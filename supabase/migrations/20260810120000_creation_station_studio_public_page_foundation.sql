-- AI-Agent: Claude Code
-- Session: Creation Station dashboard corrections walkthrough (2026-08-08/09)
-- Owner decision: a paying (tier 3+) creator's Studio request auto-approves on submit
-- (no admin review gate - the form + parent consent + payment IS the authorization).
-- Approved requests need a shareable public URL, following the exact pattern already
-- proven in the Rebel Ranch Marketplace seller-page system: a slug auto-generated from
-- the brand name at approval time (collision-checked), reached via
-- creation-station-studio.html?studio=<slug>, with public visibility gated by a
-- security-definer function - never a bare self-settable status column - because a
-- household can already update their own creator_website_requests row (owner-scoped
-- RLS), so "status='approved'" alone would let anyone self-publish by editing their
-- own row instead of actually paying. This function re-checks the OWNER's real tier
-- from public.memberships directly (NOT private.creation_station_tier_rank(), which is
-- session-scoped to auth.uid() and would check the wrong person for a public,
-- unauthenticated visitor looking at someone else's page).
--
-- Also adds creator_studio_products - a real child table (title/description/price
-- label/photo/sort order), matching this codebase's existing idiom for owner-owned
-- child records rather than a single free-text "products" paragraph - so a creator can
-- both import already-completed Portfolio projects as products and add new ones
-- directly, side by side.
-- Applied directly to the live "Rebel Ranch Platform" project (dfrwxpuojeiykaignyny)
-- via Supabase MCP apply_migration before this file was committed; this file mirrors
-- that change.

alter table public.creator_website_requests add column public_slug text unique;

create or replace function public.assign_website_request_slug()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_base text;
  v_candidate text;
  v_suffix int := 1;
begin
  if new.status in ('approved','published') and new.public_slug is null then
    v_base := trim(both '-' from regexp_replace(lower(coalesce(new.brand_name,'')), '[^a-z0-9]+', '-', 'g'));
    if v_base = '' then v_base := 'studio'; end if;
    v_candidate := v_base;
    while exists(select 1 from public.creator_website_requests where public_slug = v_candidate and id <> new.id) loop
      v_suffix := v_suffix + 1;
      v_candidate := v_base || '-' || v_suffix::text;
    end loop;
    new.public_slug := v_candidate;
  end if;
  return new;
end;
$function$;

drop trigger if exists creator_website_requests_assign_slug on public.creator_website_requests;
create trigger creator_website_requests_assign_slug
before insert or update on public.creator_website_requests
for each row execute function public.assign_website_request_slug();

create table public.creator_studio_products (
  id uuid primary key default gen_random_uuid(),
  website_request_id uuid not null references public.creator_website_requests(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  source_project_id uuid references public.creator_projects(id) on delete set null,
  title text not null,
  description text not null default '',
  price_label text,
  storage_path text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.creator_studio_products enable row level security;

create trigger set_creator_studio_products_updated_at
before update on public.creator_studio_products
for each row execute function private.set_updated_at();

create policy studio_products_owner_all on public.creator_studio_products
for all to authenticated
using (owner_user_id = (select auth.uid()) or private.is_creation_station_admin())
with check (owner_user_id = (select auth.uid()) or private.is_creation_station_admin());

grant select, insert, update, delete on public.creator_studio_products to authenticated;

create or replace function private.studio_is_publicly_listed(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1 from public.creator_website_requests r
    where r.id = p_request_id
      and r.status in ('approved','published')
      and r.public_slug is not null
      and exists (
        select 1 from public.memberships m
        where m.user_id = r.owner_user_id
          and m.program_code = 'creation_station'
          and m.offer_code in ('creator_website','club_all_access_bundle')
          and m.membership_status in ('active','past_due')
          and (m.starts_at is null or m.starts_at <= now())
          and (m.ends_at is null or m.ends_at > now())
      )
  );
$function$;

create policy website_requests_public_read on public.creator_website_requests
for select to anon
using (private.studio_is_publicly_listed(id));

grant select (id, brand_name, story, products, social_links, public_slug, status,
  payment_methods, payment_other_note, delivery_methods, published_at)
on public.creator_website_requests to anon;

create policy studio_products_public_read on public.creator_studio_products
for select to anon
using (is_active and private.studio_is_publicly_listed(website_request_id));

grant select (id, website_request_id, title, description, price_label, storage_path, sort_order)
on public.creator_studio_products to anon;
