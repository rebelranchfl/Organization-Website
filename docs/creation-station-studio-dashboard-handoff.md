# Creation Station Studio & Real Dashboard — Handoff

Status: planning/discussion only. Nothing described here has been built yet
unless explicitly marked "already exists." Written 2026-07-27 to capture a
long strategy conversation before it's lost; update this file as the
conversation continues rather than starting a new one.

## The core finding: concept vs. reality gap in the real member dashboard

The owner has a polished "conception" reference image of the intended member
dashboard (sidebar nav, a named robot companion "Nova" front and center,
points/streak/achievement-badge gamification, a 6-stage "Creation Journey"
tracker, a colorful playful visual system). The owner had not personally seen
the real, built dashboard since the original concept and was concerned it
might not match.

**Verified by reading the actual code** (`creation-station-dashboard.html`,
`assets/js/creation-station-app.js`, `assets/js/creation-station-views.js`,
`assets/js/creation-station-data.js`, `assets/css/creation-station-dashboard.css`):

- The backend/logic/data layer is real and solid: real Supabase-auth-gated
  access, real membership-tier checking, 9 real views (Studio, Projects,
  Portfolio, Resources, Classes, Growth, Creator Website, Parent, Admin),
  real project creation/progress-saving, real file uploads (20MB limit,
  type-restricted), a real Portfolio with a Private → Submitted → Reviewed →
  Published pipeline respecting parent control over minors' work, a real
  Creator Website request workflow, a real Parent view, and a real Admin
  review queue. The "Growth" view honestly labels unbuilt Marketplace metrics
  as "Not connected yet" rather than faking data — good practice, not a bug.
- Visually it uses the real brand palette (purple/pink/teal/gold) in a clean,
  functional way (`creation-station-dashboard.css`, 8 dense lines covering a
  full app). It is not broken or ugly. It is a **top-nav, panel/metric-card
  SaaS-dashboard layout**, not the sidebar app in the reference image.
- **The Companion (Nova) does not exist anywhere in the real dashboard.** The
  robot character, the naming/color/catchphrase mechanic, and the "chat with
  companion" idea only exist in a completely separate, disconnected public
  demo page (`creation-station-experience.html`), which no member login ever
  reaches. A real member today never meets a companion at all.
- **There is no gamification anywhere** — no points, streaks, or achievement
  badges in the demo or the real app.

**Conclusion:** what shipped is a real, working project/portfolio tracker.
What was designed was a game-like creative companion experience. Only the
first one exists today. The gap is real but narrower than "the dashboard is
low-level" — the underlying engineering is sound; what's missing is the
emotional/game layer (Companion + gamification) plus a visual layout change
(sidebar).

## Effort read on closing the gap, piece by piece

1. **Sidebar redesign (colorful, matching the reference layout)** — small/
   medium. Pure front-end/layout work. No new data needed — Projects,
   Portfolio, Classes, Resources, Growth all already have real data to
   render; this is a different shell around existing content.
2. **Companion character** — medium, with a real head start: the actual SVG
   robot art and the naming/color/catchphrase picking mechanic **already
   exist and work** in `creation-station-experience.html` (see `#companion`
   section and the inline script starting `const companionName=...`). This
   is "wire the existing thing into the real dashboard and give it a
   permanent home in the database" more than "build from nothing." Needs:
   a place to persist a companion's name/color/catchphrase per creator
   (new column(s) on `creator_profiles` or a small new table), and a
   dashboard hero treatment reusing the existing SVG/mechanic.
3. **Gamification (points/streaks/badges)** — the largest of the three.
   Nothing like this exists anywhere yet. Needs new data (a points/streak
   store per creator, badge/achievement records) and real product decisions
   about what actually earns points or breaks a streak — not just a UI job.
4. **Letting the owner actually see the real dashboard** — the app has a
   built-in test hook made for exactly this:
   `window.__RRM_STUDIO_TEST_DATA__`, accepted before module init, documented
   in `docs/phase-4-creation-station.md` ("Test hook" section) and read in
   `creation-station-app.js`'s `init()`. Fixture data in the shape returned
   by `loadIdentity()`/`loadWorkspace()`/`loadAdminSummary()` (see
   `creation-station-data.js`) can render the real dashboard with fake data,
   no real login needed — a real screenshot of the real app is possible
   without deploying or needing credentials. Not yet attempted; needs a
   local static server (previously declined once by the owner mid-session —
   ask again explicitly before doing this).

## Tier names vs. age bands — clarified, keep these separate

These are two independent axes, not one scale:
- **Membership tier** (what was purchased): `tierNames={1:'Young Creator
  Family',2:'Creator Development',3:'Creator Website'}` — hardcoded in
  `creation-station-data.js`. Tier 3 unlocks the Creator Website nav item
  (`data-min-tier="3"` in `creation-station-dashboard.html`) regardless of
  the creator's actual age.
- **Age band** (an attribute of each creator profile): `young_6_12` /
  `teen_13_17` / `adult_18_plus` on `creator_profiles.age_band` — drives
  Companion persona and copy tone via `audience()`/`copyForAudience()` in
  `creation-station-views.js`, independent of which tier the household paid
  for.
- A family can buy the cheapest tier for a teen, or the top tier for a young
  child whose parents want the website feature early. Don't build messaging
  or logic that assumes tier and age move together.

## Decision: rename "Creator Website" tier to "Creation Station Studio"

Confirmed by the owner. This needs to happen in the **real app code**, not
just marketing copy — found the literal source of truth:
`assets/js/creation-station-data.js` line 3:
`export const tierNames={1:'Young Creator Family',2:'Creator Development',3:'Creator Website'};`
This is what actually renders as the tier label throughout the real
dashboard (nav item, hero eyebrow, etc.) — not yet changed, flagged for
whoever picks this up.

Also confirmed: **"Creation Station Studio" is a paid-tier-only brand name.**
There is no free version of "Creation Station Studio." The free option is
the Marketplace (for marketplace vendors, local businesses, and crafters
generally) — a separate thing, never branded "Studio." Keep this
distinction in all future copy.

## Decision: simplified "graduation" flow (dashboard Portfolio → live Studio)

Original idea discussed: automatically "transform" or migrate a creator's
in-dashboard Portfolio work into a live Creation Station Studio storefront.

**Simplified, confirmed direction:** no auto-migration for now. A creator/
family purchases the Creation Station Studio tier, then manually re-enters
their own products, photos, and story into the Studio — fresh, not migrated
from their practice Portfolio. Auto-migration is explicitly deferred as a
possible *future* upgrade, not required now. This is a much smaller lift
than originally scoped.

Naming distinction to preserve in copy: the interactive dashboard has a
"**Portfolio**" (private practice space — this already exists for real,
see `creation-station-views.js`'s `portfolio()`/`portfolioCards()`). The
paid tier has a "**Creation Station Studio**" (the live, public, selling
page) — similar in spirit but a distinct, separate destination.

Confirmed: expanding beyond one project per creator requires **no schema
change** — `creator_projects` already supports many rows per creator
(verified directly against the database). The "one project" limit only
exists in the simplified public demo page, not the real product.

## Decision: reuse the existing Studio showcase as the storefront template

The existing "Creation Station Studio™" showcase section already built on
`creation.html` (product photos, cart-style layout, contact options) should
serve as the **visual template** for a creator's real, live storefront page.
This maps well onto the real `creator_website_requests` table, which already
has `brand_name`, `story`, `products`, `social_links`, and `published_url`.

Confirmed simplification: **no real shopping cart or checkout integration
needed.** The storefront is closer to a landing page than an e-commerce
site — it needs to tell a buyer how to pay (their own PayPal link if they
have one, else fallback instructions like Zelle/CashApp) and how the
product gets delivered (ship, local pickup, digital, etc.). These are new
fields the `creator_website_requests` shape doesn't yet have and would need
to be added.

## Decision: adult path — keep a light footprint, don't cut entirely

Full context from earlier in the conversation, still standing:
- Don't gate by literal age. Instead, present an explicit choice/fork so
  visitors self-select: a lighter, still-branded Creation Station path for
  newer/younger-leaning makers vs. a direct route into the real Marketplace
  for already-established crafters who just want a listing.
- The adult page's current fake storefront demo (a pretend product/cart
  mockup, separate from the real Marketplace and separate from the real
  Creator Website system) should be replaced by routing straight into the
  real systems instead of maintaining a parallel pretend version.
- The adult page currently mis-names itself "Creator Page(s)" in its own
  header/nav while showing "Creation Station Studio™" in its content — this
  should be unified to "Creation Station Studio" everywhere once the rename
  work happens.

## Open items / not yet decided

- Whether the owner wants the test-fixture screenshot attempt now (needs a
  local server; ask again before running one).
- Exact shape of new fields needed for payment/delivery info on the
  storefront (single free-text field vs. structured payment-method +
  delivery-method fields — not yet discussed).
- Whether Companion data lives on `creator_profiles` directly or a new
  table — not yet decided, just scoped as "needs somewhere to live."
- Points/streak/badge rules (what specifically earns them) — not yet
  discussed at all.
- The age-differentiated Companion persona work (robot for young_6_12,
  "assistant" persona for teen_13_17/adult_18_plus) from the earlier
  handoff is still separately queued and relevant here — a real Companion
  build should probably do both at once rather than building the young
  persona now and the assistant persona later.
