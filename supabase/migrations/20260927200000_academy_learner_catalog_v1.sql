-- Academy learner area v1: learning areas list, learner-facing release fields,
-- and a public catalog that exposes ONLY released (LIVE + published) items.
-- Owner go-ahead 2026-09-27 ("go": build the layout and the Library screen).
-- AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
-- Additive only.

-- Learning areas: the six areas the live Academy site already presents
-- (app/page.tsx learningAreas). ids match the site's ids.
create table if not exists public.academy_learning_areas (
  id text primary key,
  sort_order smallint not null,
  title text not null,
  short_title text not null,
  description text not null,
  active boolean not null default true
);
alter table public.academy_learning_areas enable row level security;
drop policy if exists academy_learning_areas_public_read on public.academy_learning_areas;
create policy academy_learning_areas_public_read on public.academy_learning_areas
  for select to anon, authenticated using (active);
drop policy if exists academy_learning_areas_admin_write on public.academy_learning_areas;
create policy academy_learning_areas_admin_write on public.academy_learning_areas
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
grant select on public.academy_learning_areas to anon, authenticated;
grant insert, update, delete on public.academy_learning_areas to authenticated;

insert into public.academy_learning_areas (id, sort_order, title, short_title, description) values
 ('personal-strength', 1, 'Personal Strength & Independence', 'Strength & Independence', 'Confidence, responsibility, accountability, resilience, decision-making, and the ability to move forward when life gets hard.'),
 ('communication', 2, 'Communication & Emotional Intelligence', 'Communication & EQ', 'Self-control, healthy boundaries, difficult conversations, conflict, teamwork, relationships, and leadership.'),
 ('business', 3, 'Business & Operations', 'Business & Operations', 'Business basics, planning, customer service, pricing foundations, processes, quality, problem-solving, and practical Six Sigma.'),
 ('money', 4, 'Money, Finance & Taxes', 'Money, Finance & Taxes', 'Budgeting, banking, credit, saving, debt, cash flow, pricing, taxes, and making informed financial decisions.'),
 ('sustainability', 5, 'Sustainability & Agriculture', 'Sustainability & Agriculture', 'Homesteading, real food systems, soil, water, growing, farming, animal stewardship, land care, and resourcefulness.'),
 ('family', 6, 'Family, Community & Leadership', 'Family & Leadership', 'Capable families, teamwork, responsibility, healthy community, service, leadership, and showing up for the people around you.')
on conflict (id) do nothing;

-- Each project may be linked to one learning area.
alter table public.academy_content_projects
  add column if not exists learning_area_id text references public.academy_learning_areas(id);

update public.academy_content_projects set learning_area_id = case
  when learning_area ilike '%sustainab%' then 'sustainability'
  when learning_area ilike '%communication%' then 'communication'
  when learning_area ilike '%personal%' then 'personal-strength'
  when learning_area ilike '%business%' then 'business'
  else learning_area_id end
where learning_area_id is null;

-- Learner-facing fields written during Release Prep.
alter table public.academy_release_records
  add column if not exists public_title text,
  add column if not exists public_summary text,
  add column if not exists item_type text check (item_type in ('LESSON','GUIDE','WORKSHEET','TOOL','VIDEO','BUNDLE')),
  add column if not exists learning_area_id text references public.academy_learning_areas(id),
  add column if not exists price_usd numeric,
  add column if not exists cover_image_url text,
  add column if not exists lesson_url text;

comment on column public.academy_release_records.public_title is 'Learner-facing title shown in the Academy Library (Release Prep).';
comment on column public.academy_release_records.price_usd is 'Approved learner price at release. 0 = Free. Null = not for sale yet.';

-- Public catalog: only items whose project is LIVE and whose release is published.
-- SECURITY DEFINER so anonymous visitors can read the learner-safe columns
-- without being granted access to the admin-only project/release tables.
create or replace function public.get_academy_catalog()
returns table (
  project_id text,
  title text,
  summary text,
  item_type text,
  learning_area_id text,
  price_usd numeric,
  cover_image_url text,
  lesson_url text,
  released_at timestamptz
)
language sql
stable
security definer
set search_path to ''
as $$
  select distinct on (r.project_id)
         r.project_id,
         coalesce(nullif(btrim(r.public_title), ''), p.title),
         r.public_summary,
         coalesce(r.item_type, 'LESSON'),
         coalesce(r.learning_area_id, p.learning_area_id),
         coalesce(r.price_usd, p.proposed_price),
         r.cover_image_url,
         coalesce(r.lesson_url, r.release_url),
         coalesce(r.verified_at, r.published_at)
    from public.academy_release_records r
    join public.academy_content_projects p on p.project_id = r.project_id
   where p.workflow_stage = 'LIVE'
     and r.published_at is not null
     and coalesce(p.archived, false) = false
   order by r.project_id, coalesce(r.verified_at, r.published_at) desc;
$$;
revoke all on function public.get_academy_catalog() from public;
grant execute on function public.get_academy_catalog() to anon, authenticated;
