# Intended Changes — Academy Lifecycle Status Consistency

**Date:** 2026-08-22
**AI-Agent:** ChatGPT/GPT-5.6 Sol
**Session:** RR Website — lifecycle status consistency cleanup

Authorized scope: fix contradictory/stale Academy lifecycle status display in Operations Review while preserving existing functionality and styling.

Planned change to `assets/js/academy-stage-progress-status.js`:

1. Treat the current `academy_content_projects` row as the authoritative lifecycle snapshot.
2. Recalculate every visible lifecycle card state on refresh: prior stages = Complete, current stage = current owner/agent status, future stages = Not reached.
3. When the authoritative project snapshot changes while the same project remains selected, invalidate the stale lifecycle workspace so it re-renders from current data instead of keeping the prior stage/status DOM.
4. Preserve existing cadence, progress, worker, owner-action, and next-step display behavior.
5. Do not change database schema, RLS, agent schedules, Water product content, release workflow, pricing, or public pages.
