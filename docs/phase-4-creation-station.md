# Phase 4: Creation Station Studio Experience

## Architecture

Phase 4 is a frontend-only presentation layer over the Phase 3 records. It adds no tables, copies no canonical data, and does not change authentication, RLS, private Storage, membership checks, PayPal, Marketplace, or Academy systems.

- `creation-station-dashboard.html` owns semantic page structure, dialogs, navigation, and live regions.
- `creation-station-data.js` owns Supabase reads and the existing mutations.
- `creation-station-views.js` owns audience-aware renderers for Studio, Growth, Parent, Admin, projects, portfolios, resources, classes, and Creator Website.
- `creation-station-app.js` owns eligibility, routing, creator selection, onboarding, state transitions, and event binding.
- `creation-station-dashboard.css` owns the responsive visual system and accessibility states.

## Role and view rules

- Signed-out users receive a clear account action.
- Nonmembers receive a membership action.
- All eligible members can use Studio and Growth.
- The selected creator age band changes Studio language for Young Creator, Teen Creator, and Adult Maker audiences.
- Parent View is available only when the account owns a household with a child creator.
- Admin View is available only when `user_roles.role = admin` is returned through existing policies.
- Creator Website navigation and workflow require tier 3.
- Main navigation never exposes Parent, Admin, or Website views to ineligible accounts.

## Data boundaries

The UI distinguishes current metrics, readiness calculations, and future Marketplace metrics. Listings, views, inquiries, orders, and revenue remain labeled “Not connected yet” and are never fabricated. Private asset paths are not converted to public URLs.

## Test hook

The app accepts optional `window.__RRM_STUDIO_TEST_DATA__` fixture data before module initialization for deterministic visual and accessibility tests. This changes rendering only; it does not alter Supabase authorization or provide privileged mutations.
