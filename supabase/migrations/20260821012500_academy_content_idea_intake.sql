-- AI-Agent: ChatGPT/Codex
-- Session: RRA content automation build
-- Purpose: Add simple owner idea intake to the shared Academy content production control plane.

alter table public.academy_content_projects
  add column if not exists owner_idea text,
  add column if not exists owner_notes text;

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
    'rra-content-dashboard-foundation',
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
