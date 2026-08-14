# Change description — 2026-08-14

**AI-Agent:** Claude Code
**Session:** Creation Station dashboard corrections walkthrough (2026-08-08 through 2026-08-14)

## Files backed up (pre-edit copies, this folder)
- `index.html.bak`

## Why

Owner wants to promote Creation Station now (a lot of real work is
live) without presenting the full five-page marketing site as finished
and generally available. Direction, confirmed twice: only the homepage
and a limited "glimpse" should be publicly discoverable for now — not
`creation.html`, `creation-station-membership.html`,
`creation-station-live-classes.html`, or the other Creation Station
marketing pages, all of which stay fully intact and working, just not
linked from the homepage anymore.

## What is changing

**`creation-station-beta.html`** (new) — a single self-contained beta
teaser page: badge + headline framing it as active beta, four real
(not invented) feature highlights pulled from what's actually built
this session (Guided Projects/journey tracker, Private Portfolio,
Weekly Live Sessions, practice-toward-a-real-storefront), and one
repeated CTA (`mailto:rebelranchfl@gmail.com?subject=...`) to sign up
as a tester. Deliberately does not use the shared Creation Station
header/footer or link to any of the other five Creation Station pages
— a minimal custom top bar (logo + "Rebel Ranch Ministries" link only,
no nav menu) so this page doesn't itself become a doorway back into
the pages being kept off the homepage.

**Note on the dashboard screenshot the owner asked for:** the existing
asset `assets/creation-station-dashboard-preview.png` is not a real
screenshot — it's an unfinished wireframe placeholder that has "Upload
this file to your GitHub assets folder under the exact same name"
baked into the image itself, and references a "Companion" character
that doesn't exist in the real, built dashboard (confirmed via this
session's earlier research — Companion only ever existed in a
disconnected demo page). Did not use it. The teaser page describes real
features in text instead. A real dashboard screenshot could be taken
later via the app's test-data hook, but that needs a local server,
which the owner has previously declined running mid-session — would
need to ask again explicitly.

**`index.html`** — the Creation Station card: "Available Now" →
"Now in Beta", both now linking to `creation-station-beta.html`
instead of `creation.html`. Removed the "See the two paths" expandable
section that linked directly to
`creation-station-membership.html`/`creation-station-live-classes.html`
— replaced with a single CTA button to the new beta page, so the
homepage no longer surfaces those pages at all.

**Unchanged:** every other Creation Station page — not deleted, not
modified, still fully functional for anyone who reaches them by direct
link (e.g., a real tester the owner emails a link to).
