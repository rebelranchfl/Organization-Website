-- Marketplace Gate 2: seller-to-creator/household affiliations and the
-- seller-team-role foundation.
-- Affiliations are display-only per the approved architecture addendum:
-- no authorization check anywhere may branch on these tables.
-- Production application still requires separate owner approval.

create table public.seller_creator_affiliations (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  relationship_label text,
  is_public boolean not null default false,
  parent_approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_profile_id, creator_id)
);

create trigger set_updated_at
before update on public.seller_creator_affiliations
for each row execute function private.set_updated_at();

create index seller_creator_affiliations_creator_id_idx
on public.seller_creator_affiliations(creator_id);

-- Youth/parent approval: keyed off age_band, not creator_type, since
-- creator_type only ever takes 'child'/'adult' and age granularity lives
-- in age_band ('young_6_12','teen_13_17','adult_18_plus').
create or replace function private.guard_seller_creator_affiliation()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_admin boolean := private.is_admin();
  v_age_band text;
  v_household_owner uuid;
  v_caller uuid := (select auth.uid());
begin
  select cp.age_band, h.owner_user_id
  into v_age_band, v_household_owner
  from public.creator_profiles cp
  left join public.households h on h.id = cp.household_id
  where cp.id = new.creator_id;

  if v_age_band in ('young_6_12','teen_13_17') then
    if new.is_public then
      if v_admin or v_caller = v_household_owner then
        new.parent_approved_at := coalesce(new.parent_approved_at, now());
      elsif tg_op = 'UPDATE' and old.is_public and old.parent_approved_at is not null then
        new.parent_approved_at := old.parent_approved_at;
      else
        raise exception 'seller_creator_affiliation_requires_parent_approval';
      end if;
    else
      new.parent_approved_at := null;
    end if;
  else
    new.parent_approved_at := null;
  end if;

  return new;
end $$;
revoke all on function private.guard_seller_creator_affiliation() from public, anon, authenticated;

create trigger guard_seller_creator_affiliation
before insert or update on public.seller_creator_affiliations
for each row execute function private.guard_seller_creator_affiliation();

-- Ownership-check helpers for RLS policies below. These must be
-- SECURITY DEFINER: creator_profiles and households both require an
-- active Creation Station membership to view even your own row, and
-- Marketplace access must never depend on that membership. A raw join
-- against those tables inside a policy would be silently blocked by
-- their own RLS for a household owner with no Creation Station
-- membership; these functions bypass that correctly, the same way
-- private.has_marketplace_seller_profile() already does for creator_profiles.
create or replace function private.is_household_owner_of_creator(p_creator_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.creator_profiles cp
    join public.households h on h.id = cp.household_id
    where cp.id = p_creator_id and h.owner_user_id = (select auth.uid())
  )
$$;
revoke all on function private.is_household_owner_of_creator(uuid) from public, anon, authenticated;
grant execute on function private.is_household_owner_of_creator(uuid) to authenticated;

create or replace function private.is_household_owner(p_household_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.households h
    where h.id = p_household_id and h.owner_user_id = (select auth.uid())
  )
$$;
revoke all on function private.is_household_owner(uuid) from public, anon, authenticated;
grant execute on function private.is_household_owner(uuid) to authenticated;

alter table public.seller_creator_affiliations enable row level security;

create policy seller_creator_affiliations_select
on public.seller_creator_affiliations
for select to authenticated
using (
  private.is_admin()
  or is_public
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
  or private.is_household_owner_of_creator(creator_id)
);

create policy seller_creator_affiliations_public_read
on public.seller_creator_affiliations
for select to anon
using (is_public);

create policy seller_creator_affiliations_insert
on public.seller_creator_affiliations
for insert to authenticated
with check (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_creator_affiliations_update
on public.seller_creator_affiliations
for update to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
  or private.is_household_owner_of_creator(creator_id)
)
with check (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
  or private.is_household_owner_of_creator(creator_id)
);

create policy seller_creator_affiliations_delete
on public.seller_creator_affiliations
for delete to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

revoke all on public.seller_creator_affiliations from anon, authenticated;
grant select on public.seller_creator_affiliations to anon;
grant select, insert, update, delete on public.seller_creator_affiliations to authenticated;

create table public.seller_household_affiliations (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_profile_id, household_id)
);

create trigger set_updated_at
before update on public.seller_household_affiliations
for each row execute function private.set_updated_at();

create index seller_household_affiliations_household_id_idx
on public.seller_household_affiliations(household_id);

alter table public.seller_household_affiliations enable row level security;

create policy seller_household_affiliations_select
on public.seller_household_affiliations
for select to authenticated
using (
  private.is_admin()
  or is_public
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
  or private.is_household_owner(household_id)
);

create policy seller_household_affiliations_public_read
on public.seller_household_affiliations
for select to anon
using (is_public);

create policy seller_household_affiliations_insert
on public.seller_household_affiliations
for insert to authenticated
with check (
  private.is_admin()
  or (
    exists (
      select 1 from public.seller_profiles sp
      where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
    )
    and private.is_household_owner(household_id)
  )
);

create policy seller_household_affiliations_update
on public.seller_household_affiliations
for update to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
  or private.is_household_owner(household_id)
)
with check (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
  or private.is_household_owner(household_id)
);

create policy seller_household_affiliations_delete
on public.seller_household_affiliations
for delete to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

revoke all on public.seller_household_affiliations from anon, authenticated;
grant select on public.seller_household_affiliations to anon;
grant select, insert, update, delete on public.seller_household_affiliations to authenticated;

-- Seller-team-role foundation. V1 whitelist is 'owner' only; no
-- self-service invite/accept flow ships in Gate 2. Additional rows
-- require an administrator.
create table public.seller_team_members (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_role text not null default 'owner' check (team_role in ('owner')),
  status text not null default 'active' check (status in ('active','revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_profile_id, user_id)
);

create trigger set_updated_at
before update on public.seller_team_members
for each row execute function private.set_updated_at();

create index seller_team_members_user_id_idx on public.seller_team_members(user_id);
create index seller_team_members_invited_by_idx on public.seller_team_members(invited_by);

create or replace function private.create_seller_team_owner()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.seller_team_members (seller_profile_id, user_id, team_role, status)
  values (new.id, new.owner_user_id, 'owner', 'active')
  on conflict (seller_profile_id, user_id) do nothing;
  return new;
end $$;
revoke all on function private.create_seller_team_owner() from public, anon, authenticated;

create trigger on_seller_profile_created_team_owner
after insert on public.seller_profiles
for each row execute function private.create_seller_team_owner();

alter table public.seller_team_members enable row level security;

create policy seller_team_members_select
on public.seller_team_members
for select to authenticated
using (
  private.is_admin()
  or user_id = (select auth.uid())
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_team_members_admin_insert
on public.seller_team_members
for insert to authenticated
with check (private.is_admin());

create policy seller_team_members_admin_update
on public.seller_team_members
for update to authenticated
using (private.is_admin())
with check (private.is_admin());

revoke all on public.seller_team_members from anon, authenticated;
grant select, insert, update on public.seller_team_members to authenticated;

-- No changes to creator_profiles, households, seller_profiles RLS,
-- seller_reviews, or seller_applications in this migration.
