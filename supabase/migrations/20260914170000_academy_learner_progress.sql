-- AI-Agent: Claude (Claude Code)
-- Session: RRA pipeline reactivation verification, owner-directed, 2026-09-14
-- Purpose: Real per-user, server-saved Academy lesson progress, per explicit owner
--   authorization given this session (overriding the Program Hub's prior device-local
--   default, which required separate owner approval before server-saved learner
--   records could be built -- that approval was given in chat and is recorded in
--   rebel ranch academy/Rebel-Ranch-Academy-Program-Hub/README.md).
--
-- Privacy note: this table stores only what is needed to resume a lesson and to
-- preserve the learner's own written activity responses. It does not duplicate
-- identity data already in auth.users/public.profiles. RLS restricts every row to
-- its owning user; only an admin (private.is_admin()) can read across users, for the
-- same reasons/controls already governing every other admin-only table in this schema.

create table if not exists public.academy_learner_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null references public.academy_content_projects(project_id) on delete cascade,
  current_section integer not null default 0,
  total_sections integer not null default 0,
  percent_complete integer not null default 0,
  activity_answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academy_learner_progress_percent_check check (percent_complete between 0 and 100),
  constraint academy_learner_progress_user_project_key unique (user_id, project_id)
);

comment on table public.academy_learner_progress is 'Real per-user, server-saved Academy lesson progress (section reached, percent complete, written activity answers). Owner-authorized 2026-09-14 to replace the device-local-only default for authenticated learners.';

alter table public.academy_learner_progress enable row level security;

create policy academy_learner_progress_owner_all
  on public.academy_learner_progress
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy academy_learner_progress_admin_select
  on public.academy_learner_progress
  for select
  using (private.is_admin());

create index if not exists academy_learner_progress_project_idx
  on public.academy_learner_progress (project_id);
