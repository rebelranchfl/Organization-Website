-- AI-Agent: Claude Code (Claude Opus 5.5)
-- Session: Custom booking system build for rebelranchministries.org (2026-09-24)
-- Purpose: Found in testing. When a visitor acknowledged an OLDER version of a required
-- waiver (because the owner edited it while they were filling out the form), booking_create
-- raised 'requirement_missing'. It still blocked the booking, but the page could not tell
-- the visitor to re-read the updated waiver. It now raises 'requirement_outdated' in that
-- case, which makes book.html reload the current wording. No rule is loosened.

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
      -- Signed an earlier version of this requirement? Then the wording changed mid-visit.
      if exists (
        select 1 from jsonb_array_elements(v_acks) a
        join public.booking_requirement_versions ov on ov.id::text = a.value->>'requirement_version_id'
        where ov.requirement_id = req.id
      ) then
        raise exception 'booking:requirement_outdated';
      end if;
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

  if jsonb_array_length(v_acks) > v_used then
    raise exception 'booking:requirement_outdated';
  end if;

  return v_booking_id;
end;
$$;

revoke all on function public.booking_create(jsonb) from public, anon, authenticated;
grant execute on function public.booking_create(jsonb) to service_role;
