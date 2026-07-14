-- Mirrors the Phase 2 schema already applied to the Supabase project.
alter table public.memberships
  add column if not exists payment_provider text,
  add column if not exists payment_environment text,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_plan_id text,
  add column if not exists provider_status text,
  add column if not exists next_billing_at timestamptz,
  add column if not exists cancel_requested_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists last_payment_at timestamptz,
  add column if not exists last_payment_failure_at timestamptz,
  add column if not exists payment_issue_code text;

create unique index if not exists memberships_provider_subscription_uidx
  on public.memberships(payment_provider,payment_environment,provider_subscription_id)
  where provider_subscription_id is not null;

create table if not exists public.payment_plan_mappings (
  id uuid primary key default gen_random_uuid(),
  payment_provider text not null default 'paypal' check(payment_provider='paypal'),
  payment_environment text not null check(payment_environment in ('sandbox','live')),
  program_code text not null check(program_code='creation_station'),
  offer_code text not null check(offer_code in ('young_creator_family','creator_development','creator_website')),
  provider_plan_id text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(payment_provider,payment_environment,offer_code),
  unique(payment_provider,payment_environment,provider_plan_id)
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_provider text not null check(payment_provider='paypal'),
  payment_environment text not null check(payment_environment in ('sandbox','live')),
  provider_event_id text not null,
  event_type text not null,
  provider_subscription_id text,
  membership_id uuid references public.memberships(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  verification_status text not null default 'verified' check(verification_status in ('verified','invalid')),
  processing_status text not null default 'pending' check(processing_status in ('pending','processed','ignored','failed')),
  error_message text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(payment_provider,payment_environment,provider_event_id)
);

alter table public.payment_plan_mappings enable row level security;
alter table public.payment_events enable row level security;
revoke all on public.payment_plan_mappings from anon,authenticated;
revoke all on public.payment_events from anon,authenticated;
grant all on public.payment_plan_mappings to service_role;
grant all on public.payment_events to service_role;

insert into public.payment_plan_mappings(payment_provider,payment_environment,program_code,offer_code,provider_plan_id,is_active)
values
 ('paypal','sandbox','creation_station','young_creator_family','P-41484347F79488808NJLE2CA',true),
 ('paypal','sandbox','creation_station','creator_development','P-4LM62438SR045062ENJLE2CA',true),
 ('paypal','sandbox','creation_station','creator_website','P-3Y70407689889710CNJLE2CI',true)
on conflict(payment_provider,payment_environment,offer_code)
do update set provider_plan_id=excluded.provider_plan_id,is_active=true,updated_at=now();
