# Hero copy changes per nav tab — 2026-08-15

Owner-approved fix for a confirmed real bug: the hero headline never
changed when navigating between tabs (Projects, Portfolio, Sessions,
Growth, Creation Station Studio) — only Parent/Admin views got distinct
copy, everything else showed the same audience-based welcome regardless
of which tab was active. Owner: "it makes me feel confused and as if i
didn't go anywhere."

## Files
- `assets/js/creation-station-views.js` — new exported `viewHeroCopy(view)`
  function providing a short "You're in [Tab] — [line]" for the five
  non-home views.
- `assets/js/creation-station-app.js` — `updateHero()` now checks
  `viewHeroCopy(state.view)` first and falls back to the existing
  `copyForAudience()` personalized greeting for Studio (home), Parent,
  and Admin, which are unchanged.

## Exact copy (owner-approved, including the owner's chosen Sessions wording)
- Projects: "You're in / Projects — Pick up where you left off."
- Portfolio: "You're in / Portfolio — Your finished work lives here."
- Sessions: "You're in / Sessions — Your weekly live Creation Station Club."
- Growth: "You're in / Growth — Here's how far you've come."
- Creation Station Studio: "You're in your / Studio — Manage your Creation
  Station Studio page."

## Not touched
Studio (home), Parent, Admin hero copy — these keep their existing
audience-personalized greetings, which the owner did not ask to change.

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-15)
