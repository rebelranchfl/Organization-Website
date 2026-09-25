-- AI-Agent: Claude Code (Claude Opus 5.5)
-- Session: Social Content Hub — verify system + all-programs full-control v2 (2026-09-25)
-- Access checks for the v2 hub tables. Runs inside a transaction and rolls back.
-- Passed against production 2026-09-25: anon has no privileges; a signed-in non-admin sees 0 rows;
-- an admin sees all rows, new items get program-code IDs (e.g. CS-0109), new outreach gets OUT-014,
-- program renames propagate to item.program, and activity-log inserts work.
begin;
create temp table _r(test text, result text) on commit drop;
grant all on _r to authenticated, anon;
select set_config('test.admin', (select user_id::text from public.user_roles where role='admin' limit 1), true);

insert into _r select 'anon can read programs? (expect false)', has_table_privilege('anon','public.social_programs','select')::text;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-000000000001','role','authenticated')::text, true);
insert into _r select 'non-admin programs (expect 0)', count(*)::text from public.social_programs;
insert into _r select 'non-admin outreach (expect 0)', count(*)::text from public.social_outreach;
insert into _r select 'non-admin items (expect 0)', count(*)::text from public.social_content_items;
insert into _r select 'non-admin activity (expect 0)', count(*)::text from public.social_activity_log;

select set_config('request.jwt.claims', json_build_object('sub',current_setting('test.admin'),'role','authenticated')::text, true);
insert into _r select 'admin programs (expect >0)', count(*)::text from public.social_programs;
insert into public.social_content_items (program_id, title, caption) values ((select id from public.social_programs where code='CS'), 'RLS test item', 'x');
insert into _r select 'admin new item (expect CS-xxxx / General / Draft)', id||' / '||campaign||' / '||status from public.social_content_items where title='RLS test item';
insert into public.social_outreach (target_name) values ('RLS test target');
insert into _r select 'admin new outreach ref (expect OUT-nnn)', ref from public.social_outreach where target_name='RLS test target';
update public.social_programs set name='Creation Station TEST' where code='CS';
insert into _r select 'rename propagates (expect Creation Station TEST)', program from public.social_content_items where title='RLS test item';
insert into public.social_activity_log (entity_type, action, actor) values ('test','test','Claude');
insert into _r select 'admin activity insert (expect 1)', count(*)::text from public.social_activity_log where entity_type='test';
reset role;
select * from _r;
rollback;
