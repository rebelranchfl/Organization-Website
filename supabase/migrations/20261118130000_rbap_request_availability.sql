-- Allow the request calendar to read RBAP slots without enabling direct booking.
do $migration$
declare definition text := pg_get_functiondef('public.booking_slots(uuid,date,date,uuid)'::regprocedure);
begin
  if position('if not found or not et.active then' in definition) = 0 then
    raise exception 'Unexpected booking_slots availability guard';
  end if;
  execute replace(definition, 'if not found or not et.active then', $guard$if not found or (not et.active and et.slug not in ('rbap-animal-care-intro', 'rbap-growing-food-intro', 'rbap-natural-systems-intro', 'rbap-farm-to-table-intro', 'rbap-hydroponics-intro', 'rbap-aquaponics-intro')) then$guard$);
end;
$migration$;
