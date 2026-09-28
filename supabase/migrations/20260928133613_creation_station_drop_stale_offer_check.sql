-- Owner instruction 2026-09-28: fix the Creation Station bundle issue.
-- A leftover rule (not in the repository) allowed only 3 of the 6 Creation Station
-- membership offers, so Club and both bundles could never be granted
-- (live failure 2026-08-18: club_studio_bundle). The current rule, membership_offer_check,
-- already lists all six offers and stays in place.
-- AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
alter table public.memberships drop constraint if exists memberships_creation_station_offer_check;
