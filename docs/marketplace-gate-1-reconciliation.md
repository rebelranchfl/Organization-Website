# Rebel Ranch Marketplace Gate 1
## Production Schema and Migration Reconciliation Report

**Status:** Platform Phase 1 is live and functional, but its schema history requires reconciliation before Marketplace Gate 1 can safely build upon it.

**Production project:** Rebel Ranch Platform (`dfrwxpuojeiykaignyny`)  
**Disposable validation project:** Rebel Ranch Phase 3 Disposable Test 2026-07-15 (`rreckoioipopyudqykek`)  
**Repository:** `rebelranchfl/Organization-Website`  
**Working branch:** `agent/marketplace-gate-1-reconciliation`

## Production seller schema inventory

### `public.seller_profiles`

- UUID primary key
- Required owner reference to `auth.users`
- Business name, slug, Marketplace path, short description, lifecycle status, and timestamps
- Path check: `food_farm`, `goods_services_handmade`, or `both`
- Status check: `draft`, `active`, `paused`, or `archived`
- Lowercase hyphenated public-slug format
- Owner and slug indexes
- RLS enabled
- Owner/admin CRUD policies
- Insert trigger creates one seller-review record
- Update trigger maintains `updated_at`

### `public.seller_reviews`

- One review row per seller profile
- States: `not_submitted`, `pending_review`, `changes_requested`, `approved`, `rejected`, and `suspended`
- Reviewer reference to `auth.users`
- Seller owner/admin read policy
- Admin-only insert, update, and delete policies
- Status index
- Update trigger maintains `updated_at`

### Seller function

`private.create_seller_review()` is a `SECURITY DEFINER` trigger function with an empty search path. It inserts one `not_submitted` review for a new seller. Browser roles do not receive direct execution.

### Seller grants

Production currently grants all table privileges to `authenticated` and `service_role` on both seller tables. RLS protects rows, but `authenticated` unnecessarily holds `TRUNCATE`, `TRIGGER`, and `REFERENCES`.

## Storage inventory

Production contains only `creation-station-private`. It is private, has a 20 MB file limit, and accepts approved image, PDF, and text types. Its policies remain Creation Station-specific.

There is no Marketplace Storage bucket or Marketplace Storage policy in production. None is proposed for Gate 1.

## Production migration history

| Recorded version | Recorded name |
|---|---|
| `20260714134741` | `phase_2_paypal_subscriptions` |
| `20260714140420` | `phase_2_membership_access_policies` |
| `20260714180828` | `phase_2_paypal_reliability` |
| `20260715212011` | `phase_3_creation_station` |
| `20260715212025` | `phase_3_publishing_approvals` |
| `20260715212037` | `phase_3_progress_history` |

No production history row records the original platform Phase 1 or seller shell.

## Repository migration comparison

| Repository filename | Production ledger |
|---|---|
| `20260714134741_phase_2_paypal_subscriptions.sql` | Same version |
| `20260714140420_phase_2_membership_access_policies.sql` | Same version |
| `20260714153500_phase_2_paypal_reliability.sql` | Production records `20260714180828` |
| `20260714190000_phase_3_creation_station.sql` | Production records `20260715212011` |
| `20260714203000_phase_3_publishing_approvals.sql` | Production records `20260715212025` |
| `20260715133000_phase_3_progress_history.sql` | Production records `20260715212037` |

The migration names correspond, but four applied version numbers differ from repository filenames.

## Verified baseline comparison

The prior fixture reconstructed profiles, roles, memberships, households, creator profiles, and basic authorization. It did not reconstruct the seller tables, seller trigger function, seller triggers, seller policies, seller grants, or seller indexes.

It also differed from production in shared Phase 1 policy structure, administrator policies, index names, index coverage, and grants. It contained `memberships_user_program_idx`, which is not in production, while omitting production indexes on membership user, membership status, creator owner, and creator household.

The branch updates the fixture to reproduce current production for testing. It remains explicitly test-only.

## Reconciliation conclusions

### Production objects missing from migration history

The entire shared Phase 1 foundation predates the current ledger, including profiles, roles, memberships, households, creators, core private functions, the new-user trigger, seller profiles, seller reviews, and seller policies.

### Repository objects not present in production

The old fixture contained policy and index structures that were not exact production matches. These were fixture differences, not a failed Phase 1.

No unapproved Marketplace feature table exists in production.

### Material differences

- Seller objects were absent from the fixture.
- Shared policy names and structures differed.
- Four repository timestamps differ from production ledger versions.
- Seller grants are broader than required.
- No Marketplace public view, Storage, listing, order, checkout, or payment object exists.

## Safe clean-environment reconstruction order

1. Start with a blank disposable Supabase project.
2. Apply the updated test-only `verified_platform_baseline.sql`.
3. Apply repository Phase 2 migrations in repository filename order.
4. Apply repository Phase 3 migrations in repository filename order.
5. Apply existing disposable role and publishing fixtures.
6. Apply proposed seller privilege hardening.
7. Apply proposed Marketplace creator access and security-invoker view.
8. Apply the proposed seller-review foreign-key index.
9. Run Marketplace access tests.
10. Run Creation Station regression tests.
11. Run Supabase security and performance advisors.
12. Keep or destroy the project only as a disposable environment.

Do not apply the baseline to production. Do not add it to the production ledger as though it were newly executed. Do not rely on a generated schema diff alone because Storage, grants, policies, and view security require manual verification.

## Recommended provenance treatment

Treat Platform Phase 1 as a documented pre-ledger production baseline.

- Keep the exact test reconstruction in the repository.
- Keep this report as the provenance record.
- Begin future approved Marketplace migrations after the current ledger.
- Do not run baseline SQL against production.
- Do not use migration repair without a separate owner-approved historical mapping.
- Never create a production migration that attempts to recreate existing Phase 1 objects.

## Disposable validation result

The Phase 3 disposable project originally contained the shared platform and Creation Station schema but no seller tables.

Gate 1 successfully verified in that disposable project:

- Exact seller-shell reconstruction
- Seller trigger and review creation
- Seller RLS
- Narrowed seller privileges
- Marketplace seller recognition independent of Creation Station membership
- Combined creator-profile read policy
- Security-invoker safe creator connection view
- Reviewer foreign-key index

No production database object or seller record was changed.
