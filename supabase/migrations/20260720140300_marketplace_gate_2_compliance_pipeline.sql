-- Marketplace Gate 2: category-driven compliance pipeline
-- (requirements -> assignments -> attestations/credentials -> verification).
-- No raw SSN/EIN or other sensitive identifiers are stored as structured
-- data anywhere in this pipeline; credential_identifier is free-text/
-- seller-controlled only, with the uploaded document as the real evidence.
-- Production application still requires separate owner approval.

create table public.compliance_requirements (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.marketplace_categories(id) on delete cascade,
  region_id uuid references public.marketplace_regions(id) on delete cascade,
  code text not null unique,
  title text not null,
  description text not null,
  requirement_type text not null
    check (requirement_type in ('license','permit','attestation','training','insurance','other')),
  requires_credential boolean not null default false,
  requires_minor_consent boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
before update on public.compliance_requirements
for each row execute function private.set_updated_at();

create index compliance_requirements_category_id_idx on public.compliance_requirements(category_id);
create index compliance_requirements_region_id_idx on public.compliance_requirements(region_id);

alter table public.compliance_requirements enable row level security;

create policy compliance_requirements_select_active_or_admin
on public.compliance_requirements
for select to authenticated
using (is_active or private.is_admin());

create policy compliance_requirements_admin_insert
on public.compliance_requirements
for insert to authenticated
with check (private.is_admin());

create policy compliance_requirements_admin_update
on public.compliance_requirements
for update to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy compliance_requirements_admin_delete
on public.compliance_requirements
for delete to authenticated
using (private.is_admin());

revoke all on public.compliance_requirements from anon, authenticated;
grant select on public.compliance_requirements to authenticated;
grant insert, update, delete on public.compliance_requirements to authenticated;

create table public.seller_requirement_assignments (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  requirement_id uuid not null references public.compliance_requirements(id) on delete restrict,
  assignment_status text not null default 'pending'
    check (assignment_status in ('pending','satisfied','waived','not_applicable')),
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  satisfied_at timestamptz,
  waived_reason text,
  unique (seller_profile_id, requirement_id)
);

create index seller_requirement_assignments_seller_profile_id_idx
on public.seller_requirement_assignments(seller_profile_id);
create index seller_requirement_assignments_requirement_id_idx
on public.seller_requirement_assignments(requirement_id);
create index seller_requirement_assignments_assigned_by_idx
on public.seller_requirement_assignments(assigned_by);

-- Assignment status is admin-managed: sellers provide attestations/credentials
-- as evidence, but marking a requirement satisfied, waived, or not applicable
-- is a moderation decision, not a self-service seller action.
create or replace function private.guard_seller_requirement_assignment()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if tg_op = 'UPDATE' and not private.is_admin() then
    raise exception 'seller_requirement_assignment_requires_admin';
  end if;
  return new;
end $$;
revoke all on function private.guard_seller_requirement_assignment() from public, anon, authenticated;

create trigger guard_seller_requirement_assignment
before update on public.seller_requirement_assignments
for each row execute function private.guard_seller_requirement_assignment();

create or replace function private.auto_assign_requirements()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_region_id uuid;
begin
  select region_id into v_region_id from public.seller_profiles where id = new.seller_profile_id;

  insert into public.seller_requirement_assignments (seller_profile_id, requirement_id, assigned_by)
  select new.seller_profile_id, cr.id, null
  from public.compliance_requirements cr
  where cr.is_active
    and (cr.category_id is null or cr.category_id = new.category_id)
    and (cr.region_id is null or cr.region_id = v_region_id)
  on conflict (seller_profile_id, requirement_id) do nothing;

  return new;
end $$;
revoke all on function private.auto_assign_requirements() from public, anon, authenticated;

create trigger auto_assign_requirements
after insert on public.seller_category_assignments
for each row execute function private.auto_assign_requirements();

alter table public.seller_requirement_assignments enable row level security;

create policy seller_requirement_assignments_select
on public.seller_requirement_assignments
for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_requirement_assignments_admin_insert
on public.seller_requirement_assignments
for insert to authenticated
with check (private.is_admin());

create policy seller_requirement_assignments_admin_update
on public.seller_requirement_assignments
for update to authenticated
using (private.is_admin())
with check (private.is_admin());

revoke all on public.seller_requirement_assignments from anon, authenticated;
grant select, insert, update on public.seller_requirement_assignments to authenticated;

-- Attestations are append-only self-declarations. A new attestation
-- supersedes the prior one for the same assignment; rows are never
-- updated or deleted once written.
create table public.seller_attestations (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  requirement_assignment_id uuid not null references public.seller_requirement_assignments(id) on delete cascade,
  attestation_text text not null,
  attested_by uuid not null references auth.users(id) on delete cascade,
  attested_at timestamptz not null default now(),
  is_current boolean not null default true
);

create unique index seller_attestations_one_current_idx
on public.seller_attestations(requirement_assignment_id)
where is_current;

create index seller_attestations_seller_profile_id_idx
on public.seller_attestations(seller_profile_id);
create index seller_attestations_attested_by_idx
on public.seller_attestations(attested_by);

create or replace function private.supersede_seller_attestations()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  update public.seller_attestations
  set is_current = false
  where requirement_assignment_id = new.requirement_assignment_id
    and id <> new.id
    and is_current;
  return new;
end $$;
revoke all on function private.supersede_seller_attestations() from public, anon, authenticated;

create trigger supersede_seller_attestations
after insert on public.seller_attestations
for each row execute function private.supersede_seller_attestations();

alter table public.seller_attestations enable row level security;

create policy seller_attestations_select
on public.seller_attestations
for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_attestations_insert_owner_or_admin
on public.seller_attestations
for insert to authenticated
with check (
  attested_by = (select auth.uid())
  and (
    private.is_admin()
    or exists (
      select 1 from public.seller_profiles sp
      where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
    )
  )
);

revoke all on public.seller_attestations from anon, authenticated;
grant select, insert on public.seller_attestations to authenticated;

-- Credentials: uploaded evidence. Sellers manage the descriptive fields
-- and document while pending; only an admin may set verification fields.
create table public.seller_credentials (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  requirement_assignment_id uuid references public.seller_requirement_assignments(id) on delete set null,
  credential_type text not null,
  issuing_authority text,
  credential_identifier text,
  issued_at date,
  expires_at date,
  document_object_path text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected','expired')),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
before update on public.seller_credentials
for each row execute function private.set_updated_at();

create index seller_credentials_seller_profile_id_idx on public.seller_credentials(seller_profile_id);
create index seller_credentials_requirement_assignment_id_idx
on public.seller_credentials(requirement_assignment_id);
create index seller_credentials_expires_at_idx
on public.seller_credentials(expires_at) where verification_status = 'verified';
create index seller_credentials_verified_by_idx
on public.seller_credentials(verified_by);

create or replace function private.guard_seller_credential()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_admin boolean := private.is_admin();
begin
  if tg_op = 'INSERT' and not v_admin then
    new.verification_status := 'pending';
    new.verified_by := null;
    new.verified_at := null;
  end if;

  if tg_op = 'UPDATE' then
    if v_admin then
      if new.verification_status is distinct from old.verification_status
         and new.verification_status in ('verified','rejected') then
        new.verified_by := (select auth.uid());
        new.verified_at := now();
      end if;
    else
      new.verification_status := old.verification_status;
      new.verified_by := old.verified_by;
      new.verified_at := old.verified_at;
    end if;
  end if;

  return new;
end $$;
revoke all on function private.guard_seller_credential() from public, anon, authenticated;

create trigger guard_seller_credential
before insert or update on public.seller_credentials
for each row execute function private.guard_seller_credential();

alter table public.seller_credentials enable row level security;

create policy seller_credentials_select
on public.seller_credentials
for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_credentials_insert_owner_or_admin
on public.seller_credentials
for insert to authenticated
with check (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_credentials_update_owner_or_admin
on public.seller_credentials
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

create policy seller_credentials_delete_owner_or_admin
on public.seller_credentials
for delete to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

revoke all on public.seller_credentials from anon, authenticated;
grant select, insert, update, delete on public.seller_credentials to authenticated;

-- Storage: private, owner-folder-scoped, same structural template as
-- creation-station-private. 10MB limit (credential scans), image/PDF only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'marketplace-seller-private', 'marketplace-seller-private', false, 10485760,
  array['image/jpeg','image/png','application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy marketplace_seller_private_owner_all
on storage.objects
for all to authenticated
using (
  bucket_id = 'marketplace-seller-private'
  and (
    private.is_admin()
    or (storage.foldername(name))[1] = (select auth.uid())::text
  )
)
with check (
  bucket_id = 'marketplace-seller-private'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- No changes to seller_applications, seller_creator_affiliations,
-- seller_household_affiliations, or seller_team_members in this migration.
