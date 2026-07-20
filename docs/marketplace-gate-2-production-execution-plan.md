# Marketplace Gate 2 Production Execution Plan

## Status

Migration preparation and disposable-project validation are complete.

**Production application is not authorized.**

This plan must be reviewed and explicitly approved before any production database change.

## Timestamped migration package

Apply in this exact order:

1. `supabase/migrations/20260720140000_marketplace_gate_2_categories_regions.sql`
2. `supabase/migrations/20260720140100_marketplace_gate_2_applications_versioning.sql`
3. `supabase/migrations/20260720140200_marketplace_gate_2_affiliations_team.sql`
4. `supabase/migrations/20260720140300_marketplace_gate_2_compliance_pipeline.sql`
5. `supabase/migrations/20260720140400_marketplace_gate_2_moderation_notifications.sql`

### Migration 1 — categories & regions

- Creates `marketplace_categories`, `marketplace_regions` (seeded with Gilchrist County only), `seller_category_assignments`.
- Adds one nullable column, `seller_profiles.region_id`. County/region label only, never a street address.
- No changes to existing seller, creator, or household RLS.

### Migration 2 — applications & versioning

- Creates `seller_applications` (a decoupled 1:many audit trail of admission attempts) with a guard trigger restricting non-admin status transitions, and a sync trigger that pushes `approved`/`rejected`/`submitted` onto the existing `seller_reviews.review_status` so the two cannot drift apart.
- Creates `seller_profile_versions`, an append-only jsonb snapshot of public-facing `seller_profiles` columns only, captured on update.
- Does not alter `seller_reviews`' own RLS or grants.

### Migration 3 — affiliations & team foundation

- Creates `seller_creator_affiliations` and `seller_household_affiliations` — display-only links per the approved architecture addendum; no authorization check anywhere branches on them.
- Creator affiliation has a guard trigger implementing youth/parent approval: when the linked creator's `age_band` is `young_6_12` or `teen_13_17`, making the link public requires `parent_approved_at` stamped by the child's household owner (or an admin). Keyed off `age_band`, not `creator_type`, avoiding a pre-existing dead-code pattern in `guard_portfolio_publication()` that checks a `creator_type` value which can never occur.
- Creates `seller_team_members` (V1 whitelist: `owner` role only, auto-populated on seller-profile creation, no self-service invite flow).
- Adds `private.is_household_owner_of_creator()` and `private.is_household_owner()` — see the disposable-validation finding below; both are required for the affiliation RLS policies to work correctly without accidentally requiring Creation Station membership.

### Migration 4 — compliance pipeline

- Creates `compliance_requirements`, `seller_requirement_assignments` (auto-assigned by category via trigger), `seller_attestations` (append-only, one current per assignment), `seller_credentials` (verification fields admin-only).
- No raw SSN/EIN or other sensitive identifiers are stored as structured data anywhere in this pipeline — `credential_identifier` is free text/seller-controlled only, with the uploaded document as the actual evidence.
- Creates a new private storage bucket, `marketplace-seller-private` (10MB limit, image/PDF only, folder-prefix-by-owner RLS, admin override) — the first Marketplace-specific Storage bucket; none existed before Gate 2.

### Migration 5 — moderation history & notifications

- Creates `seller_review_events` (trigger-only insert, `select`-only grant) capturing every `seller_reviews.review_status` and `seller_applications.status` transition.
- Creates `marketplace_notifications` (in-app feed only — no email/SMS, no scheduled sweep). Inserts happen only via `SECURITY DEFINER` triggers on real state transitions; there is no direct `insert` grant, so a seller cannot spoof their own "approved" notification. `credential_expiring`/`credential_expired` type values exist in the check constraint for a later gate to populate; nothing writes them yet.

## Disposable-project validation performed

Validated on `rreckoioipopyudqykek`, brought current with production first (the 3 Gate 1 migrations were applied there before Gate 2, since that project had only the pre-Gate-1 baseline).

**A real RLS bug was found and fixed during validation, not just simulated:** the initial `seller_creator_affiliations`/`seller_household_affiliations` policies checked household ownership via a raw join against `creator_profiles`/`households` directly inside the policy. Both of those tables require an active Creation Station membership to view even your own row — so a household owner with no Creation Station membership was silently unable to approve their own child's affiliation, which would have reintroduced the locked rule violation "Marketplace access must not require paid Creation Station membership" through the back door. Fixed by adding `SECURITY DEFINER` helper functions (`private.is_household_owner_of_creator()`, `private.is_household_owner()`) that bypass RLS correctly, the same pattern Gate 1 already established with `private.has_marketplace_seller_profile()`. The migration files in this package already contain the fix — this is not a pending follow-up.

A second, minor round of fixes: the first advisor pass after all 5 migrations found 8 legitimate unindexed-foreign-key findings (optional admin-action columns like `reviewer_user_id`, `attested_by`, `verified_by`, `assigned_by`, `changed_by`, `invited_by`, `actor_user_id`, and `marketplace_notifications.seller_profile_id`). Covering indexes were added for all 8, matching the same remediation pattern Gate 1 used for `seller_reviews.reviewer_user_id_idx`. The migration files already contain these indexes.

After both fixes, `supabase/tests/marketplace_gate_2_access.sql` passed in full, covering: privilege hardening, anonymous denial (with public lookup tables correctly readable), auto-assignment of category-linked requirements, seller self-application submit/no-self-approve/no-force-set-moderation-fields, no-self-attestation-verify, correct parent-approval stamping restricted to the actual household owner, an unrelated household owner denied editing another seller's application, `staff` role regression-checked at zero moderation authority, and admin full read/moderation with review-event-history and notification generation confirmed.

Post-fix advisors: zero new/unexpected security findings (same 4 pre-existing notices as the Gate 1 baseline — 3 service-role-only payment tables, leaked-password protection). Zero unindexed-foreign-key findings remaining. Only expected "unused index" INFO notices on a small test dataset.

## Pre-deployment blocker

None identified. Unlike Gate 1, there is no migration-timestamp-alignment prerequisite — Gate 2's five migrations are new files with timestamps that do not correspond to any pre-existing production ledger entry.

## Production pre-checks

Before deployment:

1. Confirm the CLI/MCP connection is targeting project `dfrwxpuojeiykaignyny` (`Rebel Ranch Platform`), not the disposable test project.
2. Confirm current production state:
   - `seller_profiles` / `seller_reviews` row counts match the last known figures.
   - None of the Gate 2 tables (`marketplace_categories`, `marketplace_regions`, `seller_category_assignments`, `seller_applications`, `seller_profile_versions`, `seller_creator_affiliations`, `seller_household_affiliations`, `seller_team_members`, `compliance_requirements`, `seller_requirement_assignments`, `seller_attestations`, `seller_credentials`, `seller_review_events`, `marketplace_notifications`) exist yet.
   - The `marketplace-seller-private` storage bucket does not exist yet.
3. Confirm production migration history is still exactly the 9 versions from Gate 1 (six historical + three Gate 1) with no unexpected entries.
4. Confirm an available production backup before DDL execution.
5. Run a migration comparison equivalent to `supabase db push --dry-run` and confirm it lists **only** the 5 Gate 2 migration versions in this package, in order, with no unexpected Phase 1/2/3, Gate 1, seed, or unknown migration appearing.

Do not use:

- `--include-all`
- `--include-seed`
- `db reset --linked`
- migration repair without a separately approved provenance plan

## Production application procedure

Only after explicit owner approval:

1. Merge the reviewed PR into `main`.
2. Apply the 5 migrations in the order listed above, via an authenticated Supabase connection.
3. Do not run files manually through the SQL editor.
4. Do not apply any test fixture.
5. Do not deploy Edge Functions.
6. Do not create PayPal products, charges, subscriptions, or checkout flows.
7. Record the applied migration versions and confirm they match the repository filenames exactly (Gate 1's apply tool assigned its own timestamps rather than preserving filename versions — if the same tool is used here, verify and correct `supabase_migrations.schema_migrations` the same way, with the same 1:1 mapping discipline, before calling deployment complete).

## Immediate post-deployment checks

Verify:

1. Production migration ledger contains all 5 Gate 2 versions, matching the repository filenames exactly.
2. `seller_profiles` and `seller_reviews` row counts unchanged.
3. All 14 new tables exist with RLS enabled.
4. `anon` has select access only to `marketplace_categories`/`marketplace_regions` (active rows), and to `seller_category_assignments`/`seller_creator_affiliations`/`seller_household_affiliations` rows that are public — no access to any application, version, requirement, attestation, credential, review-event, notification, or team-member data.
5. `private.is_household_owner_of_creator()` and `private.is_household_owner()` exist and are `SECURITY DEFINER`.
6. `marketplace-seller-private` storage bucket exists, private, 10MB limit, folder-prefix RLS matches `creation-station-private`'s pattern.
7. No change to any pre-existing Gate 1 or Phase 1/2/3 object, grant, or policy.

## Required access-control smoke tests

Run the same identity matrix used in the disposable project (`supabase/tests/marketplace_gate_2_access.sql`):

- Privilege hardening: no TRUNCATE/TRIGGER/REFERENCES granted on any new table.
- Anonymous: public lookups (active categories/regions) readable; everything seller-sensitive denied.
- Auto-assignment of requirements on category assignment.
- Seller owner: can draft/submit an application, cannot self-approve, cannot force-set moderation fields, cannot self-verify a credential.
- Household owner (parent): can stamp `parent_approved_at` only for their own household's creator; denied editing an unrelated seller's application.
- Unrelated staff: zero visibility, zero moderation authority (regression check against Gate 1's guarantee).
- Administrator: full read and moderation; approval syncs to `seller_reviews`; review-event history and notification recorded.

## Advisor checks

After deployment:

1. Run Supabase security advisors — expect the same 4 pre-existing notices as Gate 1's baseline, nothing new.
2. Run Supabase performance advisors — expect no unindexed-foreign-key findings; unused-index notices are informational pending real production traffic.

## Corrective migration plan

No destructive rollback is planned. Corrections should be made through a new timestamped migration, following Gate 1's precedent.

### Categories/regions rollback

A compensating migration can deactivate (`is_active=false`) rather than delete category/region rows if a mistake is found post-launch, preserving any assignments already made.

### Applications/versioning rollback

A compensating migration can adjust the guard/sync trigger logic without touching existing `seller_applications` or `seller_profile_versions` rows.

### Affiliations/team rollback

A compensating migration can tighten or loosen the `guard_seller_creator_affiliation()` transition rules without deleting existing affiliation or team-member rows.

### Compliance pipeline rollback

A compensating migration can deactivate requirements (`is_active=false`) rather than delete them, preserving assignment/attestation/credential history.

### Moderation/notifications rollback

A compensating migration can adjust notification trigger conditions without touching `seller_review_events` (append-only, never modified).

## Deployment approval boundary

The next approval must explicitly authorize:

1. The final reviewed commit for this PR.
2. The migration-comparison output showing only the 5 Gate 2 migrations pending.
3. Production application of those 5 migrations.

This does not authorize Gate 3/later-phase work, checkout, payments, orders, shipping, messaging, customer reviews, Edge Functions, or map implementation. Until that approval, the PR remains draft and production remains unchanged.
