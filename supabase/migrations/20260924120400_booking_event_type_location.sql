-- AI-Agent: Claude Code (Claude Opus 5.5)
-- Session: Custom booking system build for rebelranchministries.org (2026-09-24)
-- Purpose: Owner request 2026-09-24 — booking types are not all ranch visits (some are
-- remote). Each booking type may carry its own private location/joining details (e.g. a
-- video-call link or "we'll call you"). When set, it replaces the general private location
-- from booking_settings in that type's visitor emails. Like the general location, it is
-- never returned by any public endpoint or shown on a web page.

alter table public.booking_event_types
  add column location_text text check (location_text is null or length(location_text) <= 2000);

comment on column public.booking_event_types.location_text is
  'Private location or joining details for this booking type. Emailed only to confirmed bookers. Overrides booking_settings.private_location_text when set.';
