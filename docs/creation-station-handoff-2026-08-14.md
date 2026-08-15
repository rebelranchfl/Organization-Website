# Creation Station — Handoff (2026-08-14)

Status: current as of 2026-08-14. This supersedes
`docs/creation-station-studio-dashboard-handoff.md` (2026-07-27) as the
active status document — that file is now historical background only; most
of what it described as "not yet built" has since been built. Keep updating
**this** file as work continues, rather than starting a new one, until it
in turn goes stale enough to warrant a fresh doc.

Read this after the required reading order in `AGENTS.md` (repo rules) and
`docs/rebel-ranch-ecosystem-charter.md` (program boundaries, open
decisions). This file assumes both.

## How this work has been going — protocol to keep using

This reflects how the owner and the agent have actually been working
together over this multi-day session. Keep doing it this way.

- **Follow `AGENTS.md` literally**: backup every file before editing
  (`.backups/YYYY-MM-DD-slug/*.bak` + a `CHANGE-DESCRIPTION.md` explaining
  why and what, written *before* editing begins), smallest change that
  satisfies the request, never touch an OWNER-LOCKED component without the
  owner explicitly naming that file/change, attribution trailers
  (`AI-Agent: Claude Code` / `Session: <title>`) on every commit and
  migration.
- **Ask before commit. Ask again before push.** These are two separate
  confirmations, not one. The owner has consistently wanted to review what
  changed before it's committed, and to explicitly greenlight it going
  live separately from that.
- **There is no local dev server available in this environment** (no
  python, no node/npx on PATH as of this session). Verification happens
  against the **live production site** (`rebelranchministries.org`)
  directly, using the Browser tool — read the accessibility tree, inject
  test CSS/JS to prove a fix *before* committing it, take real screenshots,
  check computed styles. Don't claim a UI fix works from source-reading
  alone; load the real page and prove it. This caught the true root cause
  of the skill-mosaic bug (a CSS Grid row-stretch issue, not literally
  "card 2") that pure code review had missed twice.
- **Verify against the database directly, not just the UI symptom.**
  Several "bugs" the owner reported by description or screenshot turned
  out to be something else once checked directly (a save that actually
  succeeded with zero data loss; six journey stages that were all present
  but cropped out of a narrow screenshot). Use the Supabase MCP tools
  (`execute_sql`, `get_advisors`, etc.) to confirm real state before
  proposing a fix. Run `get_advisors` after any schema change.
- **When a bug or gap is found incidentally while working on something
  else, flag it and fix it, but don't silently fold it into an unrelated
  change without saying so.** This happened a few times (a storage-upload
  RLS policy with no admin bypass, a `class_registrations` policy letting
  any authenticated user register for free) — each was called out
  explicitly, fixed, and attributed as its own thing.
- **Shared files mean shared bugs.** `creation-station-teaser.html` is a
  duplicate of the owner-locked `creation.html`, and both load the same
  `assets/css/creation-station.css`. A bug found on one likely exists on
  the other. Fixing it in a *shared* file (like the CSS) is fine once
  flagged and approved, since it's a pure correction with no content or
  behavior change — but never edit `creation.html` itself (or any other
  owner-locked page) without the owner naming that file specifically.
- **If the owner rejects a direction, stop and get the corrected direction
  in their own words before re-attempting** — don't quietly reinterpret
  and try again. The first beta-teaser page was rejected outright for
  inventing new UI patterns instead of reusing the real site's design; the
  fix was to ask clarifying questions and wait, not to guess a second time.
- **Plain language.** The owner is not technical. Explain what happened,
  whether anything is needed from them, and what the exact next step is —
  no unexplained jargon, no raw diffs/terminal output without a plain-
  English gloss next to it.

## What's built so far (chronological, by area)

**Dashboard UX/logic fixes** — self-reported completion tightened to only
count real completed/near-complete projects; "Sessions attended" reworded
to clarify it means Creation Station live sessions; Parent View privacy
copy reworded; dead "View benefits" link fixed; Academy cross-promo card
moved out of the Studio hero into a footer panel.

**Journey-stage redesign** — the raw status dropdown + free-number
completion + single notes box was replaced with a guided 5-stage picker
driven by the same `journeyStages`/`stageIndexFor` helpers the journey
tracker already used, plus four structured reflection prompts
(best/tricky/change/learned) instead of one blank textarea. A young-
creator gate question now has to be answered before the stage picker
appears.

**Kid Mode / Parent Mode** — PIN-gated workspace switch (`kid_pin` /
`parent_pin` columns), Parent View gained a Kid Mode panel and a live
Studio status/link panel per creator.

**Admin live-session scheduling** — the `live_classes` table had no admin
write access at all (RLS only granted `SELECT`); added `classes_admin_insert`
/`classes_admin_update` policies and a real Sessions panel + dialog in the
admin view. The since-removed "minimum tier" field on session scheduling
was found to be meaningless (real access is membership-status- or
purchase-based, not tier-rank) and was pulled from the form and the code
entirely.

**Security gaps found and closed incidentally:**
- `class_registrations` had a policy letting *any* authenticated user
  insert/update/delete freely with no payment check — split into
  `registrations_owner_read` (SELECT only) and `registrations_admin_write`
  (admin-only ALL).
- `creation_storage_insert` (project photo uploads) required a real
  membership with no admin bypass, unlike every sibling storage policy —
  this is what made an admin test account's project saves look like
  silent failures (the project row itself always saved fine; only the
  photo upload was blocked). Fixed with an `OR is_creation_station_admin()`
  clause.

**Website/Studio request workflow** — a partial unique index
(`creator_website_one_live_revision_idx`, one submitted/approved row per
creator) meant a second submission always collided; built a real update-
in-place flow (`prefillWebsiteForm`, `updateWebsiteRequest`) instead of
always inserting fresh. Admin got real review-queue actions (Approve /
Request Changes / Decline / Mark Published) with a review dialog.

**Public Creation Station Studio pages** (the big build) — modeled
directly on the existing Marketplace seller-page pattern:
- `public_slug` on `creator_website_requests`, auto-generated by a trigger
  when a request reaches approved/published, collision-checked.
- New `creator_studio_products` table (title, description, price label,
  storage path, active flag, sort order, source project link).
- `private.studio_is_publicly_listed()` — a security-definer function that
  re-derives the *request owner's* real membership tier (not the viewer's
  session), gating anonymous public reads correctly.
- A new public storage bucket (`creation-station-studio-public`) with
  owner-scoped write policies, separate from the private project-asset
  bucket.
- `creation-station-studio.html` + `creation-station-studio-public.js` —
  the actual public page, reached via `?studio=<slug>`, anon-key reads
  only. Styled by reusing the exact CSS classes from the owner-locked
  Studio showcase mockup on `creation.html` — that source markup was
  never modified, only its class names were reused elsewhere.
- Dashboard got product management (create/edit/delete/reorder) and an
  "import from a completed project" flow that pulls a finished project's
  photo out of the private bucket and re-uploads it to the public one
  (`importProject` — note this reads from `creator_projects`/
  `project_assets`, not the empty, never-populated `portfolio_items`
  table the first version mistakenly pointed at).
- `payment_methods`, `payment_other_note`, and `delivery_methods` columns
  were added to `creator_website_requests` alongside the slug work, so the
  "how does a buyer pay/receive it" question from the earlier planning doc
  is already answered in the schema — no separate structured-fields
  decision is still pending there.

**Authorization model simplified** — owner's explicit direction: no admin
review gate for going live. "The checkbox and payment tier are the
authorization... we are just doing a cover-our-ass on the checkbox and
parent approval." `submitWebsite`/`updateWebsiteRequest` now take `status`
from the caller instead of hardcoding a review-pending value.

**Practice/mock store** — reuses the exact same Studio infrastructure for
non-paying creators: the same request/product code path, just with
`status:'draft'` instead of `'approved'` (so the slug-assignment trigger
never fires and no public page is ever generated) when
`state.identity.tier < 3`. The Studio route is now open to everyone,
including Kid Mode, with a gold "Practice mode" panel and an upgrade CTA
shown instead of a hard paywall.

**Homepage beta teaser** — after a first attempt was rejected for
inventing new UI instead of reusing the real design: `creation-station-
teaser.html` is a byte-for-byte duplicate of `creation.html` (which
remains untouched), with every link that goes deeper into paid/real
Creation Station pages replaced by a "Sign Up to Test" dialog (reusing the
same Formspree endpoint already wired up for Academy's "Notify Me," 
distinguished by its own `form_type`). Marketplace stays linked, per
owner instruction. The homepage's testimonials section was removed
outright (not replaced) per owner instruction, pending real quotes.
Two follow-up bug passes on the teaser page: duplicate "Sign Up to Test"
buttons removed, and the shared JS-injected footer (invisible to a static
HTML search — worth remembering) swapped for a minimal static one that
only links back to the homepage.

**Skill-mosaic CSS Grid fix (latest, 2026-08-14)** — what looked like "card
2 renders expanded with no text" was actually CSS Grid's default
`align-items: stretch` making every card in the same *row* match the
tallest (open) card's height at 2- and 3-column breakpoints. Fixed with
one line (`align-items: start` on `.skill-mosaic`) in the shared
`assets/css/creation-station.css` — this also fixes it on the real,
owner-locked `creation.html`, which shares the stylesheet. Verified live
by injecting the equivalent CSS into the production page and re-checking
computed heights before committing. Committed and pushed
(`abd5bbf`).

## Current architecture map (for quick orientation)

- **Data layer**: `assets/js/creation-station-data.js` — pure functions in
  an `actions` object, never throws, always returns `{data, error}`.
- **Views**: `assets/js/creation-station-views.js` — pure render functions
  returning HTML strings, exported as `renderers`. Journey-stage helpers
  (`journeyStages`, `stageIndexFor`, `stageToProgress`) live here.
- **Orchestrator**: `assets/js/creation-station-app.js` — hash-based
  routing, a `state` object, `bindScreen()` re-binds events after every
  render, `withBusy()` wraps async actions. `isEligible()` and
  `kidAllowedRoutes` control what Kid Mode and each tier can reach.
- **Dashboard shell**: `creation-station-dashboard.html` +
  `assets/css/creation-station-dashboard.css`.
- **Public marketing pages**: `creation.html` (real, owner-locked),
  `creation-station-teaser.html` (duplicate, beta-only, freely editable),
  `creation-station-studio.html` (public per-creator storefront), plus
  `creation-station-membership.html`, `creation-station-experience.html`,
  `creation-station-live-classes.html`, `creation-young-creators-interest.html`
  — all still fully live, just not linked from the homepage while the beta
  teaser is up.
- **Supabase project**: "Rebel Ranch Platform" (`dfrwxpuojeiykaignyny`),
  accessed via the Supabase MCP tools. **Note:** as of this session's end,
  the Supabase MCP connection shows as needing re-authorization — the
  owner will need to reconnect it (via `claude mcp` or `/mcp` in an
  interactive session) before the next round of schema/edge-function work
  can happen the same way.
- Full migration history: `supabase/migrations/`, newest-first by
  filename timestamp; every one carries the `AI-Agent`/`Session` header.

## What's left / open work

**Owner-confirmed priority order (set 2026-08-14, at the end of this
document's own writing session): do these in this order.** Nothing below
has been started yet — the dashboard audit had barely begun (one file
read, no findings written up, no code touched) when this handoff was
corrected to stay a handoff instead of turning into the work itself. Pick
up at item 1.

1. **Full dashboard navigation/ease-of-use audit — start here, not
   started.** Owner's words: *"go through this entire dashboard, check all
   buttons, links, etc, ensure all features are available and function
   appropriately and we need to think of ease of use. make navigation
   simple and direct people through here. this dashboard feels like a
   maze to me."* Confirmed 2026-08-14 as the top priority of the three
   items below. Treat as its own pass: map every nav item/button/link
   across all nine views (Studio, Projects, Portfolio, Resources, Classes,
   Growth, Creator Website, Parent, Admin), confirm each one goes
   somewhere real and correct, and look at simplifying the overall
   structure rather than just spot-fixing.
   - **One concrete starting point, already spotted but not yet fixed or
     written up in detail:** the website/Studio-request dialog
     (`creation-station-dashboard.html`, `#website-dialog`) still has
     stale copy from before admin review was removed. The submit button
     says "Submit for review," and the parent-consent checkbox text says
     *"I understand this submits a request for Rebel Ranch Ministries to
     review before anything becomes public"* — but `openWebsite`'s submit
     handler in `creation-station-app.js` (~line 39) now sets
     `status:'approved'` and goes live immediately for paid tiers (or
     `status:'draft'` for practice mode), with no review step at all. The
     copy is actively wrong, not just stale. Worth fixing as part of this
     audit pass, not in isolation, since it's exactly the kind of thing
     the audit should be finding systematically.
2. **Gamification expansion — owner has given direction, not started.**
   Corrected from an earlier draft of this document, which wrongly framed
   gamification as fully out of scope: it's live today (1 point per
   logged action, streak resets after 5 idle days, one "First Project"
   badge, shown only on the Studio hero banner and the Studio home
   achievement panel), and on 2026-08-14 the owner confirmed wanting it
   expanded in two specific directions:
   - **Build out a real badge library** — more than the single "First
     Project" badge. Needs product decisions (what earns each badge) that
     haven't been discussed yet — scope those with the owner before
     building, don't invent a badge list unilaterally.
   - **Show points/streak/badges in more places** — currently invisible
     outside the Studio home screen. Candidate spots not yet confirmed
     with the owner: Growth view, Parent view, Kid Mode.
   The Companion/robot-assistant idea is a separate thing from this and
   stays out of scope — the charter (`rebel-ranch-ecosystem-charter.md`,
   §4) explicitly places it in "Later phase — not part of current styling
   work." Don't fold Companion work into badge-library work without a
   fresh explicit ask.
3. **Adult-path naming still not unified.** The old planning doc flagged
   that the adult/crafter path on `creation.html` still calls itself
   "Creator Page(s)" in places (`Already creating?` → `About the Creator
   Page` → `Start a Creator Page`) while the rest of the app now says
   "Creation Station Studio" (the tier name itself was already renamed in
   `creation-station-data.js`). This is on the owner-locked page, so it
   needs explicit authorization naming `creation.html` before touching it.
   Confirmed lowest of the three priorities on 2026-08-14 — small,
   contained, save for last.

**Also still open, not part of the three-item priority order above:**

4. **Parent-approval-of-kid-changes notification queue — not built.**
   Owner's direction: kids get full management access to the Studio, but
   a parent has to approve what they change, via notification.
   Explicitly scoped to **email only for now** (Resend is already wired
   up); SMS was explicitly deferred — there's no phone-number collection
   or SMS provider in place yet, and that's a separate decision for
   later. This needs real new infrastructure: a pending-change concept
   (what counts as a "change" — a new product? an edit? a delete?), a
   review/approval record, and a one-click email approval link. Not
   started.
5. **Same class of CSS-grid stretch bug elsewhere?** The skill-mosaic fix
   was narrow (one selector). Nobody has checked whether any *other*
   multi-column grid on the site (e.g. other accordion/panel patterns)
   has the same `align-items: stretch` default problem. Not investigated,
   just worth keeping in mind if a similar "empty box" report comes in
   from a different section.
6. **Local preview capability.** There's no dev server tool available in
   this Windows environment right now (no python, no npx on PATH). All
   verification this session happened against the live production site.
   If that becomes limiting, ask the owner whether installing something
   locally (or using the app's `window.__RRM_STUDIO_TEST_DATA__` test
   hook, documented in `docs/phase-4-creation-station.md`) is wanted —
   don't install anything without asking, per `AGENTS.md`.

## Reference

- `AGENTS.md` — repo-wide working rules (read first, every session).
- `docs/rebel-ranch-ecosystem-charter.md` — program boundaries, confirmed
  decisions, and the current open-decisions list.
- `docs/creation-station-studio-dashboard-handoff.md` — historical
  planning notes from 2026-07-27; background only, largely superseded by
  the "What's built" section above.
- `docs/creation-station-dashboard-visual-rules.md`,
  `docs/creation-station-visual-rules.md` — visual/styling rules for this
  program specifically (do not apply the main RRM visual system here).
- `docs/phase-4-creation-station.md` — original build spec, including the
  `window.__RRM_STUDIO_TEST_DATA__` test-fixture hook.
