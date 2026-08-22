-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: RR Website — Academy Late-Finding Control

create table if not exists public.academy_late_findings (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.academy_content_projects(project_id) on delete cascade,
  discovered_stage text not null,
  title text not null,
  finding_text text not null,
  why_it_matters text,
  source_reference text,
  discovered_by text not null default 'OWNER',
  status text not null default 'PENDING_OWNER' check (status in (
    'PENDING_OWNER','ROUTED','IN_PROGRESS','QUEUED_V2','SPIN_OFF_QUEUED','RESOLVED','CLOSED'
  )),
  owner_decision text check (owner_decision is null or owner_decision in (
    'SEND_BACK_NOW','ADD_CURRENT_VERSION','QUEUE_V2','SPIN_OFF_NEW_PROJECT'
  )),
  target_stage text,
  owner_note text,
  owner_decided_by uuid references auth.users(id),
  owner_decided_at timestamptz,
  routed_to_agent text,
  spawned_project_id text references public.academy_content_projects(project_id),
  resolution_note text,
  resolved_by_agent text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academy_late_findings_project_created_idx
  on public.academy_late_findings(project_id, created_at desc);
create index if not exists academy_late_findings_status_idx
  on public.academy_late_findings(status, created_at);
create index if not exists academy_late_findings_route_idx
  on public.academy_late_findings(owner_decision, target_stage, status);

alter table public.academy_late_findings enable row level security;

drop policy if exists academy_late_findings_admin_select on public.academy_late_findings;
create policy academy_late_findings_admin_select
  on public.academy_late_findings
  for select to authenticated
  using (private.is_admin());

drop policy if exists academy_late_findings_admin_insert on public.academy_late_findings;
create policy academy_late_findings_admin_insert
  on public.academy_late_findings
  for insert to authenticated
  with check (private.is_admin());

drop policy if exists academy_late_findings_admin_update on public.academy_late_findings;
create policy academy_late_findings_admin_update
  on public.academy_late_findings
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

grant select, insert, update on public.academy_late_findings to authenticated;
revoke delete on public.academy_late_findings from authenticated, anon;

create or replace function public.submit_academy_late_finding(
  p_project_id text,
  p_discovered_stage text,
  p_title text,
  p_finding_text text,
  p_why_it_matters text default null,
  p_source_reference text default null
)
returns public.academy_late_findings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.academy_late_findings;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if nullif(btrim(p_title),'') is null or nullif(btrim(p_finding_text),'') is null then
    raise exception 'Title and finding are required';
  end if;
  if not exists (select 1 from public.academy_content_projects where project_id=p_project_id) then
    raise exception 'Academy project not found';
  end if;

  insert into public.academy_late_findings(
    project_id, discovered_stage, title, finding_text, why_it_matters,
    source_reference, discovered_by
  ) values (
    p_project_id, coalesce(nullif(btrim(p_discovered_stage),''),'UNKNOWN'), btrim(p_title),
    btrim(p_finding_text), nullif(btrim(p_why_it_matters),''),
    nullif(btrim(p_source_reference),''), 'OWNER'
  ) returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.submit_academy_late_finding(text,text,text,text,text,text) to authenticated;

create or replace function public.set_academy_late_finding_owner_decision(
  p_finding_id uuid,
  p_decision text,
  p_target_stage text default null,
  p_owner_note text default null
)
returns public.academy_late_findings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_finding public.academy_late_findings;
  v_project public.academy_content_projects;
  v_route_stage text;
  v_agent text;
  v_label text;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_decision not in ('SEND_BACK_NOW','ADD_CURRENT_VERSION','QUEUE_V2','SPIN_OFF_NEW_PROJECT') then
    raise exception 'Invalid late-finding decision';
  end if;

  select * into v_finding
  from public.academy_late_findings
  where id=p_finding_id
  for update;
  if not found then raise exception 'Late finding not found'; end if;
  if v_finding.status not in ('PENDING_OWNER','ROUTED','QUEUED_V2','SPIN_OFF_QUEUED') then
    raise exception 'This finding is already being worked or resolved';
  end if;

  select * into v_project
  from public.academy_content_projects
  where project_id=v_finding.project_id
  for update;
  if not found then raise exception 'Academy project not found'; end if;

  if p_decision='ADD_CURRENT_VERSION' then
    if v_project.workflow_stage in ('RESEARCH_WORKING','RESEARCH_REVIEW') then
      v_route_stage := 'RESEARCH_WORKING';
    elsif v_project.workflow_stage in ('PRODUCT_OPPORTUNITY_RESEARCH','PRODUCT_WORKING','PRODUCT_REVIEW') then
      v_route_stage := 'PRODUCT_WORKING';
    elsif v_project.workflow_stage in ('VISUAL_PRODUCTION','FINAL_PRODUCT_REVIEW') then
      v_route_stage := 'VISUAL_PRODUCTION';
    else
      raise exception 'The current lifecycle stage cannot accept a current-version finding';
    end if;
  elsif p_decision='SEND_BACK_NOW' then
    if p_target_stage not in ('RESEARCH_WORKING','PRODUCT_WORKING','VISUAL_PRODUCTION') then
      raise exception 'Choose Research, Product Design, or Visual Production for Send Back Now';
    end if;
    v_route_stage := p_target_stage;
  end if;

  if v_route_stage='RESEARCH_WORKING' then
    v_agent := 'RRA Content Agent';
    v_label := 'Research';
  elsif v_route_stage='PRODUCT_WORKING' then
    v_agent := 'RRA Product Design Agent';
    v_label := 'Product Design';
  elsif v_route_stage='VISUAL_PRODUCTION' then
    v_agent := 'RRA Visual Production Agent';
    v_label := 'Visual Production';
  end if;

  if p_decision in ('ADD_CURRENT_VERSION','SEND_BACK_NOW') then
    update public.academy_content_projects
    set workflow_stage=v_route_stage,
        current_status='AGENT_WORKING',
        owner_review_status=null,
        latest_owner_comment=coalesce(nullif(btrim(p_owner_note),''),v_finding.title),
        progress_percent=case
          when p_decision='SEND_BACK_NOW' then least(coalesce(progress_percent,0),75)
          else least(coalesce(progress_percent,0),90)
        end,
        progress_stage=v_label || ' — Late Finding',
        progress_detail='Late finding routed: ' || v_finding.title,
        progress_next=v_agent || ': resolve the routed late finding and preserve the owner decision in the finding record.',
        progress_updated_at=now(),
        last_synced_at=now(),
        updated_at=now()
    where project_id=v_finding.project_id;
  end if;

  update public.academy_late_findings
  set owner_decision=p_decision,
      target_stage=v_route_stage,
      owner_note=nullif(btrim(p_owner_note),''),
      owner_decided_by=auth.uid(),
      owner_decided_at=now(),
      routed_to_agent=case
        when p_decision in ('ADD_CURRENT_VERSION','SEND_BACK_NOW') then v_agent
        when p_decision='SPIN_OFF_NEW_PROJECT' then 'RRA Content Agent'
        else null
      end,
      status=case
        when p_decision in ('ADD_CURRENT_VERSION','SEND_BACK_NOW') then 'ROUTED'
        when p_decision='QUEUE_V2' then 'QUEUED_V2'
        when p_decision='SPIN_OFF_NEW_PROJECT' then 'SPIN_OFF_QUEUED'
      end,
      updated_at=now()
  where id=p_finding_id
  returning * into v_finding;

  return v_finding;
end;
$$;

grant execute on function public.set_academy_late_finding_owner_decision(uuid,text,text,text) to authenticated;
