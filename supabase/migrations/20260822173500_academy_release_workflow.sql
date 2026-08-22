-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: RR Website — Academy Release Workflow

create table if not exists public.academy_release_records (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.academy_content_projects(project_id),
  revision_number integer not null,
  version_label text,
  destination text,
  release_url text,
  release_notes text,
  prep_checklist jsonb not null default '{}'::jsonb,
  status text not null default 'PREP' check (status in ('PREP','READY_OWNER_DECISION','APPROVED_TO_PUBLISH','HELD','RETURNED_FOR_WORK','PUBLISHED_PENDING_VERIFY','LIVE','CANCELLED')),
  owner_decision text check (owner_decision is null or owner_decision in ('APPROVE_RELEASE','HOLD','RETURN_FOR_WORK')),
  owner_note text,
  owner_decided_by uuid,
  owner_decided_at timestamptz,
  published_at timestamptz,
  published_note text,
  verified_at timestamptz,
  verified_by uuid,
  verification_note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academy_release_records_project_idx on public.academy_release_records(project_id, created_at desc);

alter table public.academy_release_records enable row level security;

drop policy if exists academy_release_records_admin_select on public.academy_release_records;
create policy academy_release_records_admin_select on public.academy_release_records for select to authenticated using (private.is_admin());

drop policy if exists academy_release_records_admin_insert on public.academy_release_records;
create policy academy_release_records_admin_insert on public.academy_release_records for insert to authenticated with check (private.is_admin());

drop policy if exists academy_release_records_admin_update on public.academy_release_records;
create policy academy_release_records_admin_update on public.academy_release_records for update to authenticated using (private.is_admin()) with check (private.is_admin());

revoke delete on public.academy_release_records from anon, authenticated;

grant select, insert, update on public.academy_release_records to authenticated;

create or replace function public.start_academy_release_prep(p_project_id text, p_version_label text default null)
returns public.academy_release_records
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_project public.academy_content_projects;
  v_release public.academy_release_records;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;

  select * into v_project from public.academy_content_projects where project_id=p_project_id for update;
  if not found then raise exception 'Academy content project not found'; end if;
  if not (v_project.workflow_stage='FINAL_PRODUCT_REVIEW' and v_project.current_status='APPROVED') then
    raise exception 'Final Product must be approved before Release Prep begins';
  end if;

  insert into public.academy_release_records(project_id, revision_number, version_label, status, created_by)
  values(v_project.project_id, coalesce(v_project.revision_number,1), nullif(btrim(coalesce(p_version_label,'')),''), 'PREP', auth.uid())
  returning * into v_release;

  update public.academy_content_projects
  set workflow_stage='AWAITING_RELEASE', current_status='AWAITING_RELEASE', owner_review_status=null,
      progress_percent=0, progress_stage='Release Prep',
      progress_detail='Final Product is approved. Release Prep has begun. The product is not released or public yet.',
      progress_next='Complete the release record and submit it for the Owner Release Decision.',
      last_agent='Academy Release Workflow / Owner', progress_updated_at=now(), last_synced_at=now(), updated_at=now()
  where project_id=v_project.project_id;

  return v_release;
end;
$$;

create or replace function public.save_academy_release_prep(
  p_release_id uuid,
  p_version_label text,
  p_destination text,
  p_release_url text,
  p_release_notes text,
  p_checklist jsonb default '{}'::jsonb
)
returns public.academy_release_records
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_release public.academy_release_records;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  select * into v_release from public.academy_release_records where id=p_release_id for update;
  if not found then raise exception 'Release record not found'; end if;
  if v_release.status not in ('PREP','READY_OWNER_DECISION') then raise exception 'Release Prep is no longer editable'; end if;

  update public.academy_release_records set
    version_label=nullif(btrim(coalesce(p_version_label,'')),''),
    destination=nullif(btrim(coalesce(p_destination,'')),''),
    release_url=nullif(btrim(coalesce(p_release_url,'')),''),
    release_notes=nullif(btrim(coalesce(p_release_notes,'')),''),
    prep_checklist=coalesce(p_checklist,'{}'::jsonb), updated_at=now()
  where id=p_release_id returning * into v_release;
  return v_release;
end;
$$;

create or replace function public.mark_academy_release_ready(p_release_id uuid)
returns public.academy_release_records
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_release public.academy_release_records;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  select * into v_release from public.academy_release_records where id=p_release_id for update;
  if not found then raise exception 'Release record not found'; end if;
  if v_release.status <> 'PREP' then raise exception 'Release record is not in prep'; end if;
  if nullif(btrim(coalesce(v_release.version_label,'')),'') is null then raise exception 'Version label is required'; end if;
  if nullif(btrim(coalesce(v_release.destination,'')),'') is null then raise exception 'Release destination is required'; end if;

  update public.academy_release_records set status='READY_OWNER_DECISION', updated_at=now() where id=p_release_id returning * into v_release;
  update public.academy_content_projects set current_status='READY_FOR_RELEASE_DECISION', workflow_stage='AWAITING_RELEASE',
    progress_percent=100, progress_stage='Release Prep Complete',
    progress_detail='The approved product release package is prepared. Nothing has been published yet.',
    progress_next='Owner decision required: Approve Release, Hold, or Return for Work.',
    progress_updated_at=now(), last_synced_at=now(), updated_at=now()
  where project_id=v_release.project_id;
  return v_release;
end;
$$;

create or replace function public.set_academy_release_owner_decision(
  p_release_id uuid,
  p_decision text,
  p_note text default null,
  p_return_stage text default null
)
returns public.academy_release_records
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_release public.academy_release_records;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('APPROVE_RELEASE','HOLD','RETURN_FOR_WORK') then raise exception 'Invalid release decision'; end if;
  select * into v_release from public.academy_release_records where id=p_release_id for update;
  if not found then raise exception 'Release record not found'; end if;
  if v_release.status <> 'READY_OWNER_DECISION' then raise exception 'Release is not awaiting owner decision'; end if;

  if p_decision='APPROVE_RELEASE' then
    update public.academy_release_records set status='APPROVED_TO_PUBLISH', owner_decision=p_decision, owner_note=nullif(btrim(coalesce(p_note,'')),''), owner_decided_by=auth.uid(), owner_decided_at=now(), updated_at=now() where id=p_release_id returning * into v_release;
    update public.academy_content_projects set workflow_stage='PUBLISHING', current_status='APPROVED_TO_PUBLISH', progress_percent=0,
      progress_stage='Approved to Publish', progress_detail='The owner authorized publication of this prepared version. It is not LIVE until publication is recorded and verified.',
      progress_next='Publish/deploy the authorized version, then record the live URL and verify the actual released product.', progress_updated_at=now(), last_synced_at=now(), updated_at=now()
    where project_id=v_release.project_id;
  elsif p_decision='HOLD' then
    update public.academy_release_records set status='HELD', owner_decision=p_decision, owner_note=nullif(btrim(coalesce(p_note,'')),''), owner_decided_by=auth.uid(), owner_decided_at=now(), updated_at=now() where id=p_release_id returning * into v_release;
    update public.academy_content_projects set workflow_stage='AWAITING_RELEASE', current_status='RELEASE_HOLD', progress_percent=100,
      progress_stage='Release Hold', progress_detail='The final product remains approved but unreleased by owner decision.', progress_next='No release action until the owner chooses to resume or prepares a new release record.', progress_updated_at=now(), last_synced_at=now(), updated_at=now()
    where project_id=v_release.project_id;
  else
    if p_return_stage not in ('PRODUCT_WORKING','VISUAL_PRODUCTION') then raise exception 'Return stage must be PRODUCT_WORKING or VISUAL_PRODUCTION'; end if;
    if nullif(btrim(coalesce(p_note,'')),'') is null then raise exception 'Return-for-work note is required'; end if;
    update public.academy_release_records set status='RETURNED_FOR_WORK', owner_decision=p_decision, owner_note=btrim(p_note), owner_decided_by=auth.uid(), owner_decided_at=now(), updated_at=now() where id=p_release_id returning * into v_release;
    update public.academy_content_projects set workflow_stage=p_return_stage, current_status='AGENT_WORKING', owner_review_status='NEEDS_MORE_WORK', progress_percent=0,
      progress_stage=case when p_return_stage='PRODUCT_WORKING' then 'Product Design — Release Return' else 'Visual Production — Release Return' end,
      progress_detail='Release Prep identified an issue that must be corrected before a new release can be authorized.', progress_next=btrim(p_note), progress_updated_at=now(), last_synced_at=now(), updated_at=now()
    where project_id=v_release.project_id;
  end if;
  return v_release;
end;
$$;

create or replace function public.record_academy_release_published(p_release_id uuid, p_live_url text, p_note text default null)
returns public.academy_release_records
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_release public.academy_release_records;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  if nullif(btrim(coalesce(p_live_url,'')),'') is null then raise exception 'Published URL or delivery location is required'; end if;
  select * into v_release from public.academy_release_records where id=p_release_id for update;
  if not found then raise exception 'Release record not found'; end if;
  if v_release.status <> 'APPROVED_TO_PUBLISH' then raise exception 'Release is not authorized for publication'; end if;
  update public.academy_release_records set status='PUBLISHED_PENDING_VERIFY', release_url=btrim(p_live_url), published_at=now(), published_note=nullif(btrim(coalesce(p_note,'')),''), updated_at=now() where id=p_release_id returning * into v_release;
  update public.academy_content_projects set workflow_stage='PUBLISHING', current_status='PUBLISHED_PENDING_VERIFY', progress_percent=75,
    progress_stage='Published — Verify Live', progress_detail='Publication has been recorded, but the release is not LIVE until the actual released experience is verified.',
    progress_next='Open the released destination, verify the intended version and critical learner path, then record Live verification.', progress_updated_at=now(), last_synced_at=now(), updated_at=now()
  where project_id=v_release.project_id;
  return v_release;
end;
$$;

create or replace function public.verify_academy_release_live(p_release_id uuid, p_live_url text default null, p_note text default null)
returns public.academy_release_records
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_release public.academy_release_records;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  select * into v_release from public.academy_release_records where id=p_release_id for update;
  if not found then raise exception 'Release record not found'; end if;
  if v_release.status <> 'PUBLISHED_PENDING_VERIFY' then raise exception 'Published release is not awaiting verification'; end if;
  update public.academy_release_records set status='LIVE', release_url=coalesce(nullif(btrim(coalesce(p_live_url,'')),''),release_url), verified_at=now(), verified_by=auth.uid(), verification_note=nullif(btrim(coalesce(p_note,'')),''), updated_at=now() where id=p_release_id returning * into v_release;
  update public.academy_content_projects set workflow_stage='LIVE', current_status='LIVE', progress_percent=100,
    progress_stage='Live', progress_detail='The owner-authorized release was published and the released experience was verified live.',
    progress_next='Monitor learner experience and record future changes as a new revision/release rather than overwriting this release history.', progress_updated_at=now(), last_synced_at=now(), updated_at=now()
  where project_id=v_release.project_id;
  return v_release;
end;
$$;

grant execute on function public.start_academy_release_prep(text,text) to authenticated;
grant execute on function public.save_academy_release_prep(uuid,text,text,text,text,jsonb) to authenticated;
grant execute on function public.mark_academy_release_ready(uuid) to authenticated;
grant execute on function public.set_academy_release_owner_decision(uuid,text,text,text) to authenticated;
grant execute on function public.record_academy_release_published(uuid,text,text) to authenticated;
grant execute on function public.verify_academy_release_live(uuid,text,text) to authenticated;
