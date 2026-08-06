# Change description — 2026-08-06

**AI-Agent:** Claude Code
**Session:** Marketplace apply-flow fixes (this chat)

## Files backed up (pre-edit copies, this folder)
- `public-shell.js.bak` (source: `assets/js/public-shell.js`)
- `marketplace-seller-data.js.bak`
- `marketplace-seller-views.js.bak`
- `marketplace-seller-app.js.bak`

## Why
Owner found two real gaps walking the live site after tonight's deploy: (1)
no way to sign in from the shared site header — only entry point was the
Marketplace apply flow — and no visible sign-out most places; (2) no admin
action to pause/archive/remove an approved seller. Full rationale and
approach in `C:\Users\rebel\.claude\plans\cosmic-splashing-bonbon.md` (the
approved plan for this change).

## What is changing

1. **`assets/js/public-shell.js`** — the shared header injected on every
   public page gains an account-aware slot: "Sign In" when logged out,
   "My Account" + "Sign Out" when logged in. Implemented via a dynamic
   `import('./assets/js/supabase-client.js')` inside the existing IIFE —
   no other file needs to change even though this affects all 10 pages
   that include this script.
2. **`assets/js/marketplace-seller-data.js`** — `loadSellerAdminSummary()`
   gains an active-sellers query; new `adminActions.pauseSeller`,
   `.archiveSeller`, `.reactivateSeller` (one-column updates to
   `seller_profiles.profile_status`, permitted today by existing RLS
   policies — no migration needed).
3. **`assets/js/marketplace-seller-views.js`** — `admin()` gets a new
   "Active Sellers" list section with Pause/Archive/Reactivate buttons.
4. **`assets/js/marketplace-seller-app.js`** — wires the new buttons via
   the same `withBusy`/`refresh`/`message` pattern used by every other
   admin action.

No database migration. No hard-delete of any seller — pause/archive only
(reversible via reactivate), since a hard delete would destroy their
application/credential/inquiry history.
