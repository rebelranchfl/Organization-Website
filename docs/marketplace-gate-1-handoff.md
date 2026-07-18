# Rebel Ranch Marketplace Gate 1 Handoff

## Status

**Platform Phase 1 is live and functional, but its schema history requires reconciliation before Marketplace Gate 1 can safely build upon it.**

Gate 1 reconciliation and final migration preparation are complete.

The tested proposals have been converted into official timestamped migration files. Production application is not authorized.

## Repository work

Branch:

`agent/marketplace-gate-1-reconciliation`

Draft pull request:

`#4 — Marketplace Gate 1: reconcile schema provenance and access controls`

Authoritative Gate 1 migrations:

1. `supabase/migrations/20260718054200_marketplace_seller_privilege_hardening.sql`
2. `supabase/migrations/20260718054300_marketplace_shared_creator_access.sql`
3. `supabase/migrations/20260718054400_marketplace_seller_review_index.sql`

Supporting files:

- `supabase/tests/fixtures/verified_platform_baseline.sql`
- `supabase/tests/marketplace_gate_1_access.sql`
- `docs/marketplace-phase-1-architecture-addendum.md`
- `docs/marketplace-gate-1-reconciliation.md`
- `docs/marketplace-gate-1-production-execution-plan.md`
- `docs/marketplace-gate-1-handoff.md`

The superseded files under `supabase/proposed-migrations` were removed. The timestamped migrations are now the single source of truth.

## Production inventory

Existing production Marketplace objects:

- `public.seller_profiles`
- `public.seller_reviews`
- `private.create_seller_review()`
- Seller creation and timestamp triggers
- Owner/admin RLS policies
- Seller indexes and constraints

Production seller row counts at final-preparation verification:

- `seller_profiles`: 0
- `seller_reviews`: 0

Marketplace Storage, commerce, checkout, orders, shipping, messaging, and customer reviews do not exist in production.

## Reconciliation findings

1. Production migration history begins at Phase 2.
2. Shared Platform Phase 1 is live but absent from that ledger.
3. Seller shell objects were absent from the prior verified baseline fixture.
4. Four repository migration timestamps differ from their production-ledger versions.
5. The old fixture used policy and index structures that were not exact production matches.
6. Seller tables grant unnecessary `TRUNCATE`, `TRIGGER`, and `REFERENCES` privileges to `authenticated`.
7. No production seller data needs migration or transformation.

## Timestamped migration package

### `20260718054200_marketplace_seller_privilege_hardening.sql`

- Removes browser-facing `TRUNCATE`, `TRIGGER`, and `REFERENCES` privileges.
- Retains `SELECT`, `INSERT`, `UPDATE`, and `DELETE` for `authenticated`.
- Preserves existing RLS owner and administrator controls.
- Changes no seller data.

### `20260718054300_marketplace_shared_creator_access.sql`

- Adds `private.has_marketplace_seller_profile()`.
- Keeps Marketplace access independent of Creation Station paid membership.
- Expands only creator-profile `SELECT` eligibility.
- Creates `marketplace_creator_connections` with `security_invoker=true`.
- Does not grant creator create/update/delete access.
- Does not grant household, project, asset, progress, class, resource, private Storage, or moderation access.

### `20260718054400_marketplace_seller_review_index.sql`

- Adds `seller_reviews_reviewer_user_id_idx`.
- Resolves the Marketplace-specific unindexed foreign-key advisor finding.
- Changes no seller data.

## Disposable validation

Project:

`rreckoioipopyudqykek`

The disposable project was returned to its pre-Gate-1 state and the exact timestamped SQL was applied in order.

Validated:

1. Seller privileges narrowed to CRUD only.
2. Marketplace creator access added independently of Creation Station membership.
3. Safe creator connection view created with `security_invoker=true`.
4. Reviewer foreign-key index created.
5. Advisors executed after every migration.
6. Full access matrix executed again.

## Access-control results

| Scenario | Result |
|---|---|
| Anonymous seller-table access | Denied |
| Anonymous safe-view access | Denied |
| Marketplace seller without Creation Station membership | Own seller, review, eligible creator, and safe connection allowed |
| Marketplace seller household access | Denied |
| Marketplace seller private projects | Denied |
| Marketplace seller project assets | Denied |
| Marketplace seller progress history | Denied |
| Marketplace seller classes and resources | Denied |
| Marketplace seller Creation Station Storage | Denied |
| Seller owner updates own seller | Allowed |
| Seller owner changes moderation review | Denied |
| Unrelated authenticated user | Denied |
| Staff without scoped Marketplace authority | Denied |
| Creation Station member without seller | No Marketplace access |
| Administrator | Seller read and moderation allowed |
| Cross-account seller read and update | Denied |

## Advisor results

No new Marketplace security lint was produced.

The Marketplace-specific unindexed foreign-key warning is resolved after the third migration.

Existing notices remain:

- Payment service tables have RLS without browser policies because they are service-role-only.
- Leaked-password protection is disabled and requires a separate owner decision.
- Unused-index notices are expected in the small disposable dataset.

## Production deployment blocker

The repository and production migration ledger contain four matching Phase 2/3 migrations under different timestamps.

Recommended pre-deployment action:

1. Rename the four repository files to match the exact production-ledger timestamps without changing SQL content.
2. Run `supabase migration list`.
3. Run `supabase db push --dry-run`.
4. The dry run must list only the three Gate 1 migrations.
5. Stop if any earlier or unexpected migration appears.

The exact mapping and deployment steps are in:

`docs/marketplace-gate-1-production-execution-plan.md`

The timestamp-alignment method requires owner approval before production deployment.

## Production stop verification

Production currently confirms:

- `seller_profiles = 0`
- `seller_reviews = 0`
- Gate 1 helper function absent
- Gate 1 safe view absent
- Gate 1 reviewer index absent
- All three Gate 1 migration versions absent from production history
- Original broad seller grants unchanged

No production database object or record was changed.

No Edge Function was deployed.

No PayPal charge or subscription was created.

No Marketplace checkout or later-phase implementation began.

## Repository control note

During the initial branch setup, a temporary placeholder containing only the word `temporary` was mistakenly committed to `main` and immediately removed.

The two commits produce zero changed files relative to the previous Phase 4 content. No application, database, configuration, payment, or asset content differs. Production history was not force-rewritten.

## Next owner decision

Before deployment, the owner must review and approve:

1. The migration timestamp-alignment method.
2. The final reviewed PR commit.
3. A production `db push --dry-run` showing only the three Gate 1 migrations.
4. Production application of the migration package.

Until then, PR #4 remains draft and production remains unchanged.
