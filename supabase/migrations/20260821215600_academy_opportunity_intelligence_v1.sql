-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: RR Website — Academy Opportunity Intelligence v1

create table if not exists public.academy_opportunities (
  id uuid primary key default gen_random_uuid(),
  opportunity_key text not null unique,
  parent_project_id text not null references public.academy_content_projects(project_id) on delete cascade,
  parent_opportunity_id uuid references public.academy_opportunities(id) on delete set null,
  title text not null,
  summary text,
  problem_solved text,
  source_evidence text,
  opportunity_type text not null default 'LEARNING_PATH' check (opportunity_type in ('LEARNING_PATH','STANDALONE_PRODUCT','MODULE','TOOL','BUNDLE','FREE_RESOURCE','SERVICE','RESEARCH_TOPIC')),
  primary_learning_area text,
  academy_areas text[] not null default '{}',
  ecosystem_programs text[] not null default '{}',
  transferable_skills text[] not null default '{}',
  lifecycle_status text not null default 'DISCOVERED' check (lifecycle_status in ('DISCOVERED','SCREENING','SCREENED','OWNER_REVIEW','SPUN_OFF','INCORPORATED','CLOSED')),
  recommendation text not null default 'MONITOR' check (recommendation in ('PURSUE_NOW','PURSUE_LATER','INCORPORATE_BUNDLE','FREE_RESOURCE','MONITOR','NOT_RECOMMENDED_OWNER_REVIEW')),
  demand_score integer check (demand_score between 0 and 5),
  mission_value_score integer check (mission_value_score between 0 and 5),
  marketability_score integer check (marketability_score between 0 and 5),
  implementation_value_score integer check (implementation_value_score between 0 and 5),
  evidence_readiness_score integer check (evidence_readiness_score between 0 and 5),
  cross_academy_score integer check (cross_academy_score between 0 and 5),
  production_effort_score integer check (production_effort_score between 0 and 5),
  overlap_risk_score integer check (overlap_risk_score between 0 and 5),
  confidence_score integer check (confidence_score between 0 and 5),
  opportunity_score numeric(5,2) check (opportunity_score between 0 and 100),
  score_confidence text not null default 'LOW' check (score_confidence in ('LOW','MEDIUM','HIGH')),
  recommended_priority text not null default 'NORMAL' check (recommended_priority in ('NORMAL','HIGH','IMMEDIATE')),
  recommended_action_reason text,
  dependency_notes text,
  market_research_needed boolean not null default true,
  spin_off_ready boolean not null default false,
  owner_disposition text check (owner_disposition is null or owner_disposition in ('PURSUE_NOW','PURSUE_LATER','INCORPORATE_BUNDLE','FREE_RESOURCE','MONITOR','REVISIT','CLOSED_OWNER')),
  owner_note text,
  owner_decided_at timestamptz,
  spawned_project_id text references public.academy_content_projects(project_id) on delete set null,
  discovered_by text,
  screened_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_opportunity_relationships (
  id uuid primary key default gen_random_uuid(),
  source_opportunity_id uuid not null references public.academy_opportunities(id) on delete cascade,
  target_type text not null check (target_type in ('OPPORTUNITY','PROJECT','ACADEMY_AREA','PROGRAM','SKILL')),
  target_key text not null,
  relationship_type text not null check (relationship_type in ('DEPENDS_ON','LEADS_TO','SUPPORTS','OVERLAPS','TRANSFER_TO','BUNDLE_WITH','USES_SKILL','SERVES_PROGRAM')),
  strength integer not null default 3 check (strength between 1 and 5),
  rationale text,
  created_at timestamptz not null default now(),
  unique(source_opportunity_id,target_type,target_key,relationship_type)
);

create index if not exists academy_opportunities_parent_project_idx on public.academy_opportunities(parent_project_id);
create index if not exists academy_opportunities_recommendation_idx on public.academy_opportunities(recommendation,lifecycle_status);
create index if not exists academy_opportunities_owner_disposition_idx on public.academy_opportunities(owner_disposition) where owner_disposition is not null;
create index if not exists academy_opportunity_relationships_source_idx on public.academy_opportunity_relationships(source_opportunity_id);

alter table public.academy_opportunities enable row level security;
alter table public.academy_opportunity_relationships enable row level security;

grant select,insert,update on public.academy_opportunities to authenticated;
grant select,insert,update on public.academy_opportunity_relationships to authenticated;

create policy academy_opportunities_admin_select on public.academy_opportunities for select to authenticated using (private.is_admin());
create policy academy_opportunities_admin_insert on public.academy_opportunities for insert to authenticated with check (private.is_admin());
create policy academy_opportunities_admin_update on public.academy_opportunities for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy academy_opportunity_relationships_admin_select on public.academy_opportunity_relationships for select to authenticated using (private.is_admin());
create policy academy_opportunity_relationships_admin_insert on public.academy_opportunity_relationships for insert to authenticated with check (private.is_admin());
create policy academy_opportunity_relationships_admin_update on public.academy_opportunity_relationships for update to authenticated using (private.is_admin()) with check (private.is_admin());

create or replace function public.set_academy_opportunity_owner_decision(
  p_opportunity_id uuid,
  p_disposition text,
  p_note text default null
) returns public.academy_opportunities
language plpgsql
set search_path to ''
as $$
declare
  v_row public.academy_opportunities;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_disposition not in ('PURSUE_NOW','PURSUE_LATER','INCORPORATE_BUNDLE','FREE_RESOURCE','MONITOR','REVISIT','CLOSED_OWNER') then
    raise exception 'Invalid owner disposition';
  end if;
  update public.academy_opportunities
  set owner_disposition=p_disposition,
      owner_note=nullif(btrim(p_note),''),
      owner_decided_at=now(),
      lifecycle_status=case when p_disposition='CLOSED_OWNER' then 'CLOSED' else 'SCREENED' end,
      updated_at=now()
  where id=p_opportunity_id
  returning * into v_row;
  if v_row.id is null then raise exception 'Academy opportunity not found'; end if;
  return v_row;
end;
$$;

grant execute on function public.set_academy_opportunity_owner_decision(uuid,text,text) to authenticated;

insert into public.academy_opportunities (
 opportunity_key,parent_project_id,title,summary,problem_solved,opportunity_type,primary_learning_area,academy_areas,ecosystem_programs,transferable_skills,lifecycle_status,recommendation,demand_score,mission_value_score,marketability_score,implementation_value_score,evidence_readiness_score,cross_academy_score,production_effort_score,overlap_risk_score,confidence_score,opportunity_score,score_confidence,recommended_priority,recommended_action_reason,dependency_notes,market_research_needed,spin_off_ready,discovered_by,screened_by,source_evidence
) values
('water-testing-results','RRA-2026-0001','Know Your Water — Home & Well Testing','Testing is the diagnostic front door for safe treatment decisions.','Learners need to know what to test before choosing treatment.','STANDALONE_PRODUCT','Sustainability & Agriculture',array['Sustainability & Agriculture','Personal Strength & Independence','Money, Finance & Taxes'],array['Rebel Ranch Academy'],array['diagnosis','evidence evaluation','decision-making'],'SCREENED','PURSUE_NOW',5,5,5,5,5,5,3,2,5,91,'HIGH','HIGH','High-value prerequisite and recurring reference need; directly strengthens the core Water product.','Coordinate with the free Know Your Water foundation and avoid duplicating core material.',false,true,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Entry Questions 1, 2 and Product Ladder'),
('water-results-interpretation','RRA-2026-0001','Reading Water Test Results Without the Confusion','Turns laboratory/screening output into understandable next questions and treatment jobs.','People can obtain results but still not know what the numbers mean or what to do next.','TOOL','Sustainability & Agriculture',array['Sustainability & Agriculture','Personal Strength & Independence'],array['Rebel Ranch Academy'],array['interpretation','critical thinking','risk recognition'],'SCREENED','PURSUE_NOW',5,5,5,5,4,4,4,2,4,86,'MEDIUM','HIGH','Strong practical bridge between testing and system design; high reusable value.','Requires carefully bounded health/safety interpretation and evidence-backed thresholds.',true,true,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Entry Question 2'),
('uv-disinfection','RRA-2026-0001','UV & Microbiological Water Disinfection','Dedicated education on microbiological treatment, UV limits, pretreatment and verification.','Learners need to know when UV/disinfection fits and when it does not.','MODULE','Sustainability & Agriculture',array['Sustainability & Agriculture','Personal Strength & Independence'],array['Rebel Ranch Academy'],array['treatment selection','verification','maintenance'],'SCREENED','INCORPORATE_BUNDLE',4,5,4,5,5,3,4,2,5,79,'HIGH','NORMAL','Important and evidence-ready, but currently fits best as a module/follow-on inside the larger water system rather than an immediate separate build.','Targeted UV research addendum exists; preserve certified-system and pretreatment boundaries.',false,false,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — UV follow-on; targeted UV evidence addendum'),
('rainwater-storage','RRA-2026-0001','Rainwater: Catch It, Store It, Use It','Connects catchment, source protection, storage, intended use, treatment, distribution and verification.','Learners need a complete rainwater pathway rather than isolated barrel/catchment tips.','STANDALONE_PRODUCT','Sustainability & Agriculture',array['Sustainability & Agriculture','Money, Finance & Taxes','Personal Strength & Independence'],array['Rebel Ranch Academy'],array['system design','resource planning','maintenance'],'SCREENED','PURSUE_NOW',5,5,5,5,4,5,4,2,4,87,'MEDIUM','HIGH','Large practical branch with multiple genuine use cases and strong bundle value.','Potable use needs deeper evidence than irrigation/animal/non-potable use.',true,true,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Entry Question 5'),
('safe-water-storage','RRA-2026-0001','Containers Are Containers — Safe Storage by Function','Explains storage capacity, material suitability, sanitation, light/algae exposure, rotation and duration.','Clean water can become unsafe or unusable if stored poorly.','STANDALONE_PRODUCT','Sustainability & Agriculture',array['Sustainability & Agriculture','Personal Strength & Independence','Family, Community & Leadership','Money, Finance & Taxes'],array['Rebel Ranch Academy'],array['storage planning','inventory rotation','sanitation','capacity planning'],'SCREENED','PURSUE_NOW',5,5,5,5,4,5,3,2,4,89,'MEDIUM','HIGH','Direct next-step problem after purification with household, emergency and farm relevance; strong standalone and bundle utility.','Needs scenario-specific safety guidance for potable vs animal/irrigation use.',true,true,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — safe storage, water storage rotation, Rainwater & Storage'),
('gravity-pressure-flow','RRA-2026-0001','Gravity Does the Work — Head, Pressure & Flow','Teaches the transferable physics/function behind moving water without product-first thinking.','Learners need to understand whether gravity can move enough water before buying pumps.','STANDALONE_PRODUCT','Sustainability & Agriculture',array['Sustainability & Agriculture','Business & Operations','Money, Finance & Taxes'],array['Rebel Ranch Academy'],array['functional decomposition','measurement','system sizing','troubleshooting'],'SCREENED','PURSUE_NOW',4,5,4,5,4,5,3,1,4,86,'MEDIUM','HIGH','Highly transferable systems skill with home, farm, irrigation and business-operations analogies.','Needs accessible math/visuals and clear performance boundaries.',true,true,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Entry Question 4 and Add-On Layer'),
('pumps-without-mystery','RRA-2026-0001','Pumps Without the Mystery','Builds pump selection around required flow, lift/head, power, controls and maintenance.','People often buy pumps before defining required performance.','STANDALONE_PRODUCT','Sustainability & Agriculture',array['Sustainability & Agriculture','Money, Finance & Taxes','Business & Operations'],array['Rebel Ranch Academy'],array['requirements definition','equipment comparison','total cost of ownership'],'SCREENED','PURSUE_LATER',4,4,4,5,3,5,4,2,3,76,'MEDIUM','NORMAL','Good practical and transferable value, but should follow the gravity/flow foundation so requirements are understood first.','Depends on stronger pump-performance research and scenario boundaries.',true,false,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — pumps and pressure; future idea queue'),
('automatic-chicken-watering','RRA-2026-0001','Automatic Chicken Watering','Applies storage, movement, control and maintenance to a concrete farm system.','Animal caretakers want reliable water without daily manual refilling.','STANDALONE_PRODUCT','Sustainability & Agriculture',array['Sustainability & Agriculture','Personal Strength & Independence'],array['Rebel Ranch Academy'],array['automation','maintenance','redundancy','animal care systems'],'SCREENED','PURSUE_NOW',5,5,5,5,4,4,3,2,4,88,'MEDIUM','HIGH','Clear real-world problem, strong visual/implementation value and direct proof of transferable water-system thinking.','Species/use-specific sanitation, freeze and failure considerations need research.',true,true,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Entry Question 4'),
('farm-animal-water-systems','RRA-2026-0001','Farm & Animal Water Systems','Combines source, storage, distribution, controls, backup and maintenance for animals/farm use.','Farm water needs differ from household potable use and benefit from system-level planning.','BUNDLE','Sustainability & Agriculture',array['Sustainability & Agriculture','Business & Operations'],array['Rebel Ranch Academy'],array['system design','redundancy','maintenance planning','automation'],'SCREENED','PURSUE_LATER',4,5,4,5,3,4,5,2,3,73,'MEDIUM','NORMAL','Strong bundle opportunity after core subskills exist; too broad to build first.','Best assembled from storage, gravity/flow, pumps, controls and animal-specific implementations.',true,false,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Farm Water Systems bundle'),
('pond-emergency-source','RRA-2026-0001','Pond Water as an Emergency Source','Teaches risk-first emergency use of surface water, pretreatment, disinfection, storage and verification.','Learners may have water nearby during outages but not know its risks or safe-use boundaries.','RESEARCH_TOPIC','Sustainability & Agriculture',array['Sustainability & Agriculture','Personal Strength & Independence','Family, Community & Leadership'],array['Rebel Ranch Academy'],array['risk assessment','emergency planning','treatment verification'],'SCREENED','PURSUE_LATER',3,5,3,5,2,4,4,2,3,66,'LOW','NORMAL','High mission/emergency value but evidence burden and safety risk justify deeper research before productization.','Do not prescribe potable DIY treatment until source-specific evidence and verification are established.',true,false,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Entry Question 6'),
('backup-water-plan','RRA-2026-0001','Build a Backup Water Plan','Household resilience planning across stored water, rainwater, purchased water, community sources and system failure.','Families need a practical continuity plan before a pump/well outage occurs.','STANDALONE_PRODUCT','Personal Strength & Independence',array['Personal Strength & Independence','Sustainability & Agriculture','Family, Community & Leadership','Money, Finance & Taxes'],array['Rebel Ranch Academy'],array['contingency planning','resource inventory','prioritization','family roles'],'SCREENED','PURSUE_NOW',5,5,4,5,4,5,3,2,4,88,'MEDIUM','HIGH','Broad family value, low equipment dependence and strong cross-Academy transfer; natural branch from Water.','Must distinguish planning from unsupported emergency treatment claims.',true,true,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Entry Question 6'),
('maintenance-retesting','RRA-2026-0001','Filter Maintenance & Retesting','Turns treatment into an ongoing verification/maintenance system.','A treatment system can fail silently if filters, lamps, media, cleaning and retesting are ignored.','MODULE','Sustainability & Agriculture',array['Sustainability & Agriculture','Business & Operations','Personal Strength & Independence'],array['Rebel Ranch Academy'],array['preventive maintenance','logging','verification','failure detection'],'SCREENED','INCORPORATE_BUNDLE',5,5,4,5,5,5,2,1,5,90,'HIGH','HIGH','Extremely strong implementation value but naturally belongs inside every water product and system rather than being isolated first.','Can later become a reusable maintenance/logging tool across Academy systems.',false,false,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Maintenance & Monitoring'),
('source-protection','RRA-2026-0001','Source Protection: Solve the Problem Before It Reaches the Filter','Shifts thinking upstream to prevent contamination/debris where possible.','Learners often treat symptoms downstream instead of reducing the problem at the source.','MODULE','Sustainability & Agriculture',array['Sustainability & Agriculture','Business & Operations'],array['Rebel Ranch Academy'],array['root-cause thinking','prevention','system optimization'],'SCREENED','INCORPORATE_BUNDLE',4,5,4,5,4,5,2,1,4,86,'MEDIUM','NORMAL','Powerful transferable principle and important module; strongest as a cross-cutting concept within Water and systems education.','Scenario-specific source-protection claims require evidence.',true,false,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Entry Question 5 and future idea queue'),
('water-troubleshooting','RRA-2026-0001','Water System Troubleshooting','Uses symptoms, observations, tests and system functions to isolate failures without guessing.','Users need a method for diagnosing smell/taste/look changes and system performance problems.','TOOL','Sustainability & Agriculture',array['Sustainability & Agriculture','Business & Operations','Personal Strength & Independence'],array['Rebel Ranch Academy'],array['troubleshooting','root-cause analysis','evidence gathering'],'SCREENED','PURSUE_LATER',4,5,4,5,3,5,4,2,3,76,'MEDIUM','NORMAL','Strong reusable skill and good interactive-tool candidate, but best after core system components and evidence categories mature.','Must avoid symptom-based medical/safety diagnosis; route observations to appropriate testing.',true,false,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Entry Question 7'),
('function-before-form','RRA-2026-0001','Think Like a Rebel: Function Before Form','Transfers the Water problem-solving method across food, shelter, energy, business systems and budgeting.','Learners need a reusable way to define functions before buying products or copying forms.','BUNDLE','Personal Strength & Independence',array['Personal Strength & Independence','Business & Operations','Money, Finance & Taxes','Sustainability & Agriculture','Family, Community & Leadership'],array['Rebel Ranch Academy','Business Freedom'],array['functional decomposition','resourcefulness','critical thinking','systems thinking'],'SCREENED','PURSUE_LATER',5,5,5,5,5,5,4,1,5,93,'HIGH','HIGH','Highest cross-Academy strategic value; Water can serve as the first proof-of-concept before a broader systems product is spun out.','Do not detach from concrete examples too early; prove the method through completed subject products.',false,false,'Product Opportunity Research','Opportunity Intelligence v1','opportunity-funnel-map.md — Think Like a Rebel Systems Bundle and Cross-Academy transfer')
on conflict (opportunity_key) do update set
  title=excluded.title, summary=excluded.summary, problem_solved=excluded.problem_solved, opportunity_type=excluded.opportunity_type,
  primary_learning_area=excluded.primary_learning_area, academy_areas=excluded.academy_areas, ecosystem_programs=excluded.ecosystem_programs,
  transferable_skills=excluded.transferable_skills, lifecycle_status=excluded.lifecycle_status, recommendation=excluded.recommendation,
  demand_score=excluded.demand_score, mission_value_score=excluded.mission_value_score, marketability_score=excluded.marketability_score,
  implementation_value_score=excluded.implementation_value_score, evidence_readiness_score=excluded.evidence_readiness_score,
  cross_academy_score=excluded.cross_academy_score, production_effort_score=excluded.production_effort_score,
  overlap_risk_score=excluded.overlap_risk_score, confidence_score=excluded.confidence_score, opportunity_score=excluded.opportunity_score,
  score_confidence=excluded.score_confidence, recommended_priority=excluded.recommended_priority,
  recommended_action_reason=excluded.recommended_action_reason, dependency_notes=excluded.dependency_notes,
  market_research_needed=excluded.market_research_needed, spin_off_ready=excluded.spin_off_ready,
  screened_by=excluded.screened_by, source_evidence=excluded.source_evidence, updated_at=now();

insert into public.academy_opportunity_relationships (source_opportunity_id,target_type,target_key,relationship_type,strength,rationale)
select o.id,'ACADEMY_AREA',a,'TRANSFER_TO',5,'Direct cross-Academy transfer identified during Water opportunity mapping.'
from public.academy_opportunities o cross join lateral unnest(o.academy_areas) a
where o.parent_project_id='RRA-2026-0001'
on conflict do nothing;

insert into public.academy_opportunity_relationships (source_opportunity_id,target_type,target_key,relationship_type,strength,rationale)
select o.id,'SKILL',s,'USES_SKILL',4,'Transferable skill identified in the opportunity screen.'
from public.academy_opportunities o cross join lateral unnest(o.transferable_skills) s
where o.parent_project_id='RRA-2026-0001'
on conflict do nothing;

insert into public.academy_opportunity_relationships (source_opportunity_id,target_type,target_key,relationship_type,strength,rationale)
select a.id,'OPPORTUNITY',b.opportunity_key,'LEADS_TO',5,'Testing and result interpretation directly lead into treatment/system decisions.' from public.academy_opportunities a, public.academy_opportunities b where a.opportunity_key='water-testing-results' and b.opportunity_key='water-results-interpretation' on conflict do nothing;
insert into public.academy_opportunity_relationships (source_opportunity_id,target_type,target_key,relationship_type,strength,rationale)
select a.id,'OPPORTUNITY',b.opportunity_key,'LEADS_TO',5,'Purification naturally creates the next problem: safe storage and preservation.' from public.academy_opportunities a, public.academy_opportunities b where a.opportunity_key='water-results-interpretation' and b.opportunity_key='safe-water-storage' on conflict do nothing;
insert into public.academy_opportunity_relationships (source_opportunity_id,target_type,target_key,relationship_type,strength,rationale)
select a.id,'OPPORTUNITY',b.opportunity_key,'LEADS_TO',5,'Storage systems create movement/distribution requirements.' from public.academy_opportunities a, public.academy_opportunities b where a.opportunity_key='safe-water-storage' and b.opportunity_key='gravity-pressure-flow' on conflict do nothing;
insert into public.academy_opportunity_relationships (source_opportunity_id,target_type,target_key,relationship_type,strength,rationale)
select a.id,'OPPORTUNITY',b.opportunity_key,'LEADS_TO',4,'Gravity/flow understanding determines whether a pump is actually needed and what it must do.' from public.academy_opportunities a, public.academy_opportunities b where a.opportunity_key='gravity-pressure-flow' and b.opportunity_key='pumps-without-mystery' on conflict do nothing;
insert into public.academy_opportunity_relationships (source_opportunity_id,target_type,target_key,relationship_type,strength,rationale)
select a.id,'OPPORTUNITY',b.opportunity_key,'SUPPORTS',5,'Storage + flow knowledge supports reliable automated animal watering.' from public.academy_opportunities a, public.academy_opportunities b where a.opportunity_key='gravity-pressure-flow' and b.opportunity_key='automatic-chicken-watering' on conflict do nothing;
insert into public.academy_opportunity_relationships (source_opportunity_id,target_type,target_key,relationship_type,strength,rationale)
select a.id,'OPPORTUNITY',b.opportunity_key,'BUNDLE_WITH',5,'Emergency source planning and backup water planning belong in the same resilience pathway.' from public.academy_opportunities a, public.academy_opportunities b where a.opportunity_key='pond-emergency-source' and b.opportunity_key='backup-water-plan' on conflict do nothing;
