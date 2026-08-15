# Dashboard audit fixes — 2026-08-15

Owner-approved fixes from the navigation/ease-of-use audit (item 1 of
`docs/creation-station-handoff-2026-08-14.md`'s priority order). All four
items below were discussed and explicitly approved by the owner in
conversation before any file was touched.

## 1. Storefront request form — copy no longer matches what the code does
**File:** `creation-station-dashboard.html` (`#website-dialog`)
The parent-consent checkbox and submit button describe a "review before
anything becomes public" step that doesn't exist — `openWebsite`'s submit
handler in `creation-station-app.js` actually publishes immediately for
paid tiers or saves a private practice draft otherwise. Rewriting the
checkbox text and button label to state the true behavior. Also fixing the
dialog's default heading, which still reads "Creator website request" on
first submission — a direct violation of the standing "Creator Website" →
"Creation Station Studio" naming rule, found incidentally while in this
same dialog.

## 2. Hero size + upgrade card scoping
**Files:** `assets/css/creation-station-dashboard.css`,
`assets/js/creation-station-app.js`
Shrinking `.studio-hero`'s padding and headline size (owner: "much
smaller"). Scoping the `#hero-card` upgrade/manage banner to only render
on the Studio and Growth tabs — owner chose this over full removal, to
keep the dashboard's only upgrade nudge (per the org's own
under-marketing concern in `docs/non-negotiables.md`) while removing it
from Parent, Admin, Projects, Portfolio, Resources, and Sessions where it
doesn't apply. The "Start New Project" hero-cta button itself is
intentionally left untouched — out of scope for today, flagged separately
for a future decision.

## 3. "Dashboard" vs. "Studio" naming
**Files:** `creation-station-dashboard.html`,
`assets/js/creation-station-app.js`, `assets/js/creation-station-views.js`
The charter (`docs/rebel-ranch-ecosystem-charter.md`, §10) already defines
"Creation Station dashboard" (the workspace) and "Creation Station Studio"
(the paid public page) as two separate things, but the UI used "Studio"
for both. Renaming the home tab and welcome copy to "Dashboard" so
"Studio" is reserved exclusively for the paid public page, matching the
charter. Only display text changes — the internal `data-route="studio"`
route key, `state.view` value, and all JS variable/function names stay
`studio` per the standing rule never to rename underlying code
identifiers.

## 4. Footer tagline correction
**Files:** `assets/components/creation-station-footer/footer.html`,
`creation-station-live-classes.html`,
`creation-young-creators-interest.html`
Owner confirmed the correct tagline is "Create. Learn. Promote. Earn."
These three files currently show "Create. Learn. Build. Grow." — updating
to match. (`creation-station-dashboard.html` and
`creation-station-adult-page.html` already have the correct text; no
change needed there.)

## Addendum — follow-up refinement (same session, after owner review)
Owner reviewed the naming fix and asked about two further changes: renaming
the "Creation Station Studio" nav tab to "Live Creation Station Studio,"
and lengthening a couple of button labels to say "Creation Station Studio"
in full. Recommended against both — the nav tab serves both live (paid)
and practice/draft (unpaid) members, so labeling it "Live" would be wrong
for practice-mode users; and once the home tab no longer competes for the
word "Studio," lengthening buttons like "Manage My Studio" adds no real
clarity. Owner agreed. The one change made: the public-page link in the
website view, `assets/js/creation-station-views.js`, "View my live Studio
page" → "View My Live Page" — this is the one place "Live" actually
belongs, since it's the literal link to the real public page.

## Not touched
`creation.html` (owner-locked, not named for this change) and any file
outside Creation Station.

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-15)
