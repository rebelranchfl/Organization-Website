# HANDOFF — REBEL RANCH MARKETPLACE, GATE 2 IN-PROGRESS PRODUCTION DEPLOYMENT

## Purpose

Continue Gate 2 production deployment from the exact current stopping point. Gate 2 was fully designed, built, validated on a disposable project, merged to `main` via PR #5, and partially applied to production before the working session's Supabase MCP connection lost authentication. Do not redo completed work. Do not treat the mid-deployment stop as a failure — production is in a safe, non-broken intermediate state.

---

## 1. Governing status

Gate 1 is fully deployed, verified, and closed (see `docs/marketplace-gate-1-deployment-record.md`).

Gate 2 (seller onboarding foundation: applications, categories, regions, compliance pipeline, moderation/notifications, affiliations, seller-team foundation) has been:
- Fully designed (plan approved by owner)
- Built as 5 migration files + 1 RLS access-control test file
- Validated end-to-end on the disposable Supabase project
- Merged to `main` via PR #5
- **Partially applied to production**: migrations 1 and 2 of 5 are live. Migrations 3, 4, 5 are not yet applied.

No data was lost or corrupted. Migrations 1 and 2 are independent, additive, and fully functional on their own. Migrations 3–5 simply have not run yet.

---

## 2. Repository

Repo: `rebelranchfl/Organization-Website`. Local clone: `F:\Rebel Ranch Ministries\3P\Claude Mapping and Linking Services\rebelranch-website`.

Default branch: `main`.

Gate 2 branch (already merged, can be deleted or left): `agent/marketplace-gate-2-onboarding-foundation`.

PR #5 ("Merge Marketplace Gate 2: seller onboarding foundation") is **merged**. Merge commit: `2a432f0c24b333c2f08831fb1292255f22eff128`. Squash commit on the branch beforehand: `ecb760ca3e377df03d563b5d888afa51a1bea892`.

Files added by PR #5 (all present on `main` now):
```
docs/marketplace-gate-2-production-execution-plan.md
supabase/migrations/20260720140000_marketplace_gate_2_categories_regions.sql
supabase/migrations/20260720140100_marketplace_gate_2_applications_versioning.sql
supabase/migrations/20260720140200_marketplace_gate_2_affiliations_team.sql
supabase/migrations/20260720140300_marketplace_gate_2_compliance_pipeline.sql
supabase/migrations/20260720140400_marketplace_gate_2_moderation_notifications.sql
supabase/tests/marketplace_gate_2_access.sql
```

The approved design plan (all schema decisions, rationale, and owner-confirmed choices) is at `C:\Users\rebel\.claude\plans\linear-nibbling-dongarra.md` on this machine — read it for full context on *why* each table/trigger looks the way it does before touching anything.

---

## 3. Supabase projects

Production: `dfrwxpuojeiykaignyny` ("Rebel Ranch Platform").
Disposable validation project: `rreckoioipopyudqykek`. This project now has ALL of Gate 1 + Gate 2 applied and validated — safe to reuse or ignore; do not confuse with production.

---

## 4. Exact production state right now

**Applied and confirmed live** (via `apply_migration` returning `{"success":true}` for each, immediately before the connection dropped):
1. `marketplace_gate_2_categories_regions` — `marketplace_categories`, `marketplace_regions` (seeded with Gilchrist County), `seller_category_assignments`, `seller_profiles.region_id` column.
2. `marketplace_gate_2_applications_versioning` — `seller_applications` (+ guard/sync triggers), `seller_profile_versions` (+ capture trigger).

**Not yet applied — do these three next, in this exact order:**
3. `marketplace_gate_2_affiliations_team` — `seller_creator_affiliations`, `seller_household_affiliations`, `seller_team_members`, plus helper functions `private.is_household_owner_of_creator()` and `private.is_household_owner()`.
4. `marketplace_gate_2_compliance_pipeline` — `compliance_requirements`, `seller_requirement_assignments` (+ auto-assign trigger depending on migration 1's `seller_category_assignments`), `seller_attestations`, `seller_credentials`, new storage bucket `marketplace-seller-private`.
5. `marketplace_gate_2_moderation_notifications` — `seller_review_events`, `marketplace_notifications`; depends on migrations 2 and 4 (reads `seller_applications`/`seller_credentials`), must stay last.

Read each file's exact final SQL directly from the repo before applying — do not reconstruct from memory:
```
supabase/migrations/20260720140200_marketplace_gate_2_affiliations_team.sql
supabase/migrations/20260720140300_marketplace_gate_2_compliance_pipeline.sql
supabase/migrations/20260720140400_marketplace_gate_2_moderation_notifications.sql
```
These are the exact reviewed, PR-merged, disposable-tested versions. Apply each file's full contents via the Supabase MCP `apply_migration` tool (`project_id: dfrwxpuojeiykaignyny`, `name:` the filename's description e.g. `marketplace_gate_2_affiliations_team`, `query:` the file's SQL body) — same method already used successfully for migrations 1 and 2.

---

## 5. Known quirk — migration version numbers WILL need correction afterward

This happened identically during Gate 1 and should be expected again: the `apply_migration` MCP tool assigns its own timestamp-based version to each migration in `supabase_migrations.schema_migrations`, rather than preserving the version encoded in the migration filename. After applying migrations 3–5, check:

```sql
select version, name from supabase_migrations.schema_migrations order by version desc limit 10;
```

If the recorded versions for `marketplace_gate_2_affiliations_team`, `marketplace_gate_2_compliance_pipeline`, and `marketplace_gate_2_moderation_notifications` don't match `20260720140200`, `20260720140300`, `20260720140400` respectively, correct them with a direct `UPDATE` (exact same pattern used and already owner-approved for Gate 1 — see `docs/marketplace-gate-1-deployment-record.md`):

```sql
update supabase_migrations.schema_migrations set version='20260720140200' where name='marketplace_gate_2_affiliations_team';
update supabase_migrations.schema_migrations set version='20260720140300' where name='marketplace_gate_2_compliance_pipeline';
update supabase_migrations.schema_migrations set version='20260720140400' where name='marketplace_gate_2_moderation_notifications';
```

Verify afterward that `list_migrations` shows all 14 versions (6 historical + 3 Gate 1 + 5 Gate 2) exactly matching the repository's `supabase/migrations/` filenames. Document the correction the same way Gate 1's was documented (append to a deployment-record doc), since this is now a known, recurring, and already-approved pattern — no need to re-ask the owner for permission to make this specific correction again, but do record it.

---

## 6. Post-deployment verification checklist

After migrations 3–5 are applied and versions corrected:

- `seller_profiles` / `seller_reviews` row counts unchanged (no data touched by any Gate 2 migration).
- `seller_creator_affiliations`, `seller_household_affiliations`, `seller_team_members`, `compliance_requirements`, `seller_requirement_assignments`, `seller_attestations`, `seller_credentials`, `seller_review_events`, `marketplace_notifications` all exist with RLS enabled.
- Storage bucket `marketplace-seller-private` exists (private, 10MB limit, image/PDF mime types only).
- Run Supabase security + performance advisors (`get_advisors`, both `security` and `performance` types) against `dfrwxpuojeiykaignyny`. Expect no new *unexpected* findings — some INFO-level "unused index" notices on the brand-new tables are normal and not a problem (no data yet).
- Confirm `staff` role still has zero moderation authority anywhere (this has been a standing regression check since Gate 1).
- Confirm `private.is_admin()`-gated fields (verification_status, reviewer fields, assignment_status) cannot be self-set by a non-admin seller — already proven on the disposable project via `supabase/tests/marketplace_gate_2_access.sql`, just a production sanity spot-check, not a full re-run.

---

## 7. Hard boundaries that still apply (unchanged from Gate 1 and Gate 2's own approved plan)

Do not, under any circumstance in this continuation:
- Begin Gate 3 or any work beyond what's described above.
- Touch checkout, payments, orders, shipping, messaging, customer reviews, multi-seller carts, or live maps.
- Deploy Edge Functions.
- Add a `pg_cron` sweep or any email/SMS notification delivery (explicitly deferred past Gate 2 by owner decision).
- Store raw SSN/EIN or other structured sensitive identifiers anywhere (owner-confirmed: documents + free text only).
- Touch the separate `3Pconsulting/Organization-Website` repository or project in any way — it is unrelated and must remain untouched.
- Rewrite migration history or use `migration repair` beyond the specific version-number correction described in Section 5 above.

---

## 8. Why this handoff exists

The working session's Supabase MCP connector (`https://mcp.supabase.com/mcp?project_ref=dfrwxpuojeiykaignyny`, registered in this repo's `.mcp.json`) lost its authorization mid-deployment, twice, in this particular client app. The owner confirmed the same connector works fine when accessed from a regular web browser session. This handoff exists so a session in a working environment (e.g. the web browser) can pick up immediately at Section 4 without re-deriving any of the design, validation, or partial-deployment history above.
