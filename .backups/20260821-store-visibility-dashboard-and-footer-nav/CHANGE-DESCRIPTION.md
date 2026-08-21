# Change description — footer/nav tightening, Academy collection, store visibility dashboard

**Date:** 2026-08-21
**AI-Agent:** Claude Code
**Session:** Merch/store visibility dashboard (continuation of the academy-learning-interest.html restyle session)
**Owner authorization:** Given item-by-item across this session — see the numbered items below, each approved individually in chat before being built.

**Process note:** the footer/nav CSS edits, the Academy collection card, and the merch.html script rewrite were made before this backup was created, not after as the repo's normal process requires. Caught after the fact rather than during — this backup captures the exact pre-session versions from `git show HEAD:<file>` so nothing is unrecoverable, but the sequencing itself was out of order. Flagging it rather than quietly fixing it.

## 1. Footer spacing (approved: "1. a")

`assets/css/public-surface.css` and `assets/js/public-shell.js` — the shared footer's social icons and copyright line now share one row instead of two separate stacked rows, and the mobile gap between blocks was tightened. Mobile footer height: 270px → 222px. Desktop: 167px → 144.5px (also improved, not just mobile). Verified at both breakpoints with no layout regression.

## 2. Live-page embedded-logo audit (approved: "2. just leave for now")

No file changes. Traced inbound links for all 12 files originally flagged for embedding the logo as base64 — confirmed none are reachable from live site navigation (a graveyard of pre-redesign pages, or `academy.html`/`academy-partner-interest.html` which are separately on hold per the owner's own prior instruction). Left untouched per instruction.

## 3. Shop nav item (approved: "3. a")

`assets/js/public-shell.js` — added "Shop" as a top-level nav link (pointing to `merch.html`), between Home and the Programs dropdown, on the shared header used across every migrated page.

## 4. Marketplace logo (in progress on owner's side)

No action taken — owner is designing this separately and will upload it. `merch.html`'s Marketplace collection card still points at the missing `assets/Market Place/rebel-ranch-marketplace-graphic.png` until that happens.

## 5. Academy collection (approved: tagline "#2 — Real Skills for Real Life")

`merch.html` — added a 5th collection card ("Rebel Ranch Academy") using the existing `assets/rebel_ranch_academy_logo_transparent.png` asset (which already has "REAL SKILLS FOR REAL LIFE" baked into the badge design). Added `academy` to `validCollections`, added Academy keyword-matching to the collection auto-detector, added `academy: 'Rebel Ranch Academy'` to the name map, and added an Academy-specific "coming soon" empty-state message, matching the existing pattern for Working Hands/Marketplace.

## 6. Store visibility dashboard (approved: "6. yes" then "full control")

This is the substantial piece. Owner wants full, independent control over what's visible on the public store — able to publish something to the site immediately regardless of its Printify state, or leave something live in Printify without it ever appearing on rebelranchministries.org.

**New Supabase migration** (not yet applied — see below):
`supabase/migrations/20260821101229_merch_product_overrides.sql` creates `public.merch_product_overrides`, keyed by the Printify product ID (confirmed stable via a direct check of the live feed). Fields: `site_visible`, `featured`, `display_order`, `collection_override`, `type_override`. RLS: public (`anon` + `authenticated`) can `select`; only an admin (via the existing `private.is_admin()`, same function `operations-review.html`'s migrations already rely on) can `insert`/`update`. Includes explicit `grant select on ... to anon` — the missing-grants mistake from the 2026-08-15 outage was deliberately checked against this time.

The migration also **backfills one row per currently-live product** (45 rows, pulled directly from the live feed at build time) with `site_visible` set to match exactly what Printify's own `visible` flag shows today — so applying this migration does not blank out the shop. From that point forward, `site_visible` in this table is the only thing that controls the public store; Printify's own visibility toggle stops mattering to the website.

**New shared module:** `assets/js/merch-taxonomy.js` — the collection/type auto-detection logic, factored out of `merch.html` so both it and the new dashboard use the identical rules instead of two copies drifting apart.

**`merch.html` script rewrite:** converted to `type="module"`, now imports the Supabase client and the taxonomy module. Product loading now fetches the overrides table alongside the Printify feed, filters to only `site_visible === true` products, sorts featured items first (then `display_order`, then original order), and lets `collection_override`/`type_override` win over the auto-detected guess. Everything else on the page (filter buttons, collection cards, layout) is unchanged.

**New page:** `store-manager.html` — an owner-only dashboard, gated by the same Supabase-session + `admin`-role check `operations-review.html` uses (not linked from `account.html` yet, since that file appears to be under active work elsewhere and I didn't want to touch it — same reasoning `operations-review.html` itself isn't linked there either). Lists every live Printify product with its auto-detected collection/type shown for reference, and per-product controls that autosave on change: Visible, Featured, Order, Collection override, Type override.

## ⚠️ Before this is safe to publish

**The migration has not been applied.** I don't have authenticated Supabase access in this session. Until `merch_product_overrides` actually exists in the database, `merch.html`'s new script will fail its query and fall back to "We couldn't load the shop right now" — verified this exact failure mode locally. **Do not push `merch.html` live until the migration is applied and verified**, or the shop will break for every visitor, not just show stale content.

To apply it: run it through whatever path the other recent `academy_content_*` migrations in `supabase/migrations/` went through (Supabase CLI `db push`, or an authenticated Claude Code / Supabase MCP session).
