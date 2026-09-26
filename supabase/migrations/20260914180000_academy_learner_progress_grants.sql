-- AI-Agent: Claude (Claude Code)
-- Session: RRA pipeline reactivation verification, owner-directed, 2026-09-14
--
-- Real bug found during owner testing: the 20260914170000 migration created
-- academy_learner_progress with RLS policies but never granted base table
-- privileges to the authenticated role. Postgres requires BOTH a table-level
-- GRANT and a passing RLS policy for access -- RLS alone grants nothing. Every
-- authenticated request against this table failed with
-- "permission denied for table academy_learner_progress", which the owner hit
-- directly while testing the rendered lesson page. Applied live via
-- mcp__Supabase__apply_migration and committed here to keep GitHub as the
-- permanent source of truth.

grant select, insert, update, delete on public.academy_learner_progress to authenticated;
