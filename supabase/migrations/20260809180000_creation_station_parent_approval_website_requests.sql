-- AI-Agent: Claude Code
-- Session: Creation Station dashboard corrections walkthrough (2026-08-08/09)
-- Owner request: a website/Studio request must carry documented parent/guardian
-- approval (typed full name, relationship, explicit consent statement, timestamp)
-- rather than only a submit button anyone with dashboard access could click.
-- Nullable: existing rows predate this feature and are not backfilled.
-- Applied directly to the live "Rebel Ranch Platform" project (dfrwxpuojeiykaignyny)
-- via Supabase MCP apply_migration before this file was committed; this file mirrors
-- that change.

alter table public.creator_website_requests
  add column parent_approver_name text,
  add column parent_approver_relationship text,
  add column parent_approved_at timestamptz,
  add column consent_statement text;
