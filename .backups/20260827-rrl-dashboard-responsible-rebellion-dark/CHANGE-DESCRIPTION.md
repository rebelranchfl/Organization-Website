# Change description

Session: Rebel Ranch Local seller dashboard — dark "Responsible Rebellion" visual system
AI agent: Claude Code

Authorized files:

- `marketplace-seller-dashboard.html`
- `assets/css/marketplace-seller.css`
- `assets/js/marketplace-seller-app.js`
- `assets/js/marketplace-seller-views.js`

Source of direction:

- Owner-provided handoff document "Rebel Ranch Local Interactive Dashboard — Build Handoff" (prepared by ChatGPT/Codex), an owner-approved dark visual/copy direction for this dashboard specifically.
- Owner-provided color reference screenshot (white, maroon, cream, dark green, gold) — direction only; exact tokens taken from the handoff document's CSS spec, not the screenshot's hex values.
- Owner confirmed verbally in this session: use the handoff document as the concept to integrate; go fully dark (not cream); use the real logo, not a placeholder.

Intended changes (this pass):

- Add the handoff's dark CSS token set (`--rrl-black`, `--rrl-green`, `--rrl-green-2`, `--rrl-maroon`, `--rrl-maroon-hot`, `--rrl-cream`, `--rrl-muted`, `--rrl-line`, `--rrl-acid`) scoped to `assets/css/marketplace-seller.css` only — not the shared `assets/css/rebel-ranch-local.css` tokens other RRL pages (`marketplace.html`, `marketplace-seller-page.html`) depend on.
- Restyle the dashboard shell (header, tab bar, hero, panels, buttons, stat tiles) to the dark/maroon/forest-green system with hard edges, matching the handoff's CSS spec as closely as this codebase's existing component structure allows.
- Add the movement strip, hero eyebrow/headline/description, right-side community/family/children/money statement, and bottom manifesto section using the handoff's exact approved copy.
- Use the real repository logo (`assets/brand/Rebel Ranch Ministries/rrm-logo-white.png` or the RRL emblem, whichever reads correctly on the new dark background) as a linked file — no base64, no recreated/fake logo.
- Preserve every existing DOM id/class that `marketplace-seller-app.js` and `marketplace-seller-views.js` depend on (`#dashboard-nav`, `#account-actions`, `#screen`, `#status-strip`, `#order-alerts-banner`, `#dashboard-banners`, `.panel`, `.list-item`, `.status-badge`, `.tag`, `.metric`, `.button`/`.button.primary`, etc.) so no real functionality (auth, listings, orders, questions, notifications, admin) breaks.
- No fake data, fake metrics, fake buttons, or invented functionality. No non-interactive element styled as a pill/button per the existing hard rule in `AGENTS.md`.

Explicit exclusions from this pass (flagged to the owner, not silently dropped):

- The handoff's deeper information-architecture changes — left-hand desktop navigation, renaming/restructuring the tab set into Command Center / My Listings / Local Connections / My Reputation / Business Freedom / Settings, merging Questions and Orders into a unified "Local Connections" view, and state-smart "Your Next Moves" routing cards — are a functional/IA change beyond a visual reskin. Not implemented in this pass; needs its own explicit go-ahead given the size of the change to `marketplace-seller-app.js`/`marketplace-seller-views.js` and the real user-facing navigation it touches.
- No change to `assets/css/rebel-ranch-local.css`, `docs/rrl-visual-rules.md`, or any other RRL page. This dashboard's dark system is a documented owner-approved exception for this page only, not a change to the locked RRL light system elsewhere.
- No commit, push, deploy, or PR update as part of this pass.
