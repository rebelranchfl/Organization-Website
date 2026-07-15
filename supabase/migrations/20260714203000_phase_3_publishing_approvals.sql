-- Owner-approved Phase 3 publishing and moderation state machines.
create type public.portfolio_publication_status as enum
  ('private','submitted','changes_requested','approved','published','rejected','archived');

alter table public.creator_portfolios
  add column parent_approved_at timestamptz,
  add column admin_approved_at timestamptz,
  add column published_at timestamptz,
  add column moderation_note text not null default '';

alter table public.creator_portfolios
  alter column review_status drop default;
alter table public.creator_portfolios
  alter column review_status type public.portfolio_publication_status
  using (case review_status::text when 'draft' then 'private' else review_status::text end)::public.portfolio_publication_status;
alter table public.creator_portfolios
  alter column review_status set default 'private';

create type public.website_publication_status as enum
  ('draft','submitted','changes_requested','approved','published','rejected','archived');

drop policy website_requests_owner_delete on public.creator_website_requests;
alter table public.creator_website_requests alter column status drop default;
alter table public.creator_website_requests alter column status type public.website_publication_status
  using status::text::public.website_publication_status;
alter table public.creator_website_requests alter column status set default 'draft';
create policy website_requests_owner_delete on public.creator_website_requests for delete to authenticated
using(owner_user_id=(select auth.uid()) and status in ('draft','archived') or private.is_creation_station_admin());

alter table public.creator_website_requests
  add column revision_number integer not null default 1 check(revision_number > 0),
  add column replaces_request_id uuid references public.creator_website_requests(id) on delete set null,
  add column moderation_note text not null default '';

create unique index creator_website_one_live_revision_idx
  on public.creator_website_requests(creator_id)
  where status in ('submitted','approved');
create index creator_website_requests_replaces_request_id_idx
  on public.creator_website_requests(replaces_request_id);

create or replace function private.guard_portfolio_publication()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_admin boolean := private.is_creation_station_admin();
  v_creator_type text;
  v_age_band text;
begin
  select creator_type, age_band into v_creator_type, v_age_band
  from public.creator_profiles where id=new.creator_id;

  if tg_op='INSERT' and not v_admin and new.review_status <> 'private' then
    raise exception 'portfolio_must_start_private';
  end if;

  if tg_op='UPDATE' and new.review_status is distinct from old.review_status then
    if v_admin then
      if new.review_status='approved' then new.admin_approved_at := now(); end if;
      if new.review_status='published' then
        if old.review_status <> 'approved' then raise exception 'portfolio_requires_admin_approval'; end if;
        new.published_at := now();
      elsif old.review_status='published' then
        new.published_at := null;
      end if;
    else
      if not (
        (old.review_status in ('private','changes_requested','rejected') and new.review_status='submitted') or
        (old.review_status='published' and new.review_status='private') or
        (old.review_status='private' and new.review_status='archived') or
        (old.review_status='archived' and new.review_status='private')
      ) then raise exception 'portfolio_transition_requires_admin'; end if;

      if new.review_status='submitted' and v_creator_type in ('child','teen') then
        new.parent_approved_at := coalesce(new.parent_approved_at,now());
      end if;
      new.admin_approved_at := old.admin_approved_at;
      new.published_at := case when new.review_status='private' then null else old.published_at end;
      new.moderation_note := old.moderation_note;
    end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_portfolio_publication() from public,anon,authenticated;

create trigger guard_portfolio_publication
before insert or update on public.creator_portfolios
for each row execute function private.guard_portfolio_publication();

create or replace function private.guard_website_publication()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_admin boolean := private.is_creation_station_admin();
begin
  if tg_op='INSERT' and not v_admin and new.status not in ('draft','submitted') then
    raise exception 'website_request_must_start_in_review';
  end if;
  if tg_op='UPDATE' then
    if v_admin then
      if new.status='approved' then new.approved_at:=now(); end if;
      if new.status='published' then
        if old.status<>'approved' then raise exception 'website_requires_admin_approval'; end if;
        new.published_at:=now();
      elsif old.status='published' then new.published_at:=null;
      end if;
    else
      if old.status='published' then raise exception 'published_website_updates_require_new_revision'; end if;
      if new.status is distinct from old.status and not (
        (old.status='draft' and new.status='submitted') or
        (old.status='changes_requested' and new.status='submitted') or
        (old.status in ('draft','rejected') and new.status='archived')
      ) then raise exception 'website_transition_requires_admin'; end if;
      new.admin_notes:=old.admin_notes; new.moderation_note:=old.moderation_note;
      new.approved_at:=old.approved_at; new.published_at:=old.published_at; new.published_url:=old.published_url;
    end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_website_publication() from public,anon,authenticated;

create trigger guard_website_publication
before insert or update on public.creator_website_requests
for each row execute function private.guard_website_publication();

-- Public reads expose only deliberately published portfolios. Assets remain private;
-- public delivery must use short-lived signed URLs created by a trusted server workflow.
create policy published_portfolios_public_read on public.creator_portfolios
for select to anon using(review_status='published');
create policy published_portfolio_items_public_read on public.portfolio_items
for select to anon using(exists(
 select 1 from public.creator_portfolios p where p.id=portfolio_id and p.review_status='published'
));
revoke all on public.creator_portfolios,public.portfolio_items from anon;
grant select(id,creator_id,title,bio,public_slug,review_status,published_at) on public.creator_portfolios to anon;
grant select(id,portfolio_id,title,description,sort_order,is_featured,created_at) on public.portfolio_items to anon;

comment on column public.creator_website_requests.products is
  'Member-supplied content only. HTML, JavaScript, and executable uploads are not accepted or deployed.';
