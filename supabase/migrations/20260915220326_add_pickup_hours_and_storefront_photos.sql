-- Real pickup hours text (in addition to the existing offers_pickup boolean).
alter table public.seller_fulfillment_options
  add column if not exists pickup_hours text;

-- Storefront-level photo gallery, separate from per-listing photos.
-- Mirrors seller_listing_images' shape and RLS pattern.
create table if not exists public.seller_storefront_photos (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  object_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists seller_storefront_photos_seller_profile_id_idx
  on public.seller_storefront_photos (seller_profile_id);

alter table public.seller_storefront_photos enable row level security;

create policy seller_storefront_photos_select_owner_or_admin
  on public.seller_storefront_photos
  for select
  using (
    private.is_admin()
    or exists (
      select 1 from public.seller_profiles sp
      where sp.id = seller_storefront_photos.seller_profile_id
        and sp.owner_user_id = (select auth.uid())
    )
  );

create policy seller_storefront_photos_public_read
  on public.seller_storefront_photos
  for select
  using (private.seller_is_publicly_listed(seller_profile_id));

create policy seller_storefront_photos_insert_owner_or_admin
  on public.seller_storefront_photos
  for insert
  with check (
    private.is_admin()
    or exists (
      select 1 from public.seller_profiles sp
      where sp.id = seller_storefront_photos.seller_profile_id
        and sp.owner_user_id = (select auth.uid())
    )
  );

create policy seller_storefront_photos_delete_owner_or_admin
  on public.seller_storefront_photos
  for delete
  using (
    private.is_admin()
    or exists (
      select 1 from public.seller_profiles sp
      where sp.id = seller_storefront_photos.seller_profile_id
        and sp.owner_user_id = (select auth.uid())
    )
  );
