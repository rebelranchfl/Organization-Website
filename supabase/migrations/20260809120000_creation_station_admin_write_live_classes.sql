-- AI-Agent: Claude Code
-- Session: Creation Station dashboard corrections walkthrough (2026-08-08/09)
-- Owner request: build an admin scheduling form for live_classes inside the Creation
-- Station dashboard's existing Admin View. The table currently only grants SELECT to
-- authenticated (classes_member_read) - no INSERT/UPDATE grant or policy exists, so an
-- admin form would fail with a permission error until this is added. Scoped strictly to
-- accounts with public.user_roles.role='admin' via the existing private.is_creation_station_admin().
-- Applied directly to the live "Rebel Ranch Platform" project (dfrwxpuojeiykaignyny) via
-- Supabase MCP apply_migration before this file was committed; this file mirrors that change.

grant insert, update on public.live_classes to authenticated;

create policy classes_admin_insert on public.live_classes
for insert to authenticated
with check (private.is_creation_station_admin());

create policy classes_admin_update on public.live_classes
for update to authenticated
using (private.is_creation_station_admin())
with check (private.is_creation_station_admin());
