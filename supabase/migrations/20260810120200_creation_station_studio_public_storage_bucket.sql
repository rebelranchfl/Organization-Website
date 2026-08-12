-- AI-Agent: Claude Code
-- Session: Creation Station dashboard corrections walkthrough (2026-08-08/09)
-- Public bucket for Studio product photos - separate from creation-station-private
-- (project uploads), matching the marketplace-seller-public precedent: public=true so
-- anon reads work with no object-level SELECT policy needed, owner-scoped writes via
-- the (storage.foldername(name))[1]=auth.uid() path-prefix pattern already used for
-- creation-station-private in this same migration family. Path convention:
-- {user_id}/{website_request_id}/{uuid}-{filename}.
-- Applied directly to the live "Rebel Ranch Platform" project (dfrwxpuojeiykaignyny)
-- via Supabase MCP apply_migration before this file was committed; this file mirrors
-- that change.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('creation-station-studio-public','creation-station-studio-public',true,5242880,array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy studio_public_storage_insert on storage.objects for insert to authenticated
with check(bucket_id='creation-station-studio-public' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy studio_public_storage_update on storage.objects for update to authenticated
using(bucket_id='creation-station-studio-public' and ((storage.foldername(name))[1]=(select auth.uid())::text or private.is_creation_station_admin()))
with check(bucket_id='creation-station-studio-public' and ((storage.foldername(name))[1]=(select auth.uid())::text or private.is_creation_station_admin()));

create policy studio_public_storage_delete on storage.objects for delete to authenticated
using(bucket_id='creation-station-studio-public' and ((storage.foldername(name))[1]=(select auth.uid())::text or private.is_creation_station_admin()));
