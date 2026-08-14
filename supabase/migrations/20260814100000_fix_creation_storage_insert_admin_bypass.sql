-- AI-Agent: Claude Code
-- Session: Creation Station dashboard corrections walkthrough (2026-08-08/09/10)
-- Bug: creation_storage_insert (project photo uploads to the private bucket) requires
-- private.has_active_creation_station_membership() with no admin bypass, unlike every
-- other Creation Station policy in this app. The admin test account has
-- user_roles.role='admin' but zero real membership rows, so every upload attempt from
-- that account silently failed - confirmed live: project_assets had zero rows despite
-- real save attempts. Add the same admin OR-clause used elsewhere.
-- Applied directly to the live "Rebel Ranch Platform" project (dfrwxpuojeiykaignyny)
-- via Supabase MCP apply_migration before this file was committed; this file mirrors
-- that change.

drop policy if exists creation_storage_insert on storage.objects;
create policy creation_storage_insert on storage.objects for insert to authenticated
with check(bucket_id='creation-station-private' and (storage.foldername(name))[1]=(select auth.uid())::text
  and (private.has_active_creation_station_membership() or private.is_creation_station_admin()));
