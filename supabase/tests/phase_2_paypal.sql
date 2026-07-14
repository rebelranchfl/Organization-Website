-- Run only against a disposable Supabase local database or preview branch after migrations.
-- The transaction rolls back all fixtures.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

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

select * from finish();
rollback;
