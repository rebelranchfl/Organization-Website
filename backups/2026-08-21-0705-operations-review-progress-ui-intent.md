# Intended change

Update `operations-review.html` so the owner can see live Academy project progress that is already stored in Supabase.

Scope only:
- add progress percentage to queue cards;
- show current stage, what the agent is doing now, what comes next, and last progress update in project detail;
- add a visual progress bar;
- switch the fallback GitHub branch from the obsolete working branch to `main`;
- read the existing progress fields from `academy_content_projects`.

No changes to public Academy content, pricing, release status, authentication policy, or review-decision logic.
