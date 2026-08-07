# Change description — 2026-08-07

**AI-Agent:** Claude Code
**Session:** Creation Station dashboard access + site-wide deploy fix (2026-08-07)

## Files backed up (pre-edit copies, this folder)
- `marketplace-seller-dashboard.html.bak`
- `marketplace-seller.css.bak` (source: `assets/css/marketplace-seller.css`)
- `marketplace-seller-app.js.bak` (source: `assets/js/marketplace-seller-app.js`)

## Why

Owner reported that on `marketplace-seller-dashboard.html` there is no way to
sign out or reach `account.html` on anything narrower than a wide desktop
window. Root cause: `assets/css/marketplace-seller.css` hides the entire
`.account-actions` block (the "RRM Account" link and "Sign out" button)
below 1040px width, but the header markup never actually included a
hamburger button to reveal it again — `.menu-toggle{display:block}` was set
in the mobile media query, but no `.menu-toggle` element existed in the
page, so the account controls simply disappeared with nothing to bring them
back. Confirmed the owner's own account (an existing Creation Station test
account) was stuck behind this exact gap and unable to sign out to sign up
a different account.

## What is changing

1. **`marketplace-seller-dashboard.html`** — add a `.menu-toggle` hamburger
   button (3-bar icon) into `.header-inner`, and give the existing
   `.account-actions` div `id="account-actions"` so the button can control
   it via `aria-controls`.
2. **`assets/css/marketplace-seller.css`** — style `.menu-toggle` (visible
   only below 1040px, matching existing gold/dark header palette already
   defined via `--rrm-*` tokens). Change the mobile-width rule so
   `.account-actions` becomes a toggleable dropdown panel (`.open` class)
   anchored under the header, instead of being hidden with no way back.
3. **`assets/js/marketplace-seller-app.js`** — wire the toggle: click opens/
   closes the panel, updates `aria-expanded`, closes on outside click and
   Escape. No change to the existing `signOut` handler itself.

No database, RLS, or edge function changes. No changes to `account.html`.
