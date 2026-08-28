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

## Addendum — header/tabs/hero/Next Moves reconciled against owner's real reference image

Owner subsequently posted the actual reference mockup screenshot the handoff document was written from, and confirmed the image (not the document's text) is the authoritative visual target: "i had this concept designed specifically for this site. i do not want you to deviate. i want to visible see my site look like this mockup" / "thats where the md came from."

Changes made to match the image:

- Header simplified to logo + stacked wordmark/tagline + single "Join the Rebellion" CTA (image shows no separate nav links or sign-in link in the header — earlier drafts that added them were reverted).
- `.dashboard-tabs` restyled from pill/segmented buttons to underline tabs with a small maroon marker on the active tab, matching the image's tab row.
- `.market-hero .eyebrow` given a small square maroon marker; the second line of the H1 rendered as outlined/transparent text per the image.
- Hero status strip (`statusStrip()` in `marketplace-seller-views.js`) rewritten to always render a primary "Put Me on the Map" CTA plus, when live, a "View My Storefront ↗" link — this also fixes a real pre-existing gap where non-live sellers previously saw no hero call-to-action at all.
- New `.next-moves` section added (three real-destination action rows — Get Seen → listings, Make Contact → questions, Build Power → `business-request.html`) as a single bordered stacked panel with thin dividers between rows, matching the image's vertical layout (the handoff document's text described a 3-column grid; the image, confirmed authoritative, shows stacked rows, so the image was followed).
- Explicitly not built: the decorative horizontal scroll-indicator bar with chevrons shown under the tab row in the image. It has no described function and no destination, so building it would be a non-interactive element styled as a control, which `AGENTS.md` prohibits. Flagging as a deliberate omission rather than a silent drop.
- Click-binding gaps fixed: `#status-strip` content is set via `innerHTML` outside `bindScreen()`'s delegation, and `.next-moves` is static markup `render()` never touches — both needed explicit `data-goto-view` bindings, added in `marketplace-seller-app.js`, or their buttons/links would have shipped dead.
- Verified via a local harness page (import of the real `statusStrip`/`renderers` functions against the real CSS, since the live page requires authenticated Supabase state) at desktop and mobile widths. Caught and fixed a real mobile bug in the process: `.next-move-card` and the pre-existing `.manifesto-section` both switch to `flex-direction:column` under 780px, and their children's `flex-basis` (e.g. `1 1 320px`) was being applied as a *height* basis in column mode, producing large empty gaps. Fixed by resetting those children to `flex:0 1 auto` inside the mobile media query.
- This addendum's changes are committed and pushed as part of this pass.

## Addendum 2 — navigation IA renamed/restructured per the handoff document's Section 8, with owner go-ahead

Owner replied "fix this 2" to my flag that the tab-label/IA rename was still outstanding, authorizing the previously-deferred navigation restructuring. Implemented per the handoff document's Section 8 (`Seller navigation and exact purpose`), re-read in full for this pass since the earlier summary only carried the visual sections:

- Tab labels renamed to match the handoff/image: `Today` → `Command Center`, `Listings & Services` → `My Listings`, `Store Details` → `Settings`. Internal view keys (`today`, `listings`, `status`) were left unchanged to avoid touching hash-routing/history behavior — only the displayed labels changed.
- **Orders and Questions merged into a single `Local Connections` tab** (new `connections` view key, replacing both `orders` and `questions` in the route table and nav). The new `connections(state)` renderer in `marketplace-seller-views.js` stacks the existing Orders section and Questions section under one heading with their own subheadings and open/needs-response counts — it reuses the exact same inner markup and `data-*` action hooks (`data-order-action`, `data-mark-inquiry-read`, `data-mark-inquiry-responded`, the fulfillment-options form, etc.), so no seller-facing functionality changed, only the container. Updated the two "Today" feed buttons and the Next Moves "Open connections" button to route to `connections` instead of the now-removed `orders`/`questions` views.
- **`My Reputation` was deliberately not added to the navigation**, even though it appears in the owner's reference image. The handoff document is explicit: "If no real reputation system exists, do not ship this as an active navigation destination... Do not invent ratings, review counts or trust scores." This dashboard has no real buyer review/rating system (`reviewEvents` is an internal application-status audit log, not a buyer review feature) — adding the tab would mean it either goes nowhere or shows fabricated data, both of which `AGENTS.md` and the handoff prohibit. Flagging this as an intentional gap between the image and the shipped nav, not an oversight — building a real reputation feature would be new functionality requiring its own scope/authorization.
- **`Business Freedom` implemented as a real link, not a fake tab.** It routes straight to the existing `business-request.html?service=general-business-service&ref=marketplace-seller-dashboard-nav` intake page (the same real destination already used by the Next Moves card 3), styled visually distinct from the view-switching tabs (solid maroon button) so it reads honestly as "leaves the workspace to a resource page" rather than an in-app screen — there is no real in-app Business Freedom screen to route to yet, and building one is out of scope for this pass.
- `Notifications`, `History`, and `KPIs` were kept as their own visible tabs. The handoff's Section 8 doesn't list them as top-level destinations (implying they'd fold into `Settings` or elsewhere), but doing that merge risked losing discoverability of real, working features without the owner reviewing where they'd land — kept visible rather than silently buried.
- Verified via the same local harness pattern (real `renderers`/`statusStrip` against mock state, no auth available in this sandbox): Command Center tab labels and Local Connections badge count render correctly, clicking into Local Connections renders both the Orders stats/filter/order-list/fulfillment-settings block and the Questions list with all original action buttons intact, and the Business Freedom button renders as a distinct real link in the tab row. Confirmed the tab row still scrolls horizontally on mobile with the added Business Freedom entry (scrollWidth 1182px vs. 253px clientWidth at a 390px viewport) — this is pre-existing scroll behavior, not a regression.
- Committed and pushed as part of this pass.
