-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: RR Website — RRA operations control center
-- Purpose: durable repository record of the Academy content progress-tracking fields already applied to production Supabase.

alter table public.academy_content_projects
  add column if not exists progress_percent integer not null default 0,
  add column if not exists progress_stage text,
  add column if not exists progress_detail text,
  add column if not exists progress_next text,
  add column if not exists progress_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.academy_content_projects'::regclass
      and conname = 'academy_content_projects_progress_percent_check'
  ) then
    alter table public.academy_content_projects
      add constraint academy_content_projects_progress_percent_check
      check (progress_percent >= 0 and progress_percent <= 100);
  end if;
end $$;

comment on column public.academy_content_projects.progress_percent is
  'Completion percentage for the current Academy workflow/revision cycle; not a clock-time ETA.';
comment on column public.academy_content_projects.progress_stage is
  'Owner-readable current workflow stage.';
comment on column public.academy_content_projects.progress_detail is
  'Plain-language description of what the active agent is doing now.';
comment on column public.academy_content_projects.progress_next is
  'Plain-language description of the next resumable action or owner decision.';
comment on column public.academy_content_projects.progress_updated_at is
  'Timestamp of the most recent meaningful progress update.';
