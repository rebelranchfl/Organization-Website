-- AI-Agent: Claude Code (Claude Opus 5.5)
-- Session: Custom booking system build for rebelranchministries.org (2026-09-24) — store collections follow-up
-- Purpose: Owner request 2026-09-24 — add, edit, and retire store collections from the Store
-- Manager instead of code. merch_collection_settings (created earlier today) becomes the full
-- source of truth for collections: card name/description/button text, logo, logo background,
-- the title words that auto-sort products into it, and retired state. The five existing
-- collections are seeded with exactly what merch.html and merch-taxonomy.js hard-coded, so the
-- public store is unchanged by this migration.

alter table public.merch_collection_settings drop constraint if exists merch_collection_settings_collection_check;
alter table public.merch_collection_settings
  add constraint merch_collection_settings_collection_format check (collection ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.merch_collection_settings
  add column name text,
  add column description text,
  add column button_label text,
  add column logo_url text,
  add column logo_background text not null default 'dark' check (logo_background in ('dark', 'light')),
  add column match_keywords text[] not null default '{}',
  add column match_priority integer not null default 5,
  add column is_default boolean not null default false,
  add column archived boolean not null default false;

-- Seed: values copied from merch.html collection cards and merch-taxonomy.js detection rules.
update public.merch_collection_settings set
  name = 'Official RRM',
  description = 'Faith, Family & Freedom apparel, gear, and everyday favorites.',
  button_label = 'Shop Official RRM',
  logo_url = 'assets/brand/Rebel%20Ranch%20Ministries/rrm-logo-white.png',
  logo_background = 'dark', match_keywords = '{}', match_priority = 1000, is_default = true
where collection = 'rrm';

update public.merch_collection_settings set
  name = 'Creation Station',
  description = 'Colorful gear for creators, makers, learners, and growing ideas.',
  button_label = 'Shop Creation Station',
  logo_url = 'assets/brand/Creation%20Station/creation-station-logo.png',
  logo_background = 'light',
  match_keywords = array['creation station', 'create. learn. build. grow', 'passion to possibility'],
  match_priority = 20
where collection = 'creation-station';

update public.merch_collection_settings set
  name = 'Roots, Boots & Animal Poops',
  description = 'Rustic, ranch-raised designs built around faith, grit, country, and real work.',
  button_label = 'Explore Roots, Boots & Animal Poops',
  logo_url = 'assets/brand/roots%20boots%20and%20animal%20poops/adult/roots-boots-and-animal-poops-adult%20logo.png',
  logo_background = 'dark',
  match_keywords = array['roots, boots', 'animal poops', 'working hands', 'real people. real work',
    'ranch raised', 'dirt under our nails', 'purpose in our work', 'built by faith',
    'work hard', 'stay humble', 'faith, grit', 'barn raised', 'country roots'],
  match_priority = 10
where collection = 'working-hands';

update public.merch_collection_settings set
  name = 'Rebel Ranch Marketplace',
  description = 'Gear for local makers, sellers, and the buy-local movement.',
  button_label = 'Shop Marketplace',
  logo_url = 'assets/brand/Rebel%20Ranch%20Local/interface/rebel-ranch-local-emblem-v2.webp',
  logo_background = 'dark',
  match_keywords = array['marketplace', 'digital farmers market', 'buy local', 'shop local', 'local makers'],
  match_priority = 30
where collection = 'marketplace';

update public.merch_collection_settings set
  name = 'Rebel Ranch Academy',
  description = 'Real Skills for Real Life — gear for hands-on learners of every age.',
  button_label = 'Shop Academy',
  logo_url = 'assets/rebel_ranch_academy_logo_transparent-cropped.png',
  logo_background = 'dark',
  match_keywords = array['rebel ranch academy', 'real skills for real life', 'rra academy', 'academy'],
  match_priority = 40
where collection = 'academy';

alter table public.merch_collection_settings
  alter column name set not null,
  add constraint merch_collection_settings_name_length check (length(btrim(name)) between 1 and 80),
  add constraint merch_collection_settings_default_not_archived check (not (is_default and archived));

create unique index merch_collection_settings_one_default
  on public.merch_collection_settings (is_default) where is_default;

-- Admins can now add collections (retire instead of delete, so product history is never orphaned).
grant insert on table public.merch_collection_settings to authenticated;
create policy merch_collection_settings_admin_insert on public.merch_collection_settings
  for insert to authenticated with check ((select private.is_admin()));

-- merch_product_overrides.collection_override used a fixed list of five collections. Replace
-- that list with a real link to the collections table so new collections can be assigned.
-- (Existing values are all within the seeded five; nothing is rewritten.)
alter table public.merch_product_overrides drop constraint if exists merch_product_overrides_collection_override_check;
alter table public.merch_product_overrides
  add constraint merch_product_overrides_collection_override_fkey
  foreign key (collection_override) references public.merch_collection_settings (collection)
  on update cascade on delete set null;

-- Public logo images for collection cards. Anyone can view (public bucket); only admins upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('merch-collection-logos', 'merch-collection-logos', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp'])  -- no SVG: SVG files can carry scripts
on conflict (id) do nothing;

create policy merch_collection_logos_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'merch-collection-logos' and (select private.is_admin()));
create policy merch_collection_logos_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'merch-collection-logos' and (select private.is_admin()))
  with check (bucket_id = 'merch-collection-logos' and (select private.is_admin()));
create policy merch_collection_logos_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'merch-collection-logos' and (select private.is_admin()));
