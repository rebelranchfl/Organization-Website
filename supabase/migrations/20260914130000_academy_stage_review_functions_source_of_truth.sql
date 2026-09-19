-- AI-Agent: Claude (Claude Code)
-- Session: RRA end-to-end pipeline verification (owner-requested, RRA-2026-0011 test)
-- Purpose: Reconcile a real repository-integrity gap found while walking RRA-2026-0011
--   through Owner Research Review.
--
-- Defect: the live Supabase project already runs four functions that the current
--   Academy stage-review dashboard (academy-stage-review.js,
--   academy-stage-review-completion-router.js, academy-stage-review-owner-experience.js)
--   depends on directly -- submit_academy_stage_review, submit_academy_owner_edit,
--   return_academy_final_product_for_work, submit_academy_stage_feedback -- but NONE of
--   them exist in any committed migration in this repository. They were applied to the
--   live database directly at some point and never captured in GitHub.
--
-- Per content-automation.md: "GitHub/repository records are the permanent source of
--   truth... Supabase dashboard rows are not substitutes for the GitHub project record"
--   and "The presence of a table, RPC, function, row, or historical migration is not
--   proof that the current end-to-end behavior works." The inverse gap is just as real:
--   live behavior the repository can't reproduce is exactly how a rebuild, a rollback, or
--   a fresh environment silently loses working functionality without anyone noticing
--   until an owner clicks a button that should be there and isn't wired the way anyone
--   expected.
--
-- This migration captures the exact current live definitions (verified via
-- pg_get_functiondef against project dfrwxpuojeiykaignyny on 2026-09-14) as
-- create-or-replace, so applying it is a no-op against the current live database and
-- only closes the GitHub/live gap. No behavior changes here -- see the separate
-- 20260914140000 migration for the actual workflow_stage default fix.

-- ============================================================================
-- submit_academy_stage_review: the Owner Decision buttons (Approve / Needs More
-- Work / Reject) on academy-stage-review.html call this directly.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.submit_academy_stage_review(p_project_id text, p_review_stage text, p_decision text, p_comment text DEFAULT NULL::text, p_source_decisions jsonb DEFAULT '{}'::jsonb)
 RETURNS academy_content_projects
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_project public.academy_content_projects;
  v_comment text;
  v_next_stage text;
  v_status text;
  v_review_status text;
  v_progress_stage text;
  v_progress_detail text;
  v_progress_next text;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if p_review_stage not in ('RESEARCH_REVIEW','PRODUCT_REVIEW','FINAL_PRODUCT_REVIEW') then
    raise exception 'Invalid review stage';
  end if;

  if p_decision not in ('APPROVE','NEEDS_MORE_WORK','REJECT') then
    raise exception 'Invalid review decision';
  end if;

  v_comment := nullif(btrim(coalesce(p_comment,'')), '');
  if p_decision in ('NEEDS_MORE_WORK','REJECT') and v_comment is null then
    raise exception 'A review comment is required for this decision';
  end if;

  select *
    into v_project
    from public.academy_content_projects
   where project_id = p_project_id
   for update;

  if not found then
    raise exception 'Academy content project not found';
  end if;

  if v_project.current_status <> 'READY_FOR_REVIEW' then
    raise exception 'Project is not ready for owner review';
  end if;

  if v_project.workflow_stage <> p_review_stage then
    raise exception 'Review gate mismatch: project is at %, not %', v_project.workflow_stage, p_review_stage;
  end if;

  if p_decision = 'APPROVE' then
    v_status := 'APPROVED';
    v_review_status := 'APPROVED';

    if p_review_stage = 'RESEARCH_REVIEW' then
      v_next_stage := 'PRODUCT_OPPORTUNITY_RESEARCH';
      v_progress_stage := 'Product Opportunity Research — Authorized';
      v_progress_detail := 'The owner approved the Research Foundation. Product Opportunity Research is the next authorized stage. No worker is implied to be running by this approval.';
      v_progress_next := 'Begin Product Opportunity Research only through an authorized, verified execution path.';
    elsif p_review_stage = 'PRODUCT_REVIEW' then
      v_next_stage := 'VISUAL_PRODUCTION';
      v_progress_stage := 'Visual Production — Authorized';
      v_progress_detail := 'The owner approved Product Design. Visual / learner-experience production is the next authorized stage. No public release is authorized and no worker is implied to be running by this approval.';
      v_progress_next := 'Begin Visual Production only through an authorized, verified execution path; complete rendered QA before Final Product Review.';
    else
      v_next_stage := 'FINAL_PRODUCT_REVIEW';
      v_progress_stage := 'Final Product Approved — Not Released';
      v_progress_detail := 'The owner approved the actual Final Product revision. The product is accepted but remains unreleased.';
      v_progress_next := 'Release Prep may begin as a separate controlled step. Publication still requires a separate Owner Release Decision and live verification.';
    end if;

  elsif p_decision = 'NEEDS_MORE_WORK' then
    v_status := 'NEEDS_MORE_WORK';
    v_review_status := 'NEEDS_MORE_WORK';

    if p_review_stage = 'RESEARCH_REVIEW' then
      v_next_stage := 'RESEARCH_WORKING';
      v_progress_stage := 'Research — Owner Return';
      v_progress_detail := 'The owner returned the Research Foundation for more work.';
      v_progress_next := v_comment;
    elsif p_review_stage = 'PRODUCT_REVIEW' then
      v_next_stage := 'PRODUCT_WORKING';
      v_progress_stage := 'Product Design — Owner Return';
      v_progress_detail := 'The owner returned Product Design for more work.';
      v_progress_next := v_comment;
    else
      v_next_stage := 'VISUAL_PRODUCTION';
      v_progress_stage := 'Visual Production — Owner Return';
      v_progress_detail := 'The owner returned the learner-facing product for visual / delivery correction. A deeper return to Product Design or Research requires an explicit stage-specific control action rather than being guessed from a generic Needs More Work decision.';
      v_progress_next := v_comment;
    end if;

  else
    v_status := 'REJECTED';
    v_review_status := 'REJECTED';
    v_next_stage := 'REJECTED';
    v_progress_stage := 'Rejected — Owner Decision';
    v_progress_detail := 'The owner rejected the current reviewed direction. Forward movement is stopped and the history is preserved.';
    v_progress_next := v_comment;
  end if;

  insert into public.academy_content_review_events(
    project_id,
    revision_number,
    review_stage,
    decision,
    comment,
    source_decisions,
    reviewer_user_id,
    processed_at,
    processed_by_agent
  ) values (
    v_project.project_id,
    v_project.revision_number,
    p_review_stage,
    p_decision,
    v_comment,
    case when p_review_stage = 'RESEARCH_REVIEW' then coalesce(p_source_decisions,'{}'::jsonb) else '{}'::jsonb end,
    auth.uid(),
    now(),
    'ACADEMY_CONTROL_PLANE'
  );

  update public.academy_content_projects
     set current_status = v_status,
         workflow_stage = v_next_stage,
         owner_review_status = v_review_status,
         latest_owner_comment = v_comment,
         progress_percent = case
           when p_decision = 'APPROVE' and p_review_stage = 'FINAL_PRODUCT_REVIEW' then 100
           else 0
         end,
         progress_stage = v_progress_stage,
         progress_detail = v_progress_detail,
         progress_next = v_progress_next,
         progress_updated_at = now(),
         last_synced_at = now(),
         updated_at = now()
   where project_id = v_project.project_id
   returning * into v_project;

  return v_project;
end;
$function$;

REVOKE ALL ON FUNCTION public.submit_academy_stage_review(text, text, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_academy_stage_review(text, text, text, text, jsonb) TO authenticated;

-- ============================================================================
-- return_academy_final_product_for_work: the "Return to Product Design" /
-- "Return to Research" buttons on the Final Product Review gate.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.return_academy_final_product_for_work(p_project_id text, p_target_stage text, p_comment text)
 RETURNS academy_content_projects
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_project public.academy_content_projects;
  v_comment text;
  v_progress_stage text;
  v_progress_detail text;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if p_target_stage not in ('PRODUCT_WORKING','RESEARCH_WORKING') then
    raise exception 'Final Product return stage must be Product Design or Research';
  end if;

  v_comment := nullif(btrim(coalesce(p_comment,'')), '');
  if v_comment is null then
    raise exception 'Owner direction is required for a deeper Final Product return';
  end if;

  select *
    into v_project
    from public.academy_content_projects
   where project_id = p_project_id
   for update;

  if not found then
    raise exception 'Academy content project not found';
  end if;

  if not (v_project.workflow_stage = 'FINAL_PRODUCT_REVIEW' and v_project.current_status = 'READY_FOR_REVIEW') then
    raise exception 'Project is not awaiting a Final Product Review decision';
  end if;

  if p_target_stage = 'PRODUCT_WORKING' then
    v_progress_stage := 'Product Design — Final Product Return';
    v_progress_detail := 'The owner returned the actual learner-facing product to Product Design because the final experience revealed a product architecture/content/value issue that must be corrected before Visual Production resumes.';
  else
    v_progress_stage := 'Research — Final Product Return';
    v_progress_detail := 'The owner returned the actual learner-facing product to Research because the final experience revealed an evidence/research defect that must be corrected before downstream product work resumes.';
  end if;

  insert into public.academy_content_review_events(
    project_id,
    revision_number,
    review_stage,
    decision,
    comment,
    source_decisions,
    reviewer_user_id,
    processed_at,
    processed_by_agent
  ) values (
    v_project.project_id,
    v_project.revision_number,
    'FINAL_PRODUCT_REVIEW',
    'NEEDS_MORE_WORK',
    v_comment,
    jsonb_build_object('return_stage', p_target_stage),
    auth.uid(),
    now(),
    'ACADEMY_CONTROL_PLANE'
  );

  update public.academy_content_projects
     set current_status = 'NEEDS_MORE_WORK',
         workflow_stage = p_target_stage,
         owner_review_status = 'NEEDS_MORE_WORK',
         latest_owner_comment = v_comment,
         progress_percent = 0,
         progress_stage = v_progress_stage,
         progress_detail = v_progress_detail,
         progress_next = v_comment,
         progress_updated_at = now(),
         last_synced_at = now(),
         updated_at = now()
   where project_id = v_project.project_id
   returning * into v_project;

  return v_project;
end;
$function$;

REVOKE ALL ON FUNCTION public.return_academy_final_product_for_work(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.return_academy_final_product_for_work(text, text, text) TO authenticated;

-- ============================================================================
-- submit_academy_owner_edit: the inline "Edit Highlighted Text" control on the
-- Research Review reader.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.submit_academy_owner_edit(p_project_id text, p_file_path text, p_original_text text, p_replacement_text text, p_context_before text DEFAULT NULL::text, p_context_after text DEFAULT NULL::text, p_occurrence_index integer DEFAULT NULL::integer, p_note text DEFAULT NULL::text)
 RETURNS academy_content_owner_edits
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_project public.academy_content_projects;
  v_edit public.academy_content_owner_edits;
  v_order bigint;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;
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

REVOKE ALL ON FUNCTION public.submit_academy_owner_edit(text, text, text, text, text, text, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_academy_owner_edit(text, text, text, text, text, text, integer, text) TO authenticated;

-- ============================================================================
-- submit_academy_stage_feedback: the Owner Visual Feedback panel on Visual
-- Production / Final Product Review.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.submit_academy_stage_feedback(p_project_id text, p_stage text, p_component_key text, p_feedback_type text, p_note text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if coalesce(trim(p_note),'') = '' then
    raise exception 'Feedback note is required';
  end if;
  if p_feedback_type not in ('CHANGE_REQUEST','COMMENT','APPROVAL_NOTE') then
    raise exception 'Unsupported feedback type';
  end if;
  insert into public.academy_stage_feedback(project_id,stage,component_key,feedback_type,note,requested_by)
  values(p_project_id,p_stage,nullif(trim(p_component_key),''),p_feedback_type,trim(p_note),auth.uid())
  returning id into v_id;
  return v_id;
end;
$function$;

-- Live grant state includes PUBLIC on this one function; captured as-is rather than
-- silently narrowed, since the function itself still enforces private.is_admin().
-- Worth an explicit owner decision on whether PUBLIC should be revoked here, but that is
-- a judgment call outside the scope of this reconciliation.
REVOKE ALL ON FUNCTION public.submit_academy_stage_feedback(text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_academy_stage_feedback(text, text, text, text, text) TO PUBLIC, authenticated;
