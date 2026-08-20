# Confetti + congratulatory rainbow text on stage completion

Authorized by Brooke 2026-08-19, direct follow-up to the stage-to-stage flow
rebuild in `.backups/2026-08-19-stage-flow-rebuild-and-companion-relocate/`.
The handoff doc had explicitly flagged "confetti on stage completion" as a
deliberately-deferred item; she asked for it now, with two specific changes
from how it worked on the demo page (`creation-station-experience.html`,
where this already existed): longer on screen, and a congratulatory phrase
in rainbow gradient text alongside the confetti.

Authorized targets: creation-station-dashboard.html,
assets/js/creation-station-app.js, assets/css/creation-station-dashboard.css.

## What changed

1. `creation-station-dashboard.html` — added `<div id="cs-confetti" class="confetti">`
   near the end of the body (same placement pattern as the demo page).
2. `assets/css/creation-station-dashboard.css` — ported the demo's `.confetti`/
   `.dot`/`@keyframes fall` rules (renamed to avoid collision:
   `cs-confetti-fall`), with the dot-fall animation lengthened from the
   demo's 900ms to 1600ms and a new `.confetti-message` rule for the
   rainbow-gradient congratulatory text (reuses the existing `--rainbow`
   token the same way `.rainbow` elsewhere in this file does), plus a
   `prefers-reduced-motion` override matching the rest of this file's
   pattern.
3. `assets/js/creation-station-app.js` — new `popConfetti(message)` function
   (same dot-generation approach as the demo's `popConfetti()`, adapted to
   also show the message text), a short phrase pool for finishing one stage
   vs. finishing the whole project (using the existing `pick()` helper
   already imported from views.js), and two calls to it inside
   `saveFocusStage()` — one when a stage is marked complete, one when the
   whole project is finished. Overlay now stays visible ~2.6s (up from the
   demo's ~1.2s).

No Supabase/schema change. Do not commit, push, publish, or deploy.
