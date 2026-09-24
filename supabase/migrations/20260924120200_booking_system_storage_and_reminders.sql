-- AI-Agent: Claude Code (Claude Opus 5.5)
-- Session: Custom booking system build for rebelranchministries.org (2026-09-24)
-- Purpose: Private waiver-PDF storage and the hourly reminder schedule for the booking system.
--  * booking-waivers bucket is PRIVATE. Admins upload; visitors only ever receive short-lived
--    signed URLs created by the booking-public-config Edge Function.
--  * Uploaded files are never overwritten or deleted once a waiver version points at them.
--    An admin may delete an upload that no version references (e.g. an abandoned upload).
--  * pg_cron (enabled here with the owner's build authorization) calls the booking-reminders
--    Edge Function hourly via pg_net. The shared secret lives only in Supabase Vault.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-waivers', 'booking-waivers', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy booking_waivers_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'booking-waivers' and (select private.is_admin()));

create policy booking_waivers_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'booking-waivers' and (select private.is_admin()));

create policy booking_waivers_admin_delete_unused on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'booking-waivers'
    and (select private.is_admin())
    and not exists (
      select 1 from public.booking_requirement_versions v where v.file_path = storage.objects.name
    )
  );

-- ---------------------------------------------------------------------------
-- Reminder schedule
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;

select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'booking_cron_secret',
  'Shared secret the hourly pg_cron job sends to the booking-reminders Edge Function.')
where not exists (select 1 from vault.secrets where name = 'booking_cron_secret');

-- The Edge Function checks the header value against Vault through this function.
create or replace function public.booking_verify_cron_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select s.decrypted_secret = p_secret from vault.decrypted_secrets s where s.name = 'booking_cron_secret'),
    false
  );
$$;

revoke all on function public.booking_verify_cron_secret(text) from public, anon, authenticated;
grant execute on function public.booking_verify_cron_secret(text) to service_role;

select cron.schedule(
  'booking-reminders-hourly',
  '7 * * * *',
  $job$
  select net.http_post(
    url := 'https://dfrwxpuojeiykaignyny.supabase.co/functions/v1/booking-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-booking-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'booking_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $job$
);
