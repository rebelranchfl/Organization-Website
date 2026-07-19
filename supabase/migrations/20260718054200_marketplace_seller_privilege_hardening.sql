-- Marketplace Gate 1: least-privilege correction for existing seller tables.
-- Approved for final migration preparation on 2026-07-18.
-- Production application still requires separate owner approval.
-- This migration changes privileges only; it does not alter or delete seller data.

revoke all privileges on table public.seller_profiles from anon, authenticated;
revoke all privileges on table public.seller_reviews from anon, authenticated;

grant select, insert, update, delete
on table public.seller_profiles
to authenticated;

-- Seller owners may read their review through RLS.
-- Existing RLS continues to limit INSERT, UPDATE, and DELETE review operations
-- to administrators.
grant select, insert, update, delete
on table public.seller_reviews
to authenticated;
