# Repository Working Rules

- Do not modify any file unless the user explicitly authorizes that file or change.
- Make the smallest change necessary to satisfy the request.
- Before editing, create a timestamped backup of every file that will be changed.
- Include a written description of the intended changes with every backup. Do not begin editing until both the backup and its change description exist.
- If completing a request requires touching another file, stop and ask first.
- Do not install dependencies or change configuration without explicit permission.
- Do not commit, push, deploy, delete, rename, or move files unless explicitly instructed.
- Preserve existing functionality, styling, content, and structure outside the requested change.
- After working, report every file changed and describe the exact changes made to each file.
- If instructions are unclear or conflicting, stop and raise the issue instead of assuming.

## Mandatory Styling Compliance

- The approved visual rules and the applicable existing CSS are the source of truth for all styling work. Follow them unless the user explicitly requests a new design or explicitly approves a departure.
- Before starting any work or project, read this file and `docs/rrm-visual-rules.md` in full, identify the active rollout phase, and confirm that every proposed target is inside that phase.
- The current rollout is Phase 1: `index.html` and the forms reached directly from the homepage (`align-interest.html`, `business-request.html`, `support-supplies-interest.html`, and `contact.html`). Do not migrate, restyle, or otherwise change pages outside that list unless the user explicitly authorizes a later phase.
- Creation Station is a separate visual system and is outside Phase 1. Do not edit or restyle Creation Station files, components, or pages unless the user gives a separate, explicit instruction to do so.
- Before changing a Phase 1 page, compare it with the current Phase 1 rules. If the requested project or existing target does not comply, raise a flag and identify the conflict before proceeding. Do not silently expand the project into a broader cleanup.
- Before making any visual or layout change, identify whether the target belongs to the main RRM public site or an approved sub-brand such as Creation Station.
- For main RRM public-site work, read `docs/rrm-visual-rules.md` first. It is approved and locked and supersedes conflicting public-site guidance in `docs/brand-guide.md` and `docs/site-design-system.md`.
- Read the relevant portions of `docs/brand-guide.md`, the target page's complete inline styles, and every stylesheet linked by that page in cascade order before editing styling or markup that affects layout.
- Inspect the existing selectors, tokens, components, spacing, typography, colors, responsive breakpoints, header, footer, buttons, cards, and section treatments that apply to the target before proposing or implementing a change.
- Reuse the applicable existing CSS, design tokens, classes, components, and responsive patterns. Do not invent one-off colors, spacing, typography, gradients, borders, corner shapes, shadows, components, or inline overrides merely to make a page look different.
- Preserve approved sub-brand styling. Creation Station is an intentional separate design system and must not be restyled as the main RRM public site unless the user explicitly requests it.
- When a requested change appears to conflict with the approved visual rules or applicable CSS, stop, identify the conflict, and ask the user before overriding the established styling.
- After styling work, verify the result against the governing visual-rule documents and the target page's applicable CSS at both desktop and mobile widths.
