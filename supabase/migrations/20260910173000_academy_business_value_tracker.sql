-- Rebel Ranch Academy business/startup value tracker
-- Purpose: reusable, customizable valuation and action-tracking backend for
-- small businesses, startups, nonprofit ventures, and idea-stage projects.
--
-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: RRM property, valuation and capitalization planning

begin;

create table if not exists public.academy_value_projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  name text not null,
  project_type text not null default 'startup',
  description text,
  currency_code text not null default 'USD',
  status text not null default 'active',
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, project_key),
  check (project_type in ('idea','startup','small_business','nonprofit','other')),
  check (status in ('draft','active','archived')),
  check (char_length(currency_code) = 3)
);

create table if not exists public.academy_value_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.academy_value_projects(id) on delete cascade,
  asset_key text not null,
  name text not null,
  asset_type text not null,
  description text,
  ownership_status text not null default 'undecided',
  owner_label text,
  commercial_use text,
  evidence_summary text,
  custom_fields jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, asset_key)
);

create table if not exists public.academy_value_assessments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.academy_value_assets(id) on delete cascade,
  value_lens text not null,
  valuation_method text,
  low_value numeric(14,2),
  central_value numeric(14,2),
  high_value numeric(14,2),
  recurring_annual_value numeric(14,2),
  include_in_lens_total boolean not null default true,
  rationale text,
  benchmark_summary text,
  confidence text not null default 'medium',
  custom_inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (asset_id, value_lens),
  check (value_lens in ('market_value','replacement_cost','book_value','productive_value','enterprise_component','license_scenario')),
  check (confidence in ('low','medium','medium-high','high')),
  check (low_value is null or low_value >= 0),
  check (central_value is null or central_value >= 0),
  check (high_value is null or high_value >= 0),
  check (recurring_annual_value is null or recurring_annual_value >= 0)
);

create table if not exists public.academy_value_sources (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.academy_value_assessments(id) on delete cascade,
  source_title text not null,
  publisher text,
  source_url text,
  source_type text not null default 'market_comparable',
  accessed_on date,
  notes text,
  created_at timestamptz not null default now(),
  check (source_type in ('market_comparable','repository_evidence','financial_record','user_record','official_guidance','other'))
);

create table if not exists public.academy_value_actions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.academy_value_projects(id) on delete cascade,
  step_number integer,
  workstream text not null,
  what_we_know text,
  next_action text not null,
  owner_label text,
  target_date date,
  status text not null default 'not_started',
  dependency text,
  proof_required text,
  deliverable text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('not_started','in_progress','waiting','complete_verified'))
);

create table if not exists public.academy_value_assumptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.academy_value_projects(id) on delete cascade,
  assumption_key text not null,
  label text not null,
  value_text text,
  value_number numeric(16,4),
  value_date date,
  source_or_basis text,
  confidence text not null default 'medium',
  needs_update boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, assumption_key),
  check (confidence in ('low','medium','medium-high','high'))
);

create index if not exists academy_value_assets_project_idx on public.academy_value_assets(project_id, sort_order);
create index if not exists academy_value_assessments_asset_idx on public.academy_value_assessments(asset_id, value_lens);
create index if not exists academy_value_sources_assessment_idx on public.academy_value_sources(assessment_id);
create index if not exists academy_value_actions_project_idx on public.academy_value_actions(project_id, sort_order);
create index if not exists academy_value_assumptions_project_idx on public.academy_value_assumptions(project_id);

create trigger academy_value_projects_set_updated_at
before update on public.academy_value_projects
for each row execute function private.set_updated_at();

create trigger academy_value_assets_set_updated_at
before update on public.academy_value_assets
for each row execute function private.set_updated_at();

create trigger academy_value_assessments_set_updated_at
before update on public.academy_value_assessments
for each row execute function private.set_updated_at();

create trigger academy_value_actions_set_updated_at
before update on public.academy_value_actions
for each row execute function private.set_updated_at();

create trigger academy_value_assumptions_set_updated_at
before update on public.academy_value_assumptions
for each row execute function private.set_updated_at();

alter table public.academy_value_projects enable row level security;
alter table public.academy_value_assets enable row level security;
alter table public.academy_value_assessments enable row level security;
alter table public.academy_value_sources enable row level security;
alter table public.academy_value_actions enable row level security;
alter table public.academy_value_assumptions enable row level security;

create policy academy_value_projects_owner_select on public.academy_value_projects
for select to authenticated
using (owner_user_id = auth.uid() or private.is_admin());
create policy academy_value_projects_owner_insert on public.academy_value_projects
for insert to authenticated
with check (owner_user_id = auth.uid() or private.is_admin());
create policy academy_value_projects_owner_update on public.academy_value_projects
for update to authenticated
using (owner_user_id = auth.uid() or private.is_admin())
with check (owner_user_id = auth.uid() or private.is_admin());
create policy academy_value_projects_owner_delete on public.academy_value_projects
for delete to authenticated
using (owner_user_id = auth.uid() or private.is_admin());

create policy academy_value_assets_owner_all on public.academy_value_assets
for all to authenticated
using (exists (
  select 1 from public.academy_value_projects p
  where p.id = project_id and (p.owner_user_id = auth.uid() or private.is_admin())
))
with check (exists (
  select 1 from public.academy_value_projects p
  where p.id = project_id and (p.owner_user_id = auth.uid() or private.is_admin())
));

create policy academy_value_assessments_owner_all on public.academy_value_assessments
for all to authenticated
using (exists (
  select 1
  from public.academy_value_assets a
  join public.academy_value_projects p on p.id = a.project_id
  where a.id = asset_id and (p.owner_user_id = auth.uid() or private.is_admin())
))
with check (exists (
  select 1
  from public.academy_value_assets a
  join public.academy_value_projects p on p.id = a.project_id
  where a.id = asset_id and (p.owner_user_id = auth.uid() or private.is_admin())
));

create policy academy_value_sources_owner_all on public.academy_value_sources
for all to authenticated
using (exists (
  select 1
  from public.academy_value_assessments va
  join public.academy_value_assets a on a.id = va.asset_id
  join public.academy_value_projects p on p.id = a.project_id
  where va.id = assessment_id and (p.owner_user_id = auth.uid() or private.is_admin())
))
with check (exists (
  select 1
  from public.academy_value_assessments va
  join public.academy_value_assets a on a.id = va.asset_id
  join public.academy_value_projects p on p.id = a.project_id
  where va.id = assessment_id and (p.owner_user_id = auth.uid() or private.is_admin())
));

create policy academy_value_actions_owner_all on public.academy_value_actions
for all to authenticated
using (exists (
  select 1 from public.academy_value_projects p
  where p.id = project_id and (p.owner_user_id = auth.uid() or private.is_admin())
))
with check (exists (
  select 1 from public.academy_value_projects p
  where p.id = project_id and (p.owner_user_id = auth.uid() or private.is_admin())
));

create policy academy_value_assumptions_owner_all on public.academy_value_assumptions
for all to authenticated
using (exists (
  select 1 from public.academy_value_projects p
  where p.id = project_id and (p.owner_user_id = auth.uid() or private.is_admin())
))
with check (exists (
  select 1 from public.academy_value_projects p
  where p.id = project_id and (p.owner_user_id = auth.uid() or private.is_admin())
));

-- Seed the current RRM working valuation under the existing RRM administrator account.
with owner_account as (
  select p.id as owner_user_id
  from public.profiles p
  join public.user_roles ur on ur.user_id = p.id and lower(ur.role) = 'admin'
  where p.display_name = 'rebelranchfl'
  limit 1
), inserted_project as (
  insert into public.academy_value_projects (
    owner_user_id, project_key, name, project_type, description, status
  )
  select owner_user_id, 'rrm-2026', 'Rebel Ranch Ministries — 2026 Working Valuation', 'nonprofit',
         'Internal working valuation and capitalization tracker. Separates market value, replacement cost, tangible/book value, productive value, founder contribution and enterprise value.',
         'active'
  from owner_account
  on conflict (owner_user_id, project_key) do update
    set name = excluded.name,
        description = excluded.description,
        updated_at = now()
  returning id
), project_ref as (
  select id from inserted_project
  union all
  select p.id
  from public.academy_value_projects p
  join owner_account o on o.owner_user_id = p.owner_user_id
  where p.project_key = 'rrm-2026'
  limit 1
)
insert into public.academy_value_assets (
  project_id, asset_key, name, asset_type, description, ownership_status, commercial_use, evidence_summary, sort_order
)
select pr.id, v.asset_key, v.name, v.asset_type, v.description, v.ownership_status, v.commercial_use, v.evidence_summary, v.sort_order
from project_ref pr
cross join (values
  ('academy-platform','Rebel Ranch Academy digital learning platform','software_ip','Large custom Academy web application with learner-facing program hub plus supporting learning, partner and account flows.','undecided','Per-organization license; implementation/setup; white-label or nonprofit/education license.','academy.html; academy-learning-interest.html; academy-partner-interest.html; account.html',10),
  ('align-platform','ALIGN / partner-program alignment application','software_ip','Large custom ALIGN application plus alignment-interest workflow.','undecided','B2B/nonprofit SaaS license; per-organization subscription; implementation.','align.html; align-interest.html',20),
  ('automation-framework','Automation / Academy agent / QA / deployment system','automation_ip','Academy agent runner plus dispatch, QA and deployment workflows.','undecided','Automation module license; implementation; managed-agent service.','.github/scripts/academy-agent-runner.mjs; .github/workflows/*',30),
  ('data-intake-framework','Account, intake, partner and learner data-flow systems','software_ip','Reusable administrative and intake architecture supporting account, partner, learner and alignment flows.','undecided','Module license; implementation; bundled platform feature.','account.html; academy-learning-interest.html; academy-partner-interest.html; align-interest.html',40),
  ('curriculum-portfolio','Academy / Back 2 the Basics / animal-education curriculum and learning architecture','curriculum_ip','Practical-skills, agriculture, sustainability and survival education frameworks and media.','rrm_owned','Course/program license; school/co-op license; facilitator kits; digital subscription.','Academy program files; assets/animal-education; Back 2 the Basics development',50),
  ('marketplace-business-freedom','Marketplace + Business Freedom operating/funnel/service architecture','business_system_ip','Local-commerce model, vendor funnel, business-resource positioning and related service architecture.','mixed','Community/marketplace operating license; business-support toolkit; implementation consulting.','Marketplace assets/pages and Business Freedom program documentation',60),
  ('brand-media-portfolio','RRM / RRA / Creation Station brand systems and media library','brand_ip','Multiple brand identities, approved logos, creative assets, social media and program media.','rrm_owned','Merchandise, sponsorship and approved media/brand-use licensing.','assets/RRA Logo*; assets/Creation Station Logo.png; assets/Market Place; assets/Social Media; assets/Support',70),
  ('operating-playbooks','Agent instructions, SOPs, research and operating playbooks','process_ip','Codified operating knowledge controlling AI/agent and human execution.','undecided','Operations-system license; implementation consulting; managed workflow product.','AGENTS.md and program/process documents',80),
  ('pigs','Pigs — current herd','livestock','Six pigs currently operated as productive livestock for breeding, food, land management and education.','rrm_owned','Breeding, food production, land management, education and demonstration.', 'RRM livestock records; current confirmed count = 6',90)
) as v(asset_key,name,asset_type,description,ownership_status,commercial_use,evidence_summary,sort_order)
on conflict (project_id, asset_key) do update
set name=excluded.name,
    description=excluded.description,
    ownership_status=excluded.ownership_status,
    commercial_use=excluded.commercial_use,
    evidence_summary=excluded.evidence_summary,
    sort_order=excluded.sort_order,
    updated_at=now();

-- Current market-value assessments for identified IP.
with p as (
  select vp.id
  from public.academy_value_projects vp
  join public.profiles pr on pr.id=vp.owner_user_id
  where vp.project_key='rrm-2026' and pr.display_name='rebelranchfl'
  limit 1
), vals(asset_key, low_v, central_v, high_v, method, rationale, benchmark, confidence) as (
  values
  ('academy-platform',40000::numeric,90000::numeric,150000::numeric,'Market comparables + cost cross-check','Central value uses the upper end of focused custom-LMS pricing because a substantial custom application and supporting flows already exist, while discounting from enterprise LMS ranges until outside recurring revenue is proven.','Focused custom LMS builds commonly price in the tens of thousands; broader custom LMS implementations can reach $150,000+ depending on scope.','medium-high'),
  ('align-platform',25000,50000,100000,'Market comparables + cost cross-check','Central value treats ALIGN as a substantial workflow application rather than a brochure site, while remaining below larger full-software project averages until third-party adoption is proven.','Custom web applications commonly price in the tens of thousands; reviewed software-development projects can average well above that.','medium'),
  ('automation-framework',20000,35000,60000,'Market comparables + component aggregation','Multiple agent, QA, dispatch and deployment components are present; central value aggregates these without assuming enterprise-scale proprietary AI.','AI development and automation specialists commonly command professional software/automation rates; custom AI/automation projects commonly run from several thousand to tens of thousands.','medium-high'),
  ('data-intake-framework',15000,30000,50000,'Market comparables','Central value treats the connected intake/account set as a reusable administrative system rather than isolated forms.','Connected custom workflows and web applications commonly price above simple forms/sites.','medium'),
  ('curriculum-portfolio',30000,65000,120000,'Market comparables + cost method','Central value recognizes multiple program/curriculum families and real-world testing, but does not apply high finished-hour eLearning pricing without a complete audited curriculum-hour inventory.','Instructional design and custom eLearning development commonly carry material per-hour/per-course production costs.','medium'),
  ('marketplace-business-freedom',15000,35000,70000,'Market comparables + cost cross-check','Central value reflects a reusable marketplace/business-support operating model and funnel architecture while discounting for limited standalone sales history.','Strategy, launch support and custom commerce/workflow builds commonly combine into five-figure engagements.','medium'),
  ('brand-media-portfolio',15000,30000,60000,'Market comparables','Central value is a portfolio estimate across several program identities and media assets, not a logo-only estimate.','Comprehensive brand strategy/rebrand work commonly costs thousands to tens of thousands per identity.','medium-high'),
  ('operating-playbooks',15000,30000,60000,'Cost/market cross-check','Central value recognizes codified operating know-how and AI/agent control systems; portability to outside organizations remains to be proven.','Specialized automation, AI and operations consulting rates support a material value for codified reusable playbooks.','medium')
)
insert into public.academy_value_assessments (
  asset_id, value_lens, valuation_method, low_value, central_value, high_value, rationale, benchmark_summary, confidence
)
select a.id, 'market_value', v.method, v.low_v, v.central_v, v.high_v, v.rationale, v.benchmark, v.confidence
from p
join public.academy_value_assets a on a.project_id=p.id
join vals v on v.asset_key=a.asset_key
on conflict (asset_id, value_lens) do update
set valuation_method=excluded.valuation_method,
    low_value=excluded.low_value,
    central_value=excluded.central_value,
    high_value=excluded.high_value,
    rationale=excluded.rationale,
    benchmark_summary=excluded.benchmark_summary,
    confidence=excluded.confidence,
    updated_at=now();

-- Replacement-cost lens for the identified digital/program portfolio.
with p as (
  select vp.id
  from public.academy_value_projects vp
  join public.profiles pr on pr.id=vp.owner_user_id
  where vp.project_key='rrm-2026' and pr.display_name='rebelranchfl'
  limit 1
), vals(asset_key, low_v, central_v, high_v, rationale) as (
  values
  ('academy-platform',80750::numeric,109250::numeric,142500::numeric,'Estimated professional reproduction hours multiplied by a blended web/product software rate.'),
  ('automation-framework',26250,39375,52500,'Estimated professional reproduction hours multiplied by a blended automation/agent/QA rate.'),
  ('curriculum-portfolio',40000,56000,72000,'Estimated professional reproduction hours multiplied by a blended curriculum/program-development rate.'),
  ('marketplace-business-freedom',21250,31875,42500,'Estimated professional reproduction hours multiplied by a blended business-system/program rate.'),
  ('brand-media-portfolio',17500,24500,31500,'Estimated professional reproduction hours multiplied by a blended brand/media rate.'),
  ('operating-playbooks',25500,38250,51000,'Estimated professional reproduction hours multiplied by a blended operations/SOP/AI-control rate.'),
  ('data-intake-framework',13500,20250,27000,'Estimated professional reproduction hours multiplied by a blended data/admin workflow rate.')
)
insert into public.academy_value_assessments (
  asset_id, value_lens, valuation_method, low_value, central_value, high_value, rationale, confidence
)
select a.id, 'replacement_cost', 'Cost-to-duplicate', v.low_v, v.central_v, v.high_v, v.rationale, 'medium'
from p
join public.academy_value_assets a on a.project_id=p.id
join vals v on v.asset_key=a.asset_key
on conflict (asset_id, value_lens) do update
set valuation_method=excluded.valuation_method,
    low_value=excluded.low_value,
    central_value=excluded.central_value,
    high_value=excluded.high_value,
    rationale=excluded.rationale,
    confidence=excluded.confidence,
    updated_at=now();

-- Tangible current-value lens for the known pig count only; other livestock/equipment remain to be inventoried.
with a as (
  select va.id
  from public.academy_value_assets va
  join public.academy_value_projects vp on vp.id=va.project_id
  join public.profiles pr on pr.id=vp.owner_user_id
  where vp.project_key='rrm-2026' and pr.display_name='rebelranchfl' and va.asset_key='pigs'
  limit 1
)
insert into public.academy_value_assessments (
  asset_id, value_lens, valuation_method, low_value, central_value, high_value, rationale, confidence, custom_inputs
)
select id, 'book_value', 'Current herd FMV planning proxy', 900, 1500, 2400,
       'Six confirmed pigs multiplied by planning unit values of $150 / $250 / $400. Acquisition cost, breed, sex, age and breeder status still require inventory documentation.',
       'low',
       jsonb_build_object('confirmed_count',6,'low_unit_value',150,'central_unit_value',250,'high_unit_value',400)
from a
on conflict (asset_id, value_lens) do update
set low_value=excluded.low_value,
    central_value=excluded.central_value,
    high_value=excluded.high_value,
    rationale=excluded.rationale,
    confidence=excluded.confidence,
    custom_inputs=excluded.custom_inputs,
    updated_at=now();

-- Research/source records supporting current IP market assessments.
with project_assessments as (
  select av.asset_key, aa.id as assessment_id
  from public.academy_value_assessments aa
  join public.academy_value_assets av on av.id=aa.asset_id
  join public.academy_value_projects vp on vp.id=av.project_id
  join public.profiles pr on pr.id=vp.owner_user_id
  where vp.project_key='rrm-2026' and pr.display_name='rebelranchfl' and aa.value_lens='market_value'
), source_rows(asset_key, source_title, publisher, source_url, source_type, notes) as (
  values
  ('academy-platform','Cost of LMS Development','Digital Heroes','https://digitalheroesco.com/journal/cost-lms-development-digital-heroes/','market_comparable','Custom LMS development pricing benchmark.'),
  ('academy-platform','How to Build an LMS','RaftLabs','https://www.raftlabs.com/blog/how-to-build-an-lms','market_comparable','Broader LMS development cost benchmark.'),
  ('align-platform','Web Developer Hiring and Cost Guide','Upwork','https://www.upwork.com/hire/web-developers/','market_comparable','Custom web-application pricing benchmark.'),
  ('align-platform','Software Development Pricing Guide','Clutch','https://clutch.co/developers/pricing','market_comparable','Reviewed software project cost benchmark.'),
  ('automation-framework','AI Developer Hiring Guide','Upwork','https://www.upwork.com/hire/ai-developers/how-to-hire/','market_comparable','AI development rate/project benchmark.'),
  ('automation-framework','Automation Freelancers','Upwork','https://www.upwork.com/hire/automation-freelancers/','market_comparable','Automation specialist pricing benchmark.'),
  ('curriculum-portfolio','Instructional Designer Cost Guide','Upwork','https://www.upwork.com/hire/instructional-designers/cost/','market_comparable','Instructional design labor benchmark.'),
  ('curriculum-portfolio','Custom eLearning Development Cost','Liberate Global','https://www.liberateglobal.com/blogs/how-much-does-custom-elearning-development-cost','market_comparable','Custom eLearning production benchmark.'),
  ('brand-media-portfolio','Brand Strategist Hiring Guide','Upwork','https://www.upwork.com/hire/brand-strategists/','market_comparable','Brand strategy market benchmark.'),
  ('brand-media-portfolio','Design Strategist Cost Guide','Upwork','https://www.upwork.com/hire/design-strategists/cost/','market_comparable','Design strategy labor benchmark.'),
  ('operating-playbooks','Automation Freelancers','Upwork','https://www.upwork.com/hire/automation-freelancers/','market_comparable','Automation/operations implementation benchmark.'),
  ('operating-playbooks','AI Developer Hiring Guide','Upwork','https://www.upwork.com/hire/ai-developers/how-to-hire/','market_comparable','Specialized AI systems labor benchmark.')
)
insert into public.academy_value_sources (assessment_id, source_title, publisher, source_url, source_type, accessed_on, notes)
select pa.assessment_id, sr.source_title, sr.publisher, sr.source_url, sr.source_type, date '2026-09-10', sr.notes
from project_assessments pa
join source_rows sr on sr.asset_key=pa.asset_key
where not exists (
  select 1 from public.academy_value_sources s
  where s.assessment_id=pa.assessment_id and s.source_url=sr.source_url
);

-- WIPO valuation-method source attached to every current IP market assessment.
with project_assessments as (
  select aa.id as assessment_id
  from public.academy_value_assessments aa
  join public.academy_value_assets av on av.id=aa.asset_id
  join public.academy_value_projects vp on vp.id=av.project_id
  join public.profiles pr on pr.id=vp.owner_user_id
  where vp.project_key='rrm-2026' and pr.display_name='rebelranchfl' and aa.value_lens='market_value'
)
insert into public.academy_value_sources (assessment_id, source_title, publisher, source_url, source_type, accessed_on, notes)
select assessment_id, 'Intellectual Property Valuation', 'WIPO', 'https://www.wipo.int/en/web/business/ip-valuation', 'official_guidance', date '2026-09-10',
       'WIPO recognizes cost, market and income approaches to IP valuation.'
from project_assessments pa
where not exists (
  select 1 from public.academy_value_sources s
  where s.assessment_id=pa.assessment_id and s.source_url='https://www.wipo.int/en/web/business/ip-valuation'
);

-- Current 10-step property/capital/valuation execution plan.
with p as (
  select vp.id
  from public.academy_value_projects vp
  join public.profiles pr on pr.id=vp.owner_user_id
  where vp.project_key='rrm-2026' and pr.display_name='rebelranchfl'
  limit 1
), steps(step_number,workstream,what_we_know,next_action,owner_label,target_date,status,dependency,proof_required,deliverable,notes,sort_order) as (
  values
  (1,'Parcel structure / property records','21621 and 21615 appear to be separate approximately 10-acre parcels with materially different tax bills.','Obtain official HCPA property cards and confirm ownership, parcel boundaries, current land use and current agricultural classification for both parcel suffixes .0 and .1.','RRM',date '2026-09-12','in_progress','HCPA records','Official property appraiser record','Property Fact Sheet','Do not treat the back 10 acres as proven until official parcel record is matched.',10),
  (2,'Greenbelt / agricultural tax value','Back parcel tax appears very low; house parcel has a meaningful land tax component.','Call HCPA Agriculture/Greenbelt and obtain current agricultural classification and agricultural assessed value for both parcels; record exact annual tax treatment.','RRM',date '2026-09-12','not_started','Step 1','Named HCPA source plus assessment figures','Owner Tax Benefit Calculation','HCPA general line: 813-272-6100.',20),
  (3,'Land-control / lease structure','RRM needs documented control to operate agriculture and pursue USDA programs.','Prepare agricultural lease/partner term sheet covering acreage, term, animals, improvements, utilities, access, grant-funded improvements, ownership of improvements and termination rights.','RRM + owner/counsel',date '2026-09-18','not_started','Steps 1-2','Signed agreement or counsel-ready draft','Land Control Package','Build owner economic benefit into the proposal.',30),
  (4,'FSA farm record + NRCS intake','USDA Plant City serves Hillsborough; farm record is the gateway to NRCS programs.','Contact Plant City Service Center; establish/update FSA farm records and request NRCS conservation planning for livestock water, fencing, soil/pasture and related practices.','RRM',date '2026-09-14','not_started','Step 3 / control evidence','FSA farm/tract record plus NRCS contact','USDA Farm File','Plant City Service Center: 813-752-1474.',40),
  (5,'FY2027 EQIP / CSP funding','Florida NRCS FY2027 batching deadline identified as 10/30/2026.','Map eligible practices, obtain conservation plan, gather application documents and submit before batching deadline.','RRM + NRCS',date '2026-10-20','not_started','Step 4','Application receipt / contract record','EQIP/CSP Funding File','Internal target leaves margin before 10/30 deadline.',50),
  (6,'USDA Community Facilities / capital','Separate rural facility capital source may support eligible public-serving nonprofit facilities.','Map Academy/community facility concept to eligible uses; verify rural-area status and grant/loan tier; confirm UEI and SAM.gov status.','FFN/RRM',date '2026-09-25','not_started','Entity docs / site','Written eligibility notes plus application checklist','Community Facilities Capital Map','Keep separate from agricultural conservation funding.',60),
  (7,'508 / 501 funding access','Church status can support exemption while some institutional funders demand determination/TEOS evidence.','Create funding-access matrix: direct church eligibility, determination-letter required, fiscal-sponsor acceptable; identify sponsor candidates only where needed.','FFN',date '2026-09-20','not_started','Governing/entity records','Funding eligibility matrix','Funding Access File','Do not describe 508 and 501(c)(3) as mutually exclusive concepts.',70),
  (8,'Tangible asset census','Known: six pigs. Other livestock/equipment counts are incomplete.','Inventory every animal, equipment item, infrastructure component, supplies and owned digital hardware; capture cost, FMV, ownership and photo/receipt evidence.','RRM',date '2026-09-13','not_started','Physical count','Signed inventory plus evidence folder','Tangible Asset Register','Needed to stop understating tangible/economic resources.',80),
  (9,'Replacement cost + contributed effort','Repo proves substantial software, program, automation, media and SOP infrastructure.','Validate replacement hours/rates with Git history, work records and market/vendor benchmarks; enter founder/volunteer actual hours.','RRM',date '2026-09-18','in_progress','Repo plus time evidence','Evidence-backed assumptions','Replacement Cost Schedule','Current central reproduction-cost model is approximately $319,500 before tightening.',90),
  (10,'Enterprise valuation + partner package','Cash is only liquidity; RRM needs a defensible operating-platform number and land-capital story.','Finalize enterprise value, productive livestock model, traction/revenue/funding pipeline and owner value proposition; issue one-page valuation summary plus partner deck/data room.','RRM',date '2026-09-22','in_progress','Steps 1-9','Reconciled model plus source file','RRM Enterprise / Partner Package','Current researched IP market-value midpoint is approximately $365,000; whole-enterprise valuation remains a separate model.',100)
)
insert into public.academy_value_actions (
  project_id, step_number, workstream, what_we_know, next_action, owner_label, target_date, status, dependency, proof_required, deliverable, notes, sort_order
)
select p.id, s.step_number, s.workstream, s.what_we_know, s.next_action, s.owner_label, s.target_date, s.status, s.dependency, s.proof_required, s.deliverable, s.notes, s.sort_order
from p cross join steps s
where not exists (
  select 1 from public.academy_value_actions a where a.project_id=p.id and a.step_number=s.step_number
);

-- Key assumptions/current working numbers. These are editable inputs, not locked constants.
with p as (
  select vp.id
  from public.academy_value_projects vp
  join public.profiles pr on pr.id=vp.owner_user_id
  where vp.project_key='rrm-2026' and pr.display_name='rebelranchfl'
  limit 1
), vals(assumption_key,label,value_text,value_number,value_date,source_or_basis,confidence,needs_update,notes) as (
  values
  ('operating_start','RRM operating start','April 2026',null::numeric,date '2026-04-01','RRM organizational records','high',false,'Use exact formal/operating date when preparing external documents.'),
  ('confirmed_pigs','Confirmed pig count',null,6,null,'RRM livestock records','high',false,'Breed, sex, age and breeder status still need inventory detail.'),
  ('ip_market_midpoint','Identified IP market-value midpoint',null,365000,null,'Research-supported market comparable schedule created 2026-09-10','medium',true,'Update as external licensing/sales and stronger comparable evidence develop.'),
  ('ip_market_low','Identified IP market-value low',null,175000,null,'Research-supported market comparable schedule created 2026-09-10','medium',true,'Working management estimate.'),
  ('ip_market_high','Identified IP market-value high',null,670000,null,'Research-supported market comparable schedule created 2026-09-10','medium',true,'Working management estimate.'),
  ('replacement_midpoint','Digital/program replacement-cost midpoint',null,319500,null,'Cost-to-duplicate schedule created 2026-09-10','medium',true,'Different valuation lens from market value; do not add blindly.'),
  ('replacement_low','Digital/program replacement-cost low',null,224750,null,'Cost-to-duplicate schedule created 2026-09-10','medium',true,'Different valuation lens from market value.'),
  ('replacement_high','Digital/program replacement-cost high',null,419000,null,'Cost-to-duplicate schedule created 2026-09-10','medium',true,'Different valuation lens from market value.')
)
insert into public.academy_value_assumptions (
  project_id, assumption_key, label, value_text, value_number, value_date, source_or_basis, confidence, needs_update, notes
)
select p.id, v.assumption_key, v.label, v.value_text, v.value_number, v.value_date, v.source_or_basis, v.confidence, v.needs_update, v.notes
from p cross join vals v
on conflict (project_id, assumption_key) do update
set label=excluded.label,
    value_text=excluded.value_text,
    value_number=excluded.value_number,
    value_date=excluded.value_date,
    source_or_basis=excluded.source_or_basis,
    confidence=excluded.confidence,
    needs_update=excluded.needs_update,
    notes=excluded.notes,
    updated_at=now();

commit;
