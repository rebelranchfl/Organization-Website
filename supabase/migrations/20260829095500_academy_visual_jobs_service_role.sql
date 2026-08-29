-- AI-Agent: ChatGPT/Codex
-- Session: Water Ops Dashboard and Supabase recovery
-- Purpose: Allow only the trusted server worker to create/update visual job records.

grant select, insert, update on public.academy_visual_production_jobs to service_role;
revoke delete, truncate on public.academy_visual_production_jobs from service_role;
