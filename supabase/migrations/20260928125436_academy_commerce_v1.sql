-- Academy commerce v1: purchases, memberships, receipts, locked materials,
-- release listing fields, and a public catalog that never exposes material links.
-- Owner go-ahead 2026-09-28 (pay per item AND memberships; everything paid locked;
-- owner edits listings and membership plans; flows into PayPal automatically).
-- AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
-- Additive only. Separate from Creation Station payment tables on purpose.

-- ── Receipt numbers ─────────────────────────────────────────────────────────
create sequence if not exists public.academy_receipt_seq start 1001;
create or replace function private.academy_next_receipt()
returns text language sql volatile set search_path to '' as $$
  select 'RRA-' || to_char(now() at time zone 'America/New_York','YYYY') || '-' || lpad(nextval('public.academy_receipt_seq')::text, 6, '0');
$$;

-- ── Membership plans (owner edits; server syncs to PayPal) ──────────────────
create table if not exists public.academy_membership_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  description text,
  price_usd numeric(10,2) not null check (price_usd > 0),
  billing_interval text not null check (billing_interval in ('MONTH','YEAR')),
  includes_all boolean not null default true,
  active boolean not null default false,
  sort_order smallint not null default 0,
  paypal_product_id text,
  paypal_plan_id text,
  paypal_plan_price numeric(10,2),
  paypal_plan_interval text,
  paypal_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.academy_membership_plans is 'Academy membership levels. Owner edits name/price/interval; the academy-commerce function creates the matching PayPal plan (a new plan whenever price or interval changes, so existing members keep their price).';
alter table public.academy_membership_plans enable row level security;
drop policy if exists academy_plans_public_read on public.academy_membership_plans;
create policy academy_plans_public_read on public.academy_membership_plans for select to anon, authenticated
  using (active and paypal_plan_id is not null);
drop policy if exists academy_plans_admin_all on public.academy_membership_plans;
create policy academy_plans_admin_all on public.academy_membership_plans for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
grant select on public.academy_membership_plans to anon, authenticated;
grant insert, update on public.academy_membership_plans to authenticated;

-- ── Single-item purchases ───────────────────────────────────────────────────
create table if not exists public.academy_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  buyer_email text,
  project_id text not null references public.academy_content_projects(project_id),
  release_id uuid references public.academy_release_records(id),
  item_title text not null,
  amount_usd numeric(10,2) not null check (amount_usd >= 0),
  currency text not null default 'USD',
  status text not null default 'PENDING' check (status in ('PENDING','COMPLETED','DENIED','REFUNDED','CANCELLED')),
  paypal_order_id text unique,
  paypal_capture_id text unique,
  receipt_number text unique,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists academy_purchases_user_idx on public.academy_purchases(user_id, created_at desc);
create unique index if not exists academy_purchases_one_completed on public.academy_purchases(user_id, project_id) where status = 'COMPLETED';
alter table public.academy_purchases enable row level security;
drop policy if exists academy_purchases_own_read on public.academy_purchases;
create policy academy_purchases_own_read on public.academy_purchases for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
revoke insert, update, delete on public.academy_purchases from anon, authenticated;
grant select on public.academy_purchases to authenticated;

-- ── Memberships (subscriptions) ─────────────────────────────────────────────
create table if not exists public.academy_member_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  buyer_email text,
  plan_id uuid not null references public.academy_membership_plans(id),
  plan_name text not null,
  amount_usd numeric(10,2) not null,
  billing_interval text not null,
  includes_all boolean not null default true,
  status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','PAST_DUE','CANCELLED','SUSPENDED','EXPIRED')),
  paypal_subscription_id text unique,
  started_at timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists academy_subs_user_idx on public.academy_member_subscriptions(user_id, created_at desc);
alter table public.academy_member_subscriptions enable row level security;
drop policy if exists academy_subs_own_read on public.academy_member_subscriptions;
create policy academy_subs_own_read on public.academy_member_subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
revoke insert, update, delete on public.academy_member_subscriptions from anon, authenticated;
grant select on public.academy_member_subscriptions to authenticated;

-- Each membership charge (first and renewals) gets its own receipt.
create table if not exists public.academy_membership_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.academy_member_subscriptions(id),
  user_id uuid not null references auth.users(id),
  paypal_sale_id text not null unique,
  amount_usd numeric(10,2) not null,
  currency text not null default 'USD',
  status text not null default 'COMPLETED' check (status in ('COMPLETED','REFUNDED','REVERSED')),
  receipt_number text not null unique,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.academy_membership_payments enable row level security;
drop policy if exists academy_mpay_own_read on public.academy_membership_payments;
create policy academy_mpay_own_read on public.academy_membership_payments for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
revoke insert, update, delete on public.academy_membership_payments from anon, authenticated;
grant select on public.academy_membership_payments to authenticated;

-- PayPal notices seen for Academy (audit + duplicate protection).
create table if not exists public.academy_payment_events (
  id uuid primary key default gen_random_uuid(),
  paypal_event_id text not null unique,
  event_type text not null,
  resource_id text,
  processing_status text not null default 'received' check (processing_status in ('received','processed','ignored','failed')),
  error_message text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.academy_payment_events enable row level security;
drop policy if exists academy_pevents_admin_read on public.academy_payment_events;
create policy academy_pevents_admin_read on public.academy_payment_events for select to authenticated using ((select private.is_admin()));
revoke insert, update, delete on public.academy_payment_events from anon, authenticated;
grant select on public.academy_payment_events to authenticated;

-- ── Release listing: locked material location ───────────────────────────────
alter table public.academy_release_records
  add column if not exists material_path text,
  add column if not exists material_kind text check (material_kind is null or material_kind in ('LESSON_HTML','PDF','VIDEO','AUDIO','FILE')),
  add column if not exists material_filename text;
comment on column public.academy_release_records.material_path is 'Object path inside the PRIVATE storage bucket academy-materials. Never public; opened only through academy-commerce after an access check.';

-- ── Storage ────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('academy-materials','academy-materials', false)
  on conflict (id) do update set public = false;
insert into storage.buckets (id, name, public) values ('academy-covers','academy-covers', true)
  on conflict (id) do nothing;
-- Materials: only administrators may upload/replace/list. Nobody reads directly;
-- buyers receive short-lived signed links from the academy-commerce function.
drop policy if exists academy_materials_admin_write on storage.objects;
create policy academy_materials_admin_write on storage.objects for insert to authenticated
  with check (bucket_id = 'academy-materials' and (select private.is_admin()));
drop policy if exists academy_materials_admin_update on storage.objects;
create policy academy_materials_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'academy-materials' and (select private.is_admin()))
  with check (bucket_id = 'academy-materials' and (select private.is_admin()));
drop policy if exists academy_materials_admin_read on storage.objects;
create policy academy_materials_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'academy-materials' and (select private.is_admin()));
drop policy if exists academy_covers_admin_write on storage.objects;
create policy academy_covers_admin_write on storage.objects for insert to authenticated
  with check (bucket_id = 'academy-covers' and (select private.is_admin()));
drop policy if exists academy_covers_admin_update on storage.objects;
create policy academy_covers_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'academy-covers' and (select private.is_admin()))
  with check (bucket_id = 'academy-covers' and (select private.is_admin()));

-- ── Owner saves the Library listing (release checklist) ─────────────────────
create or replace function public.save_academy_release_listing(
  p_release_id uuid,
  p_public_title text,
  p_public_summary text,
  p_item_type text,
  p_learning_area_id text,
  p_price_usd numeric,
  p_cover_image_url text,
  p_material_path text,
  p_material_kind text,
  p_material_filename text
) returns public.academy_release_records
language plpgsql security definer set search_path to '' as $$
declare v public.academy_release_records;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  if p_price_usd is null or p_price_usd < 0 then raise exception 'Price must be 0 (free) or more'; end if;
  if nullif(btrim(p_public_title),'') is null then raise exception 'Title is required'; end if;
  update public.academy_release_records set
    public_title = btrim(p_public_title),
    public_summary = nullif(btrim(coalesce(p_public_summary,'')),''),
    item_type = coalesce(nullif(p_item_type,''),'LESSON'),
    learning_area_id = nullif(p_learning_area_id,''),
    price_usd = round(p_price_usd, 2),
    cover_image_url = nullif(btrim(coalesce(p_cover_image_url,'')),''),
    material_path = nullif(btrim(coalesce(p_material_path,'')),''),
    material_kind = nullif(p_material_kind,''),
    material_filename = nullif(btrim(coalesce(p_material_filename,'')),''),
    updated_at = now()
  where id = p_release_id
    and status in ('PREP','READY_OWNER_DECISION','HELD','APPROVED_TO_PUBLISH','PUBLISHED_PENDING_VERIFY','LIVE')
  returning * into v;
  if not found then raise exception 'Release not found or not editable'; end if;
  return v;
end $$;
revoke all on function public.save_academy_release_listing(uuid,text,text,text,text,numeric,text,text,text,text) from public;
grant execute on function public.save_academy_release_listing(uuid,text,text,text,text,numeric,text,text,text,text) to authenticated;

-- ── Public catalog (replaces v1): no material links, adds release id ────────
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
    coalesce(r.price_usd, p.proposed_price),
    r.cover_image_url,
    r.material_path is not null,
    r.material_kind,
    coalesce(r.verified_at, r.published_at)
  from public.academy_release_records r
  join public.academy_content_projects p on p.project_id = r.project_id
  where p.workflow_stage = 'LIVE' and r.status = 'LIVE' and r.published_at is not null
    and coalesce(p.archived,false) = false
  order by r.project_id, coalesce(r.verified_at, r.published_at) desc;
$$;
revoke all on function public.get_academy_catalog() from public;
grant execute on function public.get_academy_catalog() to anon, authenticated;

-- ── Can the signed-in person open this item? ────────────────────────────────
create or replace function public.academy_can_open(p_project_id text)
returns boolean language plpgsql stable security definer set search_path to '' as $$
declare v_price numeric; v_uid uuid := auth.uid();
begin
  select c.price_usd into v_price from public.get_academy_catalog() c where c.project_id = p_project_id;
  if not found then
    return v_uid is not null and private.is_admin();   -- unreleased: owner only
  end if;
  if coalesce(v_price,0) = 0 then return true; end if;
  if v_uid is null then return false; end if;
  if private.is_admin() then return true; end if;
  if exists (select 1 from public.academy_purchases where user_id = v_uid and project_id = p_project_id and status = 'COMPLETED') then return true; end if;
  if exists (select 1 from public.academy_member_subscriptions s
             where s.user_id = v_uid and s.includes_all
               and (s.status = 'ACTIVE' or (s.status in ('CANCELLED','PAST_DUE') and s.current_period_end > now()))) then return true; end if;
  return false;
end $$;
revoke all on function public.academy_can_open(text) from public;
grant execute on function public.academy_can_open(text) to anon, authenticated;

-- Everything the signed-in person owns or can open (My Materials).
create or replace function public.get_my_academy_library()
returns table (project_id text, release_id uuid, title text, item_type text, learning_area_id text,
               cover_image_url text, material_kind text, access_via text)
language sql stable security definer set search_path to '' as $$
  select c.project_id, c.release_id, c.title, c.item_type, c.learning_area_id, c.cover_image_url, c.material_kind,
    case
      when exists (select 1 from public.academy_purchases pu where pu.user_id = auth.uid() and pu.project_id = c.project_id and pu.status='COMPLETED') then 'PURCHASE'
      when coalesce(c.price_usd,0) = 0 then 'FREE'
      else 'MEMBERSHIP'
    end
  from public.get_academy_catalog() c
  where auth.uid() is not null and c.has_material and public.academy_can_open(c.project_id)
    and (coalesce(c.price_usd,0) > 0
         or exists (select 1 from public.academy_purchases pu where pu.user_id = auth.uid() and pu.project_id = c.project_id and pu.status='COMPLETED'));
$$;
revoke all on function public.get_my_academy_library() from public;
grant execute on function public.get_my_academy_library() to authenticated;
