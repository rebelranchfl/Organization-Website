-- Corrective fix: marketplace_categories_select_active_or_admin and
-- marketplace_regions_select_active_or_admin (both from Gate 2) apply to
-- anon as well as authenticated, and both call private.is_admin() in
-- their USING clause -- but is_admin() was only ever granted EXECUTE to
-- authenticated. Postgres checks function-execute privilege at query
-- planning time regardless of short-circuiting, so any anon query
-- touching either table failed outright with "permission denied for
-- function is_admin". This never surfaced before because nothing
-- anon-facing ever queried these tables until the public Marketplace
-- directory/seller page existed. Safe to grant: for anon, auth.uid() is
-- null, so is_admin() always evaluates to false -- this only lets the
-- planner evaluate the expression, it exposes nothing.

grant execute on function private.is_admin() to anon;
