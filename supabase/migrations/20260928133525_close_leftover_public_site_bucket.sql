-- Owner instruction 2026-09-28: switch off public access that should not be public.
-- The 'site' bucket was created by the leftover publish-ledger test function; nothing on
-- the website links to it. Made private (files kept, nothing deleted).
-- AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
update storage.buckets set public = false where id = 'site';
