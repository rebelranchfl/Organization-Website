-- Preserve KPI facts that cannot be reconstructed from the current project row.
alter table public.project_templates add column skill_tags text[] not null default '{}';

create table public.project_progress_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creator_projects(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  status public.creation_project_status not null,
  completion smallint not null check(completion between 0 and 100),
  recorded_at timestamptz not null default now()
);
create index project_progress_events_project_time_idx on public.project_progress_events(project_id,recorded_at);
create index project_progress_events_owner_time_idx on public.project_progress_events(owner_user_id,recorded_at);
create index project_progress_events_creator_time_idx on public.project_progress_events(creator_id,recorded_at);
alter table public.project_progress_events enable row level security;
grant select on public.project_progress_events to authenticated;
create policy project_progress_events_owner_read on public.project_progress_events for select to authenticated
using(owner_user_id=(select auth.uid()) or private.is_creation_station_admin());

create or replace function private.capture_project_progress()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if tg_op='INSERT' or new.status is distinct from old.status or new.completion is distinct from old.completion then
    insert into public.project_progress_events(project_id,owner_user_id,creator_id,status,completion)
    values(new.id,new.owner_user_id,new.creator_id,new.status,new.completion);
  end if;
  return new;
end $$;
revoke all on function private.capture_project_progress() from public,anon,authenticated;
create trigger capture_project_progress after insert or update of status,completion on public.creator_projects
for each row execute function private.capture_project_progress();

update public.project_templates set skill_tags=array['planning','making','reflection'] where title='My First Maker Project';
update public.project_templates set skill_tags=array['pricing','costing','business'] where title='Price a Handmade Product';
update public.project_templates set skill_tags=array['branding','storytelling','website_readiness'] where title='Build Your Creator Brand Story';
