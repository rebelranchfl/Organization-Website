# Resources nav removal + button/tag rule documentation — 2026-08-15

Two owner-approved changes, made in direct response to owner feedback in
this session.

## 1. Remove Resources from the sidebar nav
**File:** `creation-station-dashboard.html`
Owner has no real resources published yet and asked to remove the tab
from navigation "for now, add later." Removing only the `<a>` link from
the sidebar nav. The `resources` route, `resources()` renderer,
`resourceList()` function, and `kidAllowedRoutes` entry are all left
completely untouched — the feature still exists in code, it's just not
reachable from the sidebar. Re-adding later is pasting the link back in;
no other file needs to change to restore it.

## 2. Document the "tags must not look like buttons" rule
**Files:** `AGENTS.md`, `docs/creation-station-dashboard-visual-rules.md`
Owner flagged (with a screenshot) that the Parent View's membership panel
shows three non-interactive tags — "Private Portfolio," "Progress
Tracking," "Parent Control" — styled as solid pill shapes nearly
indistinguishable from real clickable buttons nearby. Owner says this
exact pattern has been raised with a prior AI session repeatedly and
needs to stop being reintroduced. Documenting it as a standing rule in
both the repo-wide `AGENTS.md` and the Creation Station dashboard's own
visual-rules doc, and naming the specific current instance so it's easy
to find and fix in a future pass. Not fixing the instance itself in this
change — owner asked specifically to document the rule; the actual visual
fix to the Parent View panel is a separate, not-yet-authorized edit.

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-15)
