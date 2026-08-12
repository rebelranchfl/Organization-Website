-- AI-Agent: Claude Code
-- Session: Creation Station dashboard corrections walkthrough (2026-08-08/09)
-- assign_website_request_slug() is a trigger function only, but SECURITY DEFINER
-- functions in the public schema default to PUBLIC execute, so the advisor flagged it
-- as directly callable via /rpc/. Revoke that - it should only ever run as a trigger.
-- Applied directly to the live "Rebel Ranch Platform" project (dfrwxpuojeiykaignyny)
-- via Supabase MCP apply_migration before this file was committed; this file mirrors
-- that change.

revoke execute on function public.assign_website_request_slug() from public, anon, authenticated;
