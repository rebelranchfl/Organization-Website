-- AI-Agent: Claude Code (Claude Opus 5.5)
-- Session: Custom booking system build for rebelranchministries.org (2026-09-24/25) — coming-soon follow-up
-- Purpose: Owner request 2026-09-25 — an owner-controlled "Coming Soon" marker (label, short note,
-- optional image, on/off) for (1) the program cards on index.html and programs.html and (2) store
-- collections on merch.html. Everything starts OFF, so no public page changes until the owner
-- switches one on.

-- 1. Programs -----------------------------------------------------------------------------------
create table if not exists public.program_status (
  program_key text primary key check (program_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  display_order integer not null default 0,
  coming_soon boolean not null default false,
  label_text text not null default 'Coming Soon' check (length(btrim(label_text)) between 1 and 60),
  note_text text check (note_text is null or length(note_text) <= 300),
  image_url text,
  keep_link boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger program_status_set_updated_at
before update on public.program_status
for each row execute function private.set_updated_at();

-- The six programs that have cards on index.html and programs.html today (data-program keys).
insert into public.program_status (program_key, name, display_order) values
  ('academy', 'Rebel Ranch Academy', 1),
  ('business-freedom', 'Business Freedom', 2),
  ('local', 'Rebel Ranch Local', 3),
  ('creation-station', 'Creation Station', 4),
  ('roots-boots', 'Roots, Boots & Animal Poops', 5),
  ('rescue', 'Rebel Ranch Rescue', 6)
on conflict (program_key) do nothing;

alter table public.program_status enable row level security;
revoke all on table public.program_status from anon, authenticated, public;
grant select on table public.program_status to anon;
grant select, update on table public.program_status to authenticated;
grant all on table public.program_status to service_role;

create policy program_status_public_select on public.program_status
  for select to anon, authenticated using (true);
create policy program_status_admin_update on public.program_status
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- 2. Store collections ---------------------------------------------------------------------------
alter table public.merch_collection_settings
  add column coming_soon boolean not null default false,
  add column coming_soon_label text not null default 'Coming Soon'
    check (length(btrim(coming_soon_label)) between 1 and 60),
  add column coming_soon_note text check (coming_soon_note is null or length(coming_soon_note) <= 300),
  add column coming_soon_image_url text;

-- 3. Images for coming-soon markers (public to view, admin-only upload; no SVG) ------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coming-soon-images', 'coming-soon-images', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy coming_soon_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'coming-soon-images' and (select private.is_admin()));
create policy coming_soon_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'coming-soon-images' and (select private.is_admin()))
  with check (bucket_id = 'coming-soon-images' and (select private.is_admin()));
create policy coming_soon_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'coming-soon-images' and (select private.is_admin()));
