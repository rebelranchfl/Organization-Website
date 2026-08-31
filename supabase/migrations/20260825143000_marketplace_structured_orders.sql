-- AI-Agent: ChatGPT/Codex
-- Session: Audit Repository Handoff
-- Structured direct-to-seller orders, private buyer photos, seller fulfillment,
-- and seller-confirmed totals. Rebel Ranch Local does not process payment.

alter table public.seller_listings
  add column unit_price numeric(10,2) check (unit_price is null or unit_price >= 0),
  add column price_type text not null default 'quote'
    check (price_type in ('fixed','starting_at','quote'));

create table public.seller_fulfillment_options (
  seller_profile_id uuid primary key references public.seller_profiles(id) on delete cascade,
  offers_pickup boolean not null default true,
  offers_delivery boolean not null default false,
  offers_meetup boolean not null default true,
  offers_shipping boolean not null default false,
  public_notes text,
  updated_at timestamptz not null default now()
);

create table public.seller_orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  seller_profile_id uuid not null references public.seller_profiles(id) on delete restrict,
  buyer_user_id uuid references auth.users(id) on delete set null,
  buyer_name text not null check (char_length(buyer_name) between 1 and 120),
  buyer_contact text not null check (char_length(buyer_contact) between 3 and 240),
  order_kind text not null check (order_kind in ('product_order','service_request')),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50),
  fulfillment_method text not null check (fulfillment_method in ('pickup','delivery','meetup','shipping','seller_coordination')),
  preferred_date text,
  delivery_address text,
  buyer_note text,
  service_location text,
  photo_object_paths text[] not null default '{}',
  estimated_total numeric(10,2) check (estimated_total is null or estimated_total >= 0),
  confirmed_total numeric(10,2) check (confirmed_total is null or confirmed_total >= 0),
  status text not null default 'new'
    check (status in ('new','accepted','change_proposed','declined','ready','completed')),
  seller_note text,
  payment_instructions text,
  fulfillment_details text,
  is_read boolean not null default false,
  read_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index seller_orders_seller_created_idx on public.seller_orders(seller_profile_id, created_at desc);
create index seller_orders_seller_status_idx on public.seller_orders(seller_profile_id, status);
create index seller_orders_buyer_user_id_idx on public.seller_orders(buyer_user_id) where buyer_user_id is not null;

create or replace function private.guard_seller_order_update()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if not private.is_admin() and not exists (
    select 1 from public.seller_profiles sp
    where sp.id = old.seller_profile_id and sp.owner_user_id = (select auth.uid())
  ) then raise exception 'seller_order_update_requires_owner_or_admin'; end if;
  new.id := old.id; new.order_number := old.order_number;
  new.seller_profile_id := old.seller_profile_id; new.buyer_user_id := old.buyer_user_id;
  new.buyer_name := old.buyer_name; new.buyer_contact := old.buyer_contact;
  new.order_kind := old.order_kind; new.items := old.items;
  new.fulfillment_method := old.fulfillment_method; new.preferred_date := old.preferred_date;
  new.delivery_address := old.delivery_address; new.buyer_note := old.buyer_note;
  new.service_location := old.service_location; new.photo_object_paths := old.photo_object_paths;
  new.estimated_total := old.estimated_total; new.created_at := old.created_at;
  new.updated_at := now();
  if new.is_read and not old.is_read then new.read_at := now(); end if;
  if new.status = 'accepted' and old.status <> 'accepted' then new.accepted_at := now(); end if;
  if new.status = 'completed' and old.status <> 'completed' then new.completed_at := now(); end if;
  return new;
end $$;
revoke all on function private.guard_seller_order_update() from public, anon, authenticated;
create trigger guard_seller_order_update before update on public.seller_orders
for each row execute function private.guard_seller_order_update();

alter table public.seller_orders enable row level security;
alter table public.seller_fulfillment_options enable row level security;

create policy seller_orders_owner_select on public.seller_orders for select to authenticated
using (private.is_admin() or exists (select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())));
create policy seller_orders_owner_update on public.seller_orders for update to authenticated
using (private.is_admin() or exists (select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())))
with check (private.is_admin() or exists (select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())));

create policy fulfillment_public_select on public.seller_fulfillment_options for select to anon, authenticated
using (private.seller_is_publicly_listed(seller_profile_id) or private.is_admin() or exists (select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())));
create policy fulfillment_owner_insert on public.seller_fulfillment_options for insert to authenticated
with check (private.is_admin() or exists (select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())));
create policy fulfillment_owner_update on public.seller_fulfillment_options for update to authenticated
using (private.is_admin() or exists (select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())))
with check (private.is_admin() or exists (select 1 from public.seller_profiles sp where sp.id=seller_profile_id and sp.owner_user_id=(select auth.uid())));

revoke all on public.seller_orders from anon, authenticated;
grant select, update on public.seller_orders to authenticated;
revoke all on public.seller_fulfillment_options from anon, authenticated;
grant select on public.seller_fulfillment_options to anon, authenticated;
grant insert, update on public.seller_fulfillment_options to authenticated;
grant select (id,listing_type,title,description,price_label,unit_price,price_type,is_active,sort_order,seller_profile_id) on public.seller_listings to anon;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('marketplace-order-private','marketplace-order-private',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy marketplace_order_photo_seller_read on storage.objects for select to authenticated
using (bucket_id='marketplace-order-private' and (private.is_admin() or exists (
  select 1 from public.seller_profiles sp
  where sp.id::text=(storage.foldername(name))[1] and sp.owner_user_id=(select auth.uid())
)));

alter table public.marketplace_notifications drop constraint marketplace_notifications_notification_type_check;
alter table public.marketplace_notifications add constraint marketplace_notifications_notification_type_check
check (notification_type in ('application_submitted','changes_requested','application_approved','application_rejected','requirement_assigned','credential_expiring','credential_expired','team_role_changed','new_inquiry','new_order'));

create or replace function private.notify_seller_of_order()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_owner uuid;
begin
  select owner_user_id into v_owner from public.seller_profiles where id=new.seller_profile_id;
  insert into public.marketplace_notifications(owner_user_id,seller_profile_id,notification_type,subject_type,subject_id,title,body)
  values(v_owner,new.seller_profile_id,'new_order','seller_order',new.id,'New order #'||new.order_number||' from '||new.buyer_name,
    case when new.order_kind='service_request' then 'New service request' else jsonb_array_length(new.items)||' item(s)' end);
  return new;
end $$;
revoke all on function private.notify_seller_of_order() from public, anon, authenticated;
create trigger notify_seller_of_order after insert on public.seller_orders for each row execute function private.notify_seller_of_order();
