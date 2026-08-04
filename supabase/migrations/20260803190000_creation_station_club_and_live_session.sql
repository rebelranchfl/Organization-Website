-- AI-Agent: Claude Code
-- Session: PayPal Club + Live Session setup (2026-08-03)
-- Creation Station: recurring Club offer + one-time Live Session purchase support.
-- Additive; existing subscription tables, RPCs, and edge-function code paths are untouched.

-- 1. Allow 'club' as a creation_station offer code on the memberships table itself.
--    Constraint name is searched by content (not assumed) since this migration cannot be
--    verified against the live constraint name before applying.
do $$
declare v_conname text;
begin
  select conname into v_conname from pg_constraint
   where conrelid = 'public.memberships'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%creator_website%';
  if v_conname is not null then
    execute format('alter table public.memberships drop constraint %I', v_conname);
  end if;
end $$;

alter table public.memberships drop constraint if exists membership_offer_check;
alter table public.memberships add constraint membership_offer_check check (
  (program_code='creation_station' and offer_code in ('young_creator_family','creator_development','creator_website','club'))
  or (program_code='marketplace' and length(trim(offer_code))>0)
);

-- 2. Allow 'club' in payment_plan_mappings and register the live Club plan.
do $$
declare v_conname text;
begin
  select conname into v_conname from pg_constraint
   where conrelid = 'public.payment_plan_mappings'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%creator_website%';
  if v_conname is not null then
    execute format('alter table public.payment_plan_mappings drop constraint %I', v_conname);
  end if;
end $$;

alter table public.payment_plan_mappings drop constraint if exists payment_plan_mappings_offer_code_check;
alter table public.payment_plan_mappings add constraint payment_plan_mappings_offer_code_check
  check (offer_code in ('young_creator_family','creator_development','creator_website','club'));

insert into public.payment_plan_mappings(payment_provider,payment_environment,program_code,offer_code,provider_plan_id,is_active)
values ('paypal','live','creation_station','club','P-96900096GE192010XNJYO6MQ',true)
on conflict(payment_provider,payment_environment,offer_code)
do update set provider_plan_id=excluded.provider_plan_id,is_active=true,updated_at=now();

-- 3. One-time offer price configuration (mirrors payment_plan_mappings conventions).
create table public.payment_one_time_offers (
  id uuid primary key default gen_random_uuid(),
  payment_provider text not null default 'paypal' check(payment_provider='paypal'),
  payment_environment text not null check(payment_environment in ('sandbox','live')),
  program_code text not null check(program_code='creation_station'),
  offer_code text not null check(offer_code='live_session_trial'),
  amount_usd numeric(10,2) not null check(amount_usd>0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(payment_provider,payment_environment,offer_code)
);
alter table public.payment_one_time_offers enable row level security;
revoke all on public.payment_one_time_offers from anon,authenticated;
grant all on public.payment_one_time_offers to service_role;
create trigger set_payment_one_time_offers_updated_at
before update on public.payment_one_time_offers
for each row execute function private.set_updated_at();

insert into public.payment_one_time_offers(payment_provider,payment_environment,program_code,offer_code,amount_usd,is_active)
values
 ('paypal','live','creation_station','live_session_trial',15.00,true),
 ('paypal','sandbox','creation_station','live_session_trial',15.00,true)
on conflict(payment_provider,payment_environment,offer_code)
do update set amount_usd=excluded.amount_usd,is_active=true,updated_at=now();

-- 4. Order checkout attempts (mirrors payment_checkout_attempts, kept separate so the
--    existing subscription reservation table and RPCs stay untouched).
create table public.live_session_checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  payment_provider text not null default 'paypal' check(payment_provider='paypal'),
  payment_environment text not null check(payment_environment in ('sandbox','live')),
  offer_code text not null default 'live_session_trial' check(offer_code='live_session_trial'),
  request_key uuid not null,
  provider_order_id text,
  status text not null default 'pending' check(status in ('pending','approved','completed','expired','failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  unique(user_id,payment_provider,payment_environment,request_key),
  unique(payment_provider,payment_environment,provider_order_id)
);
create index live_session_checkout_attempts_lookup_idx
  on public.live_session_checkout_attempts(user_id,payment_environment,status,created_at desc);
alter table public.live_session_checkout_attempts enable row level security;
revoke all on public.live_session_checkout_attempts from anon,authenticated;
grant all on public.live_session_checkout_attempts to service_role;

-- 5. One-time purchase records, linking to the class the buyer was auto-registered into.
create table public.live_session_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  payment_provider text not null default 'paypal' check(payment_provider='paypal'),
  payment_environment text not null check(payment_environment in ('sandbox','live')),
  offer_code text not null default 'live_session_trial' check(offer_code='live_session_trial'),
  provider_order_id text not null,
  provider_capture_id text,
  amount_usd numeric(10,2) not null,
  status text not null default 'pending' check(status in ('pending','completed','failed','refunded')),
  class_id uuid references public.live_classes(id) on delete set null,
  registration_id uuid references public.class_registrations(id) on delete set null,
  fulfillment_status text check(fulfillment_status in ('registered','needs_manual_scheduling')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(payment_provider,payment_environment,provider_order_id)
);
create index live_session_purchases_user_id_idx on public.live_session_purchases(user_id);
alter table public.live_session_purchases enable row level security;
revoke all on public.live_session_purchases from anon,authenticated;
grant all on public.live_session_purchases to service_role;
create trigger set_live_session_purchases_updated_at
before update on public.live_session_purchases
for each row execute function private.set_updated_at();

-- 6. Let any active creation_station member or completed one-time live-session buyer see
--    published live classes, independent of the tier ladder (Club/one-time sit outside it).
--    Must come after live_session_purchases exists, since the policy references it.
drop policy if exists classes_member_read on public.live_classes;
create policy classes_member_read on public.live_classes for select to authenticated
using(
  is_published and (
    minimum_tier<=private.creation_station_tier_rank()
    or private.has_active_creation_station_membership()
    or exists(select 1 from public.live_session_purchases p where p.user_id=(select auth.uid()) and p.status='completed')
  )
  or private.is_creation_station_admin()
);

-- 7. payment_events already audits every provider webhook; add the order-side reference
--    alongside the existing subscription-side provider_subscription_id column.
alter table public.payment_events add column if not exists provider_order_id text;
create index if not exists payment_events_provider_order_id_idx on public.payment_events(provider_order_id);

-- 8. Order-flow RPCs, mirroring reserve_paypal_checkout_attempt / complete_paypal_checkout_attempt /
--    process_paypal_webhook_event from 20260714180828_phase_2_paypal_reliability.sql.

create or replace function public.reserve_paypal_order_attempt(
  p_user_id uuid, p_creator_id uuid, p_environment text, p_request_key uuid
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_attempt public.live_session_checkout_attempts%rowtype;
  v_amount numeric(10,2);
begin
  if p_environment not in ('sandbox','live') then raise exception 'invalid_environment'; end if;
  if p_user_id is null or not exists(select 1 from auth.users where id=p_user_id) then raise exception 'missing_user_mapping'; end if;
  if not exists(select 1 from public.creator_profiles where id=p_creator_id and owner_user_id=p_user_id) then
    raise exception 'unknown_creator_profile';
  end if;

  select amount_usd into v_amount from public.payment_one_time_offers
   where payment_provider='paypal' and payment_environment=p_environment
     and program_code='creation_station' and offer_code='live_session_trial' and is_active;
  if v_amount is null then raise exception 'unknown_plan'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_environment || ':live_session_trial:' || p_creator_id::text, 0));

  select * into v_attempt from public.live_session_checkout_attempts
   where user_id=p_user_id and payment_provider='paypal' and payment_environment=p_environment
     and creator_id=p_creator_id and status='pending' and expires_at>now()
   order by created_at desc limit 1 for update;

  if v_attempt.id is null then
    insert into public.live_session_checkout_attempts(user_id,creator_id,payment_environment,request_key)
    values(p_user_id,p_creator_id,p_environment,p_request_key) returning * into v_attempt;
  end if;

  return jsonb_build_object('attempt_id',v_attempt.id,'request_id',v_attempt.id,
    'amount_usd',v_amount,'provider_order_id',v_attempt.provider_order_id);
end $$;

create or replace function public.complete_paypal_order_checkout_attempt(
  p_attempt_id uuid, p_order_id text
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.live_session_checkout_attempts
     set provider_order_id=p_order_id, updated_at=now()
   where id=p_attempt_id and status='pending'
     and (provider_order_id is null or provider_order_id=p_order_id);
  if not found then raise exception 'checkout_attempt_not_found'; end if;
end $$;

create or replace function public.process_paypal_order_webhook_event(
  p_environment text, p_event_id text, p_event_type text, p_payload jsonb,
  p_order_id text, p_capture_id text, p_user_id uuid, p_creator_id uuid,
  p_status text, p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_event public.payment_events%rowtype;
  v_purchase public.live_session_purchases%rowtype;
  v_amount numeric(10,2);
  v_class public.live_classes%rowtype;
  v_registration_id uuid;
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
      provider_order_id,user_id,verification_status,processing_status,payload)
    values('paypal',p_environment,p_event_id,p_event_type,p_order_id,p_user_id,'verified','pending',p_payload)
    returning * into v_event;
  else
    update public.payment_events set processing_status='pending',error_message=null,payload=p_payload,
      event_type=p_event_type,provider_order_id=p_order_id,user_id=p_user_id,processed_at=null
      where id=v_event.id;
  end if;

  if p_order_id is null then
    v_status := 'ignored';
  else
    if p_user_id is null or p_creator_id is null
       or not exists(select 1 from auth.users where id=p_user_id)
       or not exists(select 1 from public.creator_profiles where id=p_creator_id and owner_user_id=p_user_id) then
      raise exception 'missing_user_mapping';
    end if;

    perform pg_advisory_xact_lock(hashtextextended('live_session_purchase:' || p_order_id, 0));

    select * into v_purchase from public.live_session_purchases
     where payment_provider='paypal' and payment_environment=p_environment
       and provider_order_id=p_order_id for update;

    if v_purchase.id is null then
      select amount_usd into v_amount from public.payment_one_time_offers
       where payment_provider='paypal' and payment_environment=p_environment
         and program_code='creation_station' and offer_code='live_session_trial' and is_active;
      insert into public.live_session_purchases(user_id,creator_id,payment_environment,provider_order_id,amount_usd,status)
      values(p_user_id,p_creator_id,p_environment,p_order_id,coalesce(v_amount,0),'pending')
      returning * into v_purchase;
    end if;

    if p_event_type='PAYMENT.CAPTURE.COMPLETED' then
      update public.live_session_purchases set provider_capture_id=coalesce(p_capture_id,provider_capture_id),
        status='completed', updated_at=now()
       where id=v_purchase.id;

      if v_purchase.class_id is null then
        select * into v_class from public.live_classes
         where is_published and starts_at>now()
           and (capacity is null or capacity>(select count(*) from public.class_registrations r where r.class_id=live_classes.id))
         order by starts_at asc limit 1 for update;

        if v_class.id is not null then
          insert into public.class_registrations(owner_user_id,creator_id,class_id)
          values(p_user_id,p_creator_id,v_class.id)
          on conflict(creator_id,class_id) do nothing
          returning id into v_registration_id;

          if v_registration_id is null then
            select id into v_registration_id from public.class_registrations
             where creator_id=p_creator_id and class_id=v_class.id;
          end if;

          update public.live_session_purchases set class_id=v_class.id,registration_id=v_registration_id,
            fulfillment_status='registered',updated_at=now()
           where id=v_purchase.id;
        else
          update public.live_session_purchases set fulfillment_status='needs_manual_scheduling',updated_at=now()
           where id=v_purchase.id;
        end if;
      end if;

      update public.live_session_checkout_attempts set status='completed',updated_at=now()
       where payment_provider='paypal' and payment_environment=p_environment
         and provider_order_id=p_order_id and status<>'completed';

    elsif p_event_type='PAYMENT.CAPTURE.DENIED' then
      update public.live_session_purchases set status='failed',
        provider_capture_id=coalesce(p_capture_id,provider_capture_id), updated_at=now()
       where id=v_purchase.id;
      update public.live_session_checkout_attempts set status='failed',updated_at=now()
       where payment_provider='paypal' and payment_environment=p_environment
         and provider_order_id=p_order_id and status='pending';
    else
      v_status := 'ignored';
    end if;

    update public.payment_events set processing_status=v_status,processed_at=now(),error_message=null where id=v_event.id;
  end if;

  if v_status='ignored' and p_order_id is null then
    update public.payment_events set processing_status='ignored',processed_at=now(),error_message=null where id=v_event.id;
  end if;
  return jsonb_build_object('duplicate',false,'status',v_status,'purchase_id',v_purchase.id);
end $$;

revoke all on function public.reserve_paypal_order_attempt(uuid,uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.complete_paypal_order_checkout_attempt(uuid,text) from public,anon,authenticated;
revoke all on function public.process_paypal_order_webhook_event(text,text,text,jsonb,text,text,uuid,uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.reserve_paypal_order_attempt(uuid,uuid,text,uuid) to service_role;
grant execute on function public.complete_paypal_order_checkout_attempt(uuid,text) to service_role;
grant execute on function public.process_paypal_order_webhook_event(text,text,text,jsonb,text,text,uuid,uuid,text,timestamptz) to service_role;
