-- Marketplace: fields the standard public seller page template needs
-- (long-form description, seller's chosen page tone). Extends the
-- existing profile-version snapshot trigger to capture these too, since
-- editing them is a real profile revision like any other tracked field.

alter table public.seller_profiles
  add column long_description text,
  add column page_theme text not null default 'dark'
    check (page_theme in ('dark','cream','linen','white'));

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
      'profile_status', old.profile_status,
      'long_description', old.long_description,
      'page_theme', old.page_theme
    ),
    (select auth.uid())
  );
  return new;
end $$;

drop trigger if exists capture_seller_profile_version on public.seller_profiles;
create trigger capture_seller_profile_version
before update of business_name, public_slug, marketplace_path, short_description,
  region_id, profile_status, long_description, page_theme
on public.seller_profiles
for each row execute function private.capture_seller_profile_version();

-- Column-scoped grant: anon may read only these public-safe fields, never
-- owner_user_id or bookkeeping timestamps, even though the row-level
-- policy (previous migration) would otherwise allow the row.
grant select (
  id, business_name, public_slug, marketplace_path, short_description,
  long_description, page_theme, region_id
) on public.seller_profiles to anon;
