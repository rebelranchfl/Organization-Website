-- AI-Agent: Claude Code
-- Session: Merch/store visibility dashboard
-- Purpose: Give the site owner full, independent control over which Printify products
-- appear on the public Rebel Ranch store, decoupled from Printify's own visibility toggle,
-- plus the ability to feature/reorder/recategorize products from a dashboard.
-- Public storefront (merch.html) reads this table anonymously; only an admin can write to it.

create table if not exists public.merch_product_overrides (
  printify_product_id text primary key,
  product_title_cache text,
  site_visible boolean not null default false,
  featured boolean not null default false,
  display_order integer,
  collection_override text check (collection_override in ('rrm','creation-station','working-hands','marketplace','academy')),
  type_override text check (type_override in ('apparel','hats','drinkware','bags','accessories')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists merch_product_overrides_visible_idx
  on public.merch_product_overrides (site_visible, featured, display_order);

create trigger merch_product_overrides_set_updated_at
before update on public.merch_product_overrides
for each row execute function private.set_updated_at();

alter table public.merch_product_overrides enable row level security;

revoke all on table public.merch_product_overrides from anon;

grant select on table public.merch_product_overrides to anon;
grant select, insert, update on table public.merch_product_overrides to authenticated;

create policy merch_product_overrides_public_select
on public.merch_product_overrides
for select
to anon, authenticated
using (true);

create policy merch_product_overrides_admin_insert
on public.merch_product_overrides
for insert
to authenticated
with check ((select private.is_admin()));

create policy merch_product_overrides_admin_update
on public.merch_product_overrides
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- One-time backfill: grandfather in exactly what the storefront shows today (Printify's own
-- `visible` flag as of 2026-08-21), so shipping this migration does not blank out the shop.
-- From this point forward, site_visible in this table is the sole gate for the public store —
-- Printify's own visibility toggle no longer controls what shows on rebelranchministries.org.
insert into public.merch_product_overrides (printify_product_id, product_title_cache, site_visible)
values
  ('6a862a2122141b841703b106', 'Roots, Boots & Animal Poops T-Shirt — Funny Gardening Farm Tee', true),
  ('6a8626287054533ca90002e4', 'Engraved 16oz Sipper Glass - Western Cowboy Boots Design', false),
  ('6a86168e9cf628951b000f45', 'Roots, Boots & Animal Poops T-Shirt', true),
  ('6a80d89f0f28bb4a69004a35', 'Creation Station Kids Heavy Cotton T-Shirt', true),
  ('6a80d87f0f28bb4a69004a14', 'Creation Station Classic Dad Cap', true),
  ('6a80d858e7c7a2621305cb1d', 'Creation Station Hardcover Project Journal', true),
  ('6a80d838e7c7a2621305caf6', 'Creation Station Cotton Canvas Tote Bag', true),
  ('6a80d81152a93ea1f60bfa3b', 'Creation Station Accent Coffee Mug', true),
  ('6a80d7f2e7c7a2621305cac4', 'Creation Station Heavy Blend Crewneck', true),
  ('6a80d7bf8ec477a3bb096cf4', 'Creation Station Heavy Blend Hoodie', true),
  ('6a80d74c0f28bb4a690048ae', 'Creation Station Garment-Dyed T-Shirt', true),
  ('6a80775f50f492c0ce089226', 'Official RRM Kids Heavy Cotton T-Shirt', true),
  ('6a80773f9c3944dca50fbf1a', 'Official RRM Classic Dad Cap', true),
  ('6a80771550f492c0ce0891d6', 'Official RRM Hardcover Journal', true),
  ('6a8076f6c446b64dc40a1f26', 'Official RRM Cotton Canvas Tote Bag', true),
  ('6a8076cc50f492c0ce08919d', 'Official RRM Accent Coffee Mug', true),
  ('6a8076a99c3944dca50fbe82', 'Official RRM Heavy Blend Crewneck Sweatshirt', true),
  ('6a8076829c3944dca50fbe54', 'Official RRM Heavy Blend Hoodie', true),
  ('6a807663864b3a7e7002f2bc', 'Official RRM Comfort Colors Garment-Dyed T-Shirt', true),
  ('6a80674f4d1d72a90101dd3e', 'Official RRM Phone Grip', false),
  ('6a80673056fce35c0b00319c', 'Official RRM AirPods Case', true),
  ('6a8066f3069858104407b622', 'Official RRM Oakley Enduro Backpack, 22L', true),
  ('6a8066d856fce35c0b003136', 'Official RRM Tripper Duffel Bag', false),
  ('6a8066b456fce35c0b003122', 'Official RRM AirTag Cover Keychain', false),
  ('6a80669bd5161736ff08d300', 'Official RRM Magnetic Powerbank', false),
  ('6a80666f56fce35c0b0030ee', 'Official RRM Flat-Bill Snapback', true),
  ('6a806640069858104407b581', 'Official RRM Richardson Trucker Cap', true),
  ('6a8065e6069858104407b541', 'Official RRM Mid-Profile Baseball Cap', true),
  ('6a805df0a44588e17c01fbd4', 'Official RRM Unisex Arm Sleeve', false),
  ('6a805dd7aa30fd4db40b1053', 'Official RRM Kids’ Leakproof Straw Tumbler, 12oz', true),
  ('6a805dbea44588e17c01fbaf', 'Official RRM BrüMate Era Tumbler with Lid, 40oz', true),
  ('6a805da689e97256fd080cea', 'Official RRM Under Armour Team Blitzing Cap', true),
  ('6a805d6429afaf04950def8d', 'Official RRM Women’s Jersey Muscle Tank', false),
  ('6a805d546648b3976702f119', 'Official RRM Women’s Concert Tank', false),
  ('6a805cfe6b09edaab405161b', 'Official RRM Recyclable Steel Cup', true),
  ('6a805cf21b4d5f2d9900835c', 'The Concert Tank', true),
  ('6a805ce36b09edaab405160e', 'Women''s Racerback Tank', false),
  ('6a805cc01b4d5f2d9900832f', 'Women''s Jersey Racerback Tank', false),
  ('6a805b846b09edaab4051543', 'Official RRM Faith • Family • Freedom Festival Tank', false),
  ('6a8058321b4d5f2d99007dbe', 'Official Rebel Ranch Ministries Embroidered Dad Cap', true),
  ('6a80475c6b09edaab4050383', 'Rebel Ranch Ministries Black Ceramic Mug — Faith • Family • Freedom Logo', true),
  ('6a80472df6e995ad8200abf9', 'Rebel Ranch Ministries Kiss-Cut Sticker — Faith • Family • Freedom Cow Skull Logo', true),
  ('6a8046e2544d1332da0cb2cf', 'Camo Tee — Ranger Ranch Ministries Logo T‑Shirt (Faith • Family • Freedom)', true),
  ('6a80469d544d1332da0cb25a', 'Ceramic Mug — Rebel Ranch Ministries Skull Logo Coffee Mug (Faith • Family • Freedom)', true),
  ('6a80441fccd89cd6ae048ecf', 'Rebel Ranch Ministries Graphic Tee — Faith Family Freedom Cowboy Logo', true)
on conflict (printify_product_id) do nothing;
