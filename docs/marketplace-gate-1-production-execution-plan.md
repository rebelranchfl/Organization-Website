# Marketplace Gate 1 Production Execution Plan

## Status

Final migration preparation is complete.

**Production application is not authorized.**

This plan must be reviewed and explicitly approved before any production database change.

## Timestamped migration package

Apply in this exact order only after the migration-history blocker below is resolved:

1. `supabase/migrations/20260718054200_marketplace_seller_privilege_hardening.sql`
2. `supabase/migrations/20260718054300_marketplace_shared_creator_access.sql`
3. `supabase/migrations/20260718054400_marketplace_seller_review_index.sql`

### Migration 1 — seller privilege hardening

- Revokes all browser-facing grants from `anon` and `authenticated` on the existing seller tables.
- Regrants only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` to `authenticated`.
- Existing RLS continues to enforce owner and administrator boundaries.
- Does not alter seller rows.

### Migration 2 — Marketplace creator access

- Creates `private.has_marketplace_seller_profile()`.
- Preserves the existing `creator_profiles_select_member_or_admin` policy name.
- Expands only creator-profile `SELECT` eligibility for an account that owns a non-archived Marketplace seller profile.
- Does not add creator `INSERT`, `UPDATE`, or `DELETE` access.
- Creates `public.marketplace_creator_connections` with `security_invoker=true`.
- Grants no Marketplace access to households, projects, project assets, progress, classes, resources, private Storage, or moderation records.

### Migration 3 — seller review index

- Adds `seller_reviews_reviewer_user_id_idx`.
- Does not alter seller or review rows.

## Pre-deployment blocker — migration timestamp alignment

Production migration history contains these applied versions:

- `20260714180828` — Phase 2 PayPal reliability
- `20260715212011` — Phase 3 Creation Station
- `20260715212025` — Phase 3 publishing approvals
- `20260715212037` — Phase 3 progress history

The repository currently contains the same intended migrations under different timestamps:

| Repository file | Production ledger version |
|---|---|
| `20260714153500_phase_2_paypal_reliability.sql` | `20260714180828` |
| `20260714190000_phase_3_creation_station.sql` | `20260715212011` |
| `20260714203000_phase_3_publishing_approvals.sql` | `20260715212025` |
| `20260715133000_phase_3_progress_history.sql` | `20260715212037` |

### Recommended resolution

Before production deployment:

1. Rename the four repository files to their exact production-ledger timestamps.
2. Do not change their SQL content.
3. Run `supabase migration list` against production.
4. Confirm local and remote versions align.
5. Do not use `migration repair` unless the rename comparison still shows a discrepancy and the exact historical state has been independently confirmed.

This repository-only rename requires separate owner approval because it changes migration provenance, although it does not change production schema or data.

## Production pre-checks

Before deployment:

1. Confirm the CLI is linked to project `dfrwxpuojeiykaignyny`.
2. Confirm the project name is `Rebel Ranch Platform`.
3. Confirm the environment is production, not the disposable test project.
4. Record current seller counts:
   - `seller_profiles = 0`
   - `seller_reviews = 0`
5. Confirm the following do not yet exist:
   - `private.has_marketplace_seller_profile()`
   - `public.marketplace_creator_connections`
   - `seller_reviews_reviewer_user_id_idx`
6. Export or confirm an available production backup before DDL execution.
7. Run `supabase migration list`.
8. Run `supabase db push --dry-run`.
9. The dry run must list **only**:
   - `20260718054200`
   - `20260718054300`
   - `20260718054400`
10. If any Phase 1, Phase 2, Phase 3, unknown, or additional migration appears, stop without applying anything.

Do not use:

- `--include-all`
- `--include-seed`
- `db reset --linked`
- migration repair without a separate approved provenance plan

## Production application procedure

Only after explicit owner approval:

1. Put the Marketplace/admin interfaces into a brief maintenance hold if any browser client begins using seller tables before deployment.
2. Run the approved `supabase db push` from the reviewed commit.
3. Do not run files manually through the SQL editor.
4. Do not apply the test fixture.
5. Do not deploy Edge Functions.
6. Do not create PayPal products, charges, subscriptions, or checkout flows.
7. Record the command output and applied migration versions.

## Immediate post-deployment checks

Verify:

1. The production migration ledger contains all three Gate 1 versions.
2. `seller_profiles` remains at the expected row count.
3. `seller_reviews` remains at the expected row count.
4. `authenticated` no longer has:
   - `TRUNCATE`
   - `TRIGGER`
   - `REFERENCES`
5. `authenticated` retains:
   - `SELECT`
   - `INSERT`
   - `UPDATE`
   - `DELETE`
6. `anon` has no access to seller tables or the safe connection view.
7. `private.has_marketplace_seller_profile()` exists and is executable only as intended.
8. `marketplace_creator_connections` exists with `security_invoker=true`.
9. `seller_reviews_reviewer_user_id_idx` exists.
10. The creator-profile SELECT policy contains both:
    - active Creation Station membership access
    - owned Marketplace seller access
11. No creator insert, update, or delete policy changed.
12. No household, project, asset, progress, class, resource, Storage, or moderation grant changed.

## Required access-control smoke tests

Run the same identity matrix used in the disposable project:

- Anonymous access denied
- Marketplace-only seller sees own seller, review, eligible creator, and safe connection
- Marketplace-only seller cannot see household, projects, assets, progress, classes, resources, or Creation Station Storage
- Unrelated authenticated account denied
- Staff without Marketplace authority denied
- Creation Station member without seller receives no Marketplace access
- Administrator can read and moderate seller review
- Seller owner can update own seller but cannot change review status
- Cross-account read and update denied

## Advisor checks

After deployment:

1. Run Supabase security advisors.
2. Run Supabase performance advisors.
3. Stop if any new Marketplace security warning appears.
4. Confirm the prior missing foreign-key index finding is gone.
5. Treat unused-index notices as informational until production traffic provides meaningful usage statistics.

Expected pre-existing security notices:

- Service-role-only payment tables have RLS enabled without browser policies.
- Leaked-password protection is disabled pending a separate owner decision.

## Corrective migration plan

No destructive rollback is planned. Corrections should be made through a new timestamped migration.

### Privilege correction rollback

If required, a compensating migration may restore the prior seller-table grants. This is not recommended except to resolve a confirmed application failure.

### Shared access rollback

A compensating migration can:

1. Drop `marketplace_creator_connections`.
2. Restore the original Creation Station-only creator SELECT policy.
3. Drop `private.has_marketplace_seller_profile()` after dependent objects are removed.

No creator or seller data would be changed.

### Index rollback

A compensating migration can drop `seller_reviews_reviewer_user_id_idx` if necessary.

## Deployment approval boundary

The next approval must explicitly authorize:

1. The repository migration-timestamp alignment method.
2. The final reviewed commit.
3. The dry-run output showing only the three Gate 1 migrations.
4. Production application of those migrations.

Until that approval, the PR remains draft and production remains unchanged.
