-- Marketplace Gate 1: narrowly scoped creator connection access independent
-- of Creation Station paid membership.
-- Approved for final migration preparation on 2026-07-18.
-- Production application still requires separate owner approval.

create or replace function private.has_marketplace_seller_profile()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists (
    select 1
    from public.seller_profiles
    where owner_user_id=(select auth.uid())
      and profile_status in ('draft','active','paused')
  )
$$;

revoke all on function private.has_marketplace_seller_profile()
from public, anon, authenticated;
grant execute on function private.has_marketplace_seller_profile()
to authenticated;

-- Preserve the canonical production policy name and combine the Marketplace
-- branch into one SELECT policy to avoid multiple permissive policy evaluation.
drop policy if exists creator_profiles_select_member_or_admin
on public.creator_profiles;

create policy creator_profiles_select_member_or_admin
on public.creator_profiles
for select
to authenticated
using (
  private.is_admin()
  or (
    owner_user_id=(select auth.uid())
    and (
      private.has_active_creation_station_membership()
      or private.has_marketplace_seller_profile()
    )
  )
);

create or replace view public.marketplace_creator_connections
with (security_invoker=true)
as
select
  cp.id as creator_id,
  cp.display_name,
  cp.public_name,
  cp.creator_type,
  cp.age_band,
  cp.profile_status,
  published_portfolio.id as portfolio_id,
  published_portfolio.public_slug as portfolio_slug,
  published_portfolio.title as portfolio_title,
  published_website.published_url as creator_website_url
from public.creator_profiles cp
left join lateral (
  select p.id,p.public_slug,p.title
  from public.creator_portfolios p
  where p.creator_id=cp.id
    and p.review_status='published'
  order by p.published_at desc nulls last,p.updated_at desc
  limit 1
) published_portfolio on true
left join lateral (
  select w.published_url
  from public.creator_website_requests w
  where w.creator_id=cp.id
    and w.status='published'
    and w.published_url is not null
  order by w.published_at desc nulls last,w.updated_at desc
  limit 1
) published_website on true
where cp.owner_user_id=(select auth.uid())
  and private.has_marketplace_seller_profile();

revoke all on public.marketplace_creator_connections from public,anon;
grant select on public.marketplace_creator_connections to authenticated;

-- No new grants or policies are added to households, creator_projects,
-- project_assets, project_progress_events, creation_resources, live_classes,
-- class_registrations, creation_activity, private Storage, or moderation records.
