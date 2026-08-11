-- AI-Agent: Claude Code
-- Session: Creation Station dashboard corrections walkthrough (2026-08-08/09)
-- Owner request: a lightweight "Kid Mode" workspace switch. This is a client-side
-- convenience layer (hides Parent/Admin/Website nav and the creator switcher), not a
-- real account-security boundary - explicitly agreed with the owner given no separate
-- child login exists (avoids COPPA exposure from collecting a child's own credentials).
-- Existing owner-scoped UPDATE policies (creator_profiles_update_member_or_admin,
-- households_update_member_or_admin) already cover writing these columns - verified
-- live before writing this migration - so no new grants or policies are added here.
-- Applied directly to the live "Rebel Ranch Platform" project (dfrwxpuojeiykaignyny)
-- via Supabase MCP apply_migration before this file was committed; this file mirrors
-- that change.

alter table public.creator_profiles add column kid_pin text;
alter table public.households add column parent_pin text;
