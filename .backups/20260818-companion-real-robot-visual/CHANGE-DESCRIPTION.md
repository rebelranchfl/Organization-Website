# Companion: port the real robot character + swatch picker

Authorized by Brooke 2026-08-18. She flagged that the shipped Companion
panel still showed the plain CSS colored-box avatar, not "our real
robot" — the SVG character with the swatch color picker and live
preview that already existed (and was already kid-tested) in
creation-station-experience.html's demo Companion customizer. Earlier
in this same session she'd approved rebuilding the functional
guidance first and coming back to the visual — this batch is that
return trip.

Authorized target: assets/js/creation-station-views.js,
assets/js/creation-station-app.js, creation-station-dashboard.html,
assets/css/creation-station-dashboard.css.

## What changed

1. `creation-station-views.js` — added `companionSvg(color,size)`,
   the exact SVG character markup from creation-station-experience.html
   (body rect + right arm stroke driven by the companion's saved
   color, everything else fixed), and swapped it in for the old CSS
   box + eye/antenna pseudo-elements in `companionPanel()`.
2. `creation-station-dashboard.html` — `#companion-dialog` replaced
   the plain native color input with the demo's real picker: 5 preset
   swatches (same 5 hex values as the demo) + a custom color wheel +
   a live preview panel (robot art, name, speech bubble) that updates
   as you type, same interaction as the tested demo.
3. `creation-station-app.js` — `openCompanionEditor()` now seeds the
   swatch/preview state on open; added swatch click / custom color
   input / name / catchphrase listeners that update the live preview,
   mirroring the demo's `displayCompanion()` pattern. Submit handler
   now reads the picked color from that state instead of a bare
   input value.
4. `creation-station-dashboard.css` — new rules for the swatch row,
   custom color wheel wrapper, and preview panel, written against
   this app's own existing tokens (--purple/--teal/--pink/--gold/
   --line/--shadow already defined at the top of this file) rather
   than copying the demo's separate standalone design system. Removed
   the now-unused `.companion-eye`/`.companion-antenna` rules.

No Supabase/schema change — same `creator_companions` table and
`saveCompanion` action as before, only the `color` value's UI
changed.

Do not commit, push, publish, or deploy.
