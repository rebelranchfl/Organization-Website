-- PROPOSED ONLY. DO NOT APPLY TO PRODUCTION WITHOUT OWNER APPROVAL.
-- Marketplace Gate 1: remove unnecessary browser-facing seller-table privileges.
-- RLS policies remain unchanged and continue to enforce owner/admin row access.

begin;

revoke all privileges on table public.seller_profiles from anon, authenticated;
revoke all privileges on table public.seller_reviews from anon, authenticated;

grant select, insert, update, delete
on table public.seller_profiles
to authenticated;

-- Owners can SELECT their review through RLS.
-- Only administrators can INSERT, UPDATE, or DELETE review rows through existing RLS policies.
grant select, insert, update, delete
on table public.seller_reviews
to authenticated;

commit;
