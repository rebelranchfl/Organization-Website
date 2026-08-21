# Opportunity Intelligence v1 — Shared Agent Standard Change

**Date:** 2026-08-21
**AI-Agent:** ChatGPT/GPT-5.6 Sol
**Session:** RR Website — Academy Opportunity Intelligence v1

## Existing file authorized for update
`rebel ranch academy/ACADEMY-PRODUCT-PHASE-WORKFLOW-EXTENSION.md`

## Intended change
Append a new Opportunity Intelligence section. Both the Research Agent and Product Design Agent already read this shared extension on each run, so this is the smallest safe way to make the new intelligence behavior durable without replacing or weakening either automation's existing prompt.

The new section will require meaningful opportunity discoveries to be written to `academy_opportunities`, connected to Academy areas/programs/skills, fast-screened, and assigned an explainable recommendation. Strong `PURSUE_NOW` opportunities may be spun into separate Academy project intake when `spin_off_ready=true` and no gate/evidence blocker exists. `NOT_RECOMMENDED_OWNER_REVIEW` opportunities must remain for low-urgency owner disposition and may not be silently deleted or closed by an agent.

No existing workflow gate, release restriction, evidence boundary, owner authority, or revision-preservation rule will be removed.
