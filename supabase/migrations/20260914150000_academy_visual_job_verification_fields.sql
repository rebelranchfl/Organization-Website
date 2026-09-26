-- AI-Agent: Claude (Claude Code)
-- Session: RRA pipeline reactivation verification, owner-directed, 2026-09-14
-- Purpose: Add structured, data-based verification to the Academy visual production
--   queue, agreed with the owner after live-testing RRA-2026-0011's Visual Production
--   stage and designing the ChatGPT <-> Claude image handoff with them and ChatGPT.
--
-- Design agreed with the owner:
-- 1. Generation and verification must be two independent passes by two different
--    agents, neither trusting the other's bare assertion. ChatGPT (the generator)
--    records its OWN self-check as data (what it actually observes in the image it
--    made), not a yes/no. Claude (a different agent) independently re-derives the
--    same checks directly against the real committed file and records its own
--    findings, blind to whether they match ChatGPT's.
-- 2. When the two disagree, or Claude's independent check fails outright, the row
--    does NOT auto-retry. This is a new, unproven system; an unsupervised
--    generate-fail-retry loop risks exactly the "system claims progress it isn't
--    making" pattern that caused the original automation suspension. A disagreement
--    can also be nothing more than two systems using different words for the same
--    state (this exact thing happened during design: ChatGPT proposed
--    READY_FOR_IMAGE while the real column already used READY_FOR_CHATGPT) --
--    a human circuit breaker is required until there is a track record showing the
--    verification logic itself is well-calibrated.
-- 3. The owner reviews any conflict and chooses exactly one of three things:
--    override and proceed (the disagreement was not a real defect), authorize one
--    more generation attempt (it was a real defect), or flag that the verification
--    logic itself needs correcting (Claude's check was wrong, not the image).
--    Nothing retries until the owner has made that call.
--
-- Reuses the existing academy_visual_production_jobs table and its existing state
-- values (BRIEF_REQUIRED / READY_FOR_CHATGPT / CHATGPT_GENERATING /
-- GENERATED_PENDING_INSPECTION / REVISION_REQUIRED / READY_FOR_INTEGRATION /
-- INTEGRATING / DEPLOYED_QA_PENDING / VERIFIED / FAILED) rather than inventing a
-- parallel schema -- see migration 20260914130000/20260914140000 for the earlier,
-- unrelated instance of exactly that mistake being found and fixed.

alter table public.academy_visual_production_jobs
  add column if not exists prompt_text text,
  add column if not exists must_include jsonb not null default '[]'::jsonb,
  add column if not exists must_avoid jsonb not null default '[]'::jsonb,
  add column if not exists aspect_ratio text,
  add column if not exists generation_self_check jsonb,
  add column if not exists verification_report jsonb,
  add column if not exists verification_outcome text,
  add column if not exists owner_decision text,
  add column if not exists owner_decision_note text,
  add column if not exists owner_decision_at timestamptz;

alter table public.academy_visual_production_jobs
  add constraint academy_visual_production_jobs_verification_outcome_check
  check (verification_outcome is null or verification_outcome in ('PASS','CONFLICT','FAIL'));

alter table public.academy_visual_production_jobs
  add constraint academy_visual_production_jobs_owner_decision_check
  check (owner_decision is null or owner_decision in ('OVERRIDE_PROCEED','AUTHORIZE_RETRY','FIX_CHECKER'));

comment on column public.academy_visual_production_jobs.prompt_text is 'Exact generation prompt, sourced from the project''s visual-production-brief.md. Lets a generation agent read everything it needs from this one row without fetching/parsing a markdown file from GitHub.';
comment on column public.academy_visual_production_jobs.must_include is 'JSON array of required, specific content items (e.g. exact labels) the generated image must contain. Structured so a self-check or verification pass can be checked item by item.';
comment on column public.academy_visual_production_jobs.must_avoid is 'JSON array of prohibited shortcuts/invented content (e.g. "do not add a fifth ability").';
comment on column public.academy_visual_production_jobs.generation_self_check is 'Written by the generating agent (e.g. ChatGPT) immediately after generation. Must be structured observations about the actual output it produced (measured/observed values), never a bare pass/fail assertion.';
comment on column public.academy_visual_production_jobs.verification_report is 'Written by a DIFFERENT agent (Claude) that independently re-derives each check directly against the real committed file, without reading generation_self_check first. Never copies the generator''s self-report.';
comment on column public.academy_visual_production_jobs.verification_outcome is 'PASS: independent verification passed clean. CONFLICT: verification disagrees with generation_self_check on something specific. FAIL: verification failed outright (with or without a self-check to compare against). CONFLICT/FAIL both require an owner_decision before the row may advance or retry -- never automatic.';
comment on column public.academy_visual_production_jobs.owner_decision is 'Required before a CONFLICT/FAIL row may proceed. OVERRIDE_PROCEED: the flagged issue is not a real defect, advance anyway. AUTHORIZE_RETRY: real defect, allow exactly one more generation attempt. FIX_CHECKER: the verification logic itself was wrong, not the image -- route to fixing the check, not regenerating.';
