-- AI-Agent: Claude Code
-- Session: Creation Station membership tier & bundle pricing (2026-08-04)
-- Reprices the two Studio tiers, retires the unused middle tier, and adds two
-- new bundle offers (Club+Studio, Club+Studio+Landing Page). Additive; no
-- existing offer_code is removed, no existing membership row is touched.
--
-- Display-name note: 'young_creator_family' and 'creator_website' offer_codes
-- are NOT renamed here even though their public label is changing (to
-- "Creation Station Studio" and "Creation Station Studio + Landing Page").
-- Renaming stored offer_code values would risk breaking the one real
-- membership row already on young_creator_family. Only the price and the
-- page copy change; see docs/creation-station-visual-rules.md naming rule.

-- 1. Allow the two new bundle offer codes on memberships and payment_plan_mappings.
alter table public.memberships drop constraint if exists membership_offer_check;
alter table public.memberships add constraint membership_offer_check check (
  (program_code='creation_station' and offer_code in (
    'young_creator_family','creator_development','creator_website','club',
    'club_studio_bundle','club_all_access_bundle'
  ))
  or (program_code='marketplace' and length(trim(offer_code))>0)
);

alter table public.payment_plan_mappings drop constraint if exists payment_plan_mappings_offer_code_check;
alter table public.payment_plan_mappings add constraint payment_plan_mappings_offer_code_check
  check (offer_code in (
    'young_creator_family','creator_development','creator_website','club',
    'club_studio_bundle','club_all_access_bundle'
  ));

-- 2. Register the two new live bundle plans (owner-provided PayPal plan IDs).
insert into public.payment_plan_mappings(payment_provider,payment_environment,program_code,offer_code,provider_plan_id,is_active)
values
  ('paypal','live','creation_station','club_studio_bundle','P-45630936673765030NJZH66Y',true),
  ('paypal','live','creation_station','club_all_access_bundle','P-78A75435DJ4363646NJZH7PI',true)
on conflict(payment_provider,payment_environment,offer_code)
do update set provider_plan_id=excluded.provider_plan_id,is_active=true,updated_at=now();

-- 3. Retire creator_development: zero subscribers, no longer part of the tier
--    structure. Left in the allowed list above (harmless) but deactivated so
--    it can no longer be sold.
update public.payment_plan_mappings set is_active=false,updated_at=now()
 where program_code='creation_station' and offer_code='creator_development';

-- 4. Recognize the two bundle offer codes in the tier-rank calculation:
--    club_studio_bundle carries the same rank as young_creator_family (Studio,
--    dashboard+portfolio, no landing page). club_all_access_bundle carries the
--    same rank as creator_website (Studio + Landing Page). Club access itself
--    is unaffected: any active creation_station membership already unlocks
--    live-class visibility via private.has_active_creation_station_membership(),
--    so the bundle rows need no separate club-access wiring.
create or replace function private.creation_station_tier_rank()
returns integer language sql stable security definer set search_path=''
as $$
 select coalesce(max(case offer_code
   when 'young_creator_family' then 1
   when 'club_studio_bundle' then 1
   when 'creator_development' then 2
   when 'creator_website' then 3
   when 'club_all_access_bundle' then 3
   else 0 end),0)
 from public.memberships where user_id=(select auth.uid()) and program_code='creation_station'
 and membership_status in ('active','past_due') and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now())
$$;
revoke all on function private.creation_station_tier_rank() from public;
grant execute on function private.creation_station_tier_rank() to authenticated;
