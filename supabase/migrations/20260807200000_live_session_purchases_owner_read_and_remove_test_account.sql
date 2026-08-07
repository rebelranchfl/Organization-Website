-- AI-Agent: Claude Code
-- Session: Creation Station dashboard access + site-wide deploy fix (2026-08-07)
-- Bug: every member hit "permission denied for table live_session_purchases" loading the
-- dashboard. classes_member_read (on public.live_classes, added 20260803190000) checks an
-- EXISTS subquery against live_session_purchases, but that table has zero grants for
-- authenticated (intentionally revoked in the same migration). Postgres checks table-level
-- permission for every relation named in a query at rewrite time, regardless of which
-- OR-branch would actually match, so the grant is required even for admins/members who
-- qualify some other way.
-- Fix: grant SELECT to authenticated and add an own-rows-only RLS policy, so the EXISTS
-- check can run without exposing any other member's purchase records.
--
-- Also, per owner request: delete the brookeritchie90@icloud.com test account, now that the
-- owner has a working admin account (rebelranchfl@gmail.com). Confirmed zero rows in
-- public.payment_events for this user. All other Creation Station data owned by this account
-- (households, creator_profiles, memberships, live_session_purchases, etc.) cascades via
-- ON DELETE CASCADE foreign keys to auth.users.

grant select on public.live_session_purchases to authenticated;

create policy live_session_purchases_owner_read on public.live_session_purchases
for select to authenticated
using (user_id = (select auth.uid()));

delete from auth.users where email = 'brookeritchie90@icloud.com';
