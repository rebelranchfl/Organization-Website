# Rebel Ranch Marketplace Gate 1 Handoff

## Status

**Platform Phase 1 is live and functional, but its schema history requires reconciliation before Marketplace Gate 1 can safely build upon it.**

Gate 1 reconciliation, disposable reconstruction, proposed security changes, and access testing are complete.

Production changes remain stopped pending owner approval.

## Repository work

Branch:

`agent/marketplace-gate-1-reconciliation`

Files:

- `supabase/tests/fixtures/verified_platform_baseline.sql`
- `supabase/tests/marketplace_gate_1_access.sql`
- `supabase/proposed-migrations/marketplace_seller_privilege_hardening.sql`
- `supabase/proposed-migrations/marketplace_shared_creator_access.sql`
- `supabase/proposed-migrations/marketplace_advisor_index.sql`
- `docs/marketplace-phase-1-architecture-addendum.md`
- `docs/marketplace-gate-1-reconciliation.md`
- `docs/marketplace-gate-1-handoff.md`

The proposed SQL is outside `supabase/migrations` so it cannot be applied through a normal migration push before review.

## Production inventory

Existing Marketplace objects:

- `public.seller_profiles`
- `public.seller_reviews`
- `private.create_seller_review()`
- Seller creation and timestamp triggers
- Owner/admin RLS policies
- Seller indexes and constraints

Seller row counts at audit time:

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

## Disposable validation

Project:

`rreckoioipopyudqykek`

Validated:

1. Shared baseline and Phase 2/3 schema confirmed.
2. Missing seller shell reconstructed from production inventory.
3. Seller trigger produced one review per seller.
4. Seller privileges narrowed.
5. Marketplace creator access added independently of Creation Station membership.
6. Safe creator connection view created with `security_invoker=true`.
7. Reviewer foreign-key index added.
8. Access matrix executed.
9. Advisors executed.

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
| Cross-account seller visibility | Denied |

## Proposed privilege correction

Retain for `authenticated` on `seller_profiles`:

- SELECT
- INSERT
- UPDATE
- DELETE

Retain for `authenticated` on `seller_reviews`:

- SELECT
- INSERT
- UPDATE
- DELETE

RLS continues to limit review mutations to administrators.

Remove from both seller tables:

- TRUNCATE
- TRIGGER
- REFERENCES

Anonymous roles receive no table or safe-view access during Gate 1.

## Proposed shared access

Marketplace seller recognition is based on an owned seller profile in `draft`, `active`, or `paused` status and does not require a Creation Station membership.

Creator access is added inside the existing creator-profile SELECT policy. No creator insert, update, or delete permission and no household permission are added.

The safe view exposes only:

- Creator ID
- Display and public names
- Creator type and age band
- Profile status
- Published portfolio ID, slug, and title
- Latest published Creator Website URL

It excludes household IDs, owner IDs, private projects, private assets, progress, classes, resources, moderation notes, private portfolios, and private website revisions.

## Advisor results

No new Marketplace security lint was produced.

Existing notices remain:

- Payment service tables have RLS without browser policies because they are service-role-only.
- Leaked-password protection is disabled and requires a separate owner decision.

Performance corrections in the disposable proposal:

- Added reviewer foreign-key coverage.
- Added missing creator household foreign-key coverage to the test baseline.
- Removed the duplicate permissive creator SELECT policy by combining conditions.

Remaining performance notices are expected unused-index messages from a small test dataset.

## Architecture safeguards recorded

- Future seller-team roles
- Public/private seller-data separation
- Category-specific rules, assignments, attestations, and credentials
- One seller per initial future cart and order
- Legal, tax, and payment approval before integrated checkout
- Retention, archiving, suspension, appeals, and deletion rules
- Operational notifications
- Rural low-bandwidth requirements
- Map-provider privacy and cost approval

## Remaining decisions and blockers

Owner approval is required before:

1. Moving seller privilege SQL into a timestamped migration.
2. Moving Marketplace creator-access SQL into a timestamped migration.
3. Moving the reviewer index into a timestamped migration.
4. Applying any of those migrations to production.
5. Choosing whether production migration history remains a documented pre-ledger baseline or receives a separate migration-repair process.
6. Enabling leaked-password protection.
7. Granting future staff Marketplace permissions.
8. Creating Marketplace Storage, onboarding entities, or later-phase objects.

## Exact production changes requiring approval

Proposed database changes:

- Revoke unnecessary seller-table privileges.
- Grant explicit seller CRUD privileges.
- Add `private.has_marketplace_seller_profile()`.
- Replace the creator-profile SELECT policy with the combined Creation Station and Marketplace condition.
- Add `marketplace_creator_connections` as a security-invoker view.
- Add `seller_reviews_reviewer_user_id_idx`.

No Edge Function, PayPal, checkout, order, shipping, or payment change is proposed.

## Stop condition

Gate 1 stops here.

No production Supabase migration was applied.

No Edge Function was deployed.

No PayPal charge or subscription was created.

No Marketplace checkout or later-phase implementation began.
