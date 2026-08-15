# Dashboard nav grouping + home-screen trim — 2026-08-15

Owner-approved "light version" of the structural navigation fix (owner
chose this over a full merge of routes, given nothing is live and no one
is a member yet — but wanted to try the lower-risk pass first regardless).
Builds on top of today's earlier "dashboard-audit-fixes" backup, which is
why this is a fresh backup folder rather than a re-use of that one.

## Root problem being addressed
The owner said "I feel lost navigating my own website." Investigation
found the real cause isn't broken links (already confirmed all 9 tabs are
correctly wired) — it's that the Dashboard home screen previews five other
tabs at once (Projects, Portfolio, Sessions, Resources, plus its own
metrics), so every other tab feels redundant with what's already on the
home screen, and 7 flat, equally-weighted sidebar items give no shortcut
for scanning. Owner explicitly did not want a onboarding-tour band-aid —
wanted the actual structure addressed first.

## 1. Sidebar grouping (visual only)
**File:** `creation-station-dashboard.html`
Added three `<p class="nav-group">` labels into the existing flat nav list
— "Create" before Projects/Portfolio, "Learn" before Resources/Sessions,
"Grow" before Growth/Creation Station Studio. No `data-route` values
changed, no tab renamed/removed/merged, no route added — this is purely
new non-interactive markup inserted between the existing `<a>` tags, so
routing, Kid Mode's allowed-route list, and `isEligible()`/`updateSwitcher()`
(which only ever select `[data-route]` elements) are all unaffected.

## 2. Home screen trim
**File:** `assets/js/creation-station-views.js` (`studio()` function)
Cut the Dashboard's redundant full-previews down to what's actually
home-screen-appropriate:
- Metric tiles: 4 → 2 (kept Active projects, Completed; dropped Portfolio
  status and Skills practiced, which either duplicate Growth or aren't
  informative at a glance)
- Removed the Portfolio preview panel and "Upcoming" sessions preview and
  "Studio tools" resources preview entirely from the home screen — each is
  now one click away via the newly-grouped Create/Learn sidebar sections
- Kept unchanged: journey tracker, first-project achievement panel,
  "on your workbench" project preview, "recommended next action" panel,
  and the tier-3 Academy CTA at the bottom
- The `portfolioCards`, `classList`, and `resourceList` functions
  themselves are untouched — only removed their invocation from the home
  screen. Portfolio, Sessions, and Resources tabs are fully unaffected.

## 3. Supporting CSS
**File:** `assets/css/creation-station-dashboard.css`
Added `.nav-group` (label + divider styling, matches the existing
`.eyebrow` uppercase treatment) and `.metric-grid-compact` (a 2-column
variant, added as its own class rather than an inline style so the
existing mobile breakpoints that collapse `.metric-grid` to 1 column on
narrow screens still apply correctly).

## Not touched
Route definitions, Kid Mode logic, any Supabase query/mutation, Growth,
Portfolio, Sessions, or Resources tab content, `creation.html` (owner-locked).

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-15)
