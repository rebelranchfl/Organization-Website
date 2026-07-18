# Marketplace Gate 1 Timestamp Alignment and Dry-Run Record

## Status

Repository migration timestamp alignment is complete on branch `agent/marketplace-gate-1-reconciliation`.

Production deployment remains unauthorized.

## Alignment commit

Commit: `849bcf3ec068a2d3db4c922ea178e4665059e1ac`

The four changes are Git renames with zero SQL additions, deletions, or content changes:

| Old repository path | Aligned repository path | Blob SHA |
|---|---|---|
| `20260714153500_phase_2_paypal_reliability.sql` | `20260714180828_phase_2_paypal_reliability.sql` | `48f06d232e148fd5ed3732dbefa530405b635715` |
| `20260714190000_phase_3_creation_station.sql` | `20260715212011_phase_3_creation_station.sql` | `cd5f377e7513ce639c8260b161bced24ed4bf665` |
| `20260714203000_phase_3_publishing_approvals.sql` | `20260715212025_phase_3_publishing_approvals.sql` | `02e9865a4096497040bb691a11459feaa28c2fe2` |
| `20260715133000_phase_3_progress_history.sql` | `20260715212037_phase_3_progress_history.sql` | `0b2e0be2df661fa12d235bad5e2c01571155aade` |

GitHub comparison reports each file as `renamed` with `0` additions, `0` deletions, and `0` changes.

The obsolete paths return `404` on the branch.

## Production migration ledger

Authoritative Supabase production history:

| Version | Migration |
|---|---|
| `20260714134741` | `phase_2_paypal_subscriptions` |
| `20260714140420` | `phase_2_membership_access_policies` |
| `20260714180828` | `phase_2_paypal_reliability` |
| `20260715212011` | `phase_3_creation_station` |
| `20260715212025` | `phase_3_publishing_approvals` |
| `20260715212037` | `phase_3_progress_history` |

## Branch migration sequence

The branch contains the six aligned historical migrations plus the three pending Gate 1 migrations:

| Version | Migration | Production state |
|---|---|---|
| `20260714134741` | `phase_2_paypal_subscriptions` | Applied |
| `20260714140420` | `phase_2_membership_access_policies` | Applied |
| `20260714180828` | `phase_2_paypal_reliability` | Applied |
| `20260715212011` | `phase_3_creation_station` | Applied |
| `20260715212025` | `phase_3_publishing_approvals` | Applied |
| `20260715212037` | `phase_3_progress_history` | Applied |
| `20260718054200` | `marketplace_seller_privilege_hardening` | Pending |
| `20260718054300` | `marketplace_shared_creator_access` | Pending |
| `20260718054400` | `marketplace_seller_review_index` | Pending |

The authoritative connector comparison therefore identifies exactly three pending migration versions.

## Literal Supabase CLI dry-run attempt

CLI version: `2.109.1`

Commands attempted:

```bash
supabase migration list --linked
supabase db push --dry-run --linked
```

The authenticated CLI dry run did not complete in this runtime.

Observed errors:

```text
open /home/oai/.supabase/profile: no such file or directory
```

and:

```text
IPv6 is not supported on your current network: dial tcp: lookup db.dfrwxpuojeiykaignyny.supabase.co ... connection refused
Run supabase link --project-ref dfrwxpuojeiykaignyny to setup IPv4 connection.
```

This is an execution-environment limitation. It is not a migration mismatch and it did not change production.

## Computed pending set — not a substitute for the required CLI dry run

Based on the aligned branch filenames and the authoritative production migration ledger, the expected dry-run pending list is:

```text
20260718054200_marketplace_seller_privilege_hardening.sql
20260718054300_marketplace_shared_creator_access.sql
20260718054400_marketplace_seller_review_index.sql
```

This computed list must not be represented as a successful `supabase db push --dry-run` result.

## Stop condition

Do not merge or deploy yet.

Final production approval still requires a successful authenticated CLI run showing that only the three Gate 1 migrations would be applied.

Do not use `migration repair`, `--include-all`, `--include-seed`, or a linked database reset.
