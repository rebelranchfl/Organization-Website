-- AI-Agent: Claude Code (Claude Opus 5.5)
-- Session: Custom booking system build for rebelranchministries.org (2026-09-24)
-- Purpose: Tables for the self-hosted booking system that replaces Calendly.
-- Every object is prefixed booking_. No existing table, function, or policy is changed.
-- The public never touches these tables directly: all public reads/writes go through the
-- booking-* Edge Functions (service role). Admins (existing private.is_admin() role check)
-- manage configuration from booking-admin.html under RLS.
-- Audit history is protected: waiver versions are insert-only, acknowledgments and the
-- email log are read-only to admins.

-- ---------------------------------------------------------------------------
-- Settings (exactly one row)
-- ---------------------------------------------------------------------------
create table public.booking_settings (
  id boolean primary key default true check (id),
  notification_email text not null check (position('@' in notification_email) > 1),
  timezone text not null default 'America/New_York',
  public_booking_enabled boolean not null default false,
  private_location_text text,
  confirmation_message text,
  reminder_hours_before integer not null default 24 check (reminder_hours_before between 1 and 336),
  cancellation_policy_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.booking_validate_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Unknown time zone: %', new.timezone;
  end if;
  return new;
end;
$$;

create trigger booking_settings_validate_timezone
before insert or update of timezone on public.booking_settings
for each row execute function public.booking_validate_timezone();

create trigger booking_settings_set_updated_at
before update on public.booking_settings
for each row execute function private.set_updated_at();

-- Owner answered 2026-09-24: default notification email is rebelranchfl@gmail.com.
-- Public booking starts OFF; the owner switches it on from the admin Settings tab.
insert into public.booking_settings (id, notification_email) values (true, 'rebelranchfl@gmail.com');

-- ---------------------------------------------------------------------------
-- Visit types
-- ---------------------------------------------------------------------------
create table public.booking_event_types (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  duration_minutes integer not null default 60 check (duration_minutes between 5 and 1440),
  slot_interval_minutes integer check (slot_interval_minutes is null or slot_interval_minutes between 5 and 1440),
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes between 0 and 1440),
  buffer_after_minutes integer not null default 0 check (buffer_after_minutes between 0 and 1440),
  min_notice_hours integer not null default 24 check (min_notice_hours between 0 and 8760),
  max_days_ahead integer not null default 60 check (max_days_ahead between 1 and 730),
  max_party_size integer not null default 10 check (max_party_size between 1 and 500),
  capacity_per_slot integer not null default 1 check (capacity_per_slot between 1 and 500),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger booking_event_types_set_updated_at
before update on public.booking_event_types
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Weekly hours. event_type_id null = applies to every visit type.
-- If a visit type has ANY rows of its own, only its own rows apply to it.
-- weekday: 0 = Sunday ... 6 = Saturday (matches Postgres extract(dow)).
-- ---------------------------------------------------------------------------
create table public.booking_availability_rules (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid references public.booking_event_types(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index booking_availability_rules_lookup_idx
  on public.booking_availability_rules (weekday, event_type_id);
create index booking_availability_rules_event_type_idx
  on public.booking_availability_rules (event_type_id);

-- ---------------------------------------------------------------------------
-- Date overrides: closed days, or custom hours for one date.
-- ---------------------------------------------------------------------------
create table public.booking_date_overrides (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  event_type_id uuid references public.booking_event_types(id) on delete cascade,
  closed boolean not null default true,
  start_time time,
  end_time time,
  note text,
  created_at timestamptz not null default now(),
  check (closed or (start_time is not null and end_time is not null and end_time > start_time))
);

create index booking_date_overrides_date_idx on public.booking_date_overrides (date, event_type_id);
create index booking_date_overrides_event_type_idx on public.booking_date_overrides (event_type_id);

-- ---------------------------------------------------------------------------
-- Waivers & forms
-- ---------------------------------------------------------------------------
create table public.booking_requirements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 200),
  kind text not null check (kind in ('pdf_waiver', 'checkbox_statement', 'form_link')),
  active boolean not null default true,
  required boolean not null default true,
  requires_typed_name boolean not null default true,
  requires_guardian_for_minors boolean not null default false,
  applies_to_all boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger booking_requirements_set_updated_at
before update on public.booking_requirements
for each row execute function private.set_updated_at();

create table public.booking_requirement_event_types (
  requirement_id uuid not null references public.booking_requirements(id) on delete cascade,
  event_type_id uuid not null references public.booking_event_types(id) on delete cascade,
  primary key (requirement_id, event_type_id)
);

create index booking_requirement_event_types_event_type_idx
  on public.booking_requirement_event_types (event_type_id);

-- Every wording/file change is a new row. Rows are never updated or deleted.
create table public.booking_requirement_versions (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.booking_requirements(id) on delete restrict,
  version_number integer not null,
  body_text text,
  file_path text,
  link_url text check (link_url is null or link_url ~* '^https://'),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  unique (requirement_id, version_number)
);

create or replace function public.booking_requirement_versions_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_kind text;
begin
  -- Serialize version numbering per requirement.
  select r.kind into v_kind from public.booking_requirements r where r.id = new.requirement_id for update;
  if v_kind is null then
    raise exception 'Requirement not found';
  end if;
  if v_kind = 'pdf_waiver' and coalesce(btrim(new.file_path), '') = '' then
    raise exception 'A PDF waiver version needs an uploaded PDF file';
  end if;
  if v_kind = 'form_link' and coalesce(btrim(new.link_url), '') = '' then
    raise exception 'A form-link version needs a link';
  end if;
  if v_kind = 'checkbox_statement' and coalesce(btrim(new.body_text), '') = '' then
    raise exception 'A checkbox statement version needs wording';
  end if;
  select coalesce(max(v.version_number), 0) + 1 into new.version_number
  from public.booking_requirement_versions v where v.requirement_id = new.requirement_id;
  new.created_at := now();
  return new;
end;
$$;

create trigger booking_requirement_versions_number
before insert on public.booking_requirement_versions
for each row execute function public.booking_requirement_versions_before_insert();

create or replace function public.booking_requirement_versions_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Only an explicit, session-scoped test-data purge by the database owner may delete.
  -- Admins in the browser have no UPDATE/DELETE grant or policy on this table at all.
  if tg_op = 'DELETE' and current_setting('booking.allow_test_version_purge', true) = 'on' then
    return old;
  end if;
  raise exception 'Waiver versions are permanent and cannot be changed or deleted. Create a new version instead.';
end;
$$;

create trigger booking_requirement_versions_no_change
before update or delete on public.booking_requirement_versions
for each row execute function public.booking_requirement_versions_immutable();

create index booking_requirement_versions_requirement_idx
  on public.booking_requirement_versions (requirement_id, version_number desc);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create table public.booking_bookings (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references public.booking_event_types(id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  name text not null check (length(btrim(name)) between 1 and 160),
  email text not null check (position('@' in email) > 1 and length(email) <= 254),
  phone text check (phone is null or length(phone) <= 40),
  party_size integer not null check (party_size between 1 and 500),
  minors_count integer not null default 0 check (minors_count >= 0),
  guardian_name text check (guardian_name is null or length(guardian_name) <= 160),
  notes text check (notes is null or length(notes) <= 2000),
  manage_token_hash text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rescheduled_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by text check (cancelled_by is null or cancelled_by in ('visitor', 'admin')),
  reminder_sent_at timestamptz,
  check (end_at > start_at),
  check (minors_count <= party_size)
);

create trigger booking_bookings_set_updated_at
before update on public.booking_bookings
for each row execute function private.set_updated_at();

create index booking_bookings_slot_idx
  on public.booking_bookings (event_type_id, start_at) where status = 'confirmed';
create index booking_bookings_start_idx on public.booking_bookings (start_at);

create table public.booking_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.booking_bookings(id) on delete cascade,
  requirement_version_id uuid not null references public.booking_requirement_versions(id) on delete restrict,
  typed_name text,
  guardian_typed_name text,
  agreed_at timestamptz not null default now(),
  user_agent text,
  unique (booking_id, requirement_version_id)
);

create index booking_acknowledgments_version_idx on public.booking_acknowledgments (requirement_version_id);

create table public.booking_email_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.booking_bookings(id) on delete cascade,
  type text not null,
  recipient text,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error text,
  sent_at timestamptz not null default now()
);

create index booking_email_log_booking_idx on public.booking_email_log (booking_id);

-- Basic abuse throttle for the public Edge Functions (hashed IP only, never the raw IP).
create table public.booking_rate_limits (
  id bigint generated always as identity primary key,
  key_hash text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index booking_rate_limits_lookup_idx on public.booking_rate_limits (key_hash, action, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security + explicit grants (RLS alone is not enough; see 2026-08-15 outage)
-- ---------------------------------------------------------------------------
alter table public.booking_settings enable row level security;
alter table public.booking_event_types enable row level security;
alter table public.booking_availability_rules enable row level security;
alter table public.booking_date_overrides enable row level security;
alter table public.booking_requirements enable row level security;
alter table public.booking_requirement_event_types enable row level security;
alter table public.booking_requirement_versions enable row level security;
alter table public.booking_bookings enable row level security;
alter table public.booking_acknowledgments enable row level security;
alter table public.booking_email_log enable row level security;
alter table public.booking_rate_limits enable row level security;

revoke all on public.booking_settings, public.booking_event_types, public.booking_availability_rules,
  public.booking_date_overrides, public.booking_requirements, public.booking_requirement_event_types,
  public.booking_requirement_versions, public.booking_bookings, public.booking_acknowledgments,
  public.booking_email_log, public.booking_rate_limits
  from anon, authenticated, public;

grant all on public.booking_settings, public.booking_event_types, public.booking_availability_rules,
  public.booking_date_overrides, public.booking_requirements, public.booking_requirement_event_types,
  public.booking_requirement_versions, public.booking_bookings, public.booking_acknowledgments,
  public.booking_email_log, public.booking_rate_limits
  to service_role;

-- Admin configuration tables: full read/write.
grant select, update on public.booking_settings to authenticated;
grant select, insert, update, delete on public.booking_event_types, public.booking_availability_rules,
  public.booking_date_overrides, public.booking_requirements, public.booking_requirement_event_types
  to authenticated;
-- Audit tables: versions insert-only; bookings readable (changes go through Edge Functions);
-- acknowledgments and email log read-only.
grant select, insert on public.booking_requirement_versions to authenticated;
grant select on public.booking_bookings, public.booking_acknowledgments, public.booking_email_log to authenticated;

create policy booking_settings_admin_select on public.booking_settings
  for select to authenticated using ((select private.is_admin()));
create policy booking_settings_admin_update on public.booking_settings
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy booking_event_types_admin_all on public.booking_event_types
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy booking_availability_rules_admin_all on public.booking_availability_rules
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy booking_date_overrides_admin_all on public.booking_date_overrides
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy booking_requirements_admin_all on public.booking_requirements
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy booking_requirement_event_types_admin_all on public.booking_requirement_event_types
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy booking_requirement_versions_admin_select on public.booking_requirement_versions
  for select to authenticated using ((select private.is_admin()));
create policy booking_requirement_versions_admin_insert on public.booking_requirement_versions
  for insert to authenticated with check ((select private.is_admin()));

create policy booking_bookings_admin_select on public.booking_bookings
  for select to authenticated using ((select private.is_admin()));
create policy booking_acknowledgments_admin_select on public.booking_acknowledgments
  for select to authenticated using ((select private.is_admin()));
create policy booking_email_log_admin_select on public.booking_email_log
  for select to authenticated using ((select private.is_admin()));
-- booking_rate_limits: no policies; service role only.

revoke all on function public.booking_validate_timezone() from public, anon, authenticated;
revoke all on function public.booking_requirement_versions_before_insert() from public, anon, authenticated;
revoke all on function public.booking_requirement_versions_immutable() from public, anon, authenticated;
