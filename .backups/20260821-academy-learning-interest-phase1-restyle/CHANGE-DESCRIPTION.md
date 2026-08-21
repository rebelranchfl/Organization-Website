# Change description — academy-learning-interest.html Phase 1 restyle

**Date:** 2026-08-21
**AI-Agent:** Claude Code
**Session:** Academy learning interest form restyle
**Owner authorization:** Owner asked to make `academy-learning-interest.html` "more inviting, less scary with disclaimers" and confirmed via in-chat question ("Extend Phase 1 style to it") to add this page to the Phase 1 rollout list in `docs/rrm-visual-rules.md`, rather than leaving it as a one-off design.

## Why

The page still used the pre-redesign legacy template: its own bespoke hamburger-only nav and footer (each carrying a ~140KB base64-embedded logo instead of the real image asset), the old near-black radial page background the visual rules doc calls out as retired, and copy that opened with a disclaimer ("Learning Interest Form — Not Enrollment.") and repeated the same legal hedge twice before the visitor ever reached the submit button.

Discovered that `support-supplies-interest.html` (an already-approved Phase 1 page) contains a ready-made, reusable "Academy interest form pages" CSS block (`.legacy-page .interest-hero/.interest-card/.interest-form/.interest-note`) — literally labeled for this exact use case — plus `public-surface.css` already has shared `body.rrm-phase-one .legacy-page .interest-hero` / `.interest-card` rules. So this restyle reuses that existing, approved component rather than inventing new styling.

## What changed in `academy-learning-interest.html`

- Added `<link rel="stylesheet" href="assets/css/public-surface.css">` and `<script src="assets/js/public-shell.js" defer></script>` to `<head>`.
- Appended the existing "Academy interest form pages" CSS block (copied verbatim from `support-supplies-interest.html`) to the page's own `<style>` — no new colors, spacing, or components invented.
- `<body>` class changed to `rrm-phase-one` (matches `support-supplies-interest.html`).
- Removed the page's own hand-authored `<nav class="nav">…</nav>` (with embedded base64 logo) and `<footer>…</footer>` (with embedded base64 logo and full legal paragraph). `public-shell.js` now injects the shared header/footer automatically, same as every other Phase 1 page. The full 501(c)(3)/trademark legal paragraph that was in this page's footer already lives centrally at `legal-disclosures.html`, which the shared footer links to — nothing legal was deleted, just de-duplicated to match the rest of the site.
- Rewrote the hero/intro/card copy to lead with curiosity instead of a disclaimer, and merged the two separate in-form legal-hedge paragraphs into one line near the submit button.
- Form fields, `name=` attributes, the `academy_area` `<select>` option values, and the `id="academy-area"` hook used by the `?area=` query-param preselect script were all preserved unchanged, so existing links into this form and any downstream processing of submissions keep working.
- Title/meta description softened to match the new framing.

## What did not change

- `academy.html` and the Rebel Ranch Academy Program Hub (`academy.rebelranchministries.org`) — out of scope, untouched.
- No other repository file besides this one and `docs/rrm-visual-rules.md` (Phase 1 boundary list updated to include this page).
- Not committed or pushed — local working-tree change only, pending owner review.
