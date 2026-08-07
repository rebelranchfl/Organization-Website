# Change description — 2026-08-07

**AI-Agent:** Claude Code
**Session:** Creation Station dashboard access + site-wide deploy fix (2026-08-07)

## Files backed up (pre-edit copies, this folder)
- `marketplace-seller-page.html.bak`
- `marketplace-seller-page.css.bak` (source: `assets/css/`)
- `marketplace-seller-public.js.bak`, `marketplace-seller-views.js.bak`, `marketplace-directory.js.bak` (source: `assets/js/`)
- `marketplace.html.bak`

## Why

Owner reviewed their newly-activated live seller page and flagged: the
"How to order" and payment fine-print copy read like RRM might be involved
in transactions/contact, which contradicts the "we just host the directory,
buyers and sellers deal directly, $0 to us" rule; the trust-panel bullets
needed exact rewording the owner specified; no banner communicating "$0 to
Rebel Ranch Ministries" existed; the seller page had its own bespoke
header/footer instead of the shared site shell used everywhere else now;
clicking "Directory" just bounced back to the marketing homepage; the
seller dashboard's short-description field was permanently locked after
approval (inconsistent with long-description, which was never locked); and
there was no link anywhere in the dashboard to the seller's own live page.
Also requested: the homepage seller grid should become a carousel (3 cards
visible at a time) as more sellers join, instead of just growing rows
forever.

## What is changing

1. **`marketplace-seller-page.html`** — drop the bespoke `<header>`/`<footer>`,
   load `assets/css/public-surface.css` + `assets/js/public-shell.js` (the
   same shared shell as `marketplace.html`/`account.html`/`reset-password.html`).
2. **`assets/css/marketplace-seller-page.css`** — remove the now-dead
   `.site-header`/`.header-inner`/`.brand`/`.header-actions`/`footer{}`
   rules; add a `.trust-banner` style.
3. **`assets/js/marketplace-seller-public.js`** — add the "$0 to Rebel Ranch
   Ministries" banner; reword the "How to order" line, the payment
   fine-print, and the three trust-panel bullets per the owner's exact
   wording.
4. **`assets/js/marketplace-seller-views.js`** (`status()`) — short
   description is no longer disabled post-approval (matches
   long-description's existing behavior); added a "View my public listing"
   link once the profile is active with a slug.
5. **`marketplace.html` + `assets/js/marketplace-directory.js`** — the
   seller grid becomes a scroll-snap carousel (3 cards visible on desktop,
   ~1 on mobile) with prev/next buttons that only appear once there are
   enough sellers to scroll. Scoped to `#seller-directory-grid` specifically
   so the shared `.grid` class rule (unused elsewhere on this page today,
   confirmed via search) is left alone for any future reuse.

No database changes. No changes to `account.html`.
