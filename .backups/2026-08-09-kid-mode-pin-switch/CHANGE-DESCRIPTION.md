# Change description — 2026-08-09

**AI-Agent:** Claude Code
**Session:** Creation Station dashboard corrections walkthrough (2026-08-08/09)

## Files backed up (pre-edit copies, this folder)
- `creation-station-dashboard.html.bak`
- `creation-station-data.js.bak`
- `creation-station-app.js.bak`
- `creation-station-views.js.bak`
- `creation-station-dashboard.css.bak`

## Why

Last piece of "Bucket 3": a lightweight "Kid Mode" workspace switch, per
the owner's explicit decisions this session — (1) PIN management lives
in Parent View, (2) Kid Mode hides Parent View, Admin, the Creation
Station Studio (website) nav item, and the creator switcher, restricting
the child to Studio/Projects/Portfolio/Resources/Sessions/Growth for
their own creator profile only, (3) exiting requires a *separate* parent
PIN, not the child's own PIN, (4) explicitly agreed this is a
client-side convenience layer, not a real account-security boundary —
there is still only one real login per household (the parent's), so a
technically determined user could bypass this in dev tools. This was
the deliberate tradeoff versus giving children their own real login,
which was ruled out earlier in this session for COPPA reasons.

## What is changing

**Database** (migration `20260809200000_creation_station_kid_and_parent_pins.sql`,
applied live via Supabase MCP `apply_migration` before being committed):
adds nullable `kid_pin` to `public.creator_profiles` and nullable
`parent_pin` to `public.households`. Confirmed live beforehand that both
tables' existing owner-scoped UPDATE policies
(`creator_profiles_update_member_or_admin`,
`households_update_member_or_admin`) already cover writing these new
columns — no new grants or RLS policies needed.

**`assets/js/creation-station-data.js`** — `loadIdentity()` now selects
`kid_pin`/`parent_pin` alongside the existing creator/household fields.
New actions `setKidPin(creatorId, pin)` and `setParentPin(householdId,
pin)`.

**`assets/js/creation-station-views.js`** — `parent()` gained a "Kid
Mode" panel: one row per creator with a Set/Change PIN button, and a
household-level "parent PIN" control, both copy-labeled as a convenience
feature, not a security feature.

**`creation-station-dashboard.html`** — added `#kid-mode-toggle` button
in the sidebar's account-actions area (next to Sign Out), and a shared
`#pin-dialog` (one PIN input, reused for all four PIN actions: set a
creator's PIN, set the parent PIN, enter Kid Mode, exit Kid Mode).

**`assets/js/creation-station-app.js`**:
- `state.kidMode` (`null` or `{creatorId}`) and `kidAllowedRoutes`
  (studio/projects/portfolio/resources/classes/growth).
- `isEligible()` and `chooseInitial()` now check `state.kidMode` first —
  this is the single choke point that hides Parent/Admin/Website nav
  items (via the existing `updateSwitcher()`, unchanged) and blocks
  direct hash navigation to them while Kid Mode is on.
- `updateCreatorPicker()` also hides the "Working with [creator]"
  switcher while Kid Mode is on.
- New `updateKidModeUI()` (called every `render()`) swaps the sidebar
  button between "Enter Kid Mode" (hidden entirely if no creator has a
  PIN set yet) and "Exit Kid Mode (name)".
- New `openPin(mode, targetId)` / `#pin-form` submit handler drive all
  four PIN flows through the one dialog; entering/exiting Kid Mode is
  persisted to `localStorage` (keyed by user id) so a page refresh does
  not silently drop back into the full parent view — restored in
  `init()` before the first render.

**Sidebar CSS** (`assets/css/creation-station-dashboard.css`) — extended
the existing `.account-actions a{...}` rule to also match
`.account-actions button` (one selector, no new declarations) so the new
button matches its sidebar siblings instead of picking up the page-wide
button gradient.

**Unchanged:** every other view, dialog, and action. No existing
creator/household data modified or backfilled.
