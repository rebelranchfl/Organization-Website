# Product photos, project titles, payment handles, persistent live-page link — 2026-08-16

Owner-approved batch from a live testing pass, following two migrations
already applied (`fix_studio_admin_visibility_and_add_payment_handles`).

## 1. Studio product card shows the real uploaded photo
**File:** `assets/js/creation-station-views.js` (`studioProductsPanel`)
Same gap as yesterday's project-card fix, but a different card that was
missed — the Studio Products panel always showed a generic sparkle icon
regardless of an uploaded photo. Unlike yesterday's private-bucket fix,
this bucket (`creation-station-studio-public`) is already public, so no
signed URL is needed — a direct public URL works.

## 2. "Join session" no longer bypasses a paid registration link
**File:** `assets/js/creation-station-views.js` (`classList`)
Bug from yesterday's build: the Join link showed unconditionally whenever
a session had a meeting URL, even for sessions requiring paid
registration the member hadn't completed. Now only shows when the
session is free (no registration_link) or the member has already
registered.

## 3. "Start a project" — real title instead of a repeated template name
**Files:** `creation-station-dashboard.html`, `assets/js/creation-station-app.js`,
`assets/js/creation-station-data.js`
Owner: the 3-template dropdown was seeded for a future "pick from
supplied ideas" concept that isn't built yet, and with real projects in
progress, every project sharing one of 3 generic titles made them
indistinguishable. Owner wants the dropdown hidden from view without
deleting the underlying template data, since it may return once real
curated content exists. Replaced the visible dropdown with a required
free-text title field; a template is still auto-selected behind the
scenes (highest one the member's tier qualifies for) so category/
difficulty metadata used elsewhere keeps working unchanged.

## 4. Payment handles + split Payment/Delivery cards
**Files:** `creation-station-dashboard.html`, `assets/js/creation-station-app.js`,
`creation-station-studio.html`, `assets/js/creation-station-studio-public.js`,
`assets/css/creation-station.css`
New `payment_handles` field lets a creator show a real handle per method
(Cash App $cashtag, Zelle phone/email, PayPal email) alongside the
existing single payment link. Owner explicitly scoped this down from
Marketplace's full multi-row payment-methods table. Public page now shows
Payment and Pickup & Delivery as two visually separate cards inside the
existing sidebar column (kept as one grid cell, not two, since the page's
CSS grid explicitly expects exactly three top-level columns — About /
Products / Cart — and adding a fourth would break that layout).

## 5. Marketplace — persistent "View My Live Page" link
**Files:** `marketplace-seller-dashboard.html`, `assets/js/marketplace-seller-app.js`
The only link to a seller's own public listing lived buried in one tab
(Status), invisible from Listings/Messages/Admin/etc. Added a link in the
persistent header (outside the tab-content area), populated once the
seller's profile loads, visible from every tab. Did not touch the
existing Status-tab link or anything logo-related, since another session
has active uncommitted work touching brand logo files in this same repo.

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-16)
