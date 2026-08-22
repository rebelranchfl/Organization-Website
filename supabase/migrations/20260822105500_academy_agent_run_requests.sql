-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: RR Website — Run Agent Now v1

create table if not exists public.academy_agent_run_requests (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.academy_content_projects(project_id) on delete cascade,
  requested_stage text not null,
  requested_agent text not null,
  status text not null default 'PENDING' check (status in ('PENDING','RUNNING','COMPLETED','FAILED','CANCELLED')),
  requested_by uuid references auth.users(id),
  requested_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz,
  runner text,
  attempt_count integer not null default 0,
  base_commit_sha text,
  result_commit_sha text,
  result_summary text,
  error_message text,
  updated_at timestamptz not null default now()
);

create index if not exists academy_agent_run_requests_status_requested_idx
  on public.academy_agent_run_requests(status, requested_at);
create index if not exists academy_agent_run_requests_project_idx
  on public.academy_agent_run_requests(project_id, requested_at desc);

alter table public.academy_agent_run_requests enable row level security;

drop policy if exists academy_agent_run_requests_admin_select on public.academy_agent_run_requests;
create policy academy_agent_run_requests_admin_select
  on public.academy_agent_run_requests
  for select
  to authenticated
  using (private.is_admin());

grant select on public.academy_agent_run_requests to authenticated;

create table if not exists public.academy_agent_runner_state (
  runner_key text primary key,
  ready boolean not null default false,
  last_heartbeat timestamptz,
  last_checked_at timestamptz,
  last_error text,
  supported_stages text[] not null default array['PRODUCT_WORKING','VISUAL_PRODUCTION']::text[],
  updated_at timestamptz not null default now()
);

insert into public.academy_agent_runner_state(runner_key, ready, supported_stages)
values ('github-codex-v1', false, array['PRODUCT_WORKING','VISUAL_PRODUCTION']::text[])
on conflict (runner_key) do nothing;

alter table public.academy_agent_runner_state enable row level security;

drop policy if exists academy_agent_runner_state_admin_select on public.academy_agent_runner_state;
create policy academy_agent_runner_state_admin_select
  on public.academy_agent_runner_state
  for select
  to authenticated
  using (private.is_admin());

grant select on public.academy_agent_runner_state to authenticated;

create or replace function public.request_academy_agent_run(p_project_id text)
returns public.academy_agent_run_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.academy_content_projects;
  v_request public.academy_agent_run_requests;
  v_agent text;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;

  select * into v_project
  from public.academy_content_projects
  where project_id = p_project_id
  for update;

  if not found then
    raise exception 'Academy content project not found';
  end if;

  if v_project.owner_hold then
    raise exception 'Project is on owner hold';
  end if;

  if v_project.current_status <> 'AGENT_WORKING' then
    raise exception 'Run Agent Now is available only while an agent-owned stage is actively working';
  end if;

  if v_project.workflow_stage = 'PRODUCT_WORKING' then
    v_agent := 'RRA Product Design Agent';
  elsif v_project.workflow_stage = 'VISUAL_PRODUCTION' then
    v_agent := 'RRA Visual Production Agent';
  else
    raise exception 'Run Agent Now v1 does not yet support this stage';
  end if;

  if not exists (
    select 1
    from public.academy_agent_runner_state
    where runner_key = 'github-codex-v1'
      and ready = true
      and last_heartbeat > now() - interval '12 minutes'
      and v_project.workflow_stage = any(supported_stages)
  ) then
    raise exception 'Manual runner is not connected yet';
  end if;

  if exists (
    select 1 from public.academy_agent_run_requests
    where project_id = p_project_id and status in ('PENDING','RUNNING')
  ) then
    raise exception 'A manual run is already queued or running for this project';
  end if;

  insert into public.academy_agent_run_requests(
    project_id, requested_stage, requested_agent, requested_by
  ) values (
    v_project.project_id, v_project.workflow_stage, v_agent, auth.uid()
  )
  returning * into v_request;

  return v_request;
end;
$$;

grant execute on function public.request_academy_agent_run(text) to authenticated;
