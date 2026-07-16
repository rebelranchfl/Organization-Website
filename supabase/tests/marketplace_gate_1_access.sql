-- Marketplace Gate 1 disposable-environment access-control tests.
-- NEVER run against production.
-- Run after the verified baseline, Phase 2/3 migrations, and proposed Gate 1 SQL.

begin;

insert into public.user_roles(user_id,role)
values('11111111-1111-4111-8111-111111111111','staff')
on conflict do nothing;

insert into public.creator_profiles(
  id,owner_user_id,household_id,creator_type,age_band,display_name,public_name,profile_status
)
values(
  '51000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  null,'adult','adult_18_plus',
  'Marketplace Only Creator','Marketplace Creator','active'
)
on conflict(id) do nothing;

insert into public.seller_profiles(owner_user_id,business_name,public_slug,marketplace_path)
values(
  '40000000-0000-4000-8000-000000000001',
  'Marketplace Only Seller',
  'marketplace-only-seller',
  'goods_services_handmade'
)
on conflict(public_slug) do nothing;

-- Browser-facing privilege correction and anonymous denial.
do $$
begin
  if has_table_privilege('authenticated','public.seller_profiles','TRUNCATE')
     or has_table_privilege('authenticated','public.seller_profiles','TRIGGER')
     or has_table_privilege('authenticated','public.seller_profiles','REFERENCES')
     or has_table_privilege('authenticated','public.seller_reviews','TRUNCATE')
     or has_table_privilege('authenticated','public.seller_reviews','TRIGGER')
     or has_table_privilege('authenticated','public.seller_reviews','REFERENCES')
  then raise exception 'seller_privilege_hardening_failed';
  end if;

  if has_table_privilege('anon','public.seller_profiles','SELECT')
     or has_table_privilege('anon','public.seller_reviews','SELECT')
     or has_table_privilege('anon','public.marketplace_creator_connections','SELECT')
  then raise exception 'anonymous_marketplace_access_failed';
  end if;
end $$;

-- Marketplace seller without Creation Station membership.
set local role authenticated;
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);

do $$
begin
  if (select count(*) from public.seller_profiles)<>1
     or (select count(*) from public.seller_reviews)<>1
     or (select count(*) from public.creator_profiles
         where id='51000000-0000-4000-8000-000000000001')<>1
     or (select count(*) from public.marketplace_creator_connections
         where creator_id='51000000-0000-4000-8000-000000000001')<>1
  then raise exception 'marketplace_owner_access_failed';
  end if;

  if (select count(*) from public.households)<>0
     or (select count(*) from public.creator_projects)<>0
     or (select count(*) from public.project_assets)<>0
     or (select count(*) from public.project_progress_events)<>0
     or (select count(*) from public.creation_resources)<>0
     or (select count(*) from public.live_classes)<>0
     or (select count(*) from storage.objects
         where bucket_id='creation-station-private')<>0
  then raise exception 'marketplace_private_data_isolation_failed';
  end if;
end $$;

do $$
declare seller_count integer; review_count integer;
begin
  with seller_changed as (
    update public.seller_profiles
    set short_description='Owner update test'
    where public_slug='marketplace-only-seller'
    returning id
  ), review_changed as (
    update public.seller_reviews set review_status='approved'
    returning seller_profile_id
  )
  select (select count(*) from seller_changed),(select count(*) from review_changed)
  into seller_count,review_count;
  if seller_count<>1 or review_count<>0 then
    raise exception 'seller_mutation_boundary_failed';
  end if;
end $$;

-- Unrelated staff receives no implicit access or moderation authority.
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);

do $$
declare changed_count integer;
begin
  if (select count(*) from public.seller_profiles)<>0
     or (select count(*) from public.seller_reviews)<>0
     or (select count(*) from public.marketplace_creator_connections)<>0
  then raise exception 'unrelated_staff_access_failed';
  end if;
  with changed as (
    update public.seller_reviews set review_status='approved'
    returning seller_profile_id
  ) select count(*) into changed_count from changed;
  if changed_count<>0 then raise exception 'staff_moderation_boundary_failed'; end if;
end $$;

-- Creation Station membership alone does not grant Marketplace access.
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000002',true);

do $$
begin
  if (select count(*) from public.seller_profiles)<>0
     or (select count(*) from public.seller_reviews)<>0
     or (select count(*) from public.marketplace_creator_connections)<>0
  then raise exception 'creation_member_marketplace_boundary_failed';
  end if;
end $$;

-- Administrator can read and moderate.
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000005',true);

do $$
declare changed_count integer;
begin
  if (select count(*) from public.seller_profiles
      where public_slug='marketplace-only-seller')<>1
  then raise exception 'admin_seller_read_failed';
  end if;
  with changed as (
    update public.seller_reviews
    set review_status='approved',reviewed_at=now(),reviewer_user_id=auth.uid()
    where seller_profile_id=(
      select id from public.seller_profiles where public_slug='marketplace-only-seller'
    ) returning seller_profile_id
  ) select count(*) into changed_count from changed;
  if changed_count<>1 then raise exception 'admin_moderation_failed'; end if;
end $$;

rollback;
