# Change description — 2026-08-14

**AI-Agent:** Claude Code
**Session:** Creation Station dashboard corrections walkthrough (2026-08-08 through 2026-08-14)

## Files backed up (pre-edit copies, this folder)
- `creation-station-data.js.bak`
- `creation-station-views.js.bak`
- `creation-station-app.js.bak`

## Why

The previously-parked "mock store" idea — owner said "build it now."
Rather than a parallel pretend system, this reuses everything already
built for the real Studio (the request form, the product panel, import
from finished projects, photo upload) and just changes what happens on
submit based on whether the household is actually paying. No new
schema.

Also: owner wants kids to have full Studio *management* access in Kid
Mode (a separate, not-yet-built parent-approval-of-kid-changes queue is
the next piece — flagged, not built in this pass). Opening the route to
kids and non-paying accounts is a prerequisite for both the mock store
and that future approval queue.

## What is changing

`assets/js/creation-station-data.js` — `submitWebsite()` /
`updateWebsiteRequest()` no longer hardcode `status:'approved'`; they
take whatever `status` (and `approved_at` if present) the caller sends.

`assets/js/creation-station-app.js`:
- `openWebsite()` no longer blocks non-paying accounts from opening the
  request dialog.
- `website-form` submit handler now computes `isPaid =
  state.identity.tier >= 3` and sets `status:'approved'` (+
  `approved_at`) only when true; otherwise `status:'draft'` — the
  slug-assignment trigger only fires for `approved`/`published`, so a
  practice draft never gets a public slug or a live page, by
  construction, not by a UI-only check. The confirmation email also
  only fires for paid submissions — no point emailing "you're live"
  for a practice save.
- `isEligible()` — removed the `tier>=3` gate on the `'website'` route
  entirely (practice mode needs the route open to everyone); the real
  gate is now purely the status branch above, at the point where it
  actually matters (whether it publishes).
- `kidAllowedRoutes` now includes `'website'` — kids can reach Studio
  management in Kid Mode.

`assets/js/creation-station-views.js` — `website()` view now reads
`state.identity.tier` to show different framing: practice-mode users
see "Practice your Studio page" / "Practicing for free. Upgrade any
time to make it real," plus a new gold-accented "Practice mode" panel
with an upgrade CTA, once they have a draft request. Paid users keep
the existing "goes live immediately" framing. The Studio Products panel
(import-from-projects, add product) already worked for any request
regardless of status, so no change needed there.

## Explicitly not done in this pass (flagged separately)

- The parent-approval queue for a kid's Studio changes (owner wants:
  kid edits something → parent gets a notification → one-click
  approve). This is real new infrastructure (a pending-changes concept,
  plus email notification via the already-configured Resend, with SMS
  as a later follow-up needing a phone-number field and a paid SMS
  provider that doesn't exist yet). Opening the route to Kid Mode in
  this commit is a prerequisite for that work, not the approval gate
  itself — right now a kid's changes in Kid Mode apply the same way a
  parent's would (immediately, or as a practice draft if unpaid).
