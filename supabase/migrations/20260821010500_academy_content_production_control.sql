-- AI-Agent: ChatGPT/Codex
-- Session: RRA content automation build
-- Purpose: Add the shared admin/control-plane tables for Rebel Ranch Academy content production.
-- GitHub remains the permanent content record; these tables provide dashboard-visible workflow state and owner review events.

create table if not exists public.academy_content_projects (
  project_id text primary key,
  github_branch text not null,
  github_path text not null,
  title text not null,
  learning_area text not null,
  current_status text not null check (current_status in (
    'NEW_IDEA',
    'AGENT_WORKING',
    'READY_FOR_REVIEW',
    'NEEDS_MORE_WORK',
    'APPROVED',
    'REJECTED',
    'PUBLISHING',
    'LIVE'
  )),
  revision_number integer not null default 1 check (revision_number >= 1),
  proposed_price numeric(10,2),
  currency text not null default 'USD',
  source_count integer not null default 0 check (source_count >= 0),
  material_summary text,
  qa_status text,
  owner_review_status text not null default 'PENDING' check (owner_review_status in ('PENDING','APPROVED','NEEDS_MORE_WORK','REJECTED')),
  latest_owner_comment text,
  last_agent text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_content_review_events (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.academy_content_projects(project_id) on delete cascade,
  revision_number integer not null check (revision_number >= 1),
  decision text not null check (decision in ('APPROVE','NEEDS_MORE_WORK','REJECT')),
  comment text,
  source_decisions jsonb not null default '{}'::jsonb,
  reviewer_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by_agent text
);

create index if not exists academy_content_projects_status_idx
  on public.academy_content_projects (current_status, updated_at desc);

create index if not exists academy_content_review_events_project_idx
  on public.academy_content_review_events (project_id, created_at desc);

create trigger academy_content_projects_set_updated_at
before update on public.academy_content_projects
for each row execute function private.set_updated_at();

alter table public.academy_content_projects enable row level security;
alter table public.academy_content_review_events enable row level security;

revoke all on table public.academy_content_projects from anon;
revoke all on table public.academy_content_review_events from anon;

grant select, insert, update on table public.academy_content_projects to authenticated;
grant select, insert on table public.academy_content_review_events to authenticated;

create policy academy_content_projects_admin_select
on public.academy_content_projects
for select
to authenticated
using ((select private.is_admin()));

create policy academy_content_projects_admin_insert
on public.academy_content_projects
for insert
to authenticated
with check ((select private.is_admin()));

create policy academy_content_projects_admin_update
on public.academy_content_projects
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy academy_content_review_events_admin_select
on public.academy_content_review_events
for select
to authenticated
using ((select private.is_admin()));

create policy academy_content_review_events_admin_insert
on public.academy_content_review_events
for insert
to authenticated
with check (
  (select private.is_admin())
  and reviewer_user_id = (select auth.uid())
);
