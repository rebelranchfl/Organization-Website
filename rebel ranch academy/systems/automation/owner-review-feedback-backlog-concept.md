# Concept — In-Context Owner Feedback and Revision Backlog

Status: **captured, not built.** Owner raised this 2026-09-14 while reviewing the rendered RRA-2026-0011 preview and explicitly said to leave the pipeline as-is for now ("we still have a lot of back end work"). This document exists so the idea isn't lost before it's prioritized, not as an authorization to build it.

## The problem this solves

The current review pattern requires the owner to back out of the actual rendered product (the thing they're looking at in the browser) and go to the Program Hub dashboard to record a decision or leave a note. While looking at a real page, the owner will constantly notice small things worth fixing, adding, or reconsidering — not blocking defects, just improvement ideas. If every one of those requires backing out to the dashboard, either:
1. The owner does it anyway, and review sessions get slow and disruptive, or
2. The owner doesn't bother, and the feedback is lost.

Owner's own framing (paraphrased from the 2026-09-14 conversation): *"I'll constantly run into seeing something that needs to be added or an opportunity to take it in a different direction. If we stop and go back every time, we'll never publish anything."*

## The shape of the fix (as discussed, not yet designed in implementation detail)

Two lanes, kept separate:

1. **The existing owner-gate review** (Research Review, Product Review, Final Product Review) stays exactly as it is — this is "is this correct/complete enough to move forward or go live," a stop-the-line decision.
2. **A new, lower-friction feedback lane**, usable *while looking at the rendered product itself*:
   - The owner can leave a note in place, in context, without leaving the page or breaking their review flow.
   - Notes queue into a per-project backlog rather than blocking anything.
   - The backlog is worked in a batch: either on a schedule (e.g., monthly) or on-demand ("act now"), producing a revision pass — informally, a "volume two" of the project.
   - The revision pass goes back through real review (not auto-published) before anything changes on the live version.
   - Nothing here bypasses the existing owner gates; it feeds into them.

## Why this is the right shape (not scope creep on the existing gates)

This session already has a working pattern for exactly this kind of two-speed system: hard QA/evidence gates that never get relaxed, plus separate room for judgment calls and iteration. This is the same idea applied to a case the existing pipeline doesn't have a lane for yet: "not wrong, just could be better."

## Open questions for whoever designs this next (owner or a future session)

- Where does the owner leave the note — a lightweight in-page widget on the rendered preview itself (would need to be built into every rendered product, e.g. `eq-lesson-preview.html`'s pattern), or a browser-extension-style overlay, or something simpler like a persistent "Notes on this project" panel reachable from the same page without a full navigation away?
- What does "queue into a backlog" mean concretely — a new Supabase table (e.g. `academy_project_feedback_notes`) keyed to `project_id`, with fields like note text, page/section context, status (`OPEN` / `SCHEDULED` / `IN_REVISION` / `RESOLVED`), and timestamps?
- Who/what triggers the batch revision pass — a Program Hub button ("Start revision pass"), a scheduled Routine, or both?
- Does a revision pass need its own lightweight workflow stage (e.g., `REVISION_WORKING` → `REVISION_REVIEW`), or does it reuse the existing PRODUCT_WORKING/PRODUCT_REVIEW stages on a project that's already LIVE?

## First candidate to run through it, once built

The exact RRA-2026-0011 feedback item that prompted this discussion: the "employers now actively seek EI over other skills" claim the owner wants included eventually, but which needs real sourcing before it can be added (per the Academy's evidence-first standard) and isn't needed right now. That is a natural first backlog item once this exists.
