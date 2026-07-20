-- Marketplace Gate 2: moderation/review event history and operational
-- notifications. Both tables are populated only by SECURITY DEFINER
-- triggers on the state transitions introduced earlier in Gate 2 -
-- no direct insert grant is given to authenticated, so a seller cannot
-- spoof their own "approved" notification or event.
-- Notifications are an in-app feed only for Gate 2: no email/SMS delivery
-- and no scheduled expiration sweep. credential_expiring/credential_expired
-- values exist in the type check for a later gate to populate.
-- Production application still requires separate owner approval.

create table public.seller_review_events (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references public.seller_profiles(id) on delete cascade,
  subject_type text not null check (subject_type in ('seller_review','seller_application')),
  subject_id uuid not null,
  from_status text,
  to_status text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  note text,
  recorded_at timestamptz not null default now()
);

create index seller_review_events_seller_profile_id_idx
on public.seller_review_events(seller_profile_id, recorded_at desc);
create index seller_review_events_subject_idx
on public.seller_review_events(subject_type, subject_id);
create index seller_review_events_actor_user_id_idx
on public.seller_review_events(actor_user_id);

create or replace function private.capture_seller_review_event()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.seller_review_events (
    seller_profile_id, subject_type, subject_id, from_status, to_status, actor_user_id, note
  )
  values (
    new.seller_profile_id, 'seller_review', new.seller_profile_id,
    old.review_status, new.review_status, (select auth.uid()), new.review_notes
  );
  return new;
end $$;
revoke all on function private.capture_seller_review_event() from public, anon, authenticated;

create trigger capture_seller_review_event
after update of review_status on public.seller_reviews
for each row execute function private.capture_seller_review_event();

create or replace function private.capture_seller_application_event()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.seller_review_events (
    seller_profile_id, subject_type, subject_id, from_status, to_status, actor_user_id, note
  )
  values (
    new.seller_profile_id, 'seller_application', new.id,
    case when tg_op = 'UPDATE' then old.status else null end,
    new.status, (select auth.uid()), new.review_notes
  );
  return new;
end $$;
revoke all on function private.capture_seller_application_event() from public, anon, authenticated;

create trigger capture_seller_application_event
after insert or update of status on public.seller_applications
for each row execute function private.capture_seller_application_event();

alter table public.seller_review_events enable row level security;

create policy seller_review_events_select
on public.seller_review_events
for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.seller_profiles sp
    where sp.id = seller_profile_id and sp.owner_user_id = (select auth.uid())
  )
);

revoke all on public.seller_review_events from anon, authenticated;
grant select on public.seller_review_events to authenticated;

create table public.marketplace_notifications (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  seller_profile_id uuid references public.seller_profiles(id) on delete cascade,
  notification_type text not null check (notification_type in (
    'application_submitted','changes_requested','application_approved','application_rejected',
    'requirement_assigned','credential_expiring','credential_expired','team_role_changed'
  )),
  subject_type text,
  subject_id uuid,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index marketplace_notifications_owner_user_id_idx
on public.marketplace_notifications(owner_user_id, created_at desc);
create index marketplace_notifications_seller_profile_id_idx
on public.marketplace_notifications(seller_profile_id);

create or replace function private.notify_seller_application_status()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_owner uuid;
  v_type text;
  v_title text;
begin
  if new.status = old.status then
    return new;
  end if;

  select owner_user_id into v_owner from public.seller_profiles where id = new.seller_profile_id;
  if v_owner is null then
    return new;
  end if;

  if new.status = 'submitted' then
    v_type := 'application_submitted'; v_title := 'Application submitted';
  elsif new.status = 'changes_requested' then
    v_type := 'changes_requested'; v_title := 'Changes requested on your application';
  elsif new.status = 'approved' then
    v_type := 'application_approved'; v_title := 'Application approved';
  elsif new.status = 'rejected' then
    v_type := 'application_rejected'; v_title := 'Application not approved';
  else
    return new;
  end if;

  insert into public.marketplace_notifications (
    owner_user_id, seller_profile_id, notification_type, subject_type, subject_id, title, body
  )
  values (v_owner, new.seller_profile_id, v_type, 'seller_application', new.id, v_title, new.review_notes);

  return new;
end $$;
revoke all on function private.notify_seller_application_status() from public, anon, authenticated;

create trigger notify_seller_application_status
after update of status on public.seller_applications
for each row execute function private.notify_seller_application_status();

create or replace function private.notify_requirement_assigned()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_owner uuid;
  v_title text;
begin
  select owner_user_id into v_owner from public.seller_profiles where id = new.seller_profile_id;
  if v_owner is null then
    return new;
  end if;

  select 'New requirement: ' || cr.title into v_title
  from public.compliance_requirements cr where cr.id = new.requirement_id;

  insert into public.marketplace_notifications (
    owner_user_id, seller_profile_id, notification_type, subject_type, subject_id, title
  )
  values (v_owner, new.seller_profile_id, 'requirement_assigned', 'seller_requirement_assignment', new.id,
          coalesce(v_title, 'New compliance requirement assigned'));

  return new;
end $$;
revoke all on function private.notify_requirement_assigned() from public, anon, authenticated;

create trigger notify_requirement_assigned
after insert on public.seller_requirement_assignments
for each row execute function private.notify_requirement_assigned();

create or replace function private.notify_team_role_changed()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.marketplace_notifications (
    owner_user_id, seller_profile_id, notification_type, subject_type, subject_id, title, body
  )
  values (
    new.user_id, new.seller_profile_id, 'team_role_changed', 'seller_team_member', new.id,
    'Your Marketplace team role changed',
    format('Role: %s, status: %s.', new.team_role, new.status)
  );
  return new;
end $$;
revoke all on function private.notify_team_role_changed() from public, anon, authenticated;

create trigger notify_team_role_changed
after update of team_role, status on public.seller_team_members
for each row execute function private.notify_team_role_changed();

alter table public.marketplace_notifications enable row level security;

create policy marketplace_notifications_select_own_or_admin
on public.marketplace_notifications
for select to authenticated
using (private.is_admin() or owner_user_id = (select auth.uid()));

create policy marketplace_notifications_update_own_read_state
on public.marketplace_notifications
for update to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

revoke all on public.marketplace_notifications from anon, authenticated;
grant select, update (is_read) on public.marketplace_notifications to authenticated;
