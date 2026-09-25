-- AI-Agent: Claude (Opus 5.5) · Session: Site verification & cleanup 2026-09-25
-- Owner-approved 2026-09-25.
--
-- 1) No overlaps across booking types. Before, double-booking was blocked only within the
--    same booking type (Campfire Stories and Let's Talk could both be booked at 10:00).
--    Now any confirmed booking of ANY type (with its buffers) blocks the time for every type,
--    and create/reschedule share ONE lock so two different types can't grab the same time
--    at the same instant.
-- 2) payment_required: booking types the owner confirms only after payment. The booking
--    email and the on-page "done" step tell the visitor the session is confirmed only once
--    payment is received (wording lives in _shared/booking.ts and assets/js/booking/book.js).
-- 3) Campfire Stories description shows the $5 price already published on
--    small-space-growing.html ("Come Hang Out ... $5").

alter table public.booking_event_types
  add column if not exists payment_required boolean not null default false;

update public.booking_event_types set payment_required = true, updated_at = now()
 where slug in ('campfire-stories','small-spaces-big-possibilities');

update public.booking_event_types
   set location_text = 'Your private Proton link will be sent after payment is received.', updated_at = now()
 where slug in ('campfire-stories','small-spaces-big-possibilities');

update public.booking_event_types
   set description = rtrim(description) || E'\n\nCost: $5', updated_at = now()
 where slug = 'campfire-stories' and description not like '%$5%';

do $mig$
declare d text;
begin
  -- booking_create: one shared lock for every booking type
  select pg_get_functiondef('public.booking_create(jsonb)'::regprocedure) into d;
  if position('''booking_event_type:'' || v_et_id::text' in d) = 0 then raise exception 'booking_create lock text not found'; end if;
  execute replace(d, '''booking_event_type:'' || v_et_id::text', '''booking_all_types''');

  -- booking_reschedule: same shared lock
  select pg_get_functiondef('public.booking_reschedule(uuid,timestamptz)'::regprocedure) into d;
  if position('''booking_event_type:'' || b.event_type_id::text' in d) = 0 then raise exception 'booking_reschedule lock text not found'; end if;
  execute replace(d, '''booking_event_type:'' || b.event_type_id::text', '''booking_all_types''');

  -- booking_slots: a time is open only if no confirmed booking of another type overlaps it
  select pg_get_functiondef('public.booking_slots(uuid,date,date,uuid)'::regprocedure) into d;
  if position('    and k.cnt < et.capacity_per_slot' in d) = 0 then raise exception 'booking_slots filter text not found'; end if;
  execute replace(d, '    and k.cnt < et.capacity_per_slot',
'    and k.cnt < et.capacity_per_slot
    and not exists (
      select 1
      from public.booking_bookings ob
      join public.booking_event_types oet on oet.id = ob.event_type_id
      where ob.event_type_id <> et.id
        and ob.status = ''confirmed''
        and (p_exclude_booking_id is null or ob.id <> p_exclude_booking_id)
        and tstzrange(ob.start_at - make_interval(mins => oet.buffer_before_minutes),
                      ob.end_at + make_interval(mins => oet.buffer_after_minutes))
            && tstzrange(c.s - bb, c.s + dur + ba)
    )');
end
$mig$;
