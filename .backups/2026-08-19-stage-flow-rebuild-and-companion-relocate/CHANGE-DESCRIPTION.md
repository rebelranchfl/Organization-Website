# Real stage-to-stage project flow (ported from creation-station-experience.html demo) + Companion relocation

Authorized by Brooke 2026-08-19, across several back-and-forth messages in this
session (collaborative-problem-solving cycle): confirmed she wants the real
member dashboard's project-working experience rebuilt to match the demo
page's actual stage-by-stage flow (`creation-station-experience.html`'s
`#project` section — a row of 6 clickable steps, each with its own real
questions/checklists, right on the page), because the current dashboard's
one-size-fits-all pop-up form is less helpful for younger kids than the
demo's distinct per-step guidance. Also confirmed: give each project a real
place to store separate answers per step (Option B — a new `stage_data`
column, not reusing the single `notes` text blob for structured data), and
move the Creation Companion out of its own permanent row into a small
tap-to-expand icon inside the existing journey summary bar (Option 1),
bigger by default on desktop, icon-only on mobile until tapped.

Authorized targets:
- Supabase migration (new column, additive only, no existing data touched)
- assets/js/creation-station-data.js
- assets/js/creation-station-views.js
- assets/js/creation-station-app.js
- creation-station-dashboard.html
- assets/css/creation-station-dashboard.css

## What's changing

1. **Database**: `creator_projects` gets a new `stage_data jsonb not null
   default '{}'::jsonb` column. Additive only — every existing project row
   gets an empty `{}` default, nothing is read, removed, or reshaped.
   Column on an already-RLS-covered table, so no new grant/policy surface
   (unlike the earlier Companion-table grant gap).

2. **The project-editing pop-up (`#edit-dialog`) is removed** and replaced
   with an inline "project workspace" that renders directly on the Studio
   page when a project is opened — a clickable 6-step row (reusing the
   existing `.journey-track` styling already used for the demo-liked
   progress bar) plus one real panel below it per step, matching the demo's
   actual per-stage questions:
   - Dream It: existing "what are you making" question (unchanged, still the
     `notes.description` field used elsewhere) + new "who's it for" question.
   - Plan It: new 4-item checklist + "how much time" + "what will it cost."
   - Make It: new 4-item checklist + the existing "what was tricky" question,
     repurposed here as "what problem came up."
   - Capture It: the existing single-photo upload (unchanged — still
     replaces the old photo, per the 2026-08-19 photo-replace fix, not
     rebuilt as multi-photo) + a new "what does this photo show" question.
   - Share It: new "tell your story" + "could this be sold/gifted/used"
     questions.
   - Grow It: the existing "what worked," "what would you change," and
     "what did you learn" questions (unchanged fields, just shown on their
     own dedicated step instead of buried in one long form).
   Clicking "Mark [Step] Complete" saves that step's answers and moves
   completion forward using the same stage→percent table already in use,
   then auto-advances to the next step, mirroring the demo exactly. The
   existing young-creator "still working or all finished" check before
   Grow It is preserved. Archiving still works from the project card itself
   (already existed there independently of the old pop-up).

3. **Companion**: moves from a full always-visible row into a small icon
   docked in the existing journey summary bar; tapping it opens a small
   popover with his message and the Customize button. Sized larger on
   desktop, shrinks to icon-only on phones. No new floating/global widget.

## Explicit exclusions

- Not building multi-photo capture — stays single-photo, matching the
  2026-08-19 replace-fix already shipped; a deliberate separate decision
  per that day's handoff doc.
- Not touching project creation (`#project-dialog`), archive/favorite,
  PIN, website/product/session dialogs, or any other view.
- Not committing, pushing, publishing, or deploying.
