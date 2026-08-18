# Companion functionality: real stage-guidance + age gating

Authorized by Brooke 2026-08-18 ("yes write" approving the phrase bank
drafted in chat, after she confirmed the existing Companion build should
have been age-gated and should actually guide/motivate through the real
project journey, not just narrate percent complete).

Authorized target: assets/js/creation-station-views.js only.

## What changed

1. `companionMessage()` rewritten to key off the real 6-stage journey
   (`journeyStages`/`stageIndexFor`, same data already used by the
   project-progress dialog) instead of raw completion percent. Each
   stage has 2 phrase variants for three moments: arrival, nudge, and
   celebrate (celebrate fires once, on the render where the stage
   index is detected to have advanced past what's stored).
2. Added `companionMoment(state, creator, project)` to decide
   arrival vs. nudge vs. celebrate, using:
   - `localStorage rrm-companion-stage-{creatorId}-{projectId}` to
     remember the last stage index shown, so a real stage advance
     (not just any render) triggers the one-time celebrate line.
   - `sessionStorage rrm-companion-greeted-{creatorId}` to show the
     arrival line once per browser session, nudge afterward. Same
     storage pattern already used elsewhere in this codebase (kid
     mode PIN, entry-transition flag).
   No new database table, column, or write — purely client-side, no
   Supabase change, no RLS/grant surface touched.
3. `companionPanel()` now only renders for `audience(state)==='young'`
   (same `age_band==='young_6_12'` field the project-edit dialog
   already uses to decide the simplified young stage-gate). Teens,
   adults, parent view, and admin view no longer see the Companion at
   all, per Brooke's explicit "this won't fly with older kids."

Phrase content is exactly what was drafted in chat and approved
("thats good we can add more later") — no wording changes. More
variants can be appended to the arrays later without touching the
surrounding logic.

Do not commit, push, publish, or deploy.
