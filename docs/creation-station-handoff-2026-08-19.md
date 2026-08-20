# Creation Station — Session Handoff (2026-08-19)

Status: covers **this session's** changes only. This is not a full
update of `docs/creation-station-handoff-2026-08-14.md` — that doc's
"What's left" list has moved on significantly since 2026-08-14 (a
Companion feature, journey/badge work, and a Portfolio rebuild all
landed in between, per `.backups/` folders dated 2026-08-15 through
2026-08-18, none of which this session was part of or has full context
on). Read this doc alongside that one, not as a replacement for it.

## Commit/push status — read this first

**Pushed and live on `main`:**
- `7b39147` — Passion to Profit copy fix on `creation.html`, deep-link +
  rainbow bridge banner into `merch.html?collection=creation-station`,
  footer merch link styled as a rainbow pill.
- `6dc7faf` — Fixed a real bug: uploading a new project photo in the
  dashboard added a duplicate row instead of replacing the old one.
- `449f0fb` — "Choose your path" section on `creation.html` converted
  from text-only cards to visual cards (three images added).
- `d280994` — Those same three cards recopied from persona-based
  ("Adult Makers & Crafters") to outcome-based ("Sell What They Make").

**NOT pushed — sitting in the working tree, needs review before it
ships:**
- `creation.html` + `assets/css/creation-station.css` — a second round
  of path-section changes: the section intro rewritten with the real
  "buy time / positive screen time / passion into business skills"
  value prop, card 1's image swapped from a generic demo photo
  (`bracelets.png`) to a real cropped screenshot of the actual live
  dashboard, the "guiding" language on the `#experience` section
  heading corrected to "keeps them on track" (the dashboard tracks
  progress, it doesn't actively guide), and the decorative 01/02/03
  numbers removed from all three cards.
- `creation-station-dashboard.html`, `assets/js/creation-station-app.js`,
  `assets/js/creation-station-views.js`,
  `assets/css/creation-station-dashboard.css` — the dashboard home
  ("Studio" view) redesign, see below. This is the largest and
  riskiest change of the session — it touches the screen every member
  sees first.

Back up everything is at `.backups/2026-08-19-*/`, each with its own
`CHANGE-DESCRIPTION.md` written before editing, per `AGENTS.md`.

## One thing worth knowing before you look at the dashboard image

`assets/creation-station-dashboard-preview.png` (used as card 1's new
image) already existed in git before today, from a commit titled "Add
files via upload." It turned out to be a placeholder wireframe with
text baked into the image itself reading *"Upload this file to your
GitHub assets folder under the exact same name."* — a stand-in from an
earlier session, waiting to be manually replaced. Today's real dashboard
screenshot was saved to that same filename, which happens to be exactly
what that placeholder was asking for — just done through this session
instead of a manual GitHub upload. Nothing was lost; the old placeholder
is still recoverable from git history (`git show 03f2b02:assets/creation-
station-dashboard-preview.png`) if you ever want to see it again, but I
didn't know it was there when I picked that filename, so flagging it
rather than letting it pass silently.

## What changed today, by area

### 1. Merch promotion
CS dashboard sidebar, the shared CS footer, and a new caption on
`creation.html` all now deep-link to `merch.html?collection=creation-
station` instead of the bare merch page. `merch.html` reads that query
param, pre-selects the Creation Station collection filter, and shows a
rainbow "Welcome back, Creation Station shopper!" banner — but only for
that referral; default RRM visitors see no change. Footer merch link
restyled as a rainbow-gradient pill to match the dashboard sidebar
promo.

### 2. "Passion to Profit" section on `creation.html`
Header changed from "From Project to Profit" to "From Passion to
Profit" (echoes the already-approved "from passion to possibility"
tagline). Third journey-chain step renamed "Payoff / What can it
become?" (was "Proof"), with a one-line bridge connecting it to the
Studio showcase directly below. Merch caption added after the showcase.

### 3. Project photo upload bug (real bug, not a UI ask)
`uploadProjectAsset` in `creation-station-data.js` always inserted a new
`project_assets` row and never removed the old one, so every re-upload
looked like it silently failed — the display kept resolving to
whichever row the database happened to return first. Fixed to delete
the previous photo (row + storage object) after a successful new
upload, matching how every consumer of `project_assets` already treats
it as one-photo-per-project. Verified against real RLS policies before
shipping (owner already had DELETE rights on both the table and the
storage bucket — no grant/policy gap). Cleaned up two stale duplicate
rows already sitting on the owner's own test account from before the
fix.

### 4. "Choose your path" section — two rounds
First round: added one image to each of the three cards (real product
photos already used elsewhere on the site, deliberately not reusing the
page's own hero image to avoid repeating it one section down).

Second round, prompted by comparing this section against the rest of
the page's tone: recopied from three *personas* (family / club / adult)
to three *outcomes* (store their crafts / make friends / sell what they
make) — adults get an inline link to the existing `#adult-path` section
instead of a competing card. This also avoids presenting "Dashboard" and
"Landing Page" as two equal products when they're really two tiers of
one membership.

Still sitting uncommitted: the value-prop rewrite, the real dashboard
image on card 1, the "guiding" → "keeps them on track" fix, and removing
the card numbers (see push status above).

### 5. Dashboard home screen ("Studio" view) redesign
The big one. Came out of directly comparing the real dashboard against
`creation-station-experience.html` — the original design concept the
product never quite became. Decided what to keep from the concept and
what not to, then rebuilt the real home screen's hero and top-of-page
work area:

- **Hero**: young-creator greeting rewritten to a real personalized
  welcome ("Welcome to your Creation Station Dashboard, {name}!" — name
  in the rainbow line). Removed the "Manage My Studio" banner (the
  Studio link already lives in the sidebar nav) and the "Creation
  Station Studio · Young Creator" eyebrow. Points/streak/badges pills —
  which already existed and were already wired to real data, just
  small — sized up per a repeated owner request.
- **Removed** the "First Project Badge" achievement card (no
  expiration logic — it would show forever after one completed
  project) and the Active/Completed metric tiles from this screen; that
  stats content belongs in Portfolio/Parent view, not the "I'm actively
  creating" screen.
- **Journey + Companion panel** made sticky, with a compact
  stage-name-and-progress summary bar always visible and a toggle to
  collapse the full companion/tracker for screen space — addresses the
  owner's own flagged concern that a permanently sticky full panel
  would eat the whole phone screen.
- **Companion first-login flow**: if a young creator has no saved
  Companion yet, the full customization dialog now opens automatically
  once per session instead of waiting for a button click. After saving,
  reverts to button-only.
- **Workbench routing** now branches on how many in-progress projects a
  creator has: one goes straight to a stage-focus card naming their
  real current stage with a relevant prompt question; two or more show
  a compact horizontal picker row (mocked up and approved before
  building); zero keeps the existing "choose your next project" grid.
- **Portfolio pointer** added after the work area.

**Deliberately not built, flagged rather than silently skipped:** the
concept page's six distinct stage-specific question/checklist screens
(a different prompt, checklist, or capture step for each of Dream/Plan/
Make/Capture/Share/Grow), confetti on stage completion, and multi-photo
progression capture. The real data model only has one combined
reflection form — true per-stage persisted answers need new database
columns, which is a real schema decision on its own. Multi-photo
capture also directly conflicts with the single-photo-replace fix from
item 3 above and needs its own explicit decision if wanted.

## Open decisions / good next pieces

1. **Ship the two uncommitted batches** (path-section round 2, dashboard
   redesign) — review and push when ready.
2. **Photograph `creation-station-membership.html`'s existing "Choose
   the right Creation Station path" comparison** (Studio / Club /
   Marketplace) — this was the actual starting point of the merch/path
   conversation and never got touched; discussed as the better home for
   a product-picture grid than building a new one on `creation.html`.
3. **Bundle-savings visibility earlier in the funnel** — a small link
   pointing to `creation-station-membership.html#join`'s bundle pricing
   was added to the path-section intro (round 2, uncommitted), but
   there's no equivalent teaser anywhere else on `creation.html`.
4. **Stage-specific prompts as real persisted data** (see "deliberately
   not built" above) — needs a schema decision before it's a UI task.
5. **Confetti on stage completion** — cheap, no schema change needed,
   good small follow-up if wanted.
6. **Multi-photo progression capture** — needs an explicit decision
   since it reverses the single-photo-replace behavior shipped in item
   3; the database already supports multiple rows per project, the
   replace logic would just need to become additive again with proper
   UI for "which photo is this."

## Reference

- `AGENTS.md`, `docs/rebel-ranch-ecosystem-charter.md` — read first,
  every session, per repo rules.
- `docs/creation-station-handoff-2026-08-14.md` — prior handoff; still
  useful for its architecture map and protocol notes, but its "what's
  built"/"what's left" sections predate several intervening sessions'
  work and this one.
- `.backups/2026-08-19-*/CHANGE-DESCRIPTION.md` — one per batch listed
  above, each with the specific files touched and why.

AI-Agent: Claude Code
Session: Creation Station merch promotion + Passion to Profit copy discussion (2026-08-19)
