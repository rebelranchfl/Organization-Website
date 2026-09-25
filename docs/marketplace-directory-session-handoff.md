# Marketplace Public Directory — Session Handoff

Date: 2026-07-25 (updated same day — see "Marketing pass & 3-page split" section below for the latest)

## Business model (locked, confirmed by owner)

Rebel Ranch Marketplace is an **information hub / directory**, not a
payment-processing marketplace — an "online rolodex." Vendors register,
get reviewed, and get a page. **Payment goes directly to the vendor**
(their own PayPal/Cash App/Zelle/Stripe/etc.) — Rebel Ranch never
touches money. This significantly reduces liability scope versus a real
transaction platform, and is why "Gate 3" commerce work is out of scope
for now.

Ecosystem: Creation Station (young creators) → feeds into Marketplace.
RR Academy (business/sustainability education) → feeds into Marketplace.
3phelpme.com (the owner's separate personal consulting business) →
funnels into Marketplace. Marketplace "membership" for a seller = Rebel
Ranch builds them a page (the standard template, automatic — see below).

**Positioning (confirmed 2026-07-25, this session):** explicitly local
and small-business-only. Not "vetted" in the sense of independent
verification — Rebel Ranch reviews applications and sellers
self-attest to compliance and to being a real local, independently
owned business (not a chain/franchise/reseller). Marketing angle the
owner wants leaned into: sell the drive-out, homesteading, farm-stand
experience to the nearby wealthier urban audience (Gainesville area) —
**"visit the rural life with a little 30-minute road trip."** This
marketing copy pass (hero sections, "Find Your Path" cards on
`marketplace.html`, possibly `index.html`) was explicitly deferred to
a **separate conversation** — draft it there, don't assume it's done.

PMA (Private Membership Association) is now a **separate, optional**
path for sellers who want it — not a gate on the public directory. This
was a deliberate fix: the old disclaimer claimed the whole marketplace
was members-only/non-public, which directly contradicted the public
directory built this session. Resolved by rewording the disclaimer
(`marketplace.html`'s `.marketplace-note`), not by removing PMA.

## Marketing pass & 3-page split (decided later same day, 2026-07-25)

After PR #9 merged, the owner reconsidered how to run the "sell the
drive-out experience to Gainesville" marketing pass. Rather than
rewriting `marketplace.html`'s hero to serve both a public shopper
audience and a PMA audience on one page, the site now splits into
**three separate pages**, one per audience/funnel-stage:

1. **`private-marketplace.html`** — the PMA page. An **exact,
   unedited duplicate** of `marketplace.html` as it stood right after
   PR #9 (still has the "A Private Marketplace. Built Around Direct
   Exchange." hero, hub diagram, Member/Producer path cards — none of
   that needed rewriting, since it already reads as a PMA pitch). Not
   linked from nav or anywhere else yet. PMA is explicitly a smaller,
   non-primary focus right now — **do not promote or link this page
   without the owner asking**. Eventually this becomes password/login
   gated (members-only), but that auth work is a separate future
   project, not started.
2. **`marketplace.html`** — stays exactly as-is, untouched. This is
   now "the Public Marketplace": the real, working seller directory
   (grid, seller pages, inquiry inbox from PR #8). Its own hero copy
   is still PMA-flavored (not yet cleaned up) but that's a known,
   low-priority follow-up, not urgent, not done this session.
3. **`shop-local.html`** — brand new page, built this session. A pure
   top-of-funnel marketing/landing page aimed at the wealthier,
   nearby Gainesville audience — sells the experience ("drive out and
   meet real farms and makers"), does **not** include the live
   directory grid, and ends in a single CTA card ("Ready to see who's
   selling?" → *See Who's Selling* button → `marketplace.html`).
   Built by duplicating `marketplace.html` (to keep the same header,
   nav, and footer shell for brand trust/site coherence) and replacing
   only the hero + path-card block with new copy — reuses existing
   `.marketplace-intro`, `.marketplace-benefits`, `.marketplace-path-card`
   CSS classes already defined in the page, no new CSS needed.
   **Deliberately not linked from the main site nav** — the owner
   plans to use it purely as a link for outside social-media marketing
   (Facebook/Instagram ads targeting Gainesville) and to cross-link it
   from other pages later. Locked headline: **"The Farm Stand You Wish
   Was Closer To Home."** Supporting copy/benefit-tile wording on this
   page is a first-pass draft — the owner said they may write their
   own better verbiage later; treat all body copy on this page (not
   the headline) as easy to swap, not final.

**Explicitly deferred, not done, not scheduled:**
- Any password/login gating on `private-marketplace.html`.
- Cross-links from other pages (e.g. a line on `marketplace.html` or
  `index.html` pointing to `shop-local.html`) — owner said this can
  happen later, not needed immediately.
- Cleaning up `marketplace.html`'s own PMA-flavored hero copy now that
  it's "the Public Marketplace" page — known follow-up, not urgent.
- `index.html` was explicitly **not** touched and should stay that way
  unless the owner asks directly — it was called out by name as
  off-limits for this pass.

Work happened on branch `agent/marketplace-gainesville-landing` (off
latest `main`, after PR #9's merge) — not yet a PR as of this
handoff entry; check `git log`/`gh pr list` for current status when
picking this back up.

## Current deployed state

- Repo: `rebelranchfl/Organization-Website`, local clone at
  `F:\Rebel Ranch Ministries\3P\Claude Mapping and Linking Services\rebelranch-website`.
  **Never touch `3Pconsulting/Organization-Website`** — separate, unrelated repo.
- Production Supabase project: `dfrwxpuojeiykaignyny` ("Rebel Ranch Platform").
- Disposable validation project: `rreckoioipopyudqykek`. Always validate
  schema changes there first, then production, per this project's
  standing rule (plan → disposable validation → explicit owner approval
  → production migration → post-deploy verification).
- **PR #8 (merged, live on `main`)**: public seller directory backend
  (visibility gate, payment methods, two-lane inquiry inbox), standard
  public seller page template, seller dashboard additions (theme
  picker, payment methods editor, Messages tab), directory grid on
  `marketplace.html`. Also fixed a real pre-existing Gate 2 bug:
  `private.is_admin()` was never granted EXECUTE to `anon`, silently
  breaking all anonymous reads of `marketplace_categories`/
  `marketplace_regions` — fixed via corrective migration
  `20260725161540_marketplace_fix_anon_is_admin_grant.sql`.
- **PR #9 — MERGED** (2026-07-25, this session): drops "Vetted"/
  checkmark language site-wide on the seller page (replaced with
  honest "Local & Independent" / "Why shop here?" framing), adds a new
  self-attested compliance requirement every seller signs at
  application ("Local & Independent Business" — not a chain/reseller),
  and fixes the PMA disclaimer contradiction described above. Now on
  `main`.

## Schema additions this session (all in production + disposable)

- `seller_profiles.long_description`, `seller_profiles.page_theme`
  (enum: dark/cream/linen/white — seller-chosen tone for their own
  public page; the main directory page always stays dark).
- `seller_payment_methods` table (method_type, label, link_url) — owner
  manages via dashboard, publicly readable only for listed sellers.
- `seller_inquiries` table — the "Message This Seller" inbox.
  `sender_is_member` is computed **server-side** from the caller's live
  membership status at insert time (checked against `memberships`
  table, `membership_status='active'`) — never trusted from the
  client. Feeds `marketplace_notifications` automatically.
- `private.seller_is_publicly_listed(uuid)` — the single source of
  truth for "is this seller visible to the public." Requires BOTH
  `seller_profiles.profile_status='active'` (seller's own toggle) AND
  `seller_reviews.review_status='approved'` (admin decision). This also
  closed a real gap in the original Gate 1 policy, which only checked
  the first condition.
- `marketplace_categories` now has 10 rows (was 6): added Eggs & Dairy,
  Honey, Value-Added Foods, Herbal & Natural Remedies (the last one
  `path_group='both'`, covers teas/tinctures/salves/oils).
- `compliance_requirements`: existing Cottage Food Permit row changed
  to `requires_credential=false` (self-attestation only, not document
  verification — owner's explicit instruction: "let them check a box
  and sign that they have it... if they lie that's on them"). New
  `local-independent-business` row added, `category_id=null` so it
  auto-assigns to every seller regardless of what they sell (via the
  existing `private.auto_assign_requirements()` trigger).

**Compliance approach is now decided**: self-declared attestation only
for launch, no document verification required, no claims of
independent verification made anywhere in the copy. Do not build a
verification/document-review requirement without the owner explicitly
asking — this was a deliberate liability decision.

## New/changed files this session

- `marketplace-seller-page.html` + `assets/css/marketplace-seller-page.css`
  + `assets/js/marketplace-seller-public.js` — the public seller page,
  loads a real seller by `?seller=<public_slug>`, applies their chosen
  theme, renders payment methods, working "Message This Seller" form.
- `assets/js/marketplace-directory.js` — the directory grid on
  `marketplace.html`, lists publicly-listed sellers, links to their
  page. Empty state is an invitation ("The first listing could be
  yours") with an Apply CTA, not a flat apology.
- `marketplace-seller-page-theme-preview.html` — a one-off comparison
  tool (not linked from real nav) showing all 4 page tones side by
  side on the same sample content. Keep for reference; not production.
- `assets/js/marketplace-seller-{data,views,app}.js` — extended with
  payment-methods actions, inquiry actions, theme/long-description
  fields, and a new `messages` view/route in the seller dashboard.
- New migrations: `20260725145522` through `20260725161540` (5 files,
  see `supabase/migrations/`). **Note the recurring quirk**: the
  `apply_migration` MCP tool assigns its own timestamp rather than
  keeping the local filename's — always check `list_migrations` after
  applying and rename the local file to match, or the repo and
  production drift out of sync.

## What's NOT done yet

1. ~~PR #9 needs a merge decision~~ — done, merged into `main`
   2026-07-25.
2. **The "30-minute drive" marketing copy pass** — built as a new
   standalone page, `shop-local.html`, on branch
   `agent/marketplace-gainesville-landing` (see "Marketing pass & 3-page
   split" section above for full detail). Not yet opened as a PR, not
   yet reviewed/approved by the owner, not linked from anywhere on the
   live site. Owner may still want to rewrite the body copy themselves
   before this goes live — don't treat the current wording as final.
3. **Custom-design page tier** — business decision already made
   (standard auto-template is the default/included tier; a fully
   custom hand-built page is a separate, higher-priced service the
   owner delivers manually) but no code/UI exists for offering or
   pricing it. Not urgent — it's a service to sell, not a feature to
   build yet.
4. **No real sellers onboarded** — production has 0 sellers. Once
   ready, the owner needs to actually go through the seller dashboard
   onboarding flow for real.
5. `education-store.html` exists on `main` from a commit the owner
   made independently (not this session's work) — owner said "we'll
   probably go through it together" at some point. Not investigated.
6. No admin UI for creating/editing categories, regions, or compliance
   requirements — currently direct-database-only. Worth a small admin
   screen if changes become frequent.
7. Minor housekeeping, low priority: the Resend API key was visibly
   pasted in a screenshot earlier in the project — owner acknowledged,
   said they'd rotate it eventually, not urgent.

## Working conventions to keep following

- Every production DB change: validate on `rreckoioipopyudqykek` first,
  then apply to `dfrwxpuojeiykaignyny`, then rename the local migration
  file to match the assigned timestamp, then clean up any test data
  from both projects afterward.
- Feature branches → PR → **explicit owner approval** before merge,
  every time. Never assume a prior "yes" carries forward to a new
  change.
- Never guess on brand colors, legal/liability wording, or PMA
  structure — ask, or flag for the owner to get real legal input.
  Brand system is fully documented and audited already: see
  `docs/brand-guide.md` + `assets/css/brand-tokens.css` — don't
  re-derive it, just use it.
- Owner strongly prefers seeing real visual mockups before design
  judgment calls are finalized (this was learned the hard way earlier
  in the project — see memory).
