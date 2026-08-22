-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: RR Website — Final Product Acceptance Checklist

create table if not exists public.academy_final_product_acceptance (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.academy_content_projects(project_id) on delete cascade,
  revision_number integer not null,
  checklist jsonb not null default '{}'::jsonb,
  owner_note text,
  passed boolean not null default false,
  submitted_by uuid,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, revision_number)
);

alter table public.academy_final_product_acceptance enable row level security;
revoke all on public.academy_final_product_acceptance from anon;
grant select, insert, update on public.academy_final_product_acceptance to authenticated;

create policy academy_final_product_acceptance_admin_select on public.academy_final_product_acceptance
for select to authenticated using (private.is_admin());
create policy academy_final_product_acceptance_admin_insert on public.academy_final_product_acceptance
for insert to authenticated with check (private.is_admin());
create policy academy_final_product_acceptance_admin_update on public.academy_final_product_acceptance
for update to authenticated using (private.is_admin()) with check (private.is_admin());

create or replace function public.submit_academy_final_product_acceptance(
  p_project_id text,
  p_checklist jsonb,
  p_owner_note text default null
) returns public.academy_final_product_acceptance
language plpgsql
set search_path to public, pg_temp
as $$
declare
  v_project public.academy_content_projects;
  v_row public.academy_final_product_acceptance;
  v_required text[] := array[
    'complete_journey','customer_value','personalization_integrity','visual_teaching',
    'practical_implementation','navigation_state','plain_language','evidence_integrity',
    'testing_verification','safety_proportionality','technical_delivery','owner_value_test'
  ];
  v_key text;
  v_passed boolean := true;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  select * into v_project from public.academy_content_projects where project_id=p_project_id;
  if not found then raise exception 'Academy content project not found'; end if;
  if v_project.workflow_stage <> 'FINAL_PRODUCT_REVIEW' then
    raise exception 'Final Product Acceptance is only available at Final Product Review';
  end if;
  foreach v_key in array v_required loop
    if coalesce((p_checklist->>v_key)::boolean,false) is not true then v_passed := false; end if;
  end loop;
  insert into public.academy_final_product_acceptance(project_id,revision_number,checklist,owner_note,passed,submitted_by,submitted_at,updated_at)
  values(v_project.project_id,v_project.revision_number,coalesce(p_checklist,'{}'::jsonb),nullif(btrim(coalesce(p_owner_note,'')),''),v_passed,auth.uid(),now(),now())
  on conflict(project_id,revision_number) do update set
    checklist=excluded.checklist, owner_note=excluded.owner_note, passed=excluded.passed,
    submitted_by=excluded.submitted_by, submitted_at=now(), updated_at=now()
  returning * into v_row;
  return v_row;
end;
$$;

grant execute on function public.submit_academy_final_product_acceptance(text,jsonb,text) to authenticated;

create or replace function public.enforce_academy_final_product_acceptance()
returns trigger
language plpgsql
set search_path to public, pg_temp
as $$
declare v_revision integer;
begin
  if new.review_stage='FINAL_PRODUCT_REVIEW' and new.decision='APPROVE' then
    select revision_number into v_revision from public.academy_content_projects where project_id=new.project_id;
    if not exists (
      select 1 from public.academy_final_product_acceptance
      where project_id=new.project_id and revision_number=v_revision and passed=true
    ) then
      raise exception 'Final Product Acceptance checklist must pass before Final Product approval';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_academy_final_product_acceptance on public.academy_content_review_events;
create trigger trg_enforce_academy_final_product_acceptance
before insert on public.academy_content_review_events
for each row execute function public.enforce_academy_final_product_acceptance();
