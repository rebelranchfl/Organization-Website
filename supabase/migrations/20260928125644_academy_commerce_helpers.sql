-- Helpers for the academy-commerce function.
-- AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
create or replace function public.academy_next_receipt_public()
returns text language sql volatile security definer set search_path to '' as $$ select private.academy_next_receipt(); $$;
revoke all on function public.academy_next_receipt_public() from public, anon, authenticated;
grant execute on function public.academy_next_receipt_public() to service_role;

create or replace function public.academy_is_admin()
returns boolean language sql stable security definer set search_path to '' as $$ select coalesce(private.is_admin(), false); $$;
revoke all on function public.academy_is_admin() from public, anon;
grant execute on function public.academy_is_admin() to authenticated;
