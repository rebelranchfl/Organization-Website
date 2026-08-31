# Wealth Management (Trusts) — paid-tier gating, initial build

**Date:** 2026-08-31
**AI-Agent:** Claude Code
**Session:** Trust Cross-Reference / Wealth Management build

## Intended scope (written before editing, per AGENTS.md)

Owner explicitly authorized moving RRA past its Stage 1 no-accounts/no-pricing
gate for this feature only (see memory `rra_program_hub_and_monetization.md`
and `trust_cross_reference_tool.md`), and approved: (1) adding
`@supabase/supabase-js` as a new dependency of the Program Hub app, (2) two
offer codes — `trusts` (single-topic access) and `wealth_management_all`
(all Wealth Management topics, current and future) — under a new
`program_code = 'wealth_management'`, reusing the existing `user_roles` /
`memberships` tables (same shape already proven for Creation Station's Club
and Live Session tiers — no schema changes).

Files to change:
- `rebel ranch academy/Rebel-Ranch-Academy-Program-Hub/package.json` —
  add `@supabase/supabase-js` dependency. **Backed up as `package.json.before`
  before this edit.**

New files to add (no backup needed — did not exist before):
- `rebel ranch academy/Rebel-Ranch-Academy-Program-Hub/app/lib/supabase-client.ts`
- `rebel ranch academy/Rebel-Ranch-Academy-Program-Hub/app/lib/wealth-management-identity.ts`
- `rebel ranch academy/Rebel-Ranch-Academy-Program-Hub/app/wealth-management/trusts/page.tsx`

No database schema changes. No PayPal plan IDs or `payment_plan_mappings`
rows added yet — owner has not created the real PayPal plans/pricing for
these two offers yet; that step and its matching migration are separate,
later work.

Not committed, not pushed, not deployed — per this repo's `AGENTS.md`,
those require separate explicit authorization.

## What was actually built

- `package.json` — added `@supabase/supabase-js@2.52.0` (same version already
  vendored on the main RRM site, for consistency). **Not yet installed** —
  `npm`/`node` are not reachable from this session's tools (same limitation
  hit earlier this session trying to run the `claude` CLI). `package-lock.json`
  was deliberately left untouched rather than hand-edited. **Someone with a
  working `npm` needs to run `npm install` in
  `rebel ranch academy/Rebel-Ranch-Academy-Program-Hub/` before this builds.**
- `app/lib/supabase-client.ts` (new) — client singleton, same Supabase
  project/publishable key as the main site and Trust Cross-Reference's
  existing backend (project ref `dfrwxpuojeiykaignyny`). No new project.
- `app/lib/wealth-management-identity.ts` (new) — the access check. Same
  shape as Creation Station's `loadIdentity()` in
  `assets/js/creation-station-data.js`: queries `user_roles` for
  `role = 'admin'` and `memberships` for a current row where
  `program_code = 'wealth_management'`. `hasTrustsAccess` is true for an
  admin, or a current membership with `offer_code` of `trusts` or
  `wealth_management_all`. No RLS/schema changes — reuses the same tables
  and (by inspection) the same row-level policies Creation Station's
  identical query pattern already relies on in production.
- `app/wealth-management/trusts/page.tsx` (new) — the actual page. Shows a
  loading state, then either a locked/paywall state or the Trust
  Cross-Reference tool (the same four-determination rules engine already
  built and tested against Trust Cross-Reference's Supabase backend, ported
  faithfully into this component) if `hasTrustsAccess` is true. Includes a
  working "Verify sources now" button that calls the already-deployed
  `verify-citation` Edge Function.
- `app/wealth-management/trusts/trusts.module.css` (new) — styled entirely
  from the tokens already defined in `app/globals.css` (`--navy`, `--gold`,
  `--cream`, `--paper`, `--ink`, `--muted`, `--line`, etc.), Georgia for
  headings / Arial-Helvetica for body per the visual rules. Status labels
  use a small bordered rectangle (2px radius), not a pill shape, per the
  repo's interactive-shape rule — they're not clickable. Flagged
  (included/exposed) findings reuse the exact border-left + background
  treatment `globals.css` already uses for `.challenge`, rather than
  inventing a new semantic color.

## Added after owner said "not ready for public, don't want it linked"

- `public/robots.txt` — added `Disallow: /wealth-management/` (backed up as
  `robots.txt.before`). Covers this whole future section, not just
  `/trusts`, so pages added here later stay covered automatically. This is
  the primary, robust protection — respected by any well-behaved crawler
  whether or not it executes JavaScript.
- `app/wealth-management/trusts/page.tsx` — added a `noindex, nofollow`
  `<meta name="robots">` tag rendered on every state of the page (loading,
  locked, and full content), as a second, redundant layer on top of
  robots.txt.
- Neither of these makes the URL inaccessible to someone who already has
  the exact link — they stop it from being crawled/indexed/discovered, not
  from being visited directly. The real access control is still the
  identity check in `wealth-management-identity.ts`, which already gates
  the actual content regardless of how someone arrives at the URL.

## Added after owner asked for a real password wall (not just hidden)

- `worker/index.ts` (backed up as `worker-index.ts.before`) — every request
  to `/wealth-management` or anything under it is now intercepted at the
  Cloudflare Worker itself, before Next.js routing or any React rendering
  happens. Without valid credentials, the Worker returns a bare 401 and
  nothing else — no HTML, no page shell, nothing is produced at all. This
  cannot be bypassed by disabling JavaScript or viewing page source, because
  nothing is ever sent to the browser without the password.
- Implemented as standard HTTP Basic Auth — the browser's own native login
  prompt, no custom form to build or maintain.
- The password itself is read from a Worker secret,
  `WEALTH_MANAGEMENT_PREVIEW_PASSWORD` — **not hardcoded anywhere in this
  file or any committed source.** Deliberately not chosen or set by Claude,
  for the same reason Claude doesn't handle PayPal credentials.
- **Fails closed:** if that secret is never set, the check always returns
  false and every request to this path gets refused — including the
  owner's — rather than defaulting open.

### Action required before this protects anything

The secret has to actually be set, or the page is unreachable to everyone,
including you. Either:
- `wrangler secret put WEALTH_MANAGEMENT_PREVIEW_PASSWORD` (from a machine
  with a working `npm`/`wrangler`, run from
  `rebel ranch academy/Rebel-Ranch-Academy-Program-Hub/`), or
- the Cloudflare dashboard's Worker → Settings → Variables and Secrets UI
  for this project.

Then visiting `/wealth-management/trusts` will prompt for a username (any
value works — only the password is checked) and the password you set.

## Not done / left for the owner

- **`npm install` has not been run and this has not been build-verified.**
  I could not reach `npm` or `node` from this session's tools at all —
  confirm this actually compiles under `npm run build` before deploying.
- No PayPal plan IDs or `payment_plan_mappings` rows exist yet for either
  offer — real pricing/plans need to be created in PayPal first, matching
  the Creation Station precedent (Claude does not handle payment credentials).
- No route/nav link to `/wealth-management/trusts` was added anywhere else
  in the app (e.g. the learning-area card, a `/wealth-management` landing
  page) — the page exists but isn't linked from anything yet. A landing
  page at `/wealth-management` is referenced by the locked state's "See
  Wealth Management options" link but does not exist yet either.
- Not committed, not pushed, not deployed — per this repo's `AGENTS.md`,
  those require separate explicit authorization.
