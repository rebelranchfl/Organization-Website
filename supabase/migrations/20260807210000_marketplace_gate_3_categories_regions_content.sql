-- AI-Agent: Claude Code
-- Session: Creation Station dashboard access + site-wide deploy fix (2026-08-07)
-- Marketplace Gate 3: category taxonomy expansion + region expansion.
-- Purely additive content. seller_category_assignments is already a proper
-- many-to-many table (seller_profile_id, category_id, is_primary) - no
-- schema change needed for multi-select, only more/better category rows.
-- The bundled 'goods_services_handmade' path_group is split into real,
-- separate categories per owner request; path_group keeps its existing
-- three-value check constraint (unchanged) since it is purely descriptive
-- metadata now - seller-facing selection no longer filters by it.

insert into public.marketplace_categories (slug, name, path_group, sort_order)
values
  ('art-photography', 'Art & Photography', 'goods_services_handmade', 4),
  ('plants-nursery', 'Plants & Nursery', 'goods_services_handmade', 5),
  ('pet-care-grooming', 'Pet Care & Grooming', 'goods_services_handmade', 6),
  ('automotive-services', 'Automotive Services', 'goods_services_handmade', 7),
  ('cleaning-lawn-care', 'Cleaning & Lawn Care', 'goods_services_handmade', 8),
  ('childcare-tutoring', 'Childcare & Tutoring', 'goods_services_handmade', 9),
  ('other', 'Other', 'both', 99)
on conflict (slug) do nothing;

-- Real bordering counties of Gilchrist County, FL (owner's core service
-- area), same row shape as the existing Gilchrist County seed row.
insert into public.marketplace_regions (slug, region_name, state_code, region_type)
values
  ('alachua-county-fl', 'Alachua County', 'FL', 'county'),
  ('columbia-county-fl', 'Columbia County', 'FL', 'county'),
  ('dixie-county-fl', 'Dixie County', 'FL', 'county'),
  ('lafayette-county-fl', 'Lafayette County', 'FL', 'county'),
  ('levy-county-fl', 'Levy County', 'FL', 'county'),
  ('suwannee-county-fl', 'Suwannee County', 'FL', 'county')
on conflict (slug) do nothing;
