-- Run only against a disposable Supabase local database or preview branch after migrations.
-- The transaction rolls back all fixtures.
begin;
create extension if not exists pgtap with schema extensions;
select plan(36);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,created_at,updated_at)
values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase2-member@example.invalid','!',now(),now()),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase2-nonmember@example.invalid','!',now(),now()),
 ('10000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase2-admin@example.invalid','!',now(),now()),
 ('10000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase2-checkout@example.invalid','!',now(),now());

select lives_ok($$
 select public.process_paypal_webhook_event('sandbox','WH-ACTIVATE','BILLING.SUBSCRIPTION.ACTIVATED','{}',
  'I-PHASE2-A','10000000-0000-4000-8000-000000000001','P-41484347F79488808NJLE2CA','ACTIVE',
  now()+interval '1 month',now())
$$,'successful activation');

select is((select membership_status from public.memberships where provider_subscription_id='I-PHASE2-A'),'active','activation grants active status');

select is((select (public.process_paypal_webhook_event('sandbox','WH-ACTIVATE','BILLING.SUBSCRIPTION.ACTIVATED','{}',
 'I-PHASE2-A','10000000-0000-4000-8000-000000000001','P-41484347F79488808NJLE2CA','ACTIVE',
 now()+interval '1 month',now())->>'duplicate')::boolean),true,'duplicate webhook is dismissed only after processing');

insert into public.payment_events(payment_provider,payment_environment,provider_event_id,event_type,verification_status,processing_status,error_message,payload)
values('paypal','sandbox','WH-RETRY','BILLING.SUBSCRIPTION.ACTIVATED','verified','failed','simulated database failure','{}');
select lives_ok($$
 select public.process_paypal_webhook_event('sandbox','WH-RETRY','BILLING.SUBSCRIPTION.ACTIVATED','{}',
  'I-PHASE2-A','10000000-0000-4000-8000-000000000001','P-41484347F79488808NJLE2CA','ACTIVE',
  now()+interval '1 month',now())
$$,'failed event is reprocessed on PayPal retry');
select is((select processing_status from public.payment_events where provider_event_id='WH-RETRY'),'processed','retry marks event processed');

select lives_ok($$
 select public.process_paypal_webhook_event('sandbox','WH-CANCEL-VALID','BILLING.SUBSCRIPTION.CANCELLED','{}',
  'I-PHASE2-A','10000000-0000-4000-8000-000000000001','P-41484347F79488808NJLE2CA','CANCELLED',
  now()+interval '10 days',now())
$$,'cancellation accepts verified paid-through date');
select ok((select ends_at>now() and membership_status='active' from public.memberships where provider_subscription_id='I-PHASE2-A'),'valid paid period remains active');

update public.memberships set next_billing_at=null,last_payment_at=null where provider_subscription_id='I-PHASE2-A';
select lives_ok($$
 select public.process_paypal_webhook_event('sandbox','WH-CANCEL-MISSING','BILLING.SUBSCRIPTION.CANCELLED','{}',
  'I-PHASE2-A','10000000-0000-4000-8000-000000000001','P-41484347F79488808NJLE2CA','CANCELLED',
  null,now())
$$,'cancellation handles missing paid-through date');
select ok((select ends_at is not null and membership_status='canceled' from public.memberships where provider_subscription_id='I-PHASE2-A'),'missing paid-through never grants indefinite access');

update public.memberships set membership_status='active',ends_at=null where provider_subscription_id='I-PHASE2-A';
select lives_ok($$
 select public.process_paypal_webhook_event('sandbox','WH-FAIL','BILLING.SUBSCRIPTION.PAYMENT.FAILED','{}',
  'I-PHASE2-A','10000000-0000-4000-8000-000000000001','P-41484347F79488808NJLE2CA','ACTIVE',
  null,'2026-07-14 12:00:00+00')
$$,'payment failure starts grace');
select is((select ends_at from public.memberships where provider_subscription_id='I-PHASE2-A'),'2026-07-17 12:00:00+00'::timestamptz,'grace ends after exactly three days');

select lives_ok($$
 select public.process_paypal_webhook_event('sandbox','WH-RECOVER','PAYMENT.SALE.COMPLETED','{}',
  'I-PHASE2-A','10000000-0000-4000-8000-000000000001','P-41484347F79488808NJLE2CA','ACTIVE',
  now()+interval '1 month',now())
$$,'payment recovery during grace succeeds');
select ok((select membership_status='active' and ends_at is null and last_payment_failure_at is null from public.memberships where provider_subscription_id='I-PHASE2-A'),'recovery clears grace restriction');

select throws_ok($$select public.process_paypal_webhook_event('sandbox','WH-UNKNOWN','BILLING.SUBSCRIPTION.ACTIVATED','{}',
 'I-UNKNOWN','10000000-0000-4000-8000-000000000002','P-UNKNOWN','ACTIVE',null,now())$$,'P0001','unknown_plan','unknown plan rejected');
select throws_ok($$select public.process_paypal_webhook_event('sandbox','WH-NOUSER','BILLING.SUBSCRIPTION.ACTIVATED','{}',
 'I-NOUSER',null,'P-41484347F79488808NJLE2CA','ACTIVE',null,now())$$,'P0001','missing_user_mapping','missing user mapping rejected');

select lives_ok($$select public.reserve_paypal_checkout_attempt('10000000-0000-4000-8000-000000000004','sandbox','young_creator_family','20000000-0000-4000-8000-000000000001')$$,'first checkout reservation succeeds');
select is(
 (select public.reserve_paypal_checkout_attempt('10000000-0000-4000-8000-000000000004','sandbox','young_creator_family','20000000-0000-4000-8000-000000000001')->>'attempt_id'),
 (select public.reserve_paypal_checkout_attempt('10000000-0000-4000-8000-000000000004','sandbox','young_creator_family','20000000-0000-4000-8000-000000000002')->>'attempt_id'),
 'repeated checkout requests reuse one server attempt');

insert into public.households(id,owner_user_id,household_name) values('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Phase 2 Test');
insert into public.user_roles(user_id,role) values('10000000-0000-4000-8000-000000000003','admin');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select is((select count(*) from public.households where id='30000000-0000-4000-8000-000000000001'),1::bigint,'member RLS permits own household');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.households where id='30000000-0000-4000-8000-000000000001'),0::bigint,'nonmember RLS denies household');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.households where id='30000000-0000-4000-8000-000000000001'),1::bigint,'admin RLS permits household');

-- Creation Station Club + one-time Live Session (added 2026-08-03).
-- Club only has a live payment_plan_mappings row (no sandbox PayPal plan exists for it yet),
-- so this fixture-only sandbox row lets the RPC logic be exercised without implying a real
-- PayPal Sandbox plan exists — it is never referenced outside this rolled-back transaction.
insert into public.payment_plan_mappings(payment_provider,payment_environment,program_code,offer_code,provider_plan_id,is_active)
values('paypal','sandbox','creation_station','club','P-TEST-CLUB-SANDBOX-FIXTURE',true);

select lives_ok($$
 select public.process_paypal_webhook_event('sandbox','WH-CLUB-ACTIVATE','BILLING.SUBSCRIPTION.ACTIVATED','{}',
  'I-PHASE2-CLUB','10000000-0000-4000-8000-000000000001','P-TEST-CLUB-SANDBOX-FIXTURE','ACTIVE',
  now()+interval '1 month',now())
$$,'club activation succeeds now that club is an allowed offer code');

insert into public.households(id,owner_user_id,household_name)
values('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004','Phase 2 Live Session Test');
insert into public.creator_profiles(id,owner_user_id,household_id,creator_type,age_band,display_name,profile_status)
values
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','child','young_6_12','Test Creator One','active'),
 ('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','child','young_6_12','Test Creator Two','active');
insert into public.live_classes(id,title,starts_at,capacity,is_published)
values('50000000-0000-4000-8000-000000000001','Phase 2 Test Live Session',now()+interval '3 days',1,true);

select lives_ok($$select public.reserve_paypal_order_attempt('10000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000001','sandbox','20000000-0000-4000-8000-000000000003')$$,'first order reservation succeeds');
select is(
 (select public.reserve_paypal_order_attempt('10000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000001','sandbox','20000000-0000-4000-8000-000000000003')->>'attempt_id'),
 (select public.reserve_paypal_order_attempt('10000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000001','sandbox','20000000-0000-4000-8000-000000000004')->>'attempt_id'),
 'repeated order requests reuse one server attempt');

select lives_ok($$
 select public.complete_paypal_order_checkout_attempt(
  (public.reserve_paypal_order_attempt('10000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000001','sandbox','20000000-0000-4000-8000-000000000003')->>'attempt_id')::uuid,
  'ORDER-PHASE2-A')
$$,'completing the order checkout attempt records the PayPal order id');

select throws_ok($$select public.reserve_paypal_order_attempt('10000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000099','sandbox','20000000-0000-4000-8000-000000000005')$$,'P0001','unknown_creator_profile','reservation rejects a creator profile the caller does not own');

select lives_ok($$select public.reserve_paypal_order_attempt('10000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000002','sandbox','20000000-0000-4000-8000-000000000006')$$,'reservation for the second creator succeeds independently');
select lives_ok($$
 select public.complete_paypal_order_checkout_attempt(
  (public.reserve_paypal_order_attempt('10000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000002','sandbox','20000000-0000-4000-8000-000000000006')->>'attempt_id')::uuid,
  'ORDER-PHASE2-B')
$$,'completing the second order checkout attempt records its PayPal order id');

select lives_ok($$
 select public.process_paypal_order_webhook_event('sandbox','WH-ORDER-A','PAYMENT.CAPTURE.COMPLETED','{}',
  'ORDER-PHASE2-A','CAP-PHASE2-A','10000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000001',
  'COMPLETED',now())
$$,'first order capture completes');
select is((select status from public.live_session_purchases where provider_order_id='ORDER-PHASE2-A'),'completed','first purchase marked completed');
select is((select fulfillment_status from public.live_session_purchases where provider_order_id='ORDER-PHASE2-A'),'registered','first purchase auto-registered into the upcoming class');
select is((select count(*) from public.class_registrations where creator_id='40000000-0000-4000-8000-000000000001' and class_id='50000000-0000-4000-8000-000000000001'),1::bigint,'first creator is registered for the class');

select is((select (public.process_paypal_order_webhook_event('sandbox','WH-ORDER-A','PAYMENT.CAPTURE.COMPLETED','{}',
 'ORDER-PHASE2-A','CAP-PHASE2-A','10000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000001',
 'COMPLETED',now())->>'duplicate')::boolean),true,'duplicate order webhook is dismissed');

select lives_ok($$
 select public.process_paypal_order_webhook_event('sandbox','WH-ORDER-B','PAYMENT.CAPTURE.COMPLETED','{}',
  'ORDER-PHASE2-B','CAP-PHASE2-B','10000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000002',
  'COMPLETED',now())
$$,'second order capture completes even though the class is now full');
select is((select status from public.live_session_purchases where provider_order_id='ORDER-PHASE2-B'),'completed','second purchase is still marked completed (payment is never dropped)');
select is((select fulfillment_status from public.live_session_purchases where provider_order_id='ORDER-PHASE2-B'),'needs_manual_scheduling','second purchase falls back to manual scheduling once the class is full');
select is((select count(*) from public.class_registrations where creator_id='40000000-0000-4000-8000-000000000002'),0::bigint,'second creator is not registered once the only upcoming class is full');

select * from finish();
rollback;
