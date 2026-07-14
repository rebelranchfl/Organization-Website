-- The existing household and creator-profile RLS policies already call this function.
-- Keep those policies intact; only make the approved time-based access rules explicit.
create schema if not exists private;

create or replace function private.has_active_creation_station_membership()
returns boolean language sql stable security definer set search_path=''
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
  );
$$;

revoke all on function private.has_active_creation_station_membership() from public;
grant execute on function private.has_active_creation_station_membership() to authenticated;
