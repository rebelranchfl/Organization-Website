-- Phase 3: operational Creation Station. Additive; does not alter auth or payments.
create type public.creation_project_status as enum ('not_started','in_progress','completed','archived');
create type public.creation_review_status as enum ('draft','submitted','approved','changes_requested','rejected');

create or replace function private.is_creation_station_admin()
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin') $$;
revoke all on function private.is_creation_station_admin() from public;
grant execute on function private.is_creation_station_admin() to authenticated;

create or replace function private.creation_station_tier_rank()
returns integer language sql stable security definer set search_path=''
as $$
 select coalesce(max(case offer_code when 'young_creator_family' then 1 when 'creator_development' then 2 when 'creator_website' then 3 else 0 end),0)
 from public.memberships where user_id=(select auth.uid()) and program_code='creation_station'
 and membership_status in ('active','past_due') and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now())
$$;
revoke all on function private.creation_station_tier_rank() from public;
grant execute on function private.creation_station_tier_rank() to authenticated;

create table public.project_templates (
 id uuid primary key default gen_random_uuid(), title text not null, summary text not null default '', instructions text not null default '',
 category text not null default 'creative', difficulty text not null default 'beginner', minimum_tier smallint not null default 1 check(minimum_tier between 1 and 3),
 estimated_minutes integer check(estimated_minutes>0), supply_list jsonb not null default '[]', is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.creator_projects (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
 creator_id uuid not null references public.creator_profiles(id) on delete cascade, template_id uuid references public.project_templates(id) on delete set null,
 membership_offer_code text not null, title text not null, status public.creation_project_status not null default 'not_started', completion smallint not null default 0 check(completion between 0 and 100),
 notes text not null default '', is_favorite boolean not null default false, started_at timestamptz, completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.project_assets (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
 creator_id uuid not null references public.creator_profiles(id) on delete cascade, project_id uuid not null references public.creator_projects(id) on delete cascade,
 storage_path text not null unique, file_name text not null, mime_type text, file_size bigint check(file_size>=0), caption text not null default '', created_at timestamptz not null default now()
);
create table public.creator_portfolios (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
 creator_id uuid not null unique references public.creator_profiles(id) on delete cascade, title text not null, bio text not null default '',
 is_public boolean not null default false, public_slug text unique, review_status public.creation_review_status not null default 'draft',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.portfolio_items (
 id uuid primary key default gen_random_uuid(), portfolio_id uuid not null references public.creator_portfolios(id) on delete cascade,
 owner_user_id uuid not null references auth.users(id) on delete cascade, project_id uuid references public.creator_projects(id) on delete set null,
 asset_id uuid references public.project_assets(id) on delete set null, title text not null, description text not null default '', sort_order integer not null default 0,
 is_featured boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.creation_resources (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null default '', resource_type text not null,
 minimum_tier smallint not null default 1 check(minimum_tier between 1 and 3), storage_path text, external_url text, is_published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.live_classes (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null default '', starts_at timestamptz not null,
 ends_at timestamptz, minimum_tier smallint not null default 1 check(minimum_tier between 1 and 3), capacity integer check(capacity>0),
 meeting_url text, replay_url text, supply_list jsonb not null default '[]', is_published boolean not null default false, created_at timestamptz not null default now()
);
create table public.class_registrations (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
 creator_id uuid not null references public.creator_profiles(id) on delete cascade, class_id uuid not null references public.live_classes(id) on delete cascade,
 attended_at timestamptz, created_at timestamptz not null default now(), unique(creator_id,class_id)
);
create table public.creator_website_requests (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
 creator_id uuid not null references public.creator_profiles(id) on delete cascade, status public.creation_review_status not null default 'draft',
 brand_name text not null, story text not null default '', products text not null default '', social_links jsonb not null default '{}', owner_notes text not null default '', admin_notes text not null default '',
 submitted_at timestamptz, approved_at timestamptz, published_at timestamptz, published_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.creation_activity (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
 creator_id uuid references public.creator_profiles(id) on delete cascade, activity_type text not null, subject_type text not null, subject_id uuid,
 summary text not null, created_at timestamptz not null default now()
);

create index on public.creator_projects(owner_user_id,updated_at desc); create index on public.creator_projects(creator_id,status);
create index on public.project_assets(project_id); create index on public.portfolio_items(portfolio_id,sort_order);
create index on public.class_registrations(owner_user_id); create index on public.creator_website_requests(owner_user_id,updated_at desc);
create index on public.creation_activity(owner_user_id,created_at desc);

alter table public.project_templates enable row level security; alter table public.creator_projects enable row level security;
alter table public.project_assets enable row level security; alter table public.creator_portfolios enable row level security;
alter table public.portfolio_items enable row level security; alter table public.creation_resources enable row level security;
alter table public.live_classes enable row level security; alter table public.class_registrations enable row level security;
alter table public.creator_website_requests enable row level security; alter table public.creation_activity enable row level security;

grant select on public.project_templates,public.creation_resources,public.live_classes to authenticated;
grant select,insert,update,delete on public.creator_projects,public.project_assets,public.creator_portfolios,public.portfolio_items,public.class_registrations,public.creator_website_requests to authenticated;
grant select,insert on public.creation_activity to authenticated;

create policy templates_member_read on public.project_templates for select to authenticated using(is_active and minimum_tier<=private.creation_station_tier_rank() or private.is_creation_station_admin());
create policy resources_member_read on public.creation_resources for select to authenticated using(is_published and minimum_tier<=private.creation_station_tier_rank() or private.is_creation_station_admin());
create policy classes_member_read on public.live_classes for select to authenticated using(is_published and minimum_tier<=private.creation_station_tier_rank() or private.is_creation_station_admin());

create policy projects_owner_all on public.creator_projects for all to authenticated
 using(owner_user_id=(select auth.uid()) and private.has_active_creation_station_membership() or private.is_creation_station_admin())
 with check(owner_user_id=(select auth.uid()) and exists(select 1 from public.creator_profiles c where c.id=creator_id and c.owner_user_id=(select auth.uid())) and private.has_active_creation_station_membership() or private.is_creation_station_admin());
create policy assets_owner_all on public.project_assets for all to authenticated
 using(owner_user_id=(select auth.uid()) or private.is_creation_station_admin())
 with check(owner_user_id=(select auth.uid()) and exists(select 1 from public.creator_projects p where p.id=project_id and p.owner_user_id=(select auth.uid())) or private.is_creation_station_admin());
create policy portfolios_owner_all on public.creator_portfolios for all to authenticated
 using(owner_user_id=(select auth.uid()) or private.is_creation_station_admin())
 with check(owner_user_id=(select auth.uid()) and exists(select 1 from public.creator_profiles c where c.id=creator_id and c.owner_user_id=(select auth.uid())) or private.is_creation_station_admin());
create policy portfolio_items_owner_all on public.portfolio_items for all to authenticated using(owner_user_id=(select auth.uid()) or private.is_creation_station_admin()) with check(owner_user_id=(select auth.uid()) or private.is_creation_station_admin());
create policy registrations_owner_all on public.class_registrations for all to authenticated using(owner_user_id=(select auth.uid()) or private.is_creation_station_admin()) with check(owner_user_id=(select auth.uid()) and exists(select 1 from public.creator_profiles c where c.id=creator_id and c.owner_user_id=(select auth.uid())) or private.is_creation_station_admin());
create policy website_requests_owner_read on public.creator_website_requests for select to authenticated using(owner_user_id=(select auth.uid()) or private.is_creation_station_admin());
create policy website_requests_owner_insert on public.creator_website_requests for insert to authenticated with check(owner_user_id=(select auth.uid()) and private.creation_station_tier_rank()>=3 and exists(select 1 from public.creator_profiles c where c.id=creator_id and c.owner_user_id=(select auth.uid())) or private.is_creation_station_admin());
create policy website_requests_owner_update on public.creator_website_requests for update to authenticated using(owner_user_id=(select auth.uid()) or private.is_creation_station_admin()) with check(owner_user_id=(select auth.uid()) and private.creation_station_tier_rank()>=3 or private.is_creation_station_admin());
create policy website_requests_owner_delete on public.creator_website_requests for delete to authenticated using(owner_user_id=(select auth.uid()) and status='draft' or private.is_creation_station_admin());
create policy activity_owner_read on public.creation_activity for select to authenticated using(owner_user_id=(select auth.uid()) or private.is_creation_station_admin());
create policy activity_owner_insert on public.creation_activity for insert to authenticated with check(owner_user_id=(select auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('creation-station-private','creation-station-private',false,20971520,array['image/jpeg','image/png','image/webp','application/pdf','text/plain'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy creation_storage_read on storage.objects for select to authenticated using(bucket_id='creation-station-private' and ((storage.foldername(name))[1]=(select auth.uid())::text or private.is_creation_station_admin()));
create policy creation_storage_insert on storage.objects for insert to authenticated with check(bucket_id='creation-station-private' and (storage.foldername(name))[1]=(select auth.uid())::text and private.has_active_creation_station_membership());
create policy creation_storage_update on storage.objects for update to authenticated using(bucket_id='creation-station-private' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='creation-station-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy creation_storage_delete on storage.objects for delete to authenticated using(bucket_id='creation-station-private' and ((storage.foldername(name))[1]=(select auth.uid())::text or private.is_creation_station_admin()));

insert into public.project_templates(title,summary,instructions,category,difficulty,minimum_tier,estimated_minutes,supply_list) values
 ('My First Maker Project','Plan, make, photograph, and reflect on something you create.','Choose an idea, list supplies, build safely, upload your result, and write what you learned.','creative','beginner',1,60,'[]'),
 ('Price a Handmade Product','Learn materials cost, time, price, and profit.','Record costs, estimate your time, compare prices, and choose a sustainable price.','business','intermediate',2,90,'[]'),
 ('Build Your Creator Brand Story','Prepare the story and visual direction for a creator website.','Define your audience, values, story, products, colors, and photography needs.','website','advanced',3,120,'[]');
