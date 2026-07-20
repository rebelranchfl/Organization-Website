-- Marketplace Gate 2: category and region foundation.
-- Additive only. marketplace_path remains the fast top-level filter;
-- categories are a finer layer underneath it.
-- Production application still requires separate owner approval.

create table public.marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  path_group text not null check (path_group in ('food_farm','goods_services_handmade','both')),
  parent_id uuid references public.marketplace_categories(id) on delete set null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
before update on public.marketplace_categories
for each row execute function private.set_updated_at();

create index marketplace_categories_parent_id_idx on public.marketplace_categories(parent_id);
create index marketplace_categories_path_group_idx on public.marketplace_categories(path_group);

alter table public.marketplace_categories enable row level security;

create policy marketplace_categories_select_active_or_admin
on public.marketplace_categories
for select
to authenticated, anon
using (is_active or private.is_admin());

create policy marketplace_categories_admin_insert
on public.marketplace_categories
for insert to authenticated
with check (private.is_admin());

create policy marketplace_categories_admin_update
on public.marketplace_categories
for update to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy marketplace_categories_admin_delete
on public.marketplace_categories
for delete to authenticated
using (private.is_admin());

revoke all on public.marketplace_categories from anon, authenticated;
grant select on public.marketplace_categories to anon, authenticated;
grant insert, update, delete on public.marketplace_categories to authenticated;

create table public.marketplace_regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  region_name text not null,
  state_code text not null default 'FL',
  region_type text not null default 'county' check (region_type in ('county','multi_county','statewide')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
before update on public.marketplace_regions
for each row execute function private.set_updated_at();

alter table public.marketplace_regions enable row level security;

create policy marketplace_regions_select_active_or_admin
on public.marketplace_regions
for select
to authenticated, anon
using (is_active or private.is_admin());

create policy marketplace_regions_admin_insert
on public.marketplace_regions
for insert to authenticated
with check (private.is_admin());

create policy marketplace_regions_admin_update
on public.marketplace_regions
for update to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy marketplace_regions_admin_delete
on public.marketplace_regions
for delete to authenticated
using (private.is_admin());

revoke all on public.marketplace_regions from anon, authenticated;
grant select on public.marketplace_regions to anon, authenticated;
grant insert, update, delete on public.marketplace_regions to authenticated;

insert into public.marketplace_regions (slug, region_name, state_code, region_type)
values ('gilchrist-county-fl', 'Gilchrist County', 'FL', 'county')
on conflict (slug) do nothing;

-- Region label only, never a street address. Public location must stay
-- approximate; exact home addresses are never stored here or elsewhere.
alter table public.seller_profiles
  add column region_id uuid references public.marketplace_regions(id) on delete set null;

create index seller_profiles_region_id_idx on public.seller_profiles(region_id);

create table public.seller_category_assignments (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  category_id uuid not null references public.marketplace_categories(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (seller_profile_id, category_id)
);

create unique index seller_category_assignments_one_primary_idx
on public.seller_category_assignments(seller_profile_id)
where is_primary;

create index seller_category_assignments_category_id_idx
on public.seller_category_assignments(category_id);

alter table public.seller_category_assignments enable row level security;

create policy seller_category_assignments_select_owner_or_admin
on public.seller_category_assignments
for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_category_assignments_public_read
on public.seller_category_assignments
for select to anon
using (
  exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.profile_status = 'active'
  )
);

create policy seller_category_assignments_insert_owner_or_admin
on public.seller_category_assignments
for insert to authenticated
with check (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_category_assignments_update_owner_or_admin
on public.seller_category_assignments
for update to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
)
with check (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_category_assignments_delete_owner_or_admin
on public.seller_category_assignments
for delete to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

revoke all on public.seller_category_assignments from anon, authenticated;
grant select on public.seller_category_assignments to anon, authenticated;
grant insert, update, delete on public.seller_category_assignments to authenticated;

-- No changes to seller_profiles RLS, seller_reviews, creator_profiles,
-- households, or any Creation Station table in this migration.
