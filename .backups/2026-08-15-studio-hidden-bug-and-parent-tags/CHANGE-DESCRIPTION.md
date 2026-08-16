# Studio page hidden-state bug + Parent View tag styling — 2026-08-15

## 1. Fix: loading/not-found/real content all showing at once
**File:** `creation-station-studio.html`
Root cause confirmed earlier today: neither `assets/css/site-core.css` nor
`assets/css/creation-station.css` (the two stylesheets this page loads)
define what the `hidden` class actually does, so the JS correctly toggles
it but nothing visually happens. Fix: added `.hidden{display:none!important}`
to this page's own existing inline `<style>` block — smallest possible
fix, scoped to just this page.

**Flagging, not yet fixed:** the same missing rule likely affects at least
8 other pages that load `site-core.css` and use `.hidden` classes without
also loading a stylesheet that defines it (`business-request.html`,
`creation-station-disclaimer.html`, `creation-station-live-classes.html`,
`creation-station-membership.html`, `creation-station-teaser.html`,
`creation-young-creators-interest.html`, `creation.html`,
`membership-status.html`). The real fix for all of them would be adding
the rule to `site-core.css` itself, but that's a shared file touching
pages well outside today's Creation Station scope — not doing that
without a separate explicit decision.

## 2. Parent View membership tags no longer look like buttons
**File:** `assets/js/creation-station-views.js` (`parent()` function)
Owner flagged (screenshot) that "Private portfolio," "Progress tracking,"
and "Parent control" were styled as solid gradient pills, visually
indistinguishable from the real "See all benefits" button next to them.
Changed from `.tag` (the pill/button-shaped class) to
`.status-badge.private` — an existing, already-used class elsewhere in
this same file for non-interactive status labels (smaller, muted purple,
no pill shape, no shadow). No new CSS written; reused what already
exists, per the styling rule already in AGENTS.md.

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-15)
