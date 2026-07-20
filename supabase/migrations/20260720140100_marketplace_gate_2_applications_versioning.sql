-- Marketplace Gate 2: seller applications and seller profile versioning.
-- seller_applications is a decoupled 1:many audit trail of admission attempts;
-- seller_reviews remains the single source of truth for current visibility
-- and is kept in sync via trigger on approval/rejection.
-- Production application still requires separate owner approval.

create table public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  application_type text not null default 'initial'
    check (application_type in ('initial','category_expansion','renewal','reinstatement')),
  status text not null default 'draft'
    check (status in ('draft','submitted','changes_requested','approved','rejected','withdrawn')),
  requested_categories uuid[] not null default '{}',
  legal_business_name text,
  entity_type text check (entity_type in ('sole_proprietor','llc','partnership','nonprofit','other')),
  contact_phone text,
  mailing_region_id uuid references public.marketplace_regions(id) on delete set null,
  producer_status text check (producer_status in
    ('licensed_permitted','cottage_food_exemption','private_only_pma','still_building','not_sure')),
  applicant_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
before update on public.seller_applications
for each row execute function private.set_updated_at();

create index seller_applications_seller_profile_id_idx on public.seller_applications(seller_profile_id);
create index seller_applications_status_idx on public.seller_applications(status);
create index seller_applications_mailing_region_id_idx on public.seller_applications(mailing_region_id);
create index seller_applications_reviewer_user_id_idx on public.seller_applications(reviewer_user_id);

create or replace function private.guard_seller_application()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_admin boolean := private.is_admin();
begin
  if tg_op = 'INSERT' and not v_admin and new.status <> 'draft' then
    raise exception 'seller_application_must_start_draft';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if v_admin then
      if new.status = 'approved' or new.status = 'rejected' then
        new.reviewed_at := now();
      end if;
    else
      if not (
        (old.status in ('draft','changes_requested') and new.status = 'submitted') or
        (old.status = 'draft' and new.status = 'withdrawn')
      ) then
        raise exception 'seller_application_transition_requires_admin';
      end if;
      new.reviewed_at := old.reviewed_at;
      new.reviewer_user_id := old.reviewer_user_id;
      new.review_notes := old.review_notes;
    end if;
  elsif tg_op = 'UPDATE' and not v_admin then
    -- No status change: still guard against a non-admin quietly editing
    -- moderation fields alongside an unrelated content edit.
    new.reviewed_at := old.reviewed_at;
    new.reviewer_user_id := old.reviewer_user_id;
    new.review_notes := old.review_notes;
  end if;

  if tg_op = 'UPDATE' and not v_admin and old.status not in ('draft','changes_requested') then
    raise exception 'seller_application_locked_pending_review';
  end if;

  return new;
end $$;
revoke all on function private.guard_seller_application() from public, anon, authenticated;

create trigger guard_seller_application
before insert or update on public.seller_applications
for each row execute function private.guard_seller_application();

create or replace function private.sync_seller_review_from_application()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.status = 'approved' then
    update public.seller_reviews
    set review_status = 'approved',
        reviewed_at = new.reviewed_at,
        reviewer_user_id = new.reviewer_user_id
    where seller_profile_id = new.seller_profile_id;
  elsif new.status = 'rejected' then
    update public.seller_reviews
    set review_status = 'rejected',
        reviewed_at = new.reviewed_at,
        reviewer_user_id = new.reviewer_user_id
    where seller_profile_id = new.seller_profile_id;
  elsif new.status = 'submitted' and old.status is distinct from new.status then
    update public.seller_reviews
    set review_status = 'pending_review',
        submitted_at = coalesce(new.submitted_at, now())
    where seller_profile_id = new.seller_profile_id
      and review_status <> 'approved';
  end if;
  return new;
end $$;
revoke all on function private.sync_seller_review_from_application() from public, anon, authenticated;

create trigger sync_seller_review_from_application
after update of status on public.seller_applications
for each row execute function private.sync_seller_review_from_application();

alter table public.seller_applications enable row level security;

create policy seller_applications_select_owner_or_admin
on public.seller_applications
for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_applications_insert_owner_or_admin
on public.seller_applications
for insert to authenticated
with check (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_applications_update_owner_or_admin
on public.seller_applications
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

create policy seller_applications_delete_owner_draft_or_admin
on public.seller_applications
for delete to authenticated
using (
  private.is_admin()
  or (
    status in ('draft','withdrawn')
    and exists (
      select 1 from public.seller_profiles sp
      where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
    )
  )
);

revoke all on public.seller_applications from anon, authenticated;
grant select, insert, update, delete on public.seller_applications to authenticated;

-- Seller profile versioning: append-only snapshot of public-facing columns
-- only. Moderation metadata and compliance data are never captured here.
create table public.seller_profile_versions (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  change_reason text,
  created_at timestamptz not null default now(),
  unique (seller_profile_id, version_number)
);

create index seller_profile_versions_seller_profile_id_idx
on public.seller_profile_versions(seller_profile_id);
create index seller_profile_versions_changed_by_idx
on public.seller_profile_versions(changed_by);

create or replace function private.capture_seller_profile_version()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_next_version integer;
begin
  select coalesce(max(version_number), 0) + 1
  into v_next_version
  from public.seller_profile_versions
  where seller_profile_id = old.id;

  insert into public.seller_profile_versions (
    seller_profile_id, version_number, snapshot, changed_by
  )
  values (
    old.id,
    v_next_version,
    jsonb_build_object(
      'business_name', old.business_name,
      'public_slug', old.public_slug,
      'marketplace_path', old.marketplace_path,
      'short_description', old.short_description,
      'region_id', old.region_id,
      'profile_status', old.profile_status
    ),
    (select auth.uid())
  );
  return new;
end $$;
revoke all on function private.capture_seller_profile_version() from public, anon, authenticated;

create trigger capture_seller_profile_version
before update of business_name, public_slug, marketplace_path, short_description, region_id, profile_status
on public.seller_profiles
for each row execute function private.capture_seller_profile_version();

alter table public.seller_profile_versions enable row level security;

create policy seller_profile_versions_select_owner_or_admin
on public.seller_profile_versions
for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

revoke all on public.seller_profile_versions from anon, authenticated;
grant select on public.seller_profile_versions to authenticated;

-- No changes to creator_profiles, households, or any Creation Station table
-- in this migration.
