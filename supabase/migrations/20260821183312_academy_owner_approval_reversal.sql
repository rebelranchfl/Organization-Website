alter table public.academy_content_review_events
  add column if not exists reversal_of_event_id uuid null;

alter table public.academy_content_review_events
  drop constraint if exists academy_content_review_events_reversal_of_event_id_fkey;

alter table public.academy_content_review_events
  add constraint academy_content_review_events_reversal_of_event_id_fkey
  foreign key (reversal_of_event_id)
  references public.academy_content_review_events(id)
  on delete set null;

alter table public.academy_content_review_events
  drop constraint if exists academy_content_review_events_decision_check;

alter table public.academy_content_review_events
  add constraint academy_content_review_events_decision_check
  check (decision in ('APPROVE','NEEDS_MORE_WORK','REJECT','REVERSE_APPROVAL'));

create index if not exists academy_content_review_events_reversal_idx
  on public.academy_content_review_events(reversal_of_event_id)
  where reversal_of_event_id is not null;

create or replace function public.reverse_academy_stage_approval(
  p_project_id text,
  p_review_stage text,
  p_comment text default null
)
returns public.academy_content_projects
language plpgsql
set search_path = ''
as $function$
declare
  v_project public.academy_content_projects;
  v_approval public.academy_content_review_events;
  v_comment text;
  v_progress_stage text;
  v_progress_next text;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if p_review_stage not in ('RESEARCH_REVIEW','PRODUCT_REVIEW','FINAL_PRODUCT_REVIEW') then
    raise exception 'Invalid review stage';
  end if;

  v_comment := nullif(btrim(coalesce(p_comment,'')), '');

  select *
  into v_project
  from public.academy_content_projects
  where project_id = p_project_id
  for update;

  if not found then
    raise exception 'Academy content project not found';
  end if;

  select e.*
  into v_approval
  from public.academy_content_review_events e
  where e.project_id = p_project_id
    and e.review_stage = p_review_stage
    and e.decision = 'APPROVE'
    and not exists (
      select 1
      from public.academy_content_review_events r
      where r.reversal_of_event_id = e.id
        and r.decision = 'REVERSE_APPROVAL'
    )
  order by e.created_at desc
  limit 1;

  if not found then
    raise exception 'No active approval exists for this review stage';
  end if;

  if v_approval.processed_at is null then
    update public.academy_content_review_events
    set processed_at = now(),
        processed_by_agent = 'OWNER_CONTROL_REVERSAL'
    where id = v_approval.id;
  end if;

  insert into public.academy_content_review_events(
    project_id,
    revision_number,
    review_stage,
    decision,
    comment,
    source_decisions,
    reviewer_user_id,
    reversal_of_event_id,
    processed_at,
    processed_by_agent
  ) values (
    v_project.project_id,
    v_approval.revision_number,
    p_review_stage,
    'REVERSE_APPROVAL',
    v_comment,
    '{}'::jsonb,
    auth.uid(),
    v_approval.id,
    now(),
    'OWNER_CONTROL'
  );

  if p_review_stage = 'RESEARCH_REVIEW' then
    v_progress_stage := 'Research Review — Approval Reversed';
    v_progress_next := 'Owner review reopened: review changes and submit a new Research Review decision when ready.';
  elsif p_review_stage = 'PRODUCT_REVIEW' then
    v_progress_stage := 'Product Review — Approval Reversed';
    v_progress_next := 'Owner review reopened: review product changes and submit a new Product Review decision when ready.';
  else
    v_progress_stage := 'Final Product Review — Approval Reversed';
    v_progress_next := 'Owner review reopened: review final delivery changes and submit a new Final Product Review decision when ready.';
  end if;

  update public.academy_content_projects
  set current_status = 'READY_FOR_REVIEW',
      workflow_stage = p_review_stage,
      owner_review_status = 'PENDING',
      latest_owner_comment = v_comment,
      progress_stage = v_progress_stage,
      progress_next = v_progress_next,
      progress_updated_at = now(),
      updated_at = now()
  where project_id = v_project.project_id
  returning * into v_project;

  return v_project;
end;
$function$;

revoke all on function public.reverse_academy_stage_approval(text,text,text) from public;
grant execute on function public.reverse_academy_stage_approval(text,text,text) to authenticated;
