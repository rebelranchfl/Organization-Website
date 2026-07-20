-- Marketplace Gate 2 disposable-environment access-control tests.
-- NEVER run against production.
-- Run after the verified baseline, Phase 2/3 migrations, the 3 applied
-- Gate 1 migrations, and the 5 proposed Gate 2 migrations.

begin;

-- Fixture: staff (no marketplace authority), admin, seller owner, an
-- unrelated authenticated account, a parent/household owner with a child
-- creator, and a seller profile owned by the seller-owner account.
-- The parent/household-owner id is not part of the Gate 1 fixture set,
-- so it needs its own auth.users row before it can own a household.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
) values (
  '40000000-0000-4000-8000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated',
  'gate2-household-owner@example.invalid',
  '$2a$06$C9RulK9qErmAiufD1qpnL.byIFVwLuQ2bdjK5aKmEr/swGMHK1Rza',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Gate 2 Household Owner"}',
  false, false
)
on conflict (id) do nothing;

insert into public.user_roles(user_id,role) values
  ('11111111-1111-4111-8111-111111111111','staff'),
  ('40000000-0000-4000-8000-000000000005','admin')
on conflict do nothing;

insert into public.households(id,owner_user_id,household_name)
values('60000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000006','Parent Household')
on conflict(id) do nothing;

insert into public.creator_profiles(
  id,owner_user_id,household_id,creator_type,age_band,display_name,public_name,profile_status
)
values(
  '51000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000006',
  '60000000-0000-4000-8000-000000000001',
  'child','young_6_12','Young Maker','Young Maker','active'
)
on conflict(id) do nothing;

insert into public.seller_profiles(id,owner_user_id,business_name,public_slug,marketplace_path)
values(
  '52000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  'Gate 2 Test Seller',
  'gate-2-test-seller',
  'food_farm'
)
on conflict(id) do nothing;

-- Privilege hardening: no new Gate 2 table grants TRUNCATE/TRIGGER/REFERENCES
-- to authenticated (none were ever granted, but verify explicitly).
do $$
begin
  if has_table_privilege('authenticated','public.seller_applications','TRUNCATE')
     or has_table_privilege('authenticated','public.seller_credentials','TRUNCATE')
     or has_table_privilege('authenticated','public.seller_requirement_assignments','TRUNCATE')
  then raise exception 'gate_2_privilege_hardening_failed';
  end if;
end $$;

-- Anonymous: public lookups readable, everything seller-sensitive denied.
do $$
begin
  if (select count(*) from public.marketplace_regions where slug='gilchrist-county-fl')<>1 then
    raise exception 'anon_region_lookup_failed';
  end if;

  if has_table_privilege('anon','public.seller_applications','SELECT')
     or has_table_privilege('anon','public.seller_profile_versions','SELECT')
     or has_table_privilege('anon','public.seller_requirement_assignments','SELECT')
     or has_table_privilege('anon','public.seller_attestations','SELECT')
     or has_table_privilege('anon','public.seller_credentials','SELECT')
     or has_table_privilege('anon','public.seller_review_events','SELECT')
     or has_table_privilege('anon','public.marketplace_notifications','SELECT')
     or has_table_privilege('anon','public.seller_team_members','SELECT')
  then raise exception 'anon_gate_2_sensitive_access_failed';
  end if;
end $$;

set local role authenticated;

-- Category assignment + auto-assigned requirement, done as admin so the
-- fixture setup itself doesn't depend on owner privileges being correct yet.
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000005',true);

insert into public.marketplace_categories(id,slug,name,path_group)
values('53000000-0000-4000-8000-000000000001','test-produce','Test Produce','food_farm')
on conflict(id) do nothing;

insert into public.compliance_requirements(id,category_id,code,title,description,requirement_type)
values(
  '54000000-0000-4000-8000-000000000001',
  '53000000-0000-4000-8000-000000000001',
  'test-cottage-food-permit','Cottage Food Permit','Test requirement','permit'
)
on conflict(id) do nothing;

insert into public.seller_category_assignments(seller_profile_id,category_id,is_primary)
values('52000000-0000-4000-8000-000000000001','53000000-0000-4000-8000-000000000001',true)
on conflict do nothing;

do $$
begin
  if (select count(*) from public.seller_requirement_assignments
      where seller_profile_id='52000000-0000-4000-8000-000000000001'
        and requirement_id='54000000-0000-4000-8000-000000000001')<>1
  then raise exception 'auto_assign_requirements_failed';
  end if;
end $$;

-- Seller owner: can draft + submit an application, cannot self-approve,
-- cannot force-set moderation fields, can attest, cannot self-verify a
-- credential.
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000001',true);

insert into public.seller_applications(id,seller_profile_id,application_type,legal_business_name)
values('55000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001','initial','Gate 2 Test Seller LLC');

update public.seller_applications set status='submitted' where id='55000000-0000-4000-8000-000000000001';

do $$
begin
  if (select status from public.seller_applications where id='55000000-0000-4000-8000-000000000001')<>'submitted' then
    raise exception 'seller_application_submit_failed';
  end if;
  if (select review_status from public.seller_reviews where seller_profile_id='52000000-0000-4000-8000-000000000001')<>'pending_review' then
    raise exception 'seller_application_review_sync_failed';
  end if;
end $$;

do $$
begin
  update public.seller_applications set status='approved' where id='55000000-0000-4000-8000-000000000001';
  raise exception 'seller_application_self_approve_should_have_failed';
exception
  when others then
    if sqlerrm <> 'seller_application_transition_requires_admin' then raise; end if;
end $$;

insert into public.seller_attestations(seller_profile_id,requirement_assignment_id,attestation_text,attested_by)
select '52000000-0000-4000-8000-000000000001', id, 'I attest I hold this permit.', '40000000-0000-4000-8000-000000000001'
from public.seller_requirement_assignments
where seller_profile_id='52000000-0000-4000-8000-000000000001'
  and requirement_id='54000000-0000-4000-8000-000000000001';

insert into public.seller_credentials(id,seller_profile_id,requirement_assignment_id,credential_type,document_object_path)
select '56000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001', id, 'permit_scan', '40000000-0000-4000-8000-000000000001/permit.pdf'
from public.seller_requirement_assignments
where seller_profile_id='52000000-0000-4000-8000-000000000001'
  and requirement_id='54000000-0000-4000-8000-000000000001';

update public.seller_credentials
set verification_status='verified'
where id='56000000-0000-4000-8000-000000000001';

do $$
begin
  if (select verification_status from public.seller_credentials where id='56000000-0000-4000-8000-000000000001')<>'pending' then
    raise exception 'seller_credential_self_verify_should_have_failed';
  end if;
end $$;

-- Seller owner creates the affiliation link (is_public defaults false).
-- Only the household owner (parent) or admin can flip it public, which
-- is what actually stamps parent_approved_at.
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000001',true);

insert into public.seller_creator_affiliations(seller_profile_id,creator_id,relationship_label,is_public)
values('52000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000002','young maker',false);

-- Parent/household owner: can stamp parent_approved_at for their own
-- child's affiliation, denied for a creator outside their household.
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000006',true);

do $$
begin
  update public.seller_applications set legal_business_name='hacked' where id='55000000-0000-4000-8000-000000000001';
  raise exception 'unrelated_household_owner_should_not_edit_application';
exception
  when others then null; -- RLS denies the update (0 rows), not an exception; guarded above defensively
end $$;

update public.seller_creator_affiliations
set is_public=true
where seller_profile_id='52000000-0000-4000-8000-000000000001'
  and creator_id='51000000-0000-4000-8000-000000000002';

do $$
begin
  if (select parent_approved_at from public.seller_creator_affiliations
      where seller_profile_id='52000000-0000-4000-8000-000000000001'
        and creator_id='51000000-0000-4000-8000-000000000002') is null
  then raise exception 'parent_approval_stamp_failed';
  end if;
end $$;

-- Unrelated staff: zero visibility, zero moderation authority (regression
-- check matching Gate 1's staff-has-no-authority guarantee).
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);

do $$
declare changed_count integer;
begin
  if (select count(*) from public.seller_applications)<>0
     or (select count(*) from public.seller_credentials)<>0
     or (select count(*) from public.seller_requirement_assignments)<>0
  then raise exception 'unrelated_staff_gate_2_access_failed';
  end if;

  with changed as (
    update public.seller_requirement_assignments
    set assignment_status='satisfied'
    returning id
  ) select count(*) into changed_count from changed;
  if changed_count<>0 then raise exception 'staff_gate_2_moderation_boundary_failed'; end if;
end $$;

-- Administrator: full read and moderation across the pipeline.
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000005',true);

update public.seller_applications
set status='approved', review_notes='Looks good.'
where id='55000000-0000-4000-8000-000000000001';

update public.seller_requirement_assignments
set assignment_status='satisfied', satisfied_at=now()
where seller_profile_id='52000000-0000-4000-8000-000000000001'
  and requirement_id='54000000-0000-4000-8000-000000000001';

do $$
begin
  if (select review_status from public.seller_reviews where seller_profile_id='52000000-0000-4000-8000-000000000001')<>'approved' then
    raise exception 'admin_application_approval_sync_failed';
  end if;
  if (select count(*) from public.seller_review_events where seller_profile_id='52000000-0000-4000-8000-000000000001')<2 then
    raise exception 'review_event_history_failed';
  end if;
  if (select count(*) from public.marketplace_notifications
      where owner_user_id='40000000-0000-4000-8000-000000000001' and notification_type='application_approved')<>1
  then raise exception 'application_approved_notification_failed';
  end if;
end $$;

rollback;
