-- AI-Agent: Claude (Claude Code)
-- Session: RRA end-to-end pipeline verification (owner-requested, RRA-2026-0011 test)
-- Purpose: Fix a verified backend defect found while manually walking a test project
--   through the Academy pipeline for reactivation verification (content-automation.md
--   Section 19).
--
-- Defect: create_academy_content_idea() hardcoded github_branch to
--   'rra-content-dashboard-foundation' for every newly created idea. That branch is a
--   frozen snapshot from 2026-08-21/22 -- roughly 900 files behind main -- and was never
--   the destination for any Academy content project actually produced since. Every
--   project that reached real production (RRA-2026-0002 through RRA-2026-0009) has
--   github_branch = 'main'. A worker trusting the stored value for a brand-new idea
--   (RRA-2026-0010, RRA-2026-0011) would look for/write project files on dead ground,
--   which is consistent with the owner-reported symptom of the system appearing to work
--   while downstream state did not reflect reality.
--
-- Fix: default new ideas to 'main', matching the branch every real production project
--   actually uses. This does not change any existing row; RRA-2026-0010 and
--   RRA-2026-0011 are corrected separately with an explicit UPDATE tied to the actual
--   branch each was worked on.

create or replace function public.create_academy_content_idea(
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
    1,
    btrim(p_idea),
    nullif(btrim(coalesce(p_owner_notes, '')), ''),
    'PENDING',
    null
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_academy_content_idea(text, text) from public;
grant execute on function public.create_academy_content_idea(text, text) to authenticated;
