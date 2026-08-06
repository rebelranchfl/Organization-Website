# Change description — 2026-08-06

**AI-Agent:** Claude Code
**Session:** Marketplace apply-flow fixes (this chat, continued from 2026-08-05)

## Files backed up (pre-edit copies, this folder)
- `marketplace-seller-dashboard.html.bak`
- `marketplace-seller-app.js.bak` (source: `assets/js/marketplace-seller-app.js`)
- `auth-confirm.html.bak`

## Why
Owner confirmed live (screenshots of the actual click-through) that applying
as a Marketplace seller currently forces a detour through the unrelated,
off-brand `account.html` "Rebel Ranch Ministries ecosystem account" page
before reaching the actual seller-application form. Owner chose: fold a
lightweight sign-in/sign-up step directly into the Marketplace apply flow
itself, so the applicant never leaves the Marketplace-branded page. Full
rationale and approach in `C:\Users\rebel\.claude\plans\cosmic-splashing-bonbon.md`
(the approved plan for this change).

## What is changing

1. **`marketplace-seller-dashboard.html`** — new Step 0 inside `#create-profile`:
   Sign In / Create Account tabs (email+password sign-in; name/email/password/
   confirm-password + required adult-confirmation checkbox for sign-up),
   styled with the existing `marketplace-seller.css` tokens/classes only.
2. **`assets/js/marketplace-seller-app.js`** — `init()` shows `#create-profile`
   (with the new Step 0) instead of the `#access-state` gate when there is no
   session; new sign-in (`supabase.auth.signInWithPassword`) and sign-up
   (`supabase.auth.signUp`, mirroring `account.html`'s call shape) handlers,
   reusing the existing `withBusy`/`message` helpers. No change to any
   authenticated-dashboard logic.
3. **`auth-confirm.html`** — the "Continue to My Account" link now honors an
   optional `?next=` query param, defaulting to `account.html` when absent.
   Additive only — `account.html`'s own signup flow never sends `next` and
   is unaffected.

No database schema, RLS, or edge function changes. No changes to
`account.html` itself.
