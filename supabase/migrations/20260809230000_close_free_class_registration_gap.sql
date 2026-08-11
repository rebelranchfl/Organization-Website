-- AI-Agent: Claude Code
-- Session: Creation Station dashboard corrections walkthrough (2026-08-08/09)
-- Owner request (live sessions): "as long as they can't join for free" - Club
-- membership or a one-time Live Session purchase must gate actual attendance.
-- Found while researching the session-tier question: the existing
-- registrations_owner_all policy covered ALL commands (select/insert/update/delete)
-- with only an ownership check - no payment check at all. Any authenticated member
-- could technically self-insert a class_registrations row directly via the client
-- SDK, bypassing Club/one-time-purchase payment entirely. Not currently exposed
-- through the dashboard UI (no register button exists yet), but open at the API
-- level. Legitimate registrations only ever come from the PayPal webhook (service
-- role, bypasses RLS on a completed live_session_purchases capture) or a manual
-- admin action - members never need direct write access to this table.
-- Applied directly to the live "Rebel Ranch Platform" project (dfrwxpuojeiykaignyny)
-- via Supabase MCP apply_migration before this file was committed; this file mirrors
-- that change.

drop policy if exists registrations_owner_all on public.class_registrations;

create policy registrations_owner_read on public.class_registrations
for select to authenticated
using (owner_user_id = (select auth.uid()) or private.is_creation_station_admin());

create policy registrations_admin_write on public.class_registrations
for all to authenticated
using (private.is_creation_station_admin())
with check (private.is_creation_station_admin());
