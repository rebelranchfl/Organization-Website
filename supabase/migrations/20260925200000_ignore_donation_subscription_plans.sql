-- AI-Agent: Claude (Opus 5.5) · Session: Site verification & cleanup 2026-09-25
-- Owner-approved 2026-09-25.
--
-- Plain words: monthly donation plans (PayPal product "Monthly Mission Giving") send
-- PayPal notices to the same webhook as Creation Station memberships. Those donations
-- have no member account attached, so the membership processor raised
-- 'missing_user_mapping', answered PayPal with an error, and PayPal kept retrying.
-- This adds a short list of PayPal plans that are NOT memberships. Notices for those
-- plans are recorded in payment_events as 'ignored' and never touch memberships.
-- Every other rule (unknown Creation Station plans still raise 'unknown_plan') is unchanged.

create table if not exists public.payment_ignored_plans (
  payment_provider    text not null default 'paypal' check (payment_provider = 'paypal'),
  payment_environment text not null check (payment_environment in ('sandbox','live')),
  provider_plan_id    text not null,
  reason              text not null,
  created_at          timestamptz not null default now(),
  primary key (payment_provider, payment_environment, provider_plan_id)
);
alter table public.payment_ignored_plans enable row level security;
revoke all on public.payment_ignored_plans from anon, authenticated;

insert into public.payment_ignored_plans (payment_environment, provider_plan_id, reason) values
  ('live','P-3WJ19147NF209532FNK3PE4Q','Monthly Mission Giving - $10 (donation, not a membership)'),
  ('live','P-5YF6700609685930BNK3PFYY','Monthly Mission Giving - $25 (donation, not a membership)'),
  ('live','P-5AA19585J83742435NK3PGEQ','Monthly Mission Giving - $50 (donation, not a membership)'),
  ('live','P-69D79849XV3251154NK3PGQY','Monthly Mission Giving - $100 (donation, not a membership)')
on conflict do nothing;

CREATE OR REPLACE FUNCTION public.process_paypal_webhook_event(p_environment text, p_event_id text, p_event_type text, p_payload jsonb, p_subscription_id text, p_user_id uuid, p_plan_id text, p_provider_status text, p_next_billing_at timestamp with time zone, p_occurred_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  elsif exists (select 1 from public.payment_ignored_plans ip
                 where ip.payment_provider='paypal' and ip.payment_environment=p_environment
                   and ip.provider_plan_id=p_plan_id) then
    -- Donation (non-membership) plan: record the notice, never touch memberships.
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
      if exists (
        select 1 from public.memberships where user_id=p_user_id and program_code='creation_station'
          and membership_status in ('pending','active','past_due','suspended')
          and payment_environment is not null and payment_environment<>p_environment
      ) then raise exception 'payment_environment_mismatch'; end if;
      select * into v_membership from public.memberships
       where user_id=p_user_id and program_code='creation_station'
         and membership_status in ('pending','active','past_due','suspended')
         and (payment_environment is null or payment_environment=p_environment)
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

    if p_event_type in ('BILLING.SUBSCRIPTION.ACTIVATED','PAYMENT.SALE.COMPLETED') then
      update public.payment_checkout_attempts set status='completed',updated_at=now()
       where payment_provider='paypal' and payment_environment=p_environment
         and provider_subscription_id=p_subscription_id and status='pending';
    end if;

    update public.payment_events set membership_id=v_membership.id,processing_status=v_status,
      processed_at=now(),error_message=null where id=v_event.id;
  end if;

  if v_status='ignored' then
    update public.payment_events set processing_status='ignored',processed_at=now(),error_message=null where id=v_event.id;
  end if;
  return jsonb_build_object('duplicate',false,'status',v_status,'membership_id',v_membership.id);
end $function$;
