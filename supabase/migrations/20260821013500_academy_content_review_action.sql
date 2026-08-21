-- AI-Agent: ChatGPT/Codex
-- Session: RRA content automation build
-- Purpose: Make owner Academy content review decisions atomic and auditable.

create or replace function public.submit_academy_content_review(
  p_project_id text,
  p_decision text,
  p_comment text default null,
  p_source_decisions jsonb default '{}'::jsonb
)
returns public.academy_content_projects
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_project public.academy_content_projects;
  v_status text;
  v_review_status text;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if p_decision not in ('APPROVE', 'NEEDS_MORE_WORK', 'REJECT') then
    raise exception 'Invalid review decision';
  end if;

  select * into v_project
  from public.academy_content_projects
  where project_id = p_project_id
  for update;

  if not found then
    raise exception 'Academy content project not found';
  end if;

  if v_project.current_status <> 'READY_FOR_REVIEW' then
    raise exception 'Project is not ready for owner review';
  end if;

  if p_decision = 'APPROVE' then
    v_status := 'APPROVED';
    v_review_status := 'APPROVED';
  elsif p_decision = 'NEEDS_MORE_WORK' then
    v_status := 'NEEDS_MORE_WORK';
    v_review_status := 'NEEDS_MORE_WORK';
  else
    v_status := 'REJECTED';
    v_review_status := 'REJECTED';
  end if;

  insert into public.academy_content_review_events (
    project_id,
    revision_number,
    decision,
    comment,
    source_decisions,
    reviewer_user_id
  ) values (
    v_project.project_id,
    v_project.revision_number,
    p_decision,
    nullif(btrim(coalesce(p_comment, '')), ''),
    coalesce(p_source_decisions, '{}'::jsonb),
    auth.uid()
  );

  update public.academy_content_projects
  set current_status = v_status,
      owner_review_status = v_review_status,
      latest_owner_comment = nullif(btrim(coalesce(p_comment, '')), '')
  where project_id = v_project.project_id
  returning * into v_project;

  return v_project;
end;
$$;

revoke all on function public.submit_academy_content_review(text, text, text, jsonb) from public;
grant execute on function public.submit_academy_content_review(text, text, text, jsonb) to authenticated;
