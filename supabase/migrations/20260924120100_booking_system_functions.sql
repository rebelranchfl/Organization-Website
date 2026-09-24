-- AI-Agent: Claude Code (Claude Opus 5.5)
-- Session: Custom booking system build for rebelranchministries.org (2026-09-24)
-- Purpose: Slot math, atomic booking creation, and rescheduling for the booking system.
-- These functions are callable ONLY by the service role (the booking-* Edge Functions).
-- Double-booking is prevented here, in the database, not just in the page:
--   every create/reschedule takes a transaction-scoped advisory lock for the visit type,
--   then re-counts overlapping confirmed bookings (including buffers) against capacity.
-- The lock is keyed on the visit type (not type + exact start time) on purpose: two
-- different start times can still overlap once duration and buffers are applied, so a
-- per-start-time lock would let overlapping bookings race past each other.

-- ---------------------------------------------------------------------------
-- Open slots for one visit type between two local dates (inclusive).
-- Rules:
--  * A closed override on a date (for all types, or this type) closes the day.
--  * Custom-hours overrides for a date replace weekly hours (this type's own first,
--    otherwise the all-types ones).
--  * Otherwise weekly hours: this type's own rules if it has any, else the all-types rules.
--  * Slot starts step by slot_interval_minutes (defaults to duration) and must fully fit.
--  * Local wall-clock times are converted with the settings time zone, so DST is handled
--    by Postgres' time zone database. A tour's length is real elapsed time.
--  * min_notice_hours and max_days_ahead are enforced.
--  * A slot is full when confirmed bookings whose [start - buffer_before, end + buffer_after]
--    overlaps the candidate's buffered range reach capacity_per_slot.
-- ---------------------------------------------------------------------------
create or replace function public.booking_slots(
  p_event_type_id uuid,
  p_from date,
  p_to date,
  p_exclude_booking_id uuid default null
)
returns table (start_at timestamptz, end_at timestamptz, remaining integer)
language plpgsql
stable
set search_path = ''
as $$
declare
  et public.booking_event_types%rowtype;
  tz text;
  today_local date;
  horizon date;
  earliest timestamptz;
  step_min integer;
  own_rules boolean;
  d date;
  w record;
  m integer;
  st_min integer;
  en_min integer;
  cand timestamptz[] := '{}';
  dur interval;
  bb interval;
  ba interval;
begin
  select * into et from public.booking_event_types t where t.id = p_event_type_id;
  if not found or not et.active then
    return;
  end if;

  select s.timezone into tz from public.booking_settings s where s.id;
  tz := coalesce(tz, 'America/New_York');
  today_local := (now() at time zone tz)::date;
  horizon := today_local + et.max_days_ahead;
  earliest := now() + make_interval(hours => et.min_notice_hours);
  step_min := coalesce(et.slot_interval_minutes, et.duration_minutes);
  dur := make_interval(mins => et.duration_minutes);
  bb := make_interval(mins => et.buffer_before_minutes);
  ba := make_interval(mins => et.buffer_after_minutes);
  own_rules := exists (select 1 from public.booking_availability_rules r where r.event_type_id = et.id);

  if p_from is null or p_to is null or p_to < p_from then
    return;
  end if;
  if p_to - p_from > 62 then
    p_to := p_from + 62;
  end if;

  for d in
    select g::date from generate_series(greatest(p_from, today_local), least(p_to, horizon), interval '1 day') g
  loop
    if exists (
      select 1 from public.booking_date_overrides o
      where o.date = d and o.closed and (o.event_type_id is null or o.event_type_id = et.id)
    ) then
      continue;
    end if;

    for w in
      select o.start_time as st, o.end_time as en
      from public.booking_date_overrides o
      where o.date = d and not o.closed and o.event_type_id = et.id
      union all
      select o.start_time, o.end_time
      from public.booking_date_overrides o
      where o.date = d and not o.closed and o.event_type_id is null
        and not exists (
          select 1 from public.booking_date_overrides o2
          where o2.date = d and not o2.closed and o2.event_type_id = et.id
        )
      union all
      select r.start_time, r.end_time
      from public.booking_availability_rules r
      where r.weekday = extract(dow from d)::int
        and ((own_rules and r.event_type_id = et.id) or (not own_rules and r.event_type_id is null))
        and not exists (
          select 1 from public.booking_date_overrides o3
          where o3.date = d and not o3.closed and (o3.event_type_id is null or o3.event_type_id = et.id)
        )
    loop
      st_min := (extract(epoch from w.st) / 60)::int;
      en_min := (extract(epoch from w.en) / 60)::int;
      m := st_min;
      while m + et.duration_minutes <= en_min loop
        cand := cand || ((d::timestamp + make_interval(mins => m)) at time zone tz);
        m := m + step_min;
      end loop;
    end loop;
  end loop;

  return query
  select c.s, c.s + dur, (et.capacity_per_slot - k.cnt)::integer
  from (select distinct unnest(cand) as s) c
  cross join lateral (
    select count(*)::integer as cnt
    from public.booking_bookings b
    where b.event_type_id = et.id
      and b.status = 'confirmed'
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
      and tstzrange(b.start_at - bb, b.end_at + ba) && tstzrange(c.s - bb, c.s + dur + ba)
  ) k
  where c.s >= earliest
    and (c.s at time zone tz)::date <= horizon
    and k.cnt < et.capacity_per_slot
  order by c.s;
end;
$$;

-- ---------------------------------------------------------------------------
-- Atomic booking creation. Raises 'booking:<code>' errors the Edge Function maps to
-- visitor-friendly messages. Returns the new booking id.
-- p = {
--   event_type_id, start_at, name, email, phone, party_size, minors_count,
--   guardian_name, notes, manage_token_hash, user_agent,
--   acknowledgments: [{requirement_version_id, typed_name, guardian_typed_name}]
-- }
-- ---------------------------------------------------------------------------
create or replace function public.booking_create(p jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_et_id uuid := nullif(p->>'event_type_id', '')::uuid;
  v_start timestamptz := nullif(p->>'start_at', '')::timestamptz;
  et public.booking_event_types%rowtype;
  tz text;
  v_enabled boolean;
  v_party integer := coalesce(nullif(p->>'party_size', '')::integer, 0);
  v_minors integer := coalesce(nullif(p->>'minors_count', '')::integer, 0);
  v_guardian text := nullif(btrim(coalesce(p->>'guardian_name', '')), '');
  v_acks jsonb := coalesce(p->'acknowledgments', '[]'::jsonb);
  v_booking_id uuid;
  v_needs_guardian boolean;
  req record;
  ack jsonb;
  v_used integer := 0;
begin
  if v_et_id is null or v_start is null then
    raise exception 'booking:invalid_request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('booking_event_type:' || v_et_id::text, 0));

  select s.public_booking_enabled, s.timezone into v_enabled, tz from public.booking_settings s where s.id;
  if not coalesce(v_enabled, false) then
    raise exception 'booking:disabled';
  end if;

  select * into et from public.booking_event_types t where t.id = v_et_id;
  if not found or not et.active then
    raise exception 'booking:event_type_unavailable';
  end if;

  if v_party < 1 or v_party > et.max_party_size then
    raise exception 'booking:party_size';
  end if;
  if v_minors < 0 or v_minors > v_party then
    raise exception 'booking:minors_count';
  end if;
  if length(btrim(coalesce(p->>'name', ''))) < 1 or position('@' in coalesce(p->>'email', '')) < 2 then
    raise exception 'booking:contact_missing';
  end if;

  if not exists (
    select 1 from public.booking_slots(v_et_id, (v_start at time zone tz)::date, (v_start at time zone tz)::date) s
    where s.start_at = v_start
  ) then
    raise exception 'booking:slot_unavailable';
  end if;

  select exists (
    select 1 from public.booking_requirements r
    where r.active and r.requires_guardian_for_minors
      and (r.applies_to_all or exists (
        select 1 from public.booking_requirement_event_types j
        where j.requirement_id = r.id and j.event_type_id = v_et_id))
  ) into v_needs_guardian;
  if v_minors > 0 and v_needs_guardian and v_guardian is null then
    raise exception 'booking:guardian_missing';
  end if;

  insert into public.booking_bookings (
    event_type_id, start_at, end_at, status, name, email, phone, party_size, minors_count,
    guardian_name, notes, manage_token_hash
  ) values (
    v_et_id, v_start, v_start + make_interval(mins => et.duration_minutes), 'confirmed',
    btrim(p->>'name'), lower(btrim(p->>'email')), nullif(btrim(coalesce(p->>'phone', '')), ''),
    v_party, v_minors, v_guardian, nullif(btrim(coalesce(p->>'notes', '')), ''),
    p->>'manage_token_hash'
  ) returning id into v_booking_id;

  for req in
    select r.*, cv.id as version_id
    from public.booking_requirements r
    join lateral (
      select v.id from public.booking_requirement_versions v
      where v.requirement_id = r.id order by v.version_number desc limit 1
    ) cv on true
    where r.active
      and (r.applies_to_all or exists (
        select 1 from public.booking_requirement_event_types j
        where j.requirement_id = r.id and j.event_type_id = v_et_id))
    order by r.sort_order, r.created_at
  loop
    ack := null;
    select a.value into ack
    from jsonb_array_elements(v_acks) a
    where a.value->>'requirement_version_id' = req.version_id::text
    limit 1;

    if ack is null then
      if req.required then
        raise exception 'booking:requirement_missing:%', req.id;
      end if;
      continue;
    end if;

    if req.requires_typed_name and length(btrim(coalesce(ack->>'typed_name', ''))) < 2 then
      raise exception 'booking:typed_name_missing:%', req.id;
    end if;
    if req.requires_guardian_for_minors and v_minors > 0
       and length(btrim(coalesce(ack->>'guardian_typed_name', ''))) < 2 then
      raise exception 'booking:guardian_signature_missing:%', req.id;
    end if;

    insert into public.booking_acknowledgments (
      booking_id, requirement_version_id, typed_name, guardian_typed_name, user_agent
    ) values (
      v_booking_id, req.version_id,
      nullif(left(btrim(coalesce(ack->>'typed_name', '')), 160), ''),
      case when v_minors > 0 then nullif(left(btrim(coalesce(ack->>'guardian_typed_name', '')), 160), '') end,
      left(p->>'user_agent', 400)
    );
    v_used := v_used + 1;
  end loop;

  -- Any acknowledgment that did not match a CURRENT applicable version means the waiver
  -- changed while the visitor was filling out the form: make them review it again.
  if jsonb_array_length(v_acks) > v_used then
    raise exception 'booking:requirement_outdated';
  end if;

  return v_booking_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reschedule a confirmed, upcoming booking. Keeps acknowledgments. Resets the reminder.
-- ---------------------------------------------------------------------------
create or replace function public.booking_reschedule(p_booking_id uuid, p_new_start timestamptz)
returns table (old_start_at timestamptz, new_start_at timestamptz, new_end_at timestamptz)
language plpgsql
set search_path = ''
as $$
declare
  b public.booking_bookings%rowtype;
  et public.booking_event_types%rowtype;
  tz text;
  v_enabled boolean;
begin
  select * into b from public.booking_bookings x where x.id = p_booking_id;
  if not found then
    raise exception 'booking:not_found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('booking_event_type:' || b.event_type_id::text, 0));

  select * into b from public.booking_bookings x where x.id = p_booking_id for update;
  if b.status <> 'confirmed' then
    raise exception 'booking:not_active';
  end if;
  if b.start_at <= now() then
    raise exception 'booking:already_started';
  end if;

  select s.public_booking_enabled, s.timezone into v_enabled, tz from public.booking_settings s where s.id;
  if not coalesce(v_enabled, false) then
    raise exception 'booking:disabled';
  end if;
  select * into et from public.booking_event_types t where t.id = b.event_type_id;

  if not exists (
    select 1 from public.booking_slots(b.event_type_id, (p_new_start at time zone tz)::date,
                                       (p_new_start at time zone tz)::date, b.id) s
    where s.start_at = p_new_start
  ) then
    raise exception 'booking:slot_unavailable';
  end if;

  update public.booking_bookings
  set start_at = p_new_start,
      end_at = p_new_start + make_interval(mins => et.duration_minutes),
      rescheduled_at = now(),
      reminder_sent_at = null
  where id = b.id;

  return query select b.start_at, p_new_start, p_new_start + make_interval(mins => et.duration_minutes);
end;
$$;

-- ---------------------------------------------------------------------------
-- Claim reminders that are due right now. Setting reminder_sent_at inside the same
-- statement (with SKIP LOCKED) guarantees two overlapping runs never claim the same
-- booking. Bookings made inside the reminder window get no separate reminder (their
-- confirmation email already arrived close to the visit).
-- ---------------------------------------------------------------------------
create or replace function public.booking_claim_due_reminders()
returns setof public.booking_bookings
language plpgsql
set search_path = ''
as $$
declare
  hrs integer;
begin
  select s.reminder_hours_before into hrs from public.booking_settings s where s.id;
  hrs := coalesce(hrs, 24);
  return query
  update public.booking_bookings b
  set reminder_sent_at = now()
  where b.id in (
    select x.id from public.booking_bookings x
    where x.status = 'confirmed'
      and x.reminder_sent_at is null
      and x.start_at > now()
      and x.start_at <= now() + make_interval(hours => hrs)
      and coalesce(x.rescheduled_at, x.created_at) <= x.start_at - make_interval(hours => hrs)
    for update skip locked
  )
  returning b.*;
end;
$$;

-- Service role only. Nothing here is callable by anon or signed-in users.
revoke all on function public.booking_slots(uuid, date, date, uuid) from public, anon, authenticated;
revoke all on function public.booking_create(jsonb) from public, anon, authenticated;
revoke all on function public.booking_reschedule(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.booking_claim_due_reminders() from public, anon, authenticated;
grant execute on function public.booking_slots(uuid, date, date, uuid) to service_role;
grant execute on function public.booking_create(jsonb) to service_role;
grant execute on function public.booking_reschedule(uuid, timestamptz) to service_role;
grant execute on function public.booking_claim_due_reminders() to service_role;
