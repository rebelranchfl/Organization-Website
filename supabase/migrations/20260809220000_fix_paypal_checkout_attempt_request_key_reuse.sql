-- AI-Agent: Claude Code
-- Session: Creation Station dashboard corrections walkthrough (2026-08-08/09)
-- Bug: membership-payments.js caches one request_id per offer_code in sessionStorage
-- and only clears it on a 4xx response, never on 5xx. Once an attempt's 30-minute
-- window expires, a retry with the same cached request_key falls through to the INSERT
-- branch, which collides with the unique index on (user_id, payment_provider,
-- payment_environment, request_key) - confirmed live: "duplicate key value violates
-- unique constraint payment_checkout_attempts_user_id_payment_provider_payment__key".
-- Fix: look up by request_key first (the actual uniqueness boundary) and reset that
-- same row in place when it's stale/expired/for a different offer, instead of trying
-- to insert a new row that's guaranteed to collide.
-- Applied directly to the live "Rebel Ranch Platform" project (dfrwxpuojeiykaignyny)
-- via Supabase MCP apply_migration before this file was committed; this file mirrors
-- that change.

create or replace function public.reserve_paypal_checkout_attempt(p_user_id uuid, p_environment text, p_offer_code text, p_request_key uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
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
     and request_key=p_request_key
   for update;

  if v_attempt.id is not null then
    if v_attempt.offer_code <> p_offer_code or v_attempt.status <> 'pending' or v_attempt.expires_at <= now() then
      update public.payment_checkout_attempts
         set offer_code=p_offer_code, status='pending', provider_subscription_id=null,
             error_message=null, created_at=now(), expires_at=now()+interval '30 minutes',
             updated_at=now()
       where id=v_attempt.id
       returning * into v_attempt;
    end if;
  else
    select * into v_attempt from public.payment_checkout_attempts
     where user_id=p_user_id and payment_provider='paypal' and payment_environment=p_environment
       and offer_code=p_offer_code and status='pending' and expires_at>now()
     order by created_at desc limit 1 for update;

    if v_attempt.id is null then
      insert into public.payment_checkout_attempts(user_id,payment_environment,offer_code,request_key)
      values(p_user_id,p_environment,p_offer_code,p_request_key) returning * into v_attempt;
    end if;
  end if;

  return jsonb_build_object('attempt_id',v_attempt.id,'request_id',v_attempt.id,
    'plan_id',v_plan_id,'provider_subscription_id',v_attempt.provider_subscription_id);
end $function$;
