# Change Description — Shared Systems Consolidation

Date: 2026-09-06

Owner-authorized repository documentation consolidation.

This batch is limited to shared-system documentation and classification. No live code, database, deployment configuration, website page, program workflow, or program brand is authorized to change.

## Intended changes

1. Create one repository-level shared-systems operations document covering verified shared infrastructure boundaries: Supabase client/database/auth foundation, account/auth entry points, email delivery, shared public shell/navigation, security/permissions principles, and deployment ownership/boundaries.
2. Keep program-specific behavior in the relevant program ecosystem; shared-system documentation should not absorb Marketplace, RRA, or Creation Station business logic.
3. Refocus `docs/email-delivery-setup.md` on the shared email/auth delivery system and route Marketplace order-notification specifics to the Marketplace handoff instead of duplicating them.
4. Mark `docs/github-pages-deploy-outage-2026-08-06.md` as a historical incident record, not current deployment authority. Current deployment status must be verified from current workflows/configuration before use.
5. Record current verified deployment facts: the RRA Program Hub has a GitHub Actions workflow deploying through Cloudflare Wrangler; the historical GitHub Pages incident cannot be treated as proof of the current main-site host.
6. Preserve unresolved deployment questions as NOT VERIFIED rather than guessing.

## Files in this batch

- new: `docs/shared-systems-operations.md`
- update: `docs/email-delivery-setup.md`
- update: `docs/github-pages-deploy-outage-2026-08-06.md`

Backups of both existing files were created in this directory before edits.