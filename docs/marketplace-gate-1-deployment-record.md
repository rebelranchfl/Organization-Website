# Marketplace Gate 1 — Production Deployment Record

## Deployment Summary

Date: 2026-07-19

PR #4 ("Marketplace Gate 1: final migration preparation and provenance
reconciliation") was merged to `main` via merge commit `88728cf7c80615484ae19ea0ad1ef8b1ed369b94`,
following explicit owner approval obtained after independent verification of:

* Repository state (branch head SHA, migration filename alignment, blob-hash
  integrity of the four renamed Phase 2/3 migrations)
* Production migration ledger (exactly the six pre-Gate-1 historical
  migrations, matching `docs/marketplace-gate-1-reconciliation.md`)
* Computed pending set (exactly the three Gate 1 migrations, no unexpected
  entries)
* Production current state (zero seller rows, Gate 1 objects absent prior to
  deployment)

The three Gate 1 migrations were then applied to production
(`dfrwxpuojeiykaignyny`) in order via an authenticated Supabase MCP
connection:

1. `marketplace_seller_privilege_hardening`
2. `marketplace_shared_creator_access`
3. `marketplace_seller_review_index`

## Correction: Migration Version Timestamps

The apply tool used to execute the migrations assigns its own version
timestamp at the time of execution rather than preserving the version
encoded in the source filename. As applied, production's
`supabase_migrations.schema_migrations` table initially recorded:

| Repository filename version | Initially recorded version |
| ---------------------------- | --------------------------- |
| `20260718054200`             | `20260719223237`            |
| `20260718054300`             | `20260719223259`            |
| `20260718054400`             | `20260719223312`            |

Migration names matched exactly and all schema effects (grants, the
`private.has_marketplace_seller_profile()` helper, the
`marketplace_creator_connections` view with `security_invoker=true`, and the
`seller_reviews_reviewer_user_id_idx` index) were verified correct — this was
a version-number bookkeeping mismatch only, not a defect in the applied
schema changes.

Because the exact 1:1 mapping between recorded and intended versions was
fully known (the three migrations were applied by name, in order, in the
same session), and with explicit owner approval, the three affected rows in
`supabase_migrations.schema_migrations` were corrected via a direct `UPDATE`
to match the repository filenames:

```sql
update supabase_migrations.schema_migrations set version='20260718054200' where version='20260719223237' and name='marketplace_seller_privilege_hardening';
update supabase_migrations.schema_migrations set version='20260718054300' where version='20260719223259' and name='marketplace_shared_creator_access';
update supabase_migrations.schema_migrations set version='20260718054400' where version='20260719223312' and name='marketplace_seller_review_index';
```

Post-correction, `supabase migration list` / MCP `list_migrations` against
production shows all nine migration versions (six historical, three Gate 1)
matching the repository exactly.

## Post-Deployment Verification Results

* `seller_profiles` row count: 0 (unchanged)
* `seller_reviews` row count: 0 (unchanged)
* `authenticated` privileges on `seller_profiles` / `seller_reviews`:
  `{DELETE,INSERT,SELECT,UPDATE}` only (TRUNCATE/TRIGGER/REFERENCES revoked)
* `anon` privileges on both tables: none
* `private.has_marketplace_seller_profile()`: present, execute granted to
  `authenticated` only
* `creator_profiles_select_member_or_admin` policy: single combined policy
  covering admin, Creation Station membership, and Marketplace seller
  eligibility, as designed
* `marketplace_creator_connections` view: present, `security_invoker=true`
  confirmed via `pg_class.reloptions`
* `seller_reviews_reviewer_user_id_idx`: present
* Security/performance advisors: no new or unexpected findings; the
  previously-flagged unindexed-FK warning on `seller_reviews.reviewer_user_id`
  is resolved

No Edge Functions were deployed. No PayPal products, subscriptions, or
charges were created. No checkout, orders, shipping, messaging, or customer
review work was performed. Gate 2 has not begun.
