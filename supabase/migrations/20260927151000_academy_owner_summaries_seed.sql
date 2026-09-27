-- AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
-- Data-only: plain-language owner_summary for projects that existed before the field.
-- Each line restates that project's own progress_detail / audit record in plain words.
-- Applied to project dfrwxpuojeiykaignyny via SQL on 2026-09-27 (only where owner_summary was null).
update public.academy_content_projects p set owner_summary = v.s from (values
('RRA-2026-0001','The rebuilt product passed browser checks, including the deeper-page return and saved learner answers you flagged. Open the preview, verify images and materials, and decide.'),
('RRA-2026-0002','Product design is done: course plan and manuscript, the My Well Test Plan worksheet, the Test Route Comparator, a result-to-next-action guide, and a $29 price recommendation. Approve it to move to visual build.'),
('RRA-2026-0003','You approved the design. The learner-facing visual build is next and has not been built yet.'),
('RRA-2026-0004','Product design is done, including storage-system tools and a $29 price recommendation (not yet set as the price). Approve it to move to visual build.'),
('RRA-2026-0005','Research is done: 10 vetted sources on how automatic waterers work, freeze risk, clogging, maintenance and backup. Decide whether it is solid enough to build from.'),
('RRA-2026-0006','Research is done: 12 vetted sources on backup water planning, storage safety, treatment limits and well recovery. Decide whether it is solid enough to build from.'),
('RRA-2026-0007','Research is done: 15 vetted sources on catching, storing and using rainwater safely. Decide whether it is solid enough to build from.'),
('RRA-2026-0008','Research is done: 14 EPA and Florida sources on reading water test results. Decide whether it is solid enough to build from.'),
('RRA-2026-0009','Research is done: 13 vetted sources on gravity, pressure and flow, with historical water systems for comparison. Decide whether it is solid enough to build from.'),
('RRA-2026-0010','Test project used to check the admin security gate. No research has been recorded.'),
('RRA-2026-0011','Both images are made and checked. A clickable preview still has to be built before you can review it.')
) as v(id,s) where p.project_id = v.id and p.owner_summary is null;
