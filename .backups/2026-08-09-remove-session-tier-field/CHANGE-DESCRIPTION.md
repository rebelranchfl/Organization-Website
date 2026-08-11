# Change description — 2026-08-09

**AI-Agent:** Claude Code
**Session:** Creation Station dashboard corrections walkthrough (2026-08-08/09)

## Files backed up (pre-edit copies, this folder)
- `creation-station-dashboard.html.bak`
- `creation-station-app.js.bak`
- `creation-station-views.js.bak`

## Why

Researched how `live_classes.minimum_tier` actually affects visibility
(as the owner asked, before touching the admin form). Traced the real
RLS rule: a published session is visible if the tier check passes, OR
the member has *any* active Creation Station membership at all
(including Club-only), OR they've ever completed a one-time Live
Session purchase. Since the dashboard itself won't admit anyone without
some active membership, that middle clause already grants every real
dashboard user full visibility regardless of `minimum_tier` — the field
is effectively inert for real accounts.

Owner's direction: Live Sessions and Club are intentionally *not* gated
by Studio tier — they're a separate on-ramp used to attract members into
Club (the weekly community), not a Studio-tier feature. Real gating is
Club membership / bundle-with-Club / one-time purchase, not
`minimum_tier`. Confirmed: remove the misleading Studio-tier control
from the scheduling form rather than build real per-session audience
targeting (not requested).

## What is changing

- `creation-station-dashboard.html` — removed the "Minimum tier" select
  from `#session-dialog`.
- `assets/js/creation-station-app.js` — `openEditSession()` no longer
  populates a tier field; the `session-form` submit payload no longer
  includes `minimum_tier`.
- `assets/js/creation-station-views.js` — `sessionRow()` (Admin View
  session list) no longer displays "tier N".

**Unchanged:** the `live_classes.minimum_tier` database column itself —
left at its default value, untouched. No RLS/grant changes here (that
was the separate `class_registrations` fix, already applied).
