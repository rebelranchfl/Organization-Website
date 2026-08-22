-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: RR Website — learner language, visuals, and signal tracking
-- Purpose: privacy-minimized structured learner/product signals for Academy Audience + Opportunity Intelligence.

create table if not exists public.academy_learner_signals (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.academy_content_projects(project_id) on delete cascade,
  experience_key text not null,
  session_key text,
  user_id uuid,
  signal_type text not null check (signal_type in (
    'PROFILE_ANSWER','TOOL_EVENT','DEPTH_CHOICE','COMPLETION','ABANDONMENT',
    'RESULT_CATEGORY','OPPORTUNITY_TRIGGER','FORMAT_PREFERENCE','NEXT_LEARNING_CHOICE'
  )),
  signal_key text not null,
  signal_value text,
  signal_metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint academy_learner_signals_experience_key_len check (char_length(experience_key) between 1 and 120),
  constraint academy_learner_signals_session_key_len check (session_key is null or char_length(session_key) <= 120),
  constraint academy_learner_signals_signal_key_len check (char_length(signal_key) between 1 and 120),
  constraint academy_learner_signals_signal_value_len check (signal_value is null or char_length(signal_value) <= 240),
  constraint academy_learner_signals_metadata_object check (jsonb_typeof(signal_metadata) = 'object'),
  constraint academy_learner_signals_no_identity_keys check (
    not (signal_metadata ?| array['name','email','phone','address','ip','ip_address','browser_fingerprint'])
  )
);

create index if not exists academy_learner_signals_project_idx
  on public.academy_learner_signals(project_id, occurred_at desc);
create index if not exists academy_learner_signals_type_key_idx
  on public.academy_learner_signals(signal_type, signal_key, signal_value);
create index if not exists academy_learner_signals_session_idx
  on public.academy_learner_signals(session_key)
  where session_key is not null;

alter table public.academy_learner_signals enable row level security;

revoke all on table public.academy_learner_signals from anon, authenticated;
grant select on table public.academy_learner_signals to authenticated;

drop policy if exists academy_learner_signals_admin_select on public.academy_learner_signals;
create policy academy_learner_signals_admin_select
  on public.academy_learner_signals
  for select
  to authenticated
  using (private.is_admin());

create or replace function public.record_academy_learner_signal(
  p_project_id text,
  p_experience_key text,
  p_signal_type text,
  p_signal_key text,
  p_signal_value text default null,
  p_session_key text default null,
  p_signal_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_metadata jsonb := coalesce(p_signal_metadata, '{}'::jsonb);
begin
  if p_project_id is null or not exists (
    select 1 from public.academy_content_projects where project_id = p_project_id
  ) then
    raise exception 'Unknown Academy project';
  end if;

  if p_signal_type not in (
    'PROFILE_ANSWER','TOOL_EVENT','DEPTH_CHOICE','COMPLETION','ABANDONMENT',
    'RESULT_CATEGORY','OPPORTUNITY_TRIGGER','FORMAT_PREFERENCE','NEXT_LEARNING_CHOICE'
  ) then
    raise exception 'Unsupported learner signal type';
  end if;

  if char_length(coalesce(p_experience_key,'')) not between 1 and 120
     or char_length(coalesce(p_signal_key,'')) not between 1 and 120
     or char_length(coalesce(p_signal_value,'')) > 240
     or char_length(coalesce(p_session_key,'')) > 120 then
    raise exception 'Learner signal value exceeds allowed length';
  end if;

  if jsonb_typeof(v_metadata) <> 'object'
     or v_metadata ?| array['name','email','phone','address','ip','ip_address','browser_fingerprint'] then
    raise exception 'Learner signal metadata must be a privacy-minimized object';
  end if;

  insert into public.academy_learner_signals (
    project_id, experience_key, session_key, user_id,
    signal_type, signal_key, signal_value, signal_metadata
  ) values (
    p_project_id, p_experience_key, nullif(p_session_key,''), auth.uid(),
    p_signal_type, p_signal_key, nullif(p_signal_value,''), v_metadata
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_academy_learner_signal(text,text,text,text,text,text,jsonb) from public;
grant execute on function public.record_academy_learner_signal(text,text,text,text,text,text,jsonb) to anon, authenticated;

comment on table public.academy_learner_signals is
  'Privacy-minimized structured learner/product signals used by Rebel Ranch Academy Audience + Opportunity Intelligence. Do not store names, emails, addresses, IPs, browser fingerprints, or unrestricted personal narratives here.';
comment on function public.record_academy_learner_signal(text,text,text,text,text,text,jsonb) is
  'Public-safe structured learner signal intake. Validates project, signal type, lengths, and blocks common identity keys before insert.';