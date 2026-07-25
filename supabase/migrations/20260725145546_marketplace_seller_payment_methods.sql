-- Marketplace: flexible per-seller payment methods (PayPal, Cash App,
-- Venmo, Zelle, Stripe, cash, etc.) so the page never needs a database
-- change to support a new provider -- it's a row, not a column.

create table public.seller_payment_methods (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  method_type text not null
    check (method_type in ('paypal','venmo','cashapp','zelle','stripe','apple_pay','cash','check','other')),
  label text not null,
  link_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
before update on public.seller_payment_methods
for each row execute function private.set_updated_at();

create index seller_payment_methods_seller_profile_id_idx
on public.seller_payment_methods(seller_profile_id);

alter table public.seller_payment_methods enable row level security;

create policy seller_payment_methods_select_owner_or_admin
on public.seller_payment_methods
for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_payment_methods_public_read
on public.seller_payment_methods
for select to anon, authenticated
using (private.seller_is_publicly_listed(seller_profile_id));

create policy seller_payment_methods_insert_owner_or_admin
on public.seller_payment_methods
for insert to authenticated
with check (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_payment_methods_update_owner_or_admin
on public.seller_payment_methods
for update to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
)
with check (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_payment_methods_delete_owner_or_admin
on public.seller_payment_methods
for delete to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

revoke all on public.seller_payment_methods from anon, authenticated;
grant select on public.seller_payment_methods to anon;
grant select, insert, update, delete on public.seller_payment_methods to authenticated;
