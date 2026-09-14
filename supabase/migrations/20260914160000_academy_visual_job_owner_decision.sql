-- AI-Agent: Claude (Claude Code)
-- Session: RRA pipeline reactivation verification, owner-directed, 2026-09-14
-- Purpose: RPC backing the owner's three-way decision on a visual-job verification
--   conflict, per chatgpt-visual-handoff-contract.md Section 6. No automatic retry --
--   this is the only path that may move a REVISION_REQUIRED row forward.

create or replace function public.submit_academy_visual_job_decision(
  p_job_id uuid,
  p_decision text,
  p_note text default null
)
returns public.academy_visual_production_jobs
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_job public.academy_visual_production_jobs;
  v_note text;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if p_decision not in ('OVERRIDE_PROCEED','AUTHORIZE_RETRY','FIX_CHECKER') then
    raise exception 'Invalid decision';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');

  select * into v_job
    from public.academy_visual_production_jobs
   where id = p_job_id
   for update;

  if not found then
    raise exception 'Visual production job not found';
  end if;

  if v_job.state <> 'REVISION_REQUIRED' then
    raise exception 'Job is not awaiting a verification-conflict decision (current state: %)', v_job.state;
  end if;

  if v_job.owner_decision is not null then
    raise exception 'This conflict already has a recorded owner decision';
  end if;

  if p_decision = 'OVERRIDE_PROCEED' then
    update public.academy_visual_production_jobs
       set owner_decision = p_decision,
           owner_decision_note = v_note,
           owner_decision_at = now(),
           state = 'READY_FOR_INTEGRATION',
           updated_at = now()
     where id = p_job_id
     returning * into v_job;

  elsif p_decision = 'AUTHORIZE_RETRY' then
    if v_job.attempt_count >= 3 then
      raise exception 'This job has already had % attempts. Escalate rather than authorizing another automatic retry.', v_job.attempt_count;
    end if;
    update public.academy_visual_production_jobs
       set owner_decision = p_decision,
           owner_decision_note = v_note,
           owner_decision_at = now(),
           state = 'READY_FOR_CHATGPT',
           attempt_count = v_job.attempt_count + 1,
           generation_self_check = null,
           verification_report = null,
           verification_outcome = null,
           last_error = null,
           updated_at = now()
     where id = p_job_id
     returning * into v_job;

  else
    update public.academy_visual_production_jobs
       set owner_decision = p_decision,
           owner_decision_note = v_note,
           owner_decision_at = now(),
           updated_at = now()
     where id = p_job_id
     returning * into v_job;
  end if;

  return v_job;
end;
$$;

revoke all on function public.submit_academy_visual_job_decision(uuid, text, text) from public;
grant execute on function public.submit_academy_visual_job_decision(uuid, text, text) to authenticated;
