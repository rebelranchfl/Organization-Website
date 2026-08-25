# Repository Working Rules

## Required reading order

Before planning, editing, designing, reviewing, or publishing anything:

1. Read this repository `AGENTS.md` in full.
2. Read `docs/rebel-ranch-ecosystem-charter.md` in full.
3. Identify which program, sub-brand, rollout phase, and files the requested task belongs to.
4. For main Rebel Ranch Ministries visual work, read `docs/rrm-visual-rules.md` in full. For an approved sub-brand such as Creation Station, read that sub-brand's approved standards instead of applying the main RRM visual system to it.
5. Read the other standards and implementation notes relevant to the approved program and task.
6. Read the complete target files and their connected styles or scripts before editing.

Check for more specific `AGENTS.md` files in the target folder. More specific instructions supplement this file.

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

## Ecosystem alignment

- Treat the owner's stated scope, exclusions, phases, and approvals as binding.
- Keep Faith, Family, and Nature Church, Rebel Ranch Ministries, Creation Station, Rebel Ranch Marketplace, Rebel Ranch Academy, Business Freedom, Roots, Boots & Animal Poops, Rebel Ranch Rescue, and 3P Help Me distinct.
- Connected programs may link to one another, but do not merge their names, offers, audiences, access rules, finances, or visual identities.
- Preserve the Charter's definitions for Creation Station, the Creation Station dashboard, the Creation Station portfolio, Creation Station Studio, the Rebel Ranch Marketplace, Roots, Boots & Animal Poops, and Rebel Ranch Rescue.
- Do not implement anything listed as an open decision in the Charter without explicit owner approval.
- If project code, older documentation, and the Charter disagree, stop and explain the conflict in plain language. Do not guess.

## Digital experience first

- Rebel Ranch Ministries is a multi-program digital ecosystem, not a brochure website. New public-facing work must be designed as a digital experience first.
- Before creating or redesigning a public surface, answer this question: **How does a person interact with the RRM ecosystem here?** Define what the visitor should be able to choose, discover, search, filter, follow, learn, contribute, manage, request, buy, sell, contact, or otherwise do.
- Static explanatory content may support an experience, but do not default to long-form static pages when interaction, live/current content, personalization, filtering, user pathways, management, contribution, learning, or direct actions would materially improve the experience.
- "Interactive" does not mean adding decorative motion or gimmicks. Interaction must help the visitor accomplish something real.
- HTML, CSS, and JavaScript may remain the delivery technology. A digital experience does not require a framework, database, login, or backend unless the actual functionality requires one.
- Design architecture for the program's mature direction so today's work does not become throwaway brochure content, but present only functionality that actually exists today. Do not imply future features are live.
- Existing Marketplace, Academy, and Creation Station experiences establish the maturity level of the ecosystem. New work must build forward from that maturity rather than reverting to static brochure patterns.
- The Programs Hub uses an owner-approved **"I want to..."** intent model: visitors should be able to express what they need and have the experience respond with relevant program paths, current activity, and next actions rather than being forced through six long program essays.
- Current activity should make RRM feel alive. When relevant and technically appropriate, public experiences should surface real current program activity such as learning, listings, projects, rescue updates, agricultural work, videos, launches, or opportunities to participate.

## Scope-safe collaboration

- Use the `scope-safe-collaboration` skill for repository and file-changing work and follow it fully.
- Preserve unrelated files, working-tree changes, formatting, functionality, and configuration.
- Never perform unrelated cleanup, redesign, renaming, dependency changes, database changes, or configuration changes.
- Commits, pushes, pull requests, merges, deployments, deletions, permission changes, payments, messages, and other external actions require separate explicit authorization.

## Change attribution and traceability

- Every durable record of a change — commit message, pull request description, database migration file, edge function deployment note, or any other push/live activity — must state which AI agent made the change (for example: Claude Code, ChatGPT/Codex, or another named tool) and the title of the chat or session that produced it.
- In commit messages, add this as trailer lines, for example:
  `AI-Agent: Claude Code`
  `Session: <chat title>`
- In a new database migration file, add both as a leading SQL comment before any statements.
- This applies to every AI-originated change without exception, including changes applied directly to a live system outside a normal commit (for example, a migration run straight against the database instead of through a committed file).
- Why: without this, a later session — AI or human — cannot trace back which conversation's reasoning or decision caused a given change, making it impossible to reconstruct why something exists or was modified.

## Communication

- Assume the owner has no technical background.
- Lead with what happened, whether action is required, and the exact next step.
- Explain unavoidable technical terms immediately.
- Do not require the owner to interpret raw code, file comparisons, terminal output, Git terms, or errors without a plain-language explanation.

## Program safeguards

- Preserve parent or guardian control and privacy for minors.
- Do not weaken authentication, approval, moderation, private storage, or role restrictions through presentation work.
- Do not promise sales, profit, income, or cost recovery.
- Do not present planned features as if they already exist.
- Keep Marketplace access free for buyers and approved sellers unless the owner explicitly changes that rule.
- Do not treat Creation Station membership as automatic Marketplace approval.
- Keep 3P Help Me financially and organizationally separate from Rebel Ranch Ministries.

## Mandatory Styling Compliance

- The approved visual rules and the applicable existing CSS are the source of truth for all styling work. Follow them unless the user explicitly requests a new design or explicitly approves a departure.
- Before starting visual, layout, or public-page work, follow the required reading order above, identify the active rollout phase and program identity, and confirm that every proposed target is inside the approved scope.
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
- Never style a non-interactive element (a label, tag, or status badge) so that it is visually indistinguishable from a real clickable button — same pill shape, same solid gradient fill, same weight and sizing as a nearby real button. If it does not click, it must not look like it clicks. Confirmed a hard rule 2026-08-15 after the owner found this exact pattern on the Creation Station dashboard and said it has been raised before and needs to stop being reintroduced.
- Full pill radius (a rounded-capsule shape, e.g. `border-radius:999px`) is reserved for real clickable buttons only, everywhere in this codebase. Non-interactive status or info chips (tags, badges, metric pills) must use a visibly smaller/different radius so the shape alone signals "not a button," not just surrounding context. Confirmed a hard rule 2026-08-18 after the owner asked for a blanket fix instead of chasing individual pill violations one at a time.
- Any page going live must use the shared header/footer shell (`assets/css/public-surface.css` + `assets/js/public-shell.js`), with the logo referenced as a linked file (e.g. `assets/brand/Rebel Ranch Ministries/rrm-logo-white.png`) — never a hand-authored nav/footer, and never a logo embedded as base64 image data in the page's own HTML. Confirmed a hard rule 2026-08-21 after an audit found pages with the logo embedded twice (header + footer) inflating individual files to 264KB–1.5MB, versus a few KB for a linked reference.
- No image on this site — logo or otherwise — should be embedded as base64 data inside HTML or CSS. Every image must be a real linked file under `assets/`. Check for this before any page goes live, not just during a dedicated cleanup pass. Confirmed a hard rule 2026-08-21 alongside the header/footer rule above.
- New admin-only tools on the account dashboard (`account.html`) get added via the shared injection pattern in `assets/js/public-shell.js` (see `addAdminOperationsPath`) — a card appended to `#dashboard .path-grid` once `#dashboard-roles` confirms an administrator, guarded against duplicate insertion — not hardcoded directly into `account.html`. This applies only to role-gated/conditional content; cards every signed-in user should always see (Creation Station, Marketplace, Business Freedom, Academy) stay plain HTML in `account.html` — there is nothing to gate, so dynamic injection would only add indirection. The hidden nav card is a convenience, never the security boundary: every admin page must still independently enforce its own Supabase auth + role check (as `operations-review.html` and `store-manager.html` both already do) and rely on RLS on the underlying tables. Confirmed a hard rule 2026-08-21 after the owner adopted this pattern going forward.

## Verification and reporting

- Verify only the work that was authorized.
- Review the final changed-file list and confirm unrelated work remains untouched.
- Report every changed file, safety-copy location, check performed, limitation, and remaining owner decision.
- Do not commit, publish, or deploy unless separately authorized.
