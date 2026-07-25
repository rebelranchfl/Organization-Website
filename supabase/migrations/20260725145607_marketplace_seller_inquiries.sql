-- Marketplace: "Message This Seller" inbox. Anyone -- including an
-- anonymous visitor -- may contact an approved seller; only that seller
-- and admins may ever read the message. sender_is_member is computed
-- server-side from the caller's own membership status at submission time,
-- never trusted from the client, so a buyer can't spoof which lane they
-- show up in. This is deliberately one-way capture, not a reply thread --
-- a seller replies using whatever contact info the buyer chose to share.

create table public.seller_inquiries (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_is_member boolean not null default false,
  sender_name text not null,
  sender_contact text,
  message text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index seller_inquiries_seller_profile_id_idx
on public.seller_inquiries(seller_profile_id);
create index seller_inquiries_sender_user_id_idx
on public.seller_inquiries(sender_user_id);

create or replace function private.stamp_seller_inquiry_sender()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  new.sender_user_id := (select auth.uid());
  new.sender_is_member := coalesce((
    select true
    from public.memberships m
    where m.user_id = (select auth.uid())
      and m.membership_status = 'active'
    limit 1
  ), false);
  new.is_read := false;
  new.read_at := null;
  return new;
end $$;
revoke all on function private.stamp_seller_inquiry_sender() from public, anon, authenticated;

create trigger stamp_seller_inquiry_sender
before insert on public.seller_inquiries
for each row execute function private.stamp_seller_inquiry_sender();

-- Only the owning seller or an admin may ever update a row (marking it
-- read), and only the read state -- every other field is force-preserved
-- server-side regardless of what the caller sends.
create or replace function private.guard_seller_inquiry_update()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if not private.is_admin() and not exists (
    select 1 from public.seller_profiles sp
    where sp.id = old.seller_profile_id and sp.owner_user_id = (select auth.uid())
  ) then
    raise exception 'seller_inquiry_update_requires_owner_or_admin';
  end if;
  new.seller_profile_id := old.seller_profile_id;
  new.sender_user_id := old.sender_user_id;
  new.sender_is_member := old.sender_is_member;
  new.sender_name := old.sender_name;
  new.sender_contact := old.sender_contact;
  new.message := old.message;
  new.created_at := old.created_at;
  if new.is_read and not old.is_read then
    new.read_at := now();
  elsif not new.is_read then
    new.read_at := null;
  end if;
  return new;
end $$;
revoke all on function private.guard_seller_inquiry_update() from public, anon, authenticated;

create trigger guard_seller_inquiry_update
before update on public.seller_inquiries
for each row execute function private.guard_seller_inquiry_update();

alter table public.seller_inquiries enable row level security;

create policy seller_inquiries_select_owner_or_admin
on public.seller_inquiries
for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

create policy seller_inquiries_insert_public
on public.seller_inquiries
for insert to anon, authenticated
with check (private.seller_is_publicly_listed(seller_profile_id));

create policy seller_inquiries_update_owner_or_admin
on public.seller_inquiries
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

create policy seller_inquiries_delete_owner_or_admin
on public.seller_inquiries
for delete to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

revoke all on public.seller_inquiries from anon, authenticated;
grant insert on public.seller_inquiries to anon, authenticated;
grant select, update, delete on public.seller_inquiries to authenticated;

-- Surface new inquiries in the seller's existing in-app notification feed
-- (marketplace_notifications) -- otherwise there is no signal that a real
-- lead came in, which defeats the point of not exposing raw email.
alter table public.marketplace_notifications
  drop constraint marketplace_notifications_notification_type_check,
  add constraint marketplace_notifications_notification_type_check
    check (notification_type in (
      'application_submitted','changes_requested','application_approved',
      'application_rejected','requirement_assigned','credential_expiring',
      'credential_expired','team_role_changed','new_inquiry'
    ));

create or replace function private.notify_seller_of_inquiry()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_owner_user_id uuid;
begin
  select owner_user_id into v_owner_user_id
  from public.seller_profiles where id = new.seller_profile_id;

  insert into public.marketplace_notifications (
    owner_user_id, seller_profile_id, notification_type, subject_type, subject_id, title, body
  ) values (
    v_owner_user_id, new.seller_profile_id, 'new_inquiry', 'seller_inquiry', new.id,
    'New message from ' || new.sender_name,
    left(new.message, 200)
  );
  return new;
end $$;
revoke all on function private.notify_seller_of_inquiry() from public, anon, authenticated;

create trigger notify_seller_of_inquiry
after insert on public.seller_inquiries
for each row execute function private.notify_seller_of_inquiry();
