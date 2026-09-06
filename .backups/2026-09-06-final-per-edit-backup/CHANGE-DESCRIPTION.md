# Change Description — Replace per-edit backup rule with recoverability

Date: 2026-09-06

Owner-approved repository-control change.

Target file: `/AGENTS.md`

Replace the current requirement to create a duplicate file backup before every edit with this rule:

**Every change must be recoverable.**

Approved protection model:

1. Normal/small changes: Git commit history is the recovery mechanism. No duplicate `.backups` file is required.
2. Multi-file, structural, risky, migration, deployment, or potentially destructive work: use a dedicated branch or other verified Git recovery point before making the risky change.
3. Disaster recovery: maintain periodic full repository backups outside this repository. This is separate from normal Git change history.
4. Do not create in-repository backup copies merely because a file is being edited.
5. Existing `.backups` content remains historical material until it is reviewed during repository cleanup. Do not delete it automatically.
6. Replace final-reporting language that requires a backup location with recovery-point / branch information when applicable.

This is the last change that follows the old per-edit duplicate-backup rule. No live website behavior, program logic, database, deployment, or external service is changed.