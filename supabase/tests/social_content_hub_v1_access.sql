-- Social Content Hub V1 access-control tests.
-- AI-Agent: ChatGPT/GPT-5.6 Sol
-- Session: Rebel Ranch Marketplace — Social Content Hub
-- NEVER run against production.
-- Run in a disposable/test database after the Social Content Hub migration.

begin;

-- Anonymous should have no table access at all.
do $$
begin
  if has_table_privilege('anon','public.social_content_items','SELECT')
     or has_table_privilege('anon','public.social_content_assets','SELECT')
     or has_table_privilege('anon','public.social_reels','SELECT')
     or has_table_privilege('anon','public.social_reel_frames','SELECT')
     or has_table_privilege('anon','public.social_post_history','SELECT')
  then
    raise exception 'social_content_hub_anonymous_access_failed';
  end if;
end $$;

-- A normal authenticated user should receive no rows through RLS.
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claim.role','authenticated',true);

do $$
begin
  if (select count(*) from public.social_content_items) <> 0
     or (select count(*) from public.social_content_assets) <> 0
     or (select count(*) from public.social_reels) <> 0
     or (select count(*) from public.social_post_history) <> 0
  then
    raise exception 'social_content_hub_non_admin_read_failed';
  end if;
end $$;

do $$
declare blocked boolean := false;
begin
  begin
    insert into public.social_content_items
      (id,program,campaign,title,audience)
    values
      ('TEST-NONADMIN','RRM General','Test','Should Not Insert','Everyone');
  exception when others then
    blocked := true;
  end;
  if not blocked then
    raise exception 'social_content_hub_non_admin_write_failed';
  end if;
end $$;

-- Existing disposable fixtures use this UUID as an administrator.
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000005',true);

do $$
declare updated_count integer;
begin
  if (select count(*) from public.social_content_items where campaign='2026-08 Launch') <> 14 then
    raise exception 'social_content_hub_admin_seed_read_failed';
  end if;

  with changed as (
    update public.social_content_items
    set notes = coalesce(notes,'') || ' [access test]'
    where id='RRL-01'
    returning id
  ) select count(*) into updated_count from changed;

  if updated_count <> 1 then
    raise exception 'social_content_hub_admin_update_failed';
  end if;
end $$;

insert into public.social_reels(program,campaign,title,objective,cta)
values('Rebel Ranch Local','2026-08 Launch','Access Test Reel','Verify admin reel write','Test CTA');

insert into public.social_reel_frames(reel_id,content_item_id,frame_order)
select id,'RRL-01',1 from public.social_reels where title='Access Test Reel';

insert into public.social_post_history(content_item_id,platform,notes)
values('RRL-01','Test Platform','Disposable access test only');

do $$
begin
  if (select count(*) from public.social_reels where title='Access Test Reel') <> 1
     or (select count(*) from public.social_reel_frames where content_item_id='RRL-01') <> 1
     or (select count(*) from public.social_post_history where platform='Test Platform') <> 1
  then
    raise exception 'social_content_hub_admin_related_write_failed';
  end if;
end $$;

rollback;
