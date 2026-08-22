-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: RR Website — Academy lifecycle stage workspace

create table if not exists public.academy_stage_feedback (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.academy_content_projects(project_id) on update cascade on delete restrict,
  stage text not null,
  component_key text,
  feedback_type text not null default 'CHANGE_REQUEST' check (feedback_type in ('CHANGE_REQUEST','COMMENT','APPROVAL_NOTE')),
  note text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPLIED','BLOCKED','CLOSED')),
  requested_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_agent text,
  resolution_note text
);

create index if not exists academy_stage_feedback_project_stage_idx
  on public.academy_stage_feedback(project_id, stage, created_at desc);

alter table public.academy_stage_feedback enable row level security;

drop policy if exists academy_stage_feedback_admin_select on public.academy_stage_feedback;
create policy academy_stage_feedback_admin_select on public.academy_stage_feedback
  for select to authenticated using (private.is_admin());

drop policy if exists academy_stage_feedback_admin_insert on public.academy_stage_feedback;
create policy academy_stage_feedback_admin_insert on public.academy_stage_feedback
  for insert to authenticated with check (private.is_admin());

drop policy if exists academy_stage_feedback_admin_update on public.academy_stage_feedback;
create policy academy_stage_feedback_admin_update on public.academy_stage_feedback
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

create or replace function public.submit_academy_stage_feedback(
  p_project_id text,
  p_stage text,
  p_component_key text,
  p_feedback_type text,
  p_note text
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if coalesce(trim(p_note),'') = '' then
    raise exception 'Feedback note is required';
  end if;
  if p_feedback_type not in ('CHANGE_REQUEST','COMMENT','APPROVAL_NOTE') then
    raise exception 'Unsupported feedback type';
  end if;
  insert into public.academy_stage_feedback(project_id,stage,component_key,feedback_type,note,requested_by)
  values(p_project_id,p_stage,nullif(trim(p_component_key),''),p_feedback_type,trim(p_note),auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.submit_academy_stage_feedback(text,text,text,text,text) to authenticated;
