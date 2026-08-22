# Academy Lifecycle Stage Workspace — Intended Change

**Date:** 2026-08-22
**AI-Agent:** ChatGPT/GPT-5.6 Sol
**Session:** RR Website — Academy lifecycle stage workspace

## Owner direction
Replace the overloaded all-phases project detail view with a focused lifecycle review system: each Academy Product Lifecycle stage opens as its own full-width owner workspace, past stages remain reviewable, bottom Previous/Next navigation allows sequential review, current state/action is unmistakable, and Visual Production exposes the actual learner-facing previews with durable owner feedback/change requests.

## Authorized scope
- Add a lifecycle stage workspace module and styling for Operations Review.
- Preserve existing Operations Review data modules as audit/intelligence sources but hide their long combined project-detail presentation when the focused stage workspace is active.
- Add stage cards and Previous/Next navigation.
- Add stage-specific artifact/history summaries.
- Add actual Visual Production preview surfaces for HTML/interactive assets.
- Add durable stage/component feedback records and admin-only submission RPC.
- Add owner review buttons at Research Review, Product Review and Final Product Review only when the project is actually waiting on the owner.
- Update the Visual Production Agent behavior so it maintains a preview manifest and processes pending Visual Production feedback.
- Do not publish, deploy learner products, activate prices, sell, or bypass any owner gate.

## Existing file to change
- `assets/js/supabase-client.js` — import the new lifecycle workspace module.

## New files
- `assets/js/operations-review-lifecycle-workspace.js`
- `assets/css/operations-review-lifecycle-workspace.css`
- `supabase/migrations/20260822123000_academy_stage_feedback.sql`

## Safety
Existing authentication, admin checks, RLS, review events, workflow stages, Opportunity/Audience Intelligence data, and release gates remain authoritative and unchanged.