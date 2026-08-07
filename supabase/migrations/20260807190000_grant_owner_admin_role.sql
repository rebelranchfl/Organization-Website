-- AI-Agent: Claude Code
-- Session: Creation Station dashboard access + site-wide deploy fix (2026-08-07)
-- Owner request: rebelranchfl@gmail.com (pre-existing account, created 2026-07-13, already
-- confirmed) should have full access to every Creation Station surface without needing a
-- tier, active membership, or completed purchase. private.is_creation_station_admin() and
-- most Creation Station RLS policies already check public.user_roles for role='admin'.

insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'rebelranchfl@gmail.com'
on conflict (user_id, role) do nothing;
