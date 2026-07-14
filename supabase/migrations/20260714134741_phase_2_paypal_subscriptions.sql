alter table public.memberships
  add column if not exists payment_provider text,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_plan_id text,
  add column if not exists provider_next_billing_at timestamptz,
  add column if not exists payment_failed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

alter table public.memberships drop constraint if exists memberships_status_check;
alter table public.memberships add constraint memberships_status_check
  check (status in ('pending','active','past_due','cancelled','expired','suspended'));

create unique index if not exists memberships_provider_subscription_uidx
  on public.memberships(payment_provider, provider_subscription_id)
  where provider_subscription_id is not null;

create table if not exists public.payment_plan_mappings (
  id uuid primary key default gen_random_uuid(),
  payment_provider text not null,
  payment_environment text not null check (payment_environment in ('sandbox','live')),
  program_code text not null,
  offer_code text not null,
  provider_plan_id text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(payment_provider, payment_environment, program_code, offer_code),
  unique(payment_provider, payment_environment, provider_plan_id)
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique(payment_provider, provider_event_id)
);

alter table public.payment_plan_mappings enable row level security;
alter table public.payment_events enable row level security;
revoke all on public.payment_plan_mappings from anon, authenticated;
revoke all on public.payment_events from anon, authenticated;
grant all on public.payment_plan_mappings to service_role;
grant all on public.payment_events to service_role;

insert into public.payment_plan_mappings
  (payment_provider, payment_environment, program_code, offer_code, provider_plan_id, is_active)
values
  ('paypal','sandbox','creation_station','young_creator_family','P-41484347F79488808NJLE2CA',true),
  ('paypal','sandbox','creation_station','creator_development','P-4LM62438SR045062ENJLE2CA',true),
  ('paypal','sandbox','creation_station','creator_website','P-3Y70407689889710CNJLE2CI',true)
on conflict (payment_provider, payment_environment, program_code, offer_code)
do update set provider_plan_id=excluded.provider_plan_id, is_active=true, updated_at=now();

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public';
  end if;
end $$;
