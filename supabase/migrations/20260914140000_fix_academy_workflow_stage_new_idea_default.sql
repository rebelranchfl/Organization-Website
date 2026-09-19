-- AI-Agent: Claude (Claude Code)
-- Session: RRA end-to-end pipeline verification (owner-requested, RRA-2026-0011 test)
-- Purpose: Fix the actual root cause of a real, reproduced owner-facing failure: a
--   freshly created Academy idea has no working Approve / Needs More Work / Reject
--   control anywhere in the dashboard, no matter how much work is done on it.
--
-- Root cause, confirmed live against project dfrwxpuojeiykaignyny:
--   1. public.academy_content_projects.workflow_stage has DEFAULT 'RESEARCH_WORKING'.
--      A brand-new NEW_IDEA project has done zero research, but is stamped as if
--      research were already in progress.
--   2. create_academy_content_idea() (20260821012500_academy_content_idea_intake.sql)
--      never sets workflow_stage, progress_percent, progress_stage, progress_detail,
--      or progress_next on insert -- it only sets the older documented current_status
--      field. Every new idea silently inherits the wrong default above.
--   3. The dashboard's owner-decision buttons (academy-stage-review.js, function
--      review()) only render when workflow_stage is one of RESEARCH_REVIEW /
--      PRODUCT_REVIEW / FINAL_PRODUCT_REVIEW *and* matches the page being viewed.
--      submit_academy_stage_review() independently enforces the same equality
--      (`if v_project.workflow_stage <> p_review_stage then raise exception
--      'Review gate mismatch'`).
--
-- Net effect: nothing ever moves workflow_stage off its wrong default for a
-- newly created idea, so the real owner-decision controls never appear and never
-- would, however much research/content work an agent completes and however the
-- documented current_status field is updated -- exactly the "I can't find anything
-- to click" symptom reported against RRA-2026-0011.
--
-- This is the two-schema-fork problem in concrete form: ACADEMY-CONTENT-PROJECT-SCHEMA.md
-- documents current_status as the whole picture; the actually-deployed dashboard
-- (per ACADEMY-PRODUCT-PHASE-WORKFLOW-EXTENSION.md) runs on the separate, more granular
-- workflow_stage/progress_* fields; the only idea-intake path in the repository only
-- knows about the first one.

-- Correct the column default so a brand-new row is honest about its own state.
ALTER TABLE public.academy_content_projects
  ALTER COLUMN workflow_stage SET DEFAULT 'IDEA';

-- Backfill: RRA-2026-0010 and RRA-2026-0011 are the only two rows ever created through
-- create_academy_content_idea() (verified live). Both inherited the wrong
-- 'RESEARCH_WORKING' default at creation and neither had workflow_stage corrected since.
-- RRA-2026-0010 is still genuinely mid-research (current_status = AGENT_WORKING), so
-- 'RESEARCH_WORKING' is actually correct for it independent of the default bug -- left
-- untouched here. RRA-2026-0011 is handled explicitly by name in a separate statement
-- below (advanced to RESEARCH_REVIEW, not just IDEA) rather than through this default,
-- since real research work has already been produced for it in this session.

-- Make idea intake explicit and self-consistent instead of relying on column defaults
-- that a future schema change could silently drift again.
CREATE OR REPLACE FUNCTION public.create_academy_content_idea(
  p_idea text,
  p_owner_notes text default null
)
returns public.academy_content_projects
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_year text := to_char(current_date, 'YYYY');
  v_next integer;
  v_project_id text;
  v_row public.academy_content_projects;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if nullif(btrim(p_idea), '') is null then
    raise exception 'Idea is required';
  end if;

  perform pg_advisory_xact_lock(hashtext('rra-content-project-id-' || v_year));

  select coalesce(max(substring(project_id from 'RRA-' || v_year || '-([0-9]{4})')::integer), 0) + 1
    into v_next
  from public.academy_content_projects
  where project_id like 'RRA-' || v_year || '-____';

  v_project_id := 'RRA-' || v_year || '-' || lpad(v_next::text, 4, '0');

  insert into public.academy_content_projects (
    project_id,
    github_branch,
    github_path,
    title,
    learning_area,
    current_status,
    workflow_stage,
    progress_percent,
    progress_stage,
    progress_detail,
    progress_next,
    progress_updated_at,
    revision_number,
    owner_idea,
    owner_notes,
    owner_review_status,
    last_synced_at
  ) values (
    v_project_id,
    'main',
    '',
    btrim(p_idea),
    'Unassigned',
    'NEW_IDEA',
    'IDEA',
    0,
    'Idea + Context',
    'Owner-submitted idea. No agent has claimed this project yet.',
    'Awaiting an authorized worker to begin Context Review and Research.',
    now(),
    1,
    btrim(p_idea),
    nullif(btrim(coalesce(p_owner_notes, '')), ''),
    'PENDING',
    now()
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_academy_content_idea(text, text) from public;
grant execute on function public.create_academy_content_idea(text, text) to authenticated;
