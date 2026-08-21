alter table public.academy_content_projects
  add column if not exists owner_priority text not null default 'NORMAL',
  add column if not exists owner_hold boolean not null default false,
  add column if not exists owner_queue_order bigint null,
  add column if not exists owner_queue_note text null;

alter table public.academy_content_projects
  drop constraint if exists academy_content_projects_owner_priority_check;
alter table public.academy_content_projects
  add constraint academy_content_projects_owner_priority_check
  check (owner_priority in ('NORMAL','HIGH','IMMEDIATE'));

create table if not exists public.academy_content_owner_edits (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.academy_content_projects(project_id) on delete cascade,
  revision_number integer not null check (revision_number >= 1),
  file_path text not null,
  original_text text not null,
  replacement_text text not null,
  context_before text null,
  context_after text null,
  occurrence_index integer null,
  owner_note text null,
  status text not null default 'PENDING' check (status in ('PENDING','APPLIED','BLOCKED','SUPERSEDED')),
  requested_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  applied_at timestamptz null,
  applied_commit_sha text null,
  applied_by_agent text null
);

alter table public.academy_content_owner_edits enable row level security;

drop policy if exists academy_content_owner_edits_admin_select on public.academy_content_owner_edits;
create policy academy_content_owner_edits_admin_select
on public.academy_content_owner_edits for select
to authenticated
using ((select private.is_admin()));

drop policy if exists academy_content_owner_edits_admin_insert on public.academy_content_owner_edits;
create policy academy_content_owner_edits_admin_insert
on public.academy_content_owner_edits for insert
to authenticated
with check ((select private.is_admin()) and requested_by = (select auth.uid()));

drop policy if exists academy_content_owner_edits_admin_update on public.academy_content_owner_edits;
create policy academy_content_owner_edits_admin_update
on public.academy_content_owner_edits for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

grant select, insert, update on public.academy_content_owner_edits to authenticated;

create index if not exists academy_content_owner_edits_project_status_idx
  on public.academy_content_owner_edits(project_id,status,created_at);
create index if not exists academy_content_projects_owner_queue_idx
  on public.academy_content_projects(owner_hold,owner_priority,owner_queue_order,created_at);

create or replace function public.set_academy_owner_queue_control(
  p_project_id text,
  p_priority text default null,
  p_hold boolean default null,
  p_move_to_top boolean default false,
  p_note text default null
)
returns public.academy_content_projects
language plpgsql
set search_path = ''
as $function$
declare
  v_project public.academy_content_projects;
  v_order bigint;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  if p_priority is not null and p_priority not in ('NORMAL','HIGH','IMMEDIATE') then raise exception 'Invalid owner priority'; end if;
  if p_move_to_top then select coalesce(min(owner_queue_order),0)-1 into v_order from public.academy_content_projects; end if;
  update public.academy_content_projects
  set owner_priority = coalesce(p_priority, owner_priority),
      owner_hold = coalesce(p_hold, owner_hold),
      owner_queue_order = case when p_move_to_top then v_order else owner_queue_order end,
      owner_queue_note = case when p_note is not null then nullif(btrim(p_note),'') else owner_queue_note end,
      updated_at = now()
  where project_id = p_project_id
  returning * into v_project;
  if v_project.project_id is null then raise exception 'Academy content project not found'; end if;
  return v_project;
end;
$function$;

revoke all on function public.set_academy_owner_queue_control(text,text,boolean,boolean,text) from public;
grant execute on function public.set_academy_owner_queue_control(text,text,boolean,boolean,text) to authenticated;

create or replace function public.submit_academy_owner_edit(
  p_project_id text,
  p_file_path text,
  p_original_text text,
  p_replacement_text text,
  p_context_before text default null,
  p_context_after text default null,
  p_occurrence_index integer default null,
  p_note text default null
)
returns public.academy_content_owner_edits
language plpgsql
set search_path = ''
as $function$
declare
  v_project public.academy_content_projects;
  v_edit public.academy_content_owner_edits;
  v_order bigint;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  if nullif(btrim(coalesce(p_file_path,'')),'') is null then raise exception 'File path is required'; end if;
  if coalesce(p_original_text,'') = '' then raise exception 'Original selected text is required'; end if;
  if p_replacement_text is null then raise exception 'Replacement text is required'; end if;
  select * into v_project from public.academy_content_projects where project_id=p_project_id for update;
  if not found then raise exception 'Academy content project not found'; end if;
  insert into public.academy_content_owner_edits(
    project_id,revision_number,file_path,original_text,replacement_text,context_before,context_after,occurrence_index,owner_note,requested_by
  ) values (
    v_project.project_id,v_project.revision_number,btrim(p_file_path),p_original_text,p_replacement_text,p_context_before,p_context_after,p_occurrence_index,nullif(btrim(coalesce(p_note,'')),''),auth.uid()
  ) returning * into v_edit;
  select coalesce(min(owner_queue_order),0)-1 into v_order from public.academy_content_projects;
  update public.academy_content_projects
  set owner_priority='IMMEDIATE', owner_hold=false, owner_queue_order=v_order,
      owner_queue_note='Pending owner inline edit', updated_at=now()
  where project_id=v_project.project_id;
  return v_edit;
end;
$function$;

revoke all on function public.submit_academy_owner_edit(text,text,text,text,text,text,integer,text) from public;
grant execute on function public.submit_academy_owner_edit(text,text,text,text,text,text,integer,text) to authenticated;
