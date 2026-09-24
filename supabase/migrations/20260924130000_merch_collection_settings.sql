-- AI-Agent: Claude Code (Claude Opus 5.5)
-- Session: Custom booking system build for rebelranchministries.org (2026-09-24) — store manager follow-up
-- Purpose: Owner request 2026-09-24 — full control of the public store (merch.html) from the
-- Store Manager: which program collections appear, in what order, and how many products
-- each collection previews on the main store view. Previously all three were hard-coded.
-- Seeded with today's exact behavior (current order, all shown, 3 previewed) so nothing on
-- the live store changes until the owner edits it. merch_product_overrides is not modified.

create table if not exists public.merch_collection_settings (
  collection text primary key check (collection in ('rrm','creation-station','working-hands','marketplace','academy')),
  display_order integer not null default 0,
  site_visible boolean not null default true,
  preview_count integer not null default 3 check (preview_count between 1 and 24),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger merch_collection_settings_set_updated_at
before update on public.merch_collection_settings
for each row execute function private.set_updated_at();

insert into public.merch_collection_settings (collection, display_order) values
  ('rrm', 1), ('creation-station', 2), ('working-hands', 3), ('marketplace', 4), ('academy', 5)
on conflict (collection) do nothing;

alter table public.merch_collection_settings enable row level security;

-- Same access shape as merch_product_overrides: the public store reads, only admins write.
revoke all on table public.merch_collection_settings from anon, authenticated, public;
grant select on table public.merch_collection_settings to anon;
grant select, update on table public.merch_collection_settings to authenticated;
grant all on table public.merch_collection_settings to service_role;

create policy merch_collection_settings_public_select on public.merch_collection_settings
  for select to anon, authenticated using (true);

create policy merch_collection_settings_admin_update on public.merch_collection_settings
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
