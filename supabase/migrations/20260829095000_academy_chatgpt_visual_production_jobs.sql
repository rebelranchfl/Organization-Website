-- AI-Agent: ChatGPT/Codex
-- Session: Water Ops Dashboard and Supabase recovery
-- Purpose: Track personal-ChatGPT image generation separately from GitHub integration.

create table if not exists public.academy_visual_production_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.academy_content_projects(project_id) on delete cascade,
  asset_key text not null,
  state text not null check (state in ('BRIEF_REQUIRED','READY_FOR_CHATGPT','CHATGPT_GENERATING','GENERATED_PENDING_INSPECTION','REVISION_REQUIRED','READY_FOR_INTEGRATION','INTEGRATING','DEPLOYED_QA_PENDING','VERIFIED','FAILED')),
  approved_brief_path text not null,
  destination_path text not null,
  generation_provider text,
  image_width integer check (image_width is null or image_width > 0),
  image_height integer check (image_height is null or image_height > 0),
  image_format text,
  github_commit_sha text,
  deployed_url text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  claimed_at timestamptz,
  generated_at timestamptz,
  inspected_at timestamptz,
  integrated_at timestamptz,
  verified_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, asset_key)
);

alter table public.academy_visual_production_jobs enable row level security;
drop policy if exists academy_visual_jobs_admin_read on public.academy_visual_production_jobs;
create policy academy_visual_jobs_admin_read on public.academy_visual_production_jobs for select to authenticated using (private.is_admin());
revoke all on public.academy_visual_production_jobs from anon, authenticated;
grant select on public.academy_visual_production_jobs to authenticated;

insert into public.academy_visual_production_jobs (project_id,asset_key,state,approved_brief_path,destination_path,generation_provider,image_width,image_height,image_format,generated_at,inspected_at)
values ('RRA-2026-0001','water-55gal-layered-filter-v1','READY_FOR_INTEGRATION','visual-production/owner-corrective-directive-2026-08-27.md','visual-production/assets/generated/water-55gal-layered-filter-v1.webp','CHATGPT_BUILT_IN_IMAGE_GENERATION',1024,1536,'webp',now(),now())
on conflict (project_id,asset_key) do update set state=excluded.state,approved_brief_path=excluded.approved_brief_path,destination_path=excluded.destination_path,generation_provider=excluded.generation_provider,image_width=excluded.image_width,image_height=excluded.image_height,image_format=excluded.image_format,generated_at=excluded.generated_at,inspected_at=excluded.inspected_at,last_error=null,updated_at=now();

comment on table public.academy_visual_production_jobs is 'Truthful handoff state for personal-ChatGPT raster generation, GitHub integration, and deployed QA.';
