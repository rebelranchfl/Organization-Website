# Marketplace Gate 2: Seller & Admin Dashboard

## Architecture

This is a frontend-only presentation and mutation layer over the Gate 2 backend
(`docs/marketplace-gate-2-deployment-record.md`). It adds no tables and changes
no RLS policies, triggers, or Storage rules — every write it performs goes
through the same policies and triggers already deployed to production.

- `marketplace-seller-dashboard.html` owns semantic page structure, the
  create-profile onboarding form, the review dialog, and navigation.
- `assets/js/marketplace-seller-data.js` owns all Supabase reads and writes:
  `loadSellerIdentity`, `loadSellerWorkspace`, `loadSellerAdminSummary`,
  `loadApplicationDetail`, `actions`, `adminActions`.
- `assets/js/marketplace-seller-views.js` owns render functions per view:
  `status`, `requirements`, `affiliations`, `notifications`, `history`,
  `admin`.
- `assets/js/marketplace-seller-app.js` owns routing, eligibility, event
  binding, and state transitions.
- `assets/css/marketplace-seller.css` owns the responsive visual system, in
  the same self-contained shape as `creation-station-dashboard.css` (its own
  token set, not layered on `assets/css/site-core.css`).

This mirrors the Creation Station Studio convention
(`docs/phase-4-creation-station.md`) deliberately, with one structural
difference: the admin review queue is a gated `admin` view inside this same
single-page app (matching the one *working* admin pattern in this repo,
`creation-station-app.js`'s `state.view==='admin'`), not a separate page.
`creation-station-admin.html`/`.js` — a separate-page attempt at Creation
Station's own admin surface — was found broken during this work (it imports
functions that don't exist in `creation-station-data.js`) and is tracked as
its own fix, unrelated to Gate 2.

## Role and view rules

- Signed-out users receive a clear sign-in action, same as Creation Station.
- Signed-in users with no `seller_profiles` row see the create-profile
  onboarding form only — no workspace tabs render until a profile exists.
- Once a profile exists: Status, Requirements, Affiliations, Notifications,
  and History are available to the owning account.
- Admin is available only when `user_roles.role = 'admin'`, exactly the same
  check already enforced server-side by every Gate 2 RLS policy — this
  client-side gate is convenience only, never the real enforcement.

## Data boundaries respected by this UI

- The UI never writes to `seller_reviews` directly — approving or rejecting
  an application does so through `seller_applications.status`, and a database
  trigger syncs `seller_reviews` automatically.
- The UI never exposes `seller_requirement_assignments.assignment_status`,
  `seller_credentials.verification_status`, `verified_by`, or `verified_at`
  as seller-editable fields — those are admin-only server-side, and the
  seller-facing forms only ever submit attestations or upload documents as
  evidence.
- Setting a creator affiliation public for a minor creator is attempted the
  same way for every account; the specific database error
  (`seller_creator_affiliation_requires_parent_approval`) is caught and
  translated into a plain-language message rather than shown as a raw error.
- No raw SSN/EIN or other structured sensitive identifiers are collected by
  any form — `credential_identifier` is free text, and the actual evidence is
  the uploaded document.

## Untouched by this change

`marketplace.html` (public landing page) and `producer-interest.html`
(pre-Gate-1 Formspree lead-capture form) are unchanged. The only edit to an
existing file is `account.html`'s Marketplace path-card link, which now
points to `marketplace-seller-dashboard.html` instead of `marketplace.html`.
