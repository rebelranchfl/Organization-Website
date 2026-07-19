-- Test-only reconstruction of the verified production account/household baseline.
-- This file exists so a blank disposable project can exercise Phase 3 and Marketplace Gate 1 end to end.
-- NEVER apply this fixture to production.

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('member','staff','admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_code text not null check (program_code in ('creation_station','marketplace')),
  offer_code text not null,
  membership_status text not null default 'pending'
    check (membership_status in ('pending','active','past_due','suspended','canceled','expired')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint membership_offer_check check (
    (program_code='creation_station' and offer_code in ('young_creator_family','creator_development','creator_website'))
    or (program_code='marketplace' and length(trim(offer_code))>0)
  )
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  household_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  creator_type text not null check (creator_type in ('child','adult')),
  age_band text not null check (age_band in ('young_6_12','teen_13_17','adult_18_plus')),
  display_name text not null,
  public_name text,
  profile_status text not null default 'draft' check (profile_status in ('draft','active','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_profile_age_type_check check (
    (creator_type='child' and age_band in ('young_6_12','teen_13_17') and household_id is not null)
    or (creator_type='adult' and age_band='adult_18_plus')
  )
);

create index memberships_user_id_idx on public.memberships(user_id);
create index memberships_program_status_idx on public.memberships(program_code,membership_status);
create index creator_profiles_owner_user_id_idx on public.creator_profiles(owner_user_id);
create index creator_profiles_household_id_idx on public.creator_profiles(household_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  new.updated_at=now();
  return new;
end
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger set_memberships_updated_at
before update on public.memberships
for each row execute function private.set_updated_at();

create trigger set_households_updated_at
before update on public.households
for each row execute function private.set_updated_at();

create trigger set_creator_profiles_updated_at
before update on public.creator_profiles
for each row execute function private.set_updated_at();

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id=(select auth.uid()) and role='admin'
  )
$$;

create or replace function private.has_active_creation_station_membership()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists (
    select 1 from public.memberships
    where user_id=(select auth.uid())
      and program_code='creation_station'
      and (
        membership_status='active'
        or (membership_status='past_due' and ends_at is not null and ends_at>now())
      )
      and (starts_at is null or starts_at<=now())
      and (ends_at is null or ends_at>now())
  )
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  calculated_display_name text;
begin
  calculated_display_name := coalesce(
    nullif(new.raw_user_meta_data->>'display_name',''),
    nullif(trim(concat_ws(' ',new.raw_user_meta_data->>'first_name',new.raw_user_meta_data->>'last_name')),''),
    split_part(coalesce(new.email,'member'),'@',1)
  );
  insert into public.profiles(id,first_name,last_name,display_name)
  values(new.id,new.raw_user_meta_data->>'first_name',new.raw_user_meta_data->>'last_name',calculated_display_name)
  on conflict(id) do nothing;
  insert into public.user_roles(user_id,role)
  values(new.id,'member')
  on conflict(user_id,role) do nothing;
  return new;
end
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

revoke all on all functions in schema private from public;
grant execute on function private.is_admin(),private.has_active_creation_station_membership() to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.memberships enable row level security;
alter table public.households enable row level security;
alter table public.creator_profiles enable row level security;

-- Reproduce current production Phase 1 grants exactly in the fixture.
-- Browser-facing grants are broader than ideal; seller-table hardening is proposed separately.
grant all on table public.profiles,public.user_roles,public.memberships,public.households,public.creator_profiles to authenticated;
grant all on table public.profiles,public.user_roles,public.memberships,public.households,public.creator_profiles to service_role;

create policy profiles_select_own_or_admin
on public.profiles for select to authenticated
using(id=(select auth.uid()) or private.is_admin());

create policy profiles_update_own_or_admin
on public.profiles for update to authenticated
using(id=(select auth.uid()) or private.is_admin())
with check(id=(select auth.uid()) or private.is_admin());

create policy profiles_admin_insert
on public.profiles for insert to authenticated
with check(private.is_admin());

create policy profiles_admin_delete
on public.profiles for delete to authenticated
using(private.is_admin());

create policy user_roles_select_own_or_admin
on public.user_roles for select to authenticated
using(user_id=(select auth.uid()) or private.is_admin());

create policy user_roles_admin_insert
on public.user_roles for insert to authenticated
with check(private.is_admin());

create policy user_roles_admin_update
on public.user_roles for update to authenticated
using(private.is_admin())
with check(private.is_admin());

create policy user_roles_admin_delete
on public.user_roles for delete to authenticated
using(private.is_admin());

create policy memberships_select_own_or_admin
on public.memberships for select to authenticated
using(user_id=(select auth.uid()) or private.is_admin());

create policy memberships_admin_insert
on public.memberships for insert to authenticated
with check(private.is_admin());

create policy memberships_admin_update
on public.memberships for update to authenticated
using(private.is_admin())
with check(private.is_admin());

create policy memberships_admin_delete
on public.memberships for delete to authenticated
using(private.is_admin());

create policy households_select_member_or_admin
on public.households for select to authenticated
using(private.is_admin() or(owner_user_id=(select auth.uid()) and private.has_active_creation_station_membership()));

create policy households_insert_member_or_admin
on public.households for insert to authenticated
with check(private.is_admin() or(owner_user_id=(select auth.uid()) and private.has_active_creation_station_membership()));

create policy households_update_member_or_admin
on public.households for update to authenticated
using(private.is_admin() or(owner_user_id=(select auth.uid()) and private.has_active_creation_station_membership()))
with check(private.is_admin() or(owner_user_id=(select auth.uid()) and private.has_active_creation_station_membership()));

create policy households_delete_member_or_admin
on public.households for delete to authenticated
using(private.is_admin() or(owner_user_id=(select auth.uid()) and private.has_active_creation_station_membership()));

create policy creator_profiles_select_member_or_admin
on public.creator_profiles for select to authenticated
using(private.is_admin() or(owner_user_id=(select auth.uid()) and private.has_active_creation_station_membership()));

create policy creator_profiles_insert_member_or_admin
on public.creator_profiles for insert to authenticated
with check(
  private.is_admin()
  or (
    owner_user_id=(select auth.uid())
    and private.has_active_creation_station_membership()
    and (
      household_id is null
      or exists(
        select 1 from public.households h
        where h.id=household_id and h.owner_user_id=(select auth.uid())
      )
    )
  )
);

create policy creator_profiles_update_member_or_admin
on public.creator_profiles for update to authenticated
using(private.is_admin() or(owner_user_id=(select auth.uid()) and private.has_active_creation_station_membership()))
with check(
  private.is_admin()
  or (
    owner_user_id=(select auth.uid())
    and private.has_active_creation_station_membership()
    and (
      household_id is null
      or exists(
        select 1 from public.households h
        where h.id=household_id and h.owner_user_id=(select auth.uid())
      )
    )
  )
);

create policy creator_profiles_delete_member_or_admin
on public.creator_profiles for delete to authenticated
using(private.is_admin() or(owner_user_id=(select auth.uid()) and private.has_active_creation_station_membership()));

-- Production Marketplace seller shell, reconstructed for disposable testing only.

create table public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  public_slug text unique,
  marketplace_path text not null
    check (marketplace_path in ('food_farm','goods_services_handmade','both')),
  short_description text,
  profile_status text not null default 'draft'
    check (profile_status in ('draft','active','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_public_slug_format
    check (public_slug is null or public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.seller_reviews (
  seller_profile_id uuid primary key references public.seller_profiles(id) on delete cascade,
  review_status text not null default 'not_submitted'
    check (review_status in ('not_submitted','pending_review','changes_requested','approved','rejected','suspended')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index seller_profiles_owner_user_id_idx on public.seller_profiles(owner_user_id);
create index seller_reviews_status_idx on public.seller_reviews(review_status);

create or replace function private.create_seller_review()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  insert into public.seller_reviews(seller_profile_id,review_status)
  values(new.id,'not_submitted')
  on conflict(seller_profile_id) do nothing;
  return new;
end
$$;

revoke all on function private.create_seller_review() from public,anon,authenticated;

create trigger on_seller_profile_created
after insert on public.seller_profiles
for each row execute function private.create_seller_review();

create trigger set_seller_profiles_updated_at
before update on public.seller_profiles
for each row execute function private.set_updated_at();

create trigger set_seller_reviews_updated_at
before update on public.seller_reviews
for each row execute function private.set_updated_at();

alter table public.seller_profiles enable row level security;
alter table public.seller_reviews enable row level security;

-- Reproduce current production grants exactly in the fixture.
-- A separate proposed migration narrows browser-facing privileges.
grant all on table public.seller_profiles,public.seller_reviews to authenticated;
grant all on table public.seller_profiles,public.seller_reviews to service_role;

create policy seller_profiles_select_own_or_admin
on public.seller_profiles for select to authenticated
using(owner_user_id=(select auth.uid()) or private.is_admin());

create policy seller_profiles_insert_own_or_admin
on public.seller_profiles for insert to authenticated
with check(owner_user_id=(select auth.uid()) or private.is_admin());

create policy seller_profiles_update_own_or_admin
on public.seller_profiles for update to authenticated
using(owner_user_id=(select auth.uid()) or private.is_admin())
with check(owner_user_id=(select auth.uid()) or private.is_admin());

create policy seller_profiles_delete_own_or_admin
on public.seller_profiles for delete to authenticated
using(owner_user_id=(select auth.uid()) or private.is_admin());

create policy seller_reviews_select_owner_or_admin
on public.seller_reviews for select to authenticated
using(
  private.is_admin()
  or exists(
    select 1 from public.seller_profiles s
    where s.id=seller_profile_id and s.owner_user_id=(select auth.uid())
  )
);

create policy seller_reviews_admin_insert
on public.seller_reviews for insert to authenticated
with check(private.is_admin());

create policy seller_reviews_admin_update
on public.seller_reviews for update to authenticated
using(private.is_admin())
with check(private.is_admin());

create policy seller_reviews_admin_delete
on public.seller_reviews for delete to authenticated
using(private.is_admin());
