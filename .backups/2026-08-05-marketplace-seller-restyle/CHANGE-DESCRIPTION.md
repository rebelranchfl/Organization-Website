# Change description — 2026-08-05

**AI-Agent:** Claude Code
**Session:** Marketplace apply-flow fixes (this chat)

## File backed up
`assets/css/marketplace-seller.css` → `marketplace-seller.css.bak` (pre-edit copy, this folder)

## Why
User authorized `marketplace-seller-dashboard.html` as an explicit Phase 1 scope
exception (it is not on the locked Phase 1 page list in `docs/rrm-visual-rules.md`,
but the user approved styling it now anyway). This file's colors currently follow
the older, superseded `docs/brand-guide.md` dark-radial system, not the newer
locked `docs/rrm-visual-rules.md` v2.2 values that supersede it.

## What is changing (structure/classes/components: unchanged; three color values only)

1. **Page background** — from the radial gradient (`--rrm-bg-1/2/3`) to the
   locked flat Phase 1 background `#204227`.
2. **Card/hero/panel surface fade** — from `var(--rrm-card-1)` → `var(--rrm-card-2)`
   (`#102315` → `#0A160D`) to the locked `#1D4024` → `#122A18` fade, applied to
   every element currently using that gradient: `.notice`, `.state-card`,
   `.market-hero`, `.panel`, `.req-card`, `dialog`.
3. **Secondary/outline button background** — from `var(--rrm-green-fill)`
   (`#142617`) to the locked `#28502F`. The existing border color
   (`var(--rrm-green-dark)` = `#4A7C59`) and cream text already match the locked
   spec, so those are unchanged.

All changes are scoped to `assets/css/marketplace-seller.css` only — the shared
`assets/css/brand-tokens.css` is not touched, so no other page is affected.
No HTML structure, class names, JS behavior, or component markup changes.
No other file is touched.
