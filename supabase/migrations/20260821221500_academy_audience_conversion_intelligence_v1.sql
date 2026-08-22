-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: RR Website — Audience + Conversion Intelligence v1

create table if not exists public.academy_audience_signals (
  id uuid primary key default gen_random_uuid(),
  signal_key text not null unique,
  parent_project_id text references public.academy_content_projects(project_id) on delete set null,
  source_opportunity_id uuid references public.academy_opportunities(id) on delete set null,
  title text not null,
  audience_question text not null,
  signal_type text not null check (signal_type in ('TREND','LOCAL_EVENT','SEARCH_PATTERN','COMMUNITY_QUESTION','BEHAVIOR_DATA','OWNER_OBSERVATION','ANALYTICS')),
  geography text,
  observed_at timestamptz not null default now(),
  evidence_status text not null default 'UNVERIFIED' check (evidence_status in ('UNVERIFIED','PARTIALLY_VERIFIED','VERIFIED','STALE')),
  evidence_summary text,
  source_refs jsonb not null default '[]'::jsonb,
  urgency_score smallint check (urgency_score between 0 and 5),
  relevance_score smallint check (relevance_score between 0 and 5),
  audience_fit_score smallint check (audience_fit_score between 0 and 5),
  emotional_salience_score smallint check (emotional_salience_score between 0 and 5),
  evidence_strength_score smallint check (evidence_strength_score between 0 and 5),
  timeliness_score smallint check (timeliness_score between 0 and 5),
  signal_score numeric(5,2),
  recommended_hook text,
  hook_angle text,
  hook_risk_notes text,
  public_use_status text not null default 'RESEARCH_ONLY' check (public_use_status in ('RESEARCH_ONLY','READY_WITH_CAVEATS','READY_FOR_PUBLIC_USE','RETIRED')),
  owner_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_conversion_paths (
  id uuid primary key default gen_random_uuid(),
  path_key text not null unique,
  parent_project_id text references public.academy_content_projects(project_id) on delete set null,
  source_opportunity_id uuid references public.academy_opportunities(id) on delete set null,
  source_signal_id uuid references public.academy_audience_signals(id) on delete set null,
  title text not null,
  audience_problem text not null,
  desired_outcome text not null,
  destination_type text not null check (destination_type in ('CLASS','COURSE','WORKSHOP','TOOL','GUIDE','MEMBERSHIP','SERVICE','FREE_RESOURCE','PRODUCT','OTHER')),
  destination_label text not null,
  destination_project_id text references public.academy_content_projects(project_id) on delete set null,
  entry_hook text not null,
  free_value_promise text not null,
  self_diagnosis_type text,
  personalized_result text,
  recommended_destination_format text,
  format_rationale text,
  audience_relevance_score smallint check (audience_relevance_score between 0 and 5),
  trust_building_score smallint check (trust_building_score between 0 and 5),
  action_clarity_score smallint check (action_clarity_score between 0 and 5),
  knowledge_compression_score smallint check (knowledge_compression_score between 0 and 5),
  conversion_fit_score smallint check (conversion_fit_score between 0 and 5),
  production_effort_score smallint check (production_effort_score between 0 and 5),
  evidence_readiness_score smallint check (evidence_readiness_score between 0 and 5),
  pathway_score numeric(5,2),
  recommended_action text not null default 'RESEARCH' check (recommended_action in ('BUILD_NOW','TEST','RESEARCH','HOLD','NOT_RECOMMENDED_OWNER_REVIEW')),
  recommendation_reason text,
  owner_disposition text check (owner_disposition in ('BUILD_NOW','TEST','RESEARCH','HOLD','REVISIT','CLOSED_OWNER')),
  owner_note text,
  status text not null default 'DRAFT' check (status in ('DRAFT','SCREENED','READY_FOR_OWNER_REVIEW','OWNER_APPROVED','OWNER_REJECTED','ACTIVE','RETIRED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_conversion_steps (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.academy_conversion_paths(id) on delete cascade,
  step_order integer not null check (step_order > 0),
  step_type text not null check (step_type in ('HOOK','FREE_CONTENT','SELF_ASSESSMENT','PERSONALIZED_RESULT','FREE_NEXT_STEP','OFFER','FOLLOW_UP')),
  title text not null,
  audience_job text,
  recommended_format text,
  value_delivered text,
  cta text,
  next_transition text,
  evidence_requirement text,
  persuasion_principle text,
  manipulation_guardrail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(path_id, step_order)
);

create index if not exists academy_audience_signals_project_idx on public.academy_audience_signals(parent_project_id);
create index if not exists academy_audience_signals_opportunity_idx on public.academy_audience_signals(source_opportunity_id);
create index if not exists academy_conversion_paths_project_idx on public.academy_conversion_paths(parent_project_id);
create index if not exists academy_conversion_paths_signal_idx on public.academy_conversion_paths(source_signal_id);
create index if not exists academy_conversion_steps_path_idx on public.academy_conversion_steps(path_id, step_order);

alter table public.academy_audience_signals enable row level security;
alter table public.academy_conversion_paths enable row level security;
alter table public.academy_conversion_steps enable row level security;

drop policy if exists academy_audience_signals_admin_read on public.academy_audience_signals;
create policy academy_audience_signals_admin_read on public.academy_audience_signals for select to authenticated using (private.is_admin());
drop policy if exists academy_audience_signals_admin_write on public.academy_audience_signals;
create policy academy_audience_signals_admin_write on public.academy_audience_signals for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists academy_conversion_paths_admin_read on public.academy_conversion_paths;
create policy academy_conversion_paths_admin_read on public.academy_conversion_paths for select to authenticated using (private.is_admin());
drop policy if exists academy_conversion_paths_admin_write on public.academy_conversion_paths;
create policy academy_conversion_paths_admin_write on public.academy_conversion_paths for all to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists academy_conversion_steps_admin_read on public.academy_conversion_steps;
create policy academy_conversion_steps_admin_read on public.academy_conversion_steps for select to authenticated using (private.is_admin());
drop policy if exists academy_conversion_steps_admin_write on public.academy_conversion_steps;
create policy academy_conversion_steps_admin_write on public.academy_conversion_steps for all to authenticated using (private.is_admin()) with check (private.is_admin());

grant select, insert, update, delete on public.academy_audience_signals to authenticated;
grant select, insert, update, delete on public.academy_conversion_paths to authenticated;
grant select, insert, update, delete on public.academy_conversion_steps to authenticated;

create or replace function public.set_academy_conversion_path_owner_decision(
  p_path_id uuid,
  p_disposition text,
  p_note text default null
)
returns public.academy_conversion_paths
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_path public.academy_conversion_paths;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_disposition not in ('BUILD_NOW','TEST','RESEARCH','HOLD','REVISIT','CLOSED_OWNER') then
    raise exception 'Invalid owner disposition';
  end if;
  update public.academy_conversion_paths
  set owner_disposition = p_disposition,
      owner_note = case when p_note is null then owner_note else nullif(btrim(p_note),'') end,
      status = case when p_disposition='CLOSED_OWNER' then 'OWNER_REJECTED' else 'OWNER_APPROVED' end,
      updated_at = now()
  where id = p_path_id
  returning * into v_path;
  if v_path.id is null then raise exception 'Conversion path not found'; end if;
  return v_path;
end;
$function$;

grant execute on function public.set_academy_conversion_path_owner_decision(uuid,text,text) to authenticated;

insert into public.academy_audience_signals (
  signal_key,parent_project_id,source_opportunity_id,title,audience_question,signal_type,geography,evidence_status,evidence_summary,
  urgency_score,relevance_score,audience_fit_score,emotional_salience_score,evidence_strength_score,timeliness_score,signal_score,recommended_hook,hook_angle,hook_risk_notes,public_use_status
)
select
  'north-florida-water-scarcity-well-resilience','RRA-2026-0001',o.id,
  'North Florida water scarcity / private-well resilience concern',
  'If springs or groundwater levels decline, what—if anything—could that mean for my private well and household water resilience?',
  'OWNER_OBSERVATION','North Central Florida','UNVERIFIED',
  'Owner identified active local concern involving spring flow, private wells and water demand. This is a high-potential hook candidate but must be verified with current hydrologic/local evidence before public use.',
  4,5,5,5,1,5,79,
  'If a spring can lose flow, what does that mean for your well?',
  'Turn a visible local water concern into a practical question about household water dependence, backup capacity and what people should actually verify.',
  'Do not imply that one spring running low/dry proves a specific private well will fail. Explain aquifer/well relationships only to the level supported by current evidence.',
  'RESEARCH_ONLY'
from public.academy_opportunities o
where o.parent_project_id='RRA-2026-0001' and o.opportunity_key='backup-water-plan'
on conflict (signal_key) do update set updated_at=now();

insert into public.academy_audience_signals (
  signal_key,parent_project_id,source_opportunity_id,title,audience_question,signal_type,geography,evidence_status,evidence_summary,
  urgency_score,relevance_score,audience_fit_score,emotional_salience_score,evidence_strength_score,timeliness_score,signal_score,recommended_hook,hook_angle,hook_risk_notes,public_use_status
)
select
  'north-florida-high-water-use-development','RRA-2026-0001',o.id,
  'High-water-use development / groundwater concern',
  'When a large new water user is proposed or built nearby, what should a private-well household actually ask about local groundwater demand and resilience?',
  'OWNER_OBSERVATION','North Central Florida','UNVERIFIED',
  'Owner identified concern about data-center or other high-water-use development. Specific facility, permitted withdrawal and local impact must be verified before this becomes public-facing content.',
  4,5,5,5,1,5,78,
  'A new high-water-use facility is coming. What should well owners actually be watching?',
  'Use a current development concern to teach people how to ask better water questions instead of making unsupported impact claims.',
  'No claim that a specific facility will lower a specific well unless supported by current permitting/hydrologic evidence. Avoid fear-based certainty.',
  'RESEARCH_ONLY'
from public.academy_opportunities o
where o.parent_project_id='RRA-2026-0001' and o.opportunity_key='source-protection'
on conflict (signal_key) do update set updated_at=now();

insert into public.academy_conversion_paths (
  path_key,parent_project_id,source_opportunity_id,source_signal_id,title,audience_problem,desired_outcome,destination_type,destination_label,
  entry_hook,free_value_promise,self_diagnosis_type,personalized_result,recommended_destination_format,format_rationale,
  audience_relevance_score,trust_building_score,action_clarity_score,knowledge_compression_score,conversion_fit_score,production_effort_score,evidence_readiness_score,pathway_score,recommended_action,recommendation_reason,status
)
select
  'water-resilience-free-to-deep-learning','RRA-2026-0001',o.id,s.id,
  'Water Resilience: concern → clarity → personal plan → deeper Academy learning',
  'People are worried about water availability or dependence but do not know whether their own household is actually vulnerable or what system functions they need.',
  'Help a person understand their own water dependence, identify the highest-value gap and enter the right deeper Academy learning path without requiring them to research the entire subject alone.',
  'COURSE','Build Your Water System / Water Resilience learning experience',
  'If a spring can lose flow, what does that mean for your well?',
  'Give an evidence-based local-context explainer plus a useful household water-resilience self-assessment that stands on its own.',
  'Interactive household water profile / resilience questionnaire',
  'A plain-language Water Resilience Snapshot showing source dependence, stored-water duration, pumping dependence, backup-source options, major gaps and the next function to learn.',
  'Interactive assessment + personalized result + visual class/course pathway',
  'The audience first needs relevance and diagnosis, not a long generic guide. Personalized output demonstrates RRA knowledge compression and makes the next learning need obvious from the user’s own inputs.',
  5,5,5,5,5,4,3,91,'RESEARCH',
  'Strong funnel fit and high learner value, but the local/current hook must be verified before public campaign use and the final paid format should be confirmed against audience behavior/format research.',
  'SCREENED'
from public.academy_opportunities o
join public.academy_audience_signals s on s.signal_key='north-florida-water-scarcity-well-resilience'
where o.parent_project_id='RRA-2026-0001' and o.opportunity_key='backup-water-plan'
on conflict (path_key) do update set updated_at=now();

insert into public.academy_conversion_steps (path_id,step_order,step_type,title,audience_job,recommended_format,value_delivered,cta,next_transition,evidence_requirement,persuasion_principle,manipulation_guardrail)
select p.id,1,'HOOK','Make the concern personally relevant','Recognize why the topic may matter to my household without being told I am doomed.','Short local-context post/reel/image','A clear question that connects a visible water concern to a household decision.','Check your water resilience','Open the free evidence-based explainer.','Current/local claim must be verified and accurately scoped before publication.','Self-relevance + specificity + timely relevance','No manufactured fear, certainty, catastrophe language or unsupported causal claim.' from public.academy_conversion_paths p where p.path_key='water-resilience-free-to-deep-learning' on conflict (path_id,step_order) do nothing;

insert into public.academy_conversion_steps (path_id,step_order,step_type,title,audience_job,recommended_format,value_delivered,cta,next_transition,evidence_requirement,persuasion_principle,manipulation_guardrail)
select p.id,2,'FREE_CONTENT','Explain what the concern actually means','Understand the system enough to ask better questions and avoid panic or false confidence.','Short article + visual diagram + short video/reel','Evidence-based explanation of source, recharge, well dependence, uncertainty and what indicators matter.','See how your household stacks up','Move into self-assessment.','Use approved/current hydrologic evidence; distinguish general principles from local claims.','Cognitive fluency + trust through useful competence','Do not intentionally leave out essential context merely to force the next click.' from public.academy_conversion_paths p where p.path_key='water-resilience-free-to-deep-learning' on conflict (path_id,step_order) do nothing;

insert into public.academy_conversion_steps (path_id,step_order,step_type,title,audience_job,recommended_format,value_delivered,cta,next_transition,evidence_requirement,persuasion_principle,manipulation_guardrail)
select p.id,3,'SELF_ASSESSMENT','Map my actual water dependence','Answer simple questions about my own source, storage, pump dependence, people/animals, backup sources and intended uses.','Interactive questionnaire','Transforms a vague concern into concrete household facts.','Build my Water Resilience Snapshot','Generate a personalized result from supplied answers.','Question logic must distinguish known/unknown and avoid pretending user inputs prove water quality or future failure.','Active participation + self-generated relevance + commitment to understanding','No hidden defaults, trick questions, forced opt-in or false personalization.' from public.academy_conversion_paths p where p.path_key='water-resilience-free-to-deep-learning' on conflict (path_id,step_order) do nothing;

insert into public.academy_conversion_steps (path_id,step_order,step_type,title,audience_job,recommended_format,value_delivered,cta,next_transition,evidence_requirement,persuasion_principle,manipulation_guardrail)
select p.id,4,'PERSONALIZED_RESULT','Show me my highest-value gap','See what depends on one point of failure, approximately how long current storage supports the household, and which function deserves attention next.','Personalized visual snapshot','Plain-language gap map: source → store → move → treat → verify, with unknowns clearly marked.','Fix the biggest gap first','Recommend one free next step and the relevant deeper learning path.','Calculations and recommendations must be transparent and bounded by known inputs.','Personalization + progress + reduction of cognitive load','Do not exaggerate risk scores to increase conversion.' from public.academy_conversion_paths p where p.path_key='water-resilience-free-to-deep-learning' on conflict (path_id,step_order) do nothing;

insert into public.academy_conversion_steps (path_id,step_order,step_type,title,audience_job,recommended_format,value_delivered,cta,next_transition,evidence_requirement,persuasion_principle,manipulation_guardrail)
select p.id,5,'FREE_NEXT_STEP','Let me improve something now','Take one useful action before paying for anything.','Checklist / mini planner / calculator','A real improvement such as calculating storage duration, identifying testing needs or mapping backup movement.','Build the complete system','Offer deeper Academy learning only after useful standalone value is delivered.','Free action must be safe within evidence boundaries and not substitute for required testing/professional work.','Reciprocity through genuine value + competence demonstration','Free value cannot be deliberately crippled to manufacture dependence.' from public.academy_conversion_paths p where p.path_key='water-resilience-free-to-deep-learning' on conflict (path_id,step_order) do nothing;

insert into public.academy_conversion_steps (path_id,step_order,step_type,title,audience_job,recommended_format,value_delivered,cta,next_transition,evidence_requirement,persuasion_principle,manipulation_guardrail)
select p.id,6,'OFFER','Go deeper with the system that fits me','Choose deeper instruction because I now understand the problem and want implementation help.','Class/course + interactive planner; final format subject to format research','Structured RRA teaching that reduces research burden and connects testing, storage, movement, treatment, verification and maintenance.','Continue with Rebel Ranch Academy','Enter the approved class/course/tool when it exists and is released.','Do not present planned class/product as currently available until owner release approval.','Trust + clarity + reduced effort + demonstrated fit','No fake countdowns, false scarcity, shame, coercion or misleading guarantees.' from public.academy_conversion_paths p where p.path_key='water-resilience-free-to-deep-learning' on conflict (path_id,step_order) do nothing;