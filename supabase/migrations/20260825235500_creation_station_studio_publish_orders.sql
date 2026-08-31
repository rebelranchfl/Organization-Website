-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: Creation Station Studio Publishing and Orders
-- Owner-approved 2026-08-25: paid Creation Station Studios self-publish after acknowledgement,
-- and Studio orders use a structured direct-to-creator workflow separate from Marketplace seller_orders.

-- A paid Studio may be publicly listed only while the public-page membership remains current.
-- The existing approved status is retained for compatibility with the current dashboard; for an owner,
-- it means the required adult/parent acknowledgement is complete and the paid Studio is live.
create or replace function private.studio_is_publicly_listed(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.creator_website_requests r
    where r.id = p_request_id
      and r.status in ('approved','published')
      and r.public_slug is not null
      and nullif(btrim(r.parent_approver_name), '') is not null
      and nullif(btrim(r.parent_approver_relationship), '') is not null
      and r.parent_approved_at is not null
      and nullif(btrim(r.consent_statement), '') is not null
      and (
        private.is_creation_station_admin()
        or exists (
          select 1
          from public.memberships m
          where m.user_id = r.owner_user_id
            and m.program_code = 'creation_station'
            and m.offer_code in ('creator_website','club_all_access_bundle')
            and m.membership_status in ('active','past_due')
            and (m.starts_at is null or m.starts_at <= now())
            and (m.ends_at is null or m.ends_at > now())
        )
      )
  );
$function$;

-- Preserve the moderation/security boundary while removing the obsolete admin-editorial gate.
create or replace function private.guard_website_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_admin boolean := private.is_creation_station_admin();
  v_uid uuid := (select auth.uid());
  v_creator_owner uuid;
  v_has_public_tier boolean := false;
begin
  if v_admin then
    if tg_op = 'UPDATE' then
      if new.status = 'approved' and old.status is distinct from 'approved' then
        new.approved_at := coalesce(new.approved_at, now());
      end if;
      if new.status = 'published' then
        new.published_at := coalesce(old.published_at, new.published_at, now());
      end if;
    elsif tg_op = 'INSERT' and new.status = 'published' then
      new.published_at := coalesce(new.published_at, now());
    end if;
    return new;
  end if;

  if v_uid is null or new.owner_user_id is distinct from v_uid then
    raise exception 'studio_owner_required';
  end if;

  select c.owner_user_id into v_creator_owner
  from public.creator_profiles c
  where c.id = new.creator_id;

  if v_creator_owner is distinct from v_uid then
    raise exception 'studio_creator_must_belong_to_owner';
  end if;

  select exists (
    select 1
    from public.memberships m
    where m.user_id = v_uid
      and m.program_code = 'creation_station'
      and m.offer_code in ('creator_website','club_all_access_bundle')
      and m.membership_status in ('active','past_due')
      and (m.starts_at is null or m.starts_at <= now())
      and (m.ends_at is null or m.ends_at > now())
  ) into v_has_public_tier;

  -- Owners never control moderation/admin fields through the Studio form.
  if tg_op = 'INSERT' then
    new.admin_notes := null;
    new.moderation_note := null;
    new.published_url := null;
  else
    new.admin_notes := old.admin_notes;
    new.moderation_note := old.moderation_note;
    new.published_url := old.published_url;
  end if;

  if new.status in ('approved','published') then
    if not v_has_public_tier then
      raise exception 'studio_public_page_membership_required';
    end if;
    if nullif(btrim(new.parent_approver_name), '') is null
       or nullif(btrim(new.parent_approver_relationship), '') is null
       or new.parent_approved_at is null
       or nullif(btrim(new.consent_statement), '') is null then
      raise exception 'studio_public_acknowledgement_required';
    end if;
    new.approved_at := coalesce(case when tg_op='UPDATE' then old.approved_at end, new.approved_at, now());
    new.published_at := coalesce(case when tg_op='UPDATE' then old.published_at end, new.published_at, now());
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft','submitted','approved','published') then
      raise exception 'studio_invalid_start_status';
    end if;
  else
    if old.status in ('approved','published') and new.status in ('approved','published') then
      -- Paid Studio owners may edit their live Studio in place.
      null;
    elsif new.status is distinct from old.status and not (
      (old.status = 'draft' and new.status in ('submitted','approved','published','archived'))
      or (old.status = 'submitted' and new.status in ('approved','published','archived'))
      or (old.status = 'changes_requested' and new.status in ('submitted','approved','published','archived'))
      or (old.status = 'rejected' and new.status in ('approved','published','archived'))
      or (old.status in ('approved','published') and new.status = 'archived')
    ) then
      raise exception 'studio_invalid_owner_transition';
    end if;
  end if;

  return new;
end
$function$;

-- Extend the existing Studio order table so old references and owner RLS remain valid.
alter table public.studio_order_requests
  add column order_number bigint generated by default as identity,
  add column order_kind text not null default 'product_order',
  add column items jsonb not null default '[]'::jsonb,
  add column fulfillment_method text,
  add column preferred_date text,
  add column delivery_address text,
  add column buyer_note text,
  add column estimated_total numeric(12,2),
  add column confirmed_total numeric(12,2),
  add column status text not null default 'new',
  add column studio_owner_note text,
  add column payment_instructions text,
  add column fulfillment_details text,
  add column accepted_at timestamptz,
  add column completed_at timestamptz,
  add column updated_at timestamptz not null default now();

alter table public.studio_order_requests
  add constraint studio_order_requests_order_kind_check check (order_kind in ('product_order','service_request')),
  add constraint studio_order_requests_items_array_check check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 50),
  add constraint studio_order_requests_fulfillment_check check (fulfillment_method is null or fulfillment_method in ('pickup','delivery','meetup','shipping','seller_coordination')),
  add constraint studio_order_requests_status_check check (status in ('new','accepted','change_proposed','declined','ready','completed')),
  add constraint studio_order_requests_estimated_total_check check (estimated_total is null or estimated_total >= 0),
  add constraint studio_order_requests_confirmed_total_check check (confirmed_total is null or confirmed_total >= 0);

create unique index studio_order_requests_order_number_uidx on public.studio_order_requests(order_number);
create index studio_order_requests_request_status_idx on public.studio_order_requests(website_request_id,status,created_at desc);

-- Public buyers submit through the validating Edge Function, not directly to the table.
drop policy if exists studio_order_requests_insert_public on public.studio_order_requests;
revoke insert on table public.studio_order_requests from anon, authenticated;

create or replace function private.guard_studio_order_owner_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_admin boolean := private.is_creation_station_admin();
begin
  if not v_admin then
    new.id := old.id;
    new.order_number := old.order_number;
    new.website_request_id := old.website_request_id;
    new.sender_user_id := old.sender_user_id;
    new.sender_name := old.sender_name;
    new.sender_contact := old.sender_contact;
    new.cart_summary := old.cart_summary;
    new.message := old.message;
    new.order_kind := old.order_kind;
    new.items := old.items;
    new.fulfillment_method := old.fulfillment_method;
    new.preferred_date := old.preferred_date;
    new.delivery_address := old.delivery_address;
    new.buyer_note := old.buyer_note;
    new.estimated_total := old.estimated_total;
    new.created_at := old.created_at;
  end if;

  if new.is_read and not old.is_read then
    new.read_at := coalesce(new.read_at, now());
  elsif not new.is_read then
    new.read_at := null;
  end if;

  if new.status in ('accepted','ready') and old.status not in ('accepted','ready','completed') then
    new.accepted_at := coalesce(new.accepted_at, now());
  end if;
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.accepted_at := coalesce(new.accepted_at, now());
    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status is distinct from 'completed' then
    new.completed_at := null;
  end if;

  new.updated_at := now();
  return new;
end
$function$;

create trigger guard_studio_order_owner_update
before update on public.studio_order_requests
for each row execute function private.guard_studio_order_owner_update();
