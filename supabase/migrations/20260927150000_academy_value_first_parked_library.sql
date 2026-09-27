-- AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
-- Applied to project dfrwxpuojeiykaignyny via Supabase migration "academy_value_first_parked_library".
-- Academy back office restructure (owner decisions 2026-09-27)
-- 1. Value-first stage order: Idea -> Product Opportunity -> Automatic Value Screen -> Research.
-- 2. Parked control (owner_hold + archived) with one owner RPC.
-- 3. Owner-facing plain-language summary field.
-- 4. Interaction & Assessment Library with usage log.
-- Additive only. No existing rows are deleted or re-staged.

-- ---------------------------------------------------------------
-- Stage constraint: add IDEA (already the column default and the
-- value create_academy_content_idea inserts, but missing from the
-- check) and VALUE_SCREEN_REVIEW (borderline value screen results).
-- ---------------------------------------------------------------
alter table public.academy_content_projects
  drop constraint if exists academy_content_projects_workflow_stage_check;
alter table public.academy_content_projects
  add constraint academy_content_projects_workflow_stage_check
  check (workflow_stage = any (array[
    'IDEA','PRODUCT_OPPORTUNITY_RESEARCH','VALUE_SCREEN_REVIEW',
    'RESEARCH_WORKING','RESEARCH_REVIEW',
    'PRODUCT_WORKING','PRODUCT_REVIEW',
    'VISUAL_PRODUCTION','FINAL_PRODUCT_REVIEW',
    'AWAITING_RELEASE','APPROVED_AWAITING_RELEASE','PUBLISHING','LIVE','REJECTED'
  ]));

-- ---------------------------------------------------------------
-- New project fields
-- ---------------------------------------------------------------
alter table public.academy_content_projects
  add column if not exists owner_summary text,
  add column if not exists projected_revenue numeric;

comment on column public.academy_content_projects.owner_summary is
  'Plain-language line for the owner: what is ready and what is being asked. Agents write this alongside the technical progress_detail.';
comment on column public.academy_content_projects.projected_revenue is
  'Projected revenue set during Research & Value (value screen). Null = not set.';

-- ---------------------------------------------------------------
-- Automatic value screen log
-- ---------------------------------------------------------------
create table if not exists public.academy_value_screens (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.academy_content_projects(project_id),
  revision_number integer,
  recommendation text not null check (recommendation in (
    'PURSUE_NOW','PURSUE_LATER','INCORPORATE_BUNDLE','FREE_RESOURCE','MONITOR','NOT_RECOMMENDED_OWNER_REVIEW')),
  demand_score smallint not null check (demand_score between 0 and 5),
  mission_value_score smallint check (mission_value_score between 0 and 5),
  marketability_score smallint check (marketability_score between 0 and 5),
  implementation_value_score smallint check (implementation_value_score between 0 and 5),
  evidence_readiness_score smallint check (evidence_readiness_score between 0 and 5),
  cross_academy_score smallint check (cross_academy_score between 0 and 5),
  production_effort_score smallint check (production_effort_score between 0 and 5),
  overlap_risk_score smallint check (overlap_risk_score between 0 and 5),
  confidence_score smallint not null check (confidence_score between 0 and 5),
  proposed_price numeric,
  projected_revenue numeric,
  competitor_summary text,
  format_recommendation text,
  future_format_note text,
  distribution text not null default 'Academy website',
  rationale text not null,
  routed_to text not null check (routed_to in ('RESEARCH','PARKED','OWNER_REVIEW')),
  routed_reason text not null,
  owner_decision text check (owner_decision in ('PROCEED','PARK','REJECT')),
  owner_note text,
  owner_decided_at timestamptz,
  screened_by text,
  created_at timestamptz not null default now()
);
create index if not exists academy_value_screens_project_idx on public.academy_value_screens(project_id, created_at desc);
alter table public.academy_value_screens enable row level security;
drop policy if exists academy_value_screens_admin_select on public.academy_value_screens;
create policy academy_value_screens_admin_select on public.academy_value_screens
  for select to authenticated using ((select private.is_admin()));
grant select on public.academy_value_screens to authenticated;
grant all on public.academy_value_screens to service_role;

comment on table public.academy_value_screens is
  'Every automatic value screen result and its routing. Thresholds (owner-approved 2026-09-27): confidence<=2 or NOT_RECOMMENDED -> owner review; PURSUE_NOW with demand>=3 -> Research; FREE_RESOURCE/INCORPORATE_BUNDLE -> Research on that path; PURSUE_LATER/MONITOR -> Parked; anything else -> owner review.';

-- Records a value screen and routes the project. Callable by an admin or the service role (agents).
create or replace function public.record_academy_value_screen(
  p_project_id text,
  p_recommendation text,
  p_scores jsonb,
  p_rationale text,
  p_proposed_price numeric default null,
  p_projected_revenue numeric default null,
  p_competitor_summary text default null,
  p_format_recommendation text default null,
  p_future_format_note text default null,
  p_distribution text default 'Academy website',
  p_screened_by text default null
) returns public.academy_value_screens
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_project public.academy_content_projects;
  v_screen public.academy_value_screens;
  v_demand smallint := (p_scores->>'demand')::smallint;
  v_conf smallint := (p_scores->>'confidence')::smallint;
  v_route text;
  v_reason text;
begin
  if not (private.is_admin() or coalesce(auth.jwt()->>'role','') = 'service_role') then
    raise exception 'Administrator or service access required';
  end if;
  if v_demand is null or v_conf is null then
    raise exception 'Scores must include demand and confidence (0-5)';
  end if;
  if nullif(btrim(coalesce(p_rationale,'')),'') is null then
    raise exception 'A plain-language rationale is required';
  end if;

  select * into v_project from public.academy_content_projects where project_id = p_project_id for update;
  if not found then raise exception 'Academy content project not found'; end if;
  if v_project.workflow_stage not in ('IDEA','PRODUCT_OPPORTUNITY_RESEARCH') then
    raise exception 'Value screen runs only after Product Opportunity (project is at %)', v_project.workflow_stage;
  end if;

  -- Owner-approved starting thresholds (2026-09-27)
  if v_conf <= 2 then
    v_route := 'OWNER_REVIEW'; v_reason := 'Confidence is 2 or lower, so this comes to you.';
  elsif p_recommendation = 'NOT_RECOMMENDED_OWNER_REVIEW' then
    v_route := 'OWNER_REVIEW'; v_reason := 'The screen does not recommend this, so this comes to you.';
  elsif p_recommendation = 'PURSUE_NOW' and v_demand >= 3 then
    v_route := 'RESEARCH'; v_reason := 'Pursue now with demand 3+ and confidence 3+.';
  elsif p_recommendation in ('FREE_RESOURCE','INCORPORATE_BUNDLE') then
    v_route := 'RESEARCH'; v_reason := 'Value is real on the ' || replace(lower(p_recommendation),'_',' ') || ' path.';
  elsif p_recommendation in ('PURSUE_LATER','MONITOR') then
    v_route := 'PARKED'; v_reason := 'Screened as ' || replace(lower(p_recommendation),'_',' ') || '; parked with this reason.';
  else
    v_route := 'OWNER_REVIEW'; v_reason := 'Borderline: pursue now but demand is below 3.';
  end if;

  insert into public.academy_value_screens(
    project_id, revision_number, recommendation,
    demand_score, mission_value_score, marketability_score, implementation_value_score,
    evidence_readiness_score, cross_academy_score, production_effort_score, overlap_risk_score, confidence_score,
    proposed_price, projected_revenue, competitor_summary, format_recommendation, future_format_note,
    distribution, rationale, routed_to, routed_reason, screened_by
  ) values (
    v_project.project_id, v_project.revision_number, p_recommendation,
    v_demand, (p_scores->>'mission_value')::smallint, (p_scores->>'marketability')::smallint,
    (p_scores->>'implementation_value')::smallint, (p_scores->>'evidence_readiness')::smallint,
    (p_scores->>'cross_academy')::smallint, (p_scores->>'production_effort')::smallint,
    (p_scores->>'overlap_risk')::smallint, v_conf,
    p_proposed_price, p_projected_revenue, p_competitor_summary, p_format_recommendation, p_future_format_note,
    coalesce(nullif(btrim(p_distribution),''),'Academy website'), btrim(p_rationale), v_route, v_reason,
    coalesce(p_screened_by, case when private.is_admin() then 'OWNER' else 'AGENT' end)
  ) returning * into v_screen;

  update public.academy_content_projects set
    proposed_price = coalesce(p_proposed_price, proposed_price),
    projected_revenue = coalesce(p_projected_revenue, projected_revenue),
    workflow_stage = case v_route when 'RESEARCH' then 'RESEARCH_WORKING'
                                  when 'OWNER_REVIEW' then 'VALUE_SCREEN_REVIEW'
                                  else 'PRODUCT_OPPORTUNITY_RESEARCH' end,
    current_status = case v_route when 'RESEARCH' then 'APPROVED'
                                  when 'OWNER_REVIEW' then 'READY_FOR_REVIEW'
                                  else current_status end,
    owner_hold = case when v_route = 'PARKED' then true else owner_hold end,
    progress_stage = case v_route when 'RESEARCH' then 'Research — Authorized by value screen'
                                  when 'OWNER_REVIEW' then 'Value Screen — Owner review'
                                  else 'Parked by value screen' end,
    progress_detail = v_reason,
    owner_summary = case v_route
      when 'RESEARCH' then 'Passed the value screen. Research is next.'
      when 'OWNER_REVIEW' then 'Value screen is borderline. Decide: go to research, park, or reject.'
      else 'Parked by the value screen: ' || v_reason end,
    progress_next = case v_route when 'OWNER_REVIEW' then 'Owner decides: proceed, park, or reject.'
                                 when 'RESEARCH' then 'Begin Research through an authorized, verified execution path.'
                                 else 'Resume from the Parked list when the timing is right.' end,
    progress_percent = 0,
    progress_updated_at = now(),
    updated_at = now()
  where project_id = v_project.project_id;

  return v_screen;
end;
$$;
revoke all on function public.record_academy_value_screen(text,text,jsonb,text,numeric,numeric,text,text,text,text,text) from public, anon;
grant execute on function public.record_academy_value_screen(text,text,jsonb,text,numeric,numeric,text,text,text,text,text) to authenticated, service_role;

-- Owner decision on a borderline value screen.
create or replace function public.decide_academy_value_screen(
  p_project_id text, p_decision text, p_note text default null
) returns public.academy_content_projects
language plpgsql
set search_path to ''
as $$
declare
  v_project public.academy_content_projects;
  v_note text := nullif(btrim(coalesce(p_note,'')),'');
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('PROCEED','PARK','REJECT') then raise exception 'Invalid decision'; end if;
  if p_decision = 'REJECT' and v_note is null then raise exception 'Add a note explaining the rejection'; end if;

  select * into v_project from public.academy_content_projects where project_id = p_project_id for update;
  if not found then raise exception 'Academy content project not found'; end if;
  if v_project.workflow_stage <> 'VALUE_SCREEN_REVIEW' then
    raise exception 'Project is not waiting on a value screen decision';
  end if;

  update public.academy_value_screens
     set owner_decision = p_decision, owner_note = v_note, owner_decided_at = now()
   where id = (select id from public.academy_value_screens where project_id = p_project_id order by created_at desc limit 1);

  update public.academy_content_projects set
    workflow_stage = case p_decision when 'PROCEED' then 'RESEARCH_WORKING'
                                     when 'PARK' then 'PRODUCT_OPPORTUNITY_RESEARCH'
                                     else 'REJECTED' end,
    current_status = case p_decision when 'PROCEED' then 'APPROVED'
                                     when 'PARK' then 'NEEDS_MORE_WORK'
                                     else 'REJECTED' end,
    owner_hold = case when p_decision = 'PARK' then true else owner_hold end,
    latest_owner_comment = v_note,
    progress_stage = case p_decision when 'PROCEED' then 'Research — Authorized by owner'
                                     when 'PARK' then 'Parked by owner at value screen'
                                     else 'Rejected at value screen' end,
    progress_detail = coalesce(v_note, 'Owner decision at value screen.'),
    owner_summary = case p_decision when 'PROCEED' then 'You sent this to research.'
                                    when 'PARK' then 'You parked this at the value screen.'
                                    else 'You rejected this at the value screen.' end,
    progress_updated_at = now(), updated_at = now()
  where project_id = p_project_id
  returning * into v_project;
  return v_project;
end;
$$;
revoke all on function public.decide_academy_value_screen(text,text,text) from public, anon;
grant execute on function public.decide_academy_value_screen(text,text,text) to authenticated;

-- ---------------------------------------------------------------
-- Parked control: one switch for owner_hold + archived
-- ---------------------------------------------------------------
create or replace function public.set_academy_project_parked(
  p_project_id text, p_parked boolean, p_note text default null
) returns public.academy_content_projects
language plpgsql
set search_path to ''
as $$
declare v_project public.academy_content_projects;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  update public.academy_content_projects set
    owner_hold = p_parked,
    archived = p_parked,
    owner_queue_note = case when p_note is not null then nullif(btrim(p_note),'') else owner_queue_note end,
    updated_at = now()
  where project_id = p_project_id
  returning * into v_project;
  if v_project.project_id is null then raise exception 'Academy content project not found'; end if;
  return v_project;
end;
$$;
revoke all on function public.set_academy_project_parked(text,boolean,text) from public, anon;
grant execute on function public.set_academy_project_parked(text,boolean,text) to authenticated;

-- ---------------------------------------------------------------
-- Research Review approval: value-first projects skip the old
-- post-research Product Opportunity stage. Projects without a
-- value screen (legacy) keep the old path so pricing still happens.
-- ---------------------------------------------------------------
create or replace function public.submit_academy_stage_review(
  p_project_id text, p_review_stage text, p_decision text,
  p_comment text default null, p_source_decisions jsonb default '{}'::jsonb
) returns public.academy_content_projects
language plpgsql
set search_path to ''
as $function$
declare
  v_project public.academy_content_projects;
  v_comment text;
  v_next_stage text;
  v_status text;
  v_review_status text;
  v_progress_stage text;
  v_progress_detail text;
  v_progress_next text;
  v_has_screen boolean;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_review_stage not in ('RESEARCH_REVIEW','PRODUCT_REVIEW','FINAL_PRODUCT_REVIEW') then
    raise exception 'Invalid review stage';
  end if;
  if p_decision not in ('APPROVE','NEEDS_MORE_WORK','REJECT') then
    raise exception 'Invalid review decision';
  end if;
  v_comment := nullif(btrim(coalesce(p_comment,'')), '');
  if p_decision in ('NEEDS_MORE_WORK','REJECT') and v_comment is null then
    raise exception 'A review comment is required for this decision';
  end if;

  select * into v_project from public.academy_content_projects where project_id = p_project_id for update;
  if not found then raise exception 'Academy content project not found'; end if;
  if v_project.current_status <> 'READY_FOR_REVIEW' then
    raise exception 'Project is not ready for owner review';
  end if;
  if v_project.workflow_stage <> p_review_stage then
    raise exception 'Review gate mismatch: project is at %, not %', v_project.workflow_stage, p_review_stage;
  end if;

  if p_decision = 'APPROVE' then
    v_status := 'APPROVED';
    v_review_status := 'APPROVED';
    if p_review_stage = 'RESEARCH_REVIEW' then
      select exists(select 1 from public.academy_value_screens s
                     where s.project_id = v_project.project_id
                       and (s.routed_to = 'RESEARCH' or s.owner_decision = 'PROCEED'))
        into v_has_screen;
      if v_has_screen then
        v_next_stage := 'PRODUCT_WORKING';
        v_progress_stage := 'Product Design — Authorized';
        v_progress_detail := 'The owner approved the Research Foundation. Value was already screened before research, so Product Design is next. No worker is implied to be running by this approval.';
        v_progress_next := 'Begin Product Design only through an authorized, verified execution path.';
      else
        v_next_stage := 'PRODUCT_OPPORTUNITY_RESEARCH';
        v_progress_stage := 'Product Opportunity Research — Authorized';
        v_progress_detail := 'The owner approved the Research Foundation. This project predates the value-first order, so Product Opportunity Research is the next authorized stage. No worker is implied to be running by this approval.';
        v_progress_next := 'Begin Product Opportunity Research only through an authorized, verified execution path.';
      end if;
    elsif p_review_stage = 'PRODUCT_REVIEW' then
      v_next_stage := 'VISUAL_PRODUCTION';
      v_progress_stage := 'Visual Production — Authorized';
      v_progress_detail := 'The owner approved Product Design. Visual / learner-experience production is the next authorized stage. No public release is authorized and no worker is implied to be running by this approval.';
      v_progress_next := 'Begin Visual Production only through an authorized, verified execution path; complete rendered QA before Final Product Review.';
    else
      v_next_stage := 'FINAL_PRODUCT_REVIEW';
      v_progress_stage := 'Final Product Approved — Not Released';
      v_progress_detail := 'The owner approved the actual Final Product revision. The product is accepted but remains unreleased.';
      v_progress_next := 'Release Prep may begin as a separate controlled step. Publication still requires a separate Owner Release Decision and live verification.';
    end if;
  elsif p_decision = 'NEEDS_MORE_WORK' then
    v_status := 'NEEDS_MORE_WORK';
    v_review_status := 'NEEDS_MORE_WORK';
    if p_review_stage = 'RESEARCH_REVIEW' then
      v_next_stage := 'RESEARCH_WORKING';
      v_progress_stage := 'Research — Owner Return';
      v_progress_detail := 'The owner returned the Research Foundation for more work.';
      v_progress_next := v_comment;
    elsif p_review_stage = 'PRODUCT_REVIEW' then
      v_next_stage := 'PRODUCT_WORKING';
      v_progress_stage := 'Product Design — Owner Return';
      v_progress_detail := 'The owner returned Product Design for more work.';
      v_progress_next := v_comment;
    else
      v_next_stage := 'VISUAL_PRODUCTION';
      v_progress_stage := 'Visual Production — Owner Return';
      v_progress_detail := 'The owner returned the learner-facing product for visual / delivery correction. A deeper return to Product Design or Research requires an explicit stage-specific control action rather than being guessed from a generic Needs More Work decision.';
      v_progress_next := v_comment;
    end if;
  else
    v_status := 'REJECTED';
    v_review_status := 'REJECTED';
    v_next_stage := 'REJECTED';
    v_progress_stage := 'Rejected — Owner Decision';
    v_progress_detail := 'The owner rejected the current reviewed direction. Forward movement is stopped and the history is preserved.';
    v_progress_next := v_comment;
  end if;

  insert into public.academy_content_review_events(
    project_id, revision_number, review_stage, decision, comment, source_decisions,
    reviewer_user_id, processed_at, processed_by_agent
  ) values (
    v_project.project_id, v_project.revision_number, p_review_stage, p_decision, v_comment,
    case when p_review_stage = 'RESEARCH_REVIEW' then coalesce(p_source_decisions,'{}'::jsonb) else '{}'::jsonb end,
    auth.uid(), now(), 'ACADEMY_CONTROL_PLANE'
  );

  update public.academy_content_projects
     set current_status = v_status,
         workflow_stage = v_next_stage,
         owner_review_status = v_review_status,
         latest_owner_comment = v_comment,
         progress_percent = case when p_decision = 'APPROVE' and p_review_stage = 'FINAL_PRODUCT_REVIEW' then 100 else 0 end,
         progress_stage = v_progress_stage,
         progress_detail = v_progress_detail,
         progress_next = v_progress_next,
         owner_summary = null,
         progress_updated_at = now(),
         last_synced_at = now(),
         updated_at = now()
   where project_id = v_project.project_id
   returning * into v_project;

  return v_project;
end;
$function$;

-- ---------------------------------------------------------------
-- Interaction & Assessment Library
-- ---------------------------------------------------------------
create table if not exists public.academy_interaction_types (
  id uuid primary key default gen_random_uuid(),
  type_key text not null unique,
  name text not null,
  learner_action text not null,
  seems_to_fit text,
  fit_notes text,
  source text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.academy_interaction_uses (
  id uuid primary key default gen_random_uuid(),
  type_id uuid not null references public.academy_interaction_types(id),
  project_id text not null references public.academy_content_projects(project_id),
  stage text,
  usage_note text,
  fit_rating smallint check (fit_rating between 1 and 5),
  fit_note text,
  recorded_by text,
  created_at timestamptz not null default now(),
  unique (type_id, project_id)
);
create index if not exists academy_interaction_uses_project_idx on public.academy_interaction_uses(project_id);

alter table public.academy_interaction_types enable row level security;
alter table public.academy_interaction_uses enable row level security;
drop policy if exists academy_interaction_types_admin_all on public.academy_interaction_types;
create policy academy_interaction_types_admin_all on public.academy_interaction_types
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists academy_interaction_uses_admin_all on public.academy_interaction_uses;
create policy academy_interaction_uses_admin_all on public.academy_interaction_uses
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
grant select, insert, update, delete on public.academy_interaction_types, public.academy_interaction_uses to authenticated;
grant all on public.academy_interaction_types, public.academy_interaction_uses to service_role;

create or replace view public.academy_interaction_library
with (security_invoker = true) as
select t.id, t.type_key, t.name, t.learner_action, t.seems_to_fit, t.fit_notes, t.source, t.active,
       count(u.id)::int as times_used,
       max(u.created_at) as last_used_at,
       round(avg(u.fit_rating)::numeric, 1) as avg_fit,
       coalesce(array_agg(u.project_id order by u.created_at) filter (where u.id is not null), '{}') as used_in
  from public.academy_interaction_types t
  left join public.academy_interaction_uses u on u.type_id = t.id
 group by t.id;
grant select on public.academy_interaction_library to authenticated;

-- Seed: activity types from RRA-EDUCATIONAL-METHOD.md "Practical Application",
-- plus interactions already built into projects.
insert into public.academy_interaction_types (type_key, name, learner_action, seems_to_fit, source) values
  ('worksheet-planner','Worksheet / planner','Fills in their own plan','Home systems, cost planning','Know Your Water product design'),
  ('comparator','Comparator','Compares options side by side','Tool or method choices','Know Your Water product design; RRA-EDUCATIONAL-METHOD.md (comparison of tools or methods)'),
  ('branching-guide','Branching guide','Follows a path based on their answer or result','Troubleshooting, test results','Know Your Water product design'),
  ('multiple-choice','Multiple-choice check','Picks one or more answers','Concept checks','Water Through the Layers'),
  ('calculation','Calculation / measurement','Works a number (flow, cost, capacity) or measures something','Water, gravity, budgets','RRA-EDUCATIONAL-METHOD.md'),
  ('scenario','Scenario / simulation','Decides what to do in a situation','Judgment, safety, bias','RRA-EDUCATIONAL-METHOD.md'),
  ('source-comparison','Source comparison','Weighs sources on the same claim','Fact, opinion & bias','RRA-EDUCATIONAL-METHOD.md'),
  ('troubleshooting','Troubleshooting','Finds the fault in a broken system','Waterers, filters, plumbing','RRA-EDUCATIONAL-METHOD.md'),
  ('build-make','Hands-on build','Builds or makes something real','Farm and land skills','RRA-EDUCATIONAL-METHOD.md'),
  ('field-observation','Observation / field activity','Observes or records something in the real world','Farm and land skills','RRA-EDUCATIONAL-METHOD.md'),
  ('demonstration','Demonstration','Watches a process shown step by step','Processes, safety','RRA-EDUCATIONAL-METHOD.md'),
  ('experiment-lab','Experiment / lab','Tests something and records the result','Water, soil, science','RRA-EDUCATIONAL-METHOD.md'),
  ('design-exercise','Design exercise','Designs a solution to a stated need','Systems, planning','RRA-EDUCATIONAL-METHOD.md'),
  ('real-system-analysis','Real-system analysis','Examines how an actual system works','Utilities, finance, households','RRA-EDUCATIONAL-METHOD.md'),
  ('student-created','Student-created solution','Creates their own answer or product','Capstones','RRA-EDUCATIONAL-METHOD.md')
on conflict (type_key) do nothing;

-- Seed uses confirmed from existing project records.
insert into public.academy_interaction_uses (type_id, project_id, stage, usage_note, fit_note, recorded_by)
select t.id, v.project_id, v.stage, v.usage_note, v.fit_note, 'SEED 2026-09-27'
from (values
  ('worksheet-planner','RRA-2026-0002','PRODUCT_WORKING','"My Well Test Plan" worksheet',null),
  ('comparator','RRA-2026-0002','PRODUCT_WORKING','Test Route Comparator',null),
  ('branching-guide','RRA-2026-0002','PRODUCT_WORKING','Result-to-next-action guide',null),
  ('multiple-choice','RRA-2026-0001','PRODUCT_WORKING','Concept checks','Owner review found single-choice logic where several answers should count.')
) as v(type_key, project_id, stage, usage_note, fit_note)
join public.academy_interaction_types t on t.type_key = v.type_key
on conflict (type_id, project_id) do nothing;
