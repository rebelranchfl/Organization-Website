create schema if not exists private;

create or replace function private.has_active_creation_station_membership()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid())
      and m.program_code = 'creation_station'
      and (
        (m.status = 'active' and (m.ends_at is null or m.ends_at > now()))
        or (m.status = 'past_due' and m.ends_at > now())
      )
  );
$$;

revoke all on function private.has_active_creation_station_membership() from public;
grant execute on function private.has_active_creation_station_membership() to authenticated;
