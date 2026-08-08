# Seller listings catalog + logo upload, and a dedicated searchable Marketplace directory

**Status: planning only, for hand-off — not implemented in this session.**

Repo root: `C:\Users\rebel\Gitbuh Repos\Rebel Ranch Ministries\Organization-Website`
Supabase project id: `dfrwxpuojeiykaignyny`

## Context

Owner used their own seller dashboard end-to-end and hit two gaps: there's no way for a seller to list what they actually sell (candles, HVAC services, pricing) or upload a business logo — their public page just shows an initials placeholder — and there's no real searchable directory, only a marketing homepage with an embedded, non-searchable seller carousel. This plan designs both. Decisions below were confirmed directly by the owner; everything else is a recommendation grounded in exact, verified current schema/code, meant to be executed without re-deriving context.

**Owner-confirmed decisions:**
1. New listings publish **immediately** under the seller's own control (no admin approval queue) — matches every other self-service field on an approved seller's profile. **No admin notification for new listings** — the owner does not need to be pinged or shown a "recent listings" list when a seller adds one. Do not build any notification/recent-activity surface for this.
2. The site-wide "Marketplace" nav link (used on every page via the shared header) **stays pointed at `marketplace.html`** (the marketing/recruitment page). Only things literally labeled "Directory" get repointed to the new page.
3. Photo/logo uploads must accept iPhone photos. iPhones save photos as HEIC (and sometimes report the type as HEIF) by default — the upload bucket's allowed file types and the upload forms' client-side checks must include these, not just JPEG/PNG/WebP, or every iPhone user uploading straight from their camera roll will get silently rejected.

## Load-bearing correction — read before writing any RLS

Public-read visibility for seller-owned data is **not** a plain `profile_status='active'` check. It's gated through `private.seller_is_publicly_listed(seller_profile_id)`, defined in `supabase/migrations/20260725145522_marketplace_public_directory_visibility.sql:13-27` — verified directly:

```sql
create or replace function private.seller_is_publicly_listed(p_seller_profile_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.seller_profiles sp
    join public.seller_reviews sr on sr.seller_profile_id = sp.id
    where sp.id = p_seller_profile_id and sp.profile_status = 'active' and sr.review_status = 'approved'
  );
$$;
```

Every new public-read RLS policy below (`seller_listings`, `seller_listing_images`) must call this function, not re-implement a weaker check. Also: `seller_profiles`'s anon access is a **column-scoped grant**, not full-table (`20260725145535_marketplace_seller_page_fields.sql:53-56` lists exactly which columns anon may read). `logo_object_path` must be added to that grant list or the public page/directory will silently fail to read it.

## Feature A: Seller listings catalog + logo upload

### A1. New migration (new file, timestamp after the current latest migration)

**Logo column + grant:**

```sql
alter table public.seller_profiles add column logo_object_path text;
grant select (logo_object_path) on public.seller_profiles to anon;
```

Optionally extend `private.capture_seller_profile_version()` (in `20260725145535_marketplace_seller_page_fields.sql`) to snapshot this column too, same way `long_description`/`page_theme` were added there.

**`seller_listings` table** — `price_label text` (free text like "$8 each", "Starting at $89"), not a numeric price column: this platform has no checkout/payment processing (buyers message sellers and pay them directly), so a structured price would imply precision that doesn't exist and can't express "call for quote" pricing HVAC-type services need.

```sql
create table public.seller_listings (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  listing_type text not null check (listing_type in ('product','service')),
  title text not null,
  description text,
  price_label text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index seller_listings_seller_profile_id_idx on public.seller_listings(seller_profile_id);
create trigger set_updated_at before update on public.seller_listings
  for each row execute function private.set_updated_at();
alter table public.seller_listings enable row level security;

create policy seller_listings_select_owner_or_admin on public.seller_listings for select to authenticated
  using (private.is_admin() or exists(select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())));
create policy seller_listings_public_read on public.seller_listings for select to anon, authenticated
  using (is_active and private.seller_is_publicly_listed(seller_profile_id));
create policy seller_listings_insert_owner_or_admin on public.seller_listings for insert to authenticated
  with check (private.is_admin() or exists(select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())));
create policy seller_listings_update_owner_or_admin on public.seller_listings for update to authenticated
  using (private.is_admin() or exists(select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())))
  with check (private.is_admin() or exists(select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())));
create policy seller_listings_delete_owner_or_admin on public.seller_listings for delete to authenticated
  using (private.is_admin() or exists(select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())));
revoke all on public.seller_listings from anon, authenticated;
grant select on public.seller_listings to anon, authenticated;
grant insert, update, delete on public.seller_listings to authenticated;
```

**`seller_listing_images` child table** (a real child table, not an array column — matches this codebase's consistent idiom for seller-owned child records: `seller_category_assignments`, `seller_credentials`, `seller_payment_methods` are all separate tables):

```sql
create table public.seller_listing_images (
  id uuid primary key default gen_random_uuid(),
  seller_listing_id uuid not null references public.seller_listings(id) on delete cascade,
  object_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index seller_listing_images_seller_listing_id_idx on public.seller_listing_images(seller_listing_id);
alter table public.seller_listing_images enable row level security;

create policy seller_listing_images_select_owner_or_admin on public.seller_listing_images for select to authenticated
  using (private.is_admin() or exists(select 1 from public.seller_listings sl join public.seller_profiles sp on sp.id=sl.seller_profile_id where sl.id=seller_listing_id and sp.owner_user_id=(select auth.uid())));
create policy seller_listing_images_public_read on public.seller_listing_images for select to anon, authenticated
  using (exists(select 1 from public.seller_listings sl join public.seller_profiles sp on sp.id=sl.seller_profile_id where sl.id=seller_listing_id and sl.is_active and private.seller_is_publicly_listed(sp.id)));
create policy seller_listing_images_insert_owner_or_admin on public.seller_listing_images for insert to authenticated
  with check (private.is_admin() or exists(select 1 from public.seller_listings sl join public.seller_profiles sp on sp.id=sl.seller_profile_id where sl.id=seller_listing_id and sp.owner_user_id=(select auth.uid())));
create policy seller_listing_images_delete_owner_or_admin on public.seller_listing_images for delete to authenticated
  using (private.is_admin() or exists(select 1 from public.seller_listings sl join public.seller_profiles sp on sp.id=sl.seller_profile_id where sl.id=seller_listing_id and sp.owner_user_id=(select auth.uid())));
-- No update policy: images are insert/delete only in v1, no in-place edit.
revoke all on public.seller_listing_images from anon, authenticated;
grant select on public.seller_listing_images to anon, authenticated;
grant insert, delete on public.seller_listing_images to authenticated;
```

**First public storage bucket** (both existing buckets — `creation-station-private`, `marketplace-seller-private` — are private; this is a new pattern):

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marketplace-seller-public', 'marketplace-seller-public', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public=true, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create policy marketplace_seller_public_owner_write on storage.objects for all to authenticated
  using (bucket_id='marketplace-seller-public' and (private.is_admin() or (storage.foldername(name))[1]=(select auth.uid())::text))
  with check (bucket_id='marketplace-seller-public' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Public read needs no RLS — Supabase serves public-bucket objects via the public
-- URL endpoint regardless of storage.objects policies. This policy only lets the
-- seller's own dashboard list/manage uploads through the authenticated client.
create policy marketplace_seller_public_authenticated_read on storage.objects for select to authenticated
  using (bucket_id='marketplace-seller-public');
```

5MB/image-only limits are tighter than the private compliance bucket (10MB, allows PDFs) since logos/listing photos don't need PDF support. `image/heic`/`image/heif` are included specifically for iPhone camera-roll uploads (owner-confirmed requirement) — without them, an iPhone user uploading an unconverted photo gets silently rejected by the bucket's MIME allowlist.

**Deleted/replaced images must be removed from storage, not just unlinked in the database.** Because this bucket is `public=true`, any object in it stays reachable forever at its public URL regardless of what the `seller_listings`/`seller_listing_images` rows say — deleting or updating a database row does not delete the underlying file. Every action that removes or replaces an image must also call `supabase.storage.from('marketplace-seller-public').remove([oldPath])`:
- `deleteListingImage(identity, imageId)` — read the row's `object_path` first, delete the storage object, then delete the database row (or delete the row and use its returned `object_path` — either order is fine as long as both happen).
- `uploadLogo(identity, file)` — if `identity.sellerProfile.logo_object_path` is already set (a logo is being replaced), remove the old object from storage after the new upload succeeds and the `seller_profiles.logo_object_path` update succeeds.

Skipping this step leaves old/deleted photos permanently public at their original link even though the site no longer shows them anywhere.

### A2. Seller dashboard: new "Listings" tab

- **`assets/js/marketplace-seller-app.js`**: add `'listings'` to the `routes` array (line 7) and `['listings','Listings']` to the view-switcher array in `eligibleViews()` (line 31), placed right after Status. In `bindScreen()`, add handlers for: listing create/edit form (mirror the payment-method form pattern, lines ~140-155), `[data-toggle-listing-active]` (mirror `[data-toggle-affiliation]`, lines 207-213), `[data-delete-listing]` with a `confirm()` guard (mirror `[data-archive-seller]`, line 283 — see storage-cleanup note above, this must also remove any image objects tied to the deleted listing), and a per-listing image upload form (mirror `[data-credential-form]`, lines 183-202 — same client-side file-size check, but 5MB/5242880 to match the new bucket, not the 10MB credential bucket; accept attribute and any client-side type check must include HEIC/HEIF alongside JPEG/PNG/WebP). All use the existing `withBusy()` (lines 59-67) and `message()` (lines 9-16) helpers — do not reinvent loading/error handling.
- **`assets/js/marketplace-seller-data.js`**: add `logo_object_path,long_description,page_theme` to the `seller_profiles` select in `loadSellerIdentity()` (line 11) — `long_description`/`page_theme` are currently missing from this select even though the Status view reads them, a real pre-existing bug worth fixing in the same pass. Add a `seller_listings` fetch to the `Promise.all` in `loadSellerWorkspace()` (line 32), with images nested via PostgREST embed (matching the existing `seller_category_assignments(...marketplace_categories(...))` embed pattern already in this file): `select('id,listing_type,title,description,price_label,is_active,sort_order,created_at,seller_listing_images(id,object_path,sort_order)')`. Add to `actions`: `uploadLogo`, `createListing`, `updateListing`, `setListingActive`, `deleteListing`, `uploadListingImage`, `deleteListingImage` — all following the exact existing convention (raw `{data,error}` return, no throw; upload path shape `${identity.user.id}/${identity.sellerProfile.id}/...`, matching `actions.uploadCredential` at lines 149-163 exactly). `deleteListingImage` and `uploadLogo` must include the storage-object removal described above, not just a database delete/update.
- **`assets/js/marketplace-seller-views.js`**: add a logo upload block inside the existing business-info panel in `status()` (~line 34-45), reusing `.onboarding-form`/`.dialog-actions` classes already in use throughout this file. Add a new exported `listings(state)` function mirroring `requirements()`'s structure (lines 72-102) — heading, add-listing form, card grid with per-listing image thumbnails/upload/toggle/delete. Add `listings` to the exported `renderers` object (line 161). To resolve a storage path to a displayable URL, prefer `supabase.storage.from('marketplace-seller-public').getPublicUrl(path).data.publicUrl` over hardcoding the base URL (this file currently has no `supabase` import — add one).
- **`assets/css/marketplace-seller.css`**: reuse existing `.panel`/`.card-grid`/`.list`/`.onboarding-form`/`.status-badge`/`.tag`/`.danger` classes; add a small `.listing-photos{display:flex;gap:8px;flex-wrap:wrap}.listing-photos img{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--rrm-card-line)}` block.

### A3. Public seller page: logo + listings display

- **`assets/js/marketplace-seller-public.js`**: add `logo_object_path` to the `seller_profiles` select in `init()` (line 130); add a parallel `seller_listings` query (RLS already restricts to active + publicly-listed, so no client-side filtering needed, matching how category assignments are already trusted-via-RLS in this same file) with the same nested-image embed as A2. Replace the `initials(...)` fallback (line 70) with a conditional: render an `<img>` using `getPublicUrl()` when `logo_object_path` is set, initials circle otherwise. Add a new "Listings" panel to the existing `.stack` layout (~lines 84-89), one card per listing with type tag, price, description, and its images. Repoint the two "Directory" links in this file (line 11 `showMessage`'s recovery link, line 67 breadcrumb) to the new `marketplace-directory.html` (Feature B).
- **`assets/css/marketplace-seller-page.css`**: `.seller-mark{overflow:hidden}.seller-mark img{width:100%;height:100%;object-fit:cover}`. The `.gallery`/`.gallery div` rules (lines 38-39, 83) are confirmed dead CSS (never rendered by this file) — repurpose/rename for the new listings image grid rather than adding a fully redundant block.

## Feature B: Dedicated searchable Marketplace directory page

No new schema needed — no full-text-search infrastructure exists anywhere in this database (confirmed, no tsvector/gin/pg_trgm), and at current/near-term seller counts (single digits to low hundreds, ~7 Florida counties) client-side filtering over one fetched dataset is the right call, not a new search backend.

- **New file `marketplace-directory.html`**: same shared-shell pattern as every other public page added today (`brand-tokens.css`, `public-surface.css`, `public-shell.js` deferred), plus a new `assets/css/marketplace-directory.css`.
- **New file `assets/js/marketplace-directory-search.js`** (deliberately not reusing the existing `assets/js/marketplace-directory.js` filename — that file stays untouched, still powering the `marketplace.html` teaser carousel). Fetch on load:
  ```js
  const [{data:regions},{data:sellers}] = await Promise.all([
    supabase.from('marketplace_regions').select('id,region_name,state_code').eq('is_active',true).order('region_name'),
    supabase.from('seller_profiles').select('id,business_name,public_slug,marketplace_path,short_description,long_description,logo_object_path,region_id,seller_category_assignments(is_primary,marketplace_categories(name,slug))').order('business_name')
  ]);
  ```
  Do **not** add `.eq('profile_status','active')` — anon has no SELECT grant on that column at all (see the load-bearing correction above); RLS via `seller_profiles_public_read`/`seller_is_publicly_listed` already restricts the result set correctly. Resolve each seller's region client-side from the `regions` map (matching how `marketplace-seller-public.js` already fetches region as a separate query rather than an embed).
  - Single search box, case-insensitive substring match across business name, short/long description, assigned category names, and resolved region name/state — satisfies "searchable by product description, location, business name, and type" in one field, matching this codebase's preference for simple UI over many separate inputs.
  - Category and Region `<select>` filters (AND'd with search), with option lists derived from what's actually present among fetched sellers (not the full static reference tables) so a filter never returns a guaranteed-empty result at low seller counts.
  - Always alphabetical by `business_name` — already guaranteed by the query's `.order()`; just use `.filter()` for search/filters, never anything that reorders.
  - Each card links to `marketplace-seller-page.html?seller=${encodeURIComponent(sp.public_slug)}`, logo or initials fallback, same as the existing carousel.
  - Two distinct empty states: true zero-sellers-exist (reuse the "founding seller" copy from `assets/js/marketplace-directory.js` lines 29-36) vs. filtered-to-zero ("No sellers match your search — try clearing filters").
- **`marketplace.html`**: keep the existing carousel exactly as-is (don't touch `assets/js/marketplace-directory.js`), add one static link in `#seller-directory-section`'s header: `<p><a href="marketplace-directory.html">Browse the full searchable directory →</a></p>` — visible regardless of carousel/empty state since it's static HTML, not script-injected.
- **Link updates**: only `assets/js/marketplace-seller-public.js`'s two literal "Directory" links (above) get repointed. Per the owner's confirmed decision, the shared nav's "Marketplace" item and the seller-dashboard brand link stay on `marketplace.html`.

## Suggested execution order

1. Migration (schema + RLS + bucket) — apply and verify with `get_advisors` before any frontend work, since nothing else is testable without it.
2. Dashboard Listings tab (A2) — sellers need to create listings before there's anything to display.
3. Public seller page display (A3).
4. Directory page (Feature B) — shows what A2/A3 just enabled.
5. Link updates (last, since they reference the now-existing `marketplace-directory.html`).

## Verification

- After the migration: `get_advisors` (security) to confirm the new public bucket + RLS didn't introduce an unintended anon write path or missing policy; manually test as a non-owner authenticated user that they cannot insert/update another seller's listings, and as anon that `seller_listings_public_read`/`seller_listing_images_public_read` only return rows for sellers passing `seller_is_publicly_listed()`.
- Create a test listing with 2 images as a seller, confirm it appears immediately on their own public page and in the new directory's search results without any admin action.
- Upload a logo (including one exported from an iPhone in its default HEIC format), confirm it's accepted, replaces the initials circle on the public seller page, and renders correctly in directory search-result cards.
- Delete a listing image (and separately, replace a logo), then confirm the old file's public URL is no longer reachable — not just that it disappeared from the app.
- Directory search: verify text search matches on description content (not just business name), category/region filters narrow correctly, results stay alphabetical after filtering.
- Confirm `marketplace.html`'s teaser link reaches the new page, and both "Directory" links on the seller public page (breadcrumb + not-found recovery) point to it too, while the shared site nav's "Marketplace" item and the seller dashboard's brand link are unchanged.

### Critical files
`supabase/migrations/20260725145522_marketplace_public_directory_visibility.sql` (defines `seller_is_publicly_listed` — read before writing RLS), `assets/js/marketplace-seller-data.js`, `assets/js/marketplace-seller-app.js`, `assets/js/marketplace-seller-views.js`, `assets/js/marketplace-seller-public.js`, `assets/css/marketplace-seller-page.css`, new: `marketplace-directory.html`, `assets/js/marketplace-directory-search.js`, `assets/css/marketplace-directory.css`, plus one new migration file.
