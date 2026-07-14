-- Phase 2 reliability corrections. This migration is additive and preserves existing RLS policies.

create table if not exists public.payment_checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_provider text not null default 'paypal' check (payment_provider = 'paypal'),
  payment_environment text not null check (payment_environment in ('sandbox','live')),
  offer_code text not null,
  request_key uuid not null,
  provider_subscription_id text,
  status text not null default 'pending' check (status in ('pending','approved','completed','expired','failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  unique (user_id, payment_provider, payment_environment, request_key),
  unique (payment_provider, payment_environment, provider_subscription_id)
);

alter table public.payment_checkout_attempts enable row level security;
revoke all on public.payment_checkout_attempts from anon, authenticated;
grant all on public.payment_checkout_attempts to service_role;

create index if not exists payment_checkout_attempts_lookup_idx
  on public.payment_checkout_attempts(user_id, payment_environment, offer_code, created_at desc);

create or replace function public.reserve_paypal_checkout_attempt(
  p_user_id uuid, p_environment text, p_offer_code text, p_request_key uuid
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_attempt public.payment_checkout_attempts%rowtype;
  v_plan_id text;
begin
  if p_environment not in ('sandbox','live') then raise exception 'invalid_environment'; end if;
  if p_user_id is null or not exists(select 1 from auth.users where id=p_user_id) then raise exception 'missing_user_mapping'; end if;

  select provider_plan_id into v_plan_id from public.payment_plan_mappings
   where payment_provider='paypal' and payment_environment=p_environment
     and program_code='creation_station' and offer_code=p_offer_code and is_active;
  if v_plan_id is null then raise exception 'unknown_plan'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_environment || ':' || p_offer_code, 0));

  if exists (
    select 1 from public.memberships where user_id=p_user_id and program_code='creation_station'
      and payment_environment=p_environment and membership_status in ('active','past_due','suspended')
      and (ends_at is null or ends_at > now())
  ) then raise exception 'existing_subscription'; end if;

  select * into v_attempt from public.payment_checkout_attempts
   where user_id=p_user_id and payment_provider='paypal' and payment_environment=p_environment
     and offer_code=p_offer_code and status='pending' and expires_at>now()
   order by created_at desc limit 1 for update;

  if v_attempt.id is null then
    insert into public.payment_checkout_attempts(user_id,payment_environment,offer_code,request_key)
    values(p_user_id,p_environment,p_offer_code,p_request_key) returning * into v_attempt;
  end if;

  return jsonb_build_object('attempt_id',v_attempt.id,'request_id',v_attempt.id,
    'plan_id',v_plan_id,'provider_subscription_id',v_attempt.provider_subscription_id);
end $$;

create or replace function public.complete_paypal_checkout_attempt(
  p_attempt_id uuid, p_subscription_id text
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.payment_checkout_attempts
     set provider_subscription_id=p_subscription_id, updated_at=now()
   where id=p_attempt_id and status='pending'
     and (provider_subscription_id is null or provider_subscription_id=p_subscription_id);
  if not found then raise exception 'checkout_attempt_not_found'; end if;
end $$;

create or replace function public.process_paypal_webhook_event(
  p_environment text, p_event_id text, p_event_type text, p_payload jsonb,
  p_subscription_id text, p_user_id uuid, p_plan_id text, p_provider_status text,
  p_next_billing_at timestamptz, p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_event public.payment_events%rowtype;
  v_membership public.memberships%rowtype;
  v_offer_code text;
  v_paid_through timestamptz;
  v_status text := 'processed';
begin
  if p_environment not in ('sandbox','live') then raise exception 'invalid_environment'; end if;
  if p_event_id is null or p_event_type is null then raise exception 'invalid_event'; end if;

  select * into v_event from public.payment_events
   where payment_provider='paypal' and payment_environment=p_environment and provider_event_id=p_event_id
   for update;

  if v_event.id is not null and v_event.processing_status in ('processed','ignored') then
    return jsonb_build_object('duplicate',true,'status',v_event.processing_status);
  end if;

  if v_event.id is null then
    insert into public.payment_events(payment_provider,payment_environment,provider_event_id,event_type,
      provider_subscription_id,user_id,verification_status,processing_status,payload)
    values('paypal',p_environment,p_event_id,p_event_type,p_subscription_id,p_user_id,'verified','pending',p_payload)
    returning * into v_event;
  else
    update public.payment_events set processing_status='pending',error_message=null,payload=p_payload,
      event_type=p_event_type,provider_subscription_id=p_subscription_id,user_id=p_user_id,processed_at=null
      where id=v_event.id;
  end if;

  if p_subscription_id is null then
    v_status := 'ignored';
  else
    if p_user_id is null or not exists(select 1 from auth.users where id=p_user_id) then raise exception 'missing_user_mapping'; end if;
    select offer_code into v_offer_code from public.payment_plan_mappings
     where payment_provider='paypal' and payment_environment=p_environment
       and program_code='creation_station' and provider_plan_id=p_plan_id and is_active;
    if v_offer_code is null then raise exception 'unknown_plan'; end if;

    select * into v_membership from public.memberships
     where payment_provider='paypal' and payment_environment=p_environment
       and provider_subscription_id=p_subscription_id for update;

    if v_membership.id is null then
      select * into v_membership from public.memberships
       where user_id=p_user_id and program_code='creation_station'
         and membership_status in ('pending','active','past_due','suspended')
       order by created_at desc limit 1 for update;
    end if;

    if v_membership.id is null then
      insert into public.memberships(user_id,program_code,offer_code,membership_status,payment_provider,
        payment_environment,provider_subscription_id,provider_plan_id,provider_status,starts_at,updated_at)
      values(p_user_id,'creation_station',v_offer_code,'pending','paypal',p_environment,
        p_subscription_id,p_plan_id,p_provider_status,coalesce(p_occurred_at,now()),now())
      returning * into v_membership;
    end if;

    if p_event_type in ('BILLING.SUBSCRIPTION.ACTIVATED','PAYMENT.SALE.COMPLETED') then
      update public.memberships set offer_code=v_offer_code,membership_status='active',
        payment_provider='paypal',payment_environment=p_environment,provider_subscription_id=p_subscription_id,
        provider_plan_id=p_plan_id,provider_status=p_provider_status,
        starts_at=coalesce(starts_at,p_occurred_at,now()),ends_at=null,
        next_billing_at=p_next_billing_at,last_payment_at=case when p_event_type='PAYMENT.SALE.COMPLETED' then coalesce(p_occurred_at,now()) else last_payment_at end,
        last_payment_failure_at=null,payment_issue_code=null,updated_at=now()
       where id=v_membership.id;
    elsif p_event_type in ('BILLING.SUBSCRIPTION.PAYMENT.FAILED','PAYMENT.SALE.DENIED') then
      update public.memberships set membership_status='past_due',provider_status=p_provider_status,
        last_payment_failure_at=coalesce(p_occurred_at,now()),payment_issue_code='payment_failed',
        ends_at=coalesce(p_occurred_at,now())+interval '3 days',updated_at=now()
       where id=v_membership.id;
    elsif p_event_type='BILLING.SUBSCRIPTION.CANCELLED' then
      v_paid_through := case
        when p_next_billing_at>coalesce(p_occurred_at,now()) then p_next_billing_at
        when v_membership.next_billing_at>coalesce(p_occurred_at,now()) then v_membership.next_billing_at
        when v_membership.last_payment_at+interval '1 month'>coalesce(p_occurred_at,now())
          then v_membership.last_payment_at+interval '1 month'
        else coalesce(p_occurred_at,now()) end;
      update public.memberships set membership_status=case when v_paid_through>now() then 'active' else 'canceled' end,
        provider_status=p_provider_status,cancel_requested_at=coalesce(cancel_requested_at,p_occurred_at,now()),
        canceled_at=coalesce(p_occurred_at,now()),ends_at=v_paid_through,updated_at=now()
       where id=v_membership.id;
    elsif p_event_type in ('BILLING.SUBSCRIPTION.SUSPENDED','BILLING.SUBSCRIPTION.EXPIRED') then
      update public.memberships set membership_status=case when p_event_type like '%EXPIRED' then 'expired' else 'suspended' end,
        provider_status=p_provider_status,ends_at=coalesce(p_occurred_at,now()),updated_at=now()
       where id=v_membership.id;
    else
      v_status := 'ignored';
    end if;

    update public.payment_events set membership_id=v_membership.id,processing_status=v_status,
      processed_at=now(),error_message=null where id=v_event.id;
  end if;

  if v_status='ignored' then
    update public.payment_events set processing_status='ignored',processed_at=now(),error_message=null where id=v_event.id;
  end if;
  return jsonb_build_object('duplicate',false,'status',v_status,'membership_id',v_membership.id);
end $$;

revoke all on function public.reserve_paypal_checkout_attempt(uuid,text,text,uuid) from public,anon,authenticated;
revoke all on function public.complete_paypal_checkout_attempt(uuid,text) from public,anon,authenticated;
revoke all on function public.process_paypal_webhook_event(text,text,text,jsonb,text,uuid,text,text,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.reserve_paypal_checkout_attempt(uuid,text,text,uuid) to service_role;
grant execute on function public.complete_paypal_checkout_attempt(uuid,text) to service_role;
grant execute on function public.process_paypal_webhook_event(text,text,text,jsonb,text,uuid,text,text,timestamptz,timestamptz) to service_role;

-- Verified against production on 2026-07-14: existing household and creator-profile
-- policies already call private.has_active_creation_station_membership(); they are intentionally unchanged.
