-- Academy commerce: fixes from the independent review (2026-09-28).
-- AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
-- HIGH-1  material is served only from the LIVE release the catalog shows (server-only lookup).
-- MED-1   an item with no price is never listed and never free; no fallback to the unapproved proposed price.
-- MED-4   one active/past-due membership per person (database rule).
-- MED-5   ACTIVE memberships stop granting access 3 days after the paid period if PayPal goes quiet.
-- LOW     revoke TRUNCATE on Academy commerce tables; receipt counter not callable by users;
--         admin read on academy-covers so cover replacement works.

-- Catalog: only priced LIVE releases; price comes only from the release.
drop function if exists public.get_academy_catalog();
create function public.get_academy_catalog()
returns table (
  project_id text, release_id uuid, title text, summary text, item_type text,
  learning_area_id text, price_usd numeric, cover_image_url text, has_material boolean,
  material_kind text, released_at timestamptz
)
language sql stable security definer set search_path to '' as $$
  select distinct on (r.project_id)
    r.project_id, r.id,
    coalesce(nullif(btrim(r.public_title),''), p.title),
    r.public_summary,
    coalesce(r.item_type,'LESSON'),
    coalesce(r.learning_area_id, p.learning_area_id),
    r.price_usd,
    r.cover_image_url,
    r.material_path is not null,
    r.material_kind,
    coalesce(r.verified_at, r.published_at)
  from public.academy_release_records r
  join public.academy_content_projects p on p.project_id = r.project_id
  where p.workflow_stage = 'LIVE' and r.status = 'LIVE' and r.published_at is not null
    and r.price_usd is not null
    and coalesce(p.archived,false) = false
  order by r.project_id, coalesce(r.verified_at, r.published_at) desc;
$$;
revoke all on function public.get_academy_catalog() from public;
grant execute on function public.get_academy_catalog() to anon, authenticated, service_role;

-- One place that decides access, for a given person.
create or replace function private.academy_user_can_open(p_uid uuid, p_project_id text)
returns boolean language plpgsql stable security definer set search_path to '' as $$
declare v_price numeric;
begin
  select c.price_usd into v_price from public.get_academy_catalog() c where c.project_id = p_project_id;
  if not found then return false; end if;                 -- not released (or no price): nobody
  if v_price = 0 then return true; end if;                -- free
  if p_uid is null then return false; end if;
  if exists (select 1 from public.user_roles ur where ur.user_id = p_uid and ur.role = 'admin') then return true; end if;
  if exists (select 1 from public.academy_purchases where user_id = p_uid and project_id = p_project_id and status = 'COMPLETED') then return true; end if;
  if exists (select 1 from public.academy_member_subscriptions s
             where s.user_id = p_uid and s.includes_all
               and ((s.status = 'ACTIVE' and (s.current_period_end is null or s.current_period_end > now() - interval '3 days'))
                 or (s.status in ('CANCELLED','PAST_DUE') and s.current_period_end > now()))) then return true; end if;
  return false;
end $$;
revoke all on function private.academy_user_can_open(uuid, text) from public, anon, authenticated;

create or replace function public.academy_can_open(p_project_id text)
returns boolean language sql stable security definer set search_path to '' as $$
  select private.academy_user_can_open(auth.uid(), p_project_id);
$$;
revoke all on function public.academy_can_open(text) from public;
grant execute on function public.academy_can_open(text) to anon, authenticated;

-- Server-only: the material of the LIVE catalog release, if this person may open it.
create or replace function public.academy_material_for(p_uid uuid, p_project_id text)
returns table (release_id uuid, title text, material_path text, material_kind text, material_filename text)
language sql stable security definer set search_path to '' as $$
  select r.id, coalesce(nullif(btrim(r.public_title),''), c.title), r.material_path, r.material_kind, r.material_filename
  from public.get_academy_catalog() c
  join public.academy_release_records r on r.id = c.release_id and r.status = 'LIVE'
  where c.project_id = p_project_id and r.material_path is not null
    and private.academy_user_can_open(p_uid, p_project_id);
$$;
revoke all on function public.academy_material_for(uuid, text) from public, anon, authenticated;
grant execute on function public.academy_material_for(uuid, text) to service_role;

-- My Materials uses the same access rule.
create or replace function public.get_my_academy_library()
returns table (project_id text, release_id uuid, title text, item_type text, learning_area_id text,
               cover_image_url text, material_kind text, access_via text)
language sql stable security definer set search_path to '' as $$
  select c.project_id, c.release_id, c.title, c.item_type, c.learning_area_id, c.cover_image_url, c.material_kind,
    case when exists (select 1 from public.academy_purchases pu where pu.user_id = auth.uid() and pu.project_id = c.project_id and pu.status='COMPLETED')
         then 'PURCHASE' else 'MEMBERSHIP' end
  from public.get_academy_catalog() c
  where auth.uid() is not null and c.has_material and c.price_usd > 0
    and private.academy_user_can_open(auth.uid(), c.project_id)
    and not exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'
                    and not exists (select 1 from public.academy_purchases pu where pu.user_id = auth.uid() and pu.project_id = c.project_id and pu.status='COMPLETED')
                    and not exists (select 1 from public.academy_member_subscriptions s where s.user_id = auth.uid() and s.status in ('ACTIVE','PAST_DUE','CANCELLED')));
$$;
revoke all on function public.get_my_academy_library() from public;
grant execute on function public.get_my_academy_library() to authenticated;

-- One active/past-due membership per person.
create unique index if not exists academy_subs_one_current on public.academy_member_subscriptions(user_id)
  where status in ('ACTIVE','PAST_DUE');

-- Tighten grants.
revoke truncate on public.academy_purchases, public.academy_member_subscriptions, public.academy_membership_payments,
  public.academy_payment_events, public.academy_membership_plans, public.academy_release_records from anon, authenticated;
revoke all on function private.academy_next_receipt() from public, anon, authenticated;
grant execute on function private.academy_next_receipt() to service_role;

-- Admin read on covers (needed to replace a cover).
drop policy if exists academy_covers_admin_read on storage.objects;
create policy academy_covers_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'academy-covers' and (select private.is_admin()));
