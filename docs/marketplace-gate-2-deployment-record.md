# Marketplace Gate 2 — Production Deployment Record

## Deployment Summary

Date: 2026-07-20

PR #5 ("Merge Marketplace Gate 2: seller onboarding foundation") was merged
to `main` via merge commit `2a432f0c24b333c2f08831fb1292255f22eff128`, following
explicit owner approval obtained after design review (see
`C:\Users\rebel\.claude\plans\linear-nibbling-dongarra.md`) and full validation
on the disposable Supabase project (`rreckoioipopyudqykek`) using
`supabase/tests/marketplace_gate_2_access.sql`.

All five Gate 2 migrations were applied to production (`dfrwxpuojeiykaignyny`)
in order via an authenticated Supabase MCP connection:

1. `marketplace_gate_2_categories_regions` (`20260720140000`)
2. `marketplace_gate_2_applications_versioning` (`20260720140100`)
3. `marketplace_gate_2_affiliations_team` (`20260720140200`)
4. `marketplace_gate_2_compliance_pipeline` (`20260720140300`)
5. `marketplace_gate_2_moderation_notifications` (`20260720140400`)

Unlike Gate 1, all five recorded versions in
`supabase_migrations.schema_migrations` matched the repository filenames
exactly on first application — no version-number correction was needed this
time.

The deployment session's Supabase MCP connection dropped authorization
twice mid-deployment (see `docs/marketplace-gate-2-session-handoff.md` for
the interim state). On reconnection, verification showed migrations 1
through 5 had in fact all applied successfully before the connection
dropped — the confirmations were simply never received. No migration was
reapplied; production was verified to already be in the fully-deployed
target state.

## Post-Deployment Verification Results

* `seller_profiles` row count: 0 (unchanged)
* `seller_reviews` row count: 0 (unchanged)
* Storage bucket `marketplace-seller-private`: present, private, 10MB limit
* `authenticated` privileges on `seller_applications` / `seller_credentials`:
  `{DELETE,INSERT,SELECT,UPDATE}` only; `anon` has none
* All 14 new/existing objects (`marketplace_categories`, `marketplace_regions`,
  `seller_category_assignments`, `seller_applications`, `seller_profile_versions`,
  `seller_creator_affiliations`, `seller_household_affiliations`,
  `seller_team_members`, `compliance_requirements`,
  `seller_requirement_assignments`, `seller_attestations`,
  `seller_credentials`, `seller_review_events`, `marketplace_notifications`)
  present with RLS enabled
* Security advisors: no new findings beyond the three pre-existing
  service-role-only payment-table notices and the leaked-password-protection
  warning (both unrelated to Marketplace)
* Performance advisors: only expected "unused index" INFO notices on the
  brand-new, currently-empty tables — no unexpected findings
* `staff` role confirmed to retain zero moderation authority (regression
  check, per the disposable-project access test)

No Edge Functions were deployed. No PayPal products, subscriptions, or
charges were created. No checkout, orders, shipping, messaging, or customer
review work was performed. Gate 3 has not begun.
