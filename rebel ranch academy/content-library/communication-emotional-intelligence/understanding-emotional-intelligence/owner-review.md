# Owner Review History — RRA-2026-0011

No owner decision has been recorded yet.

**Correction (2026-09-14):** this project is actually parked at **Gate A — Owner Research Review** (`workflow_stage = RESEARCH_REVIEW`), per `ACADEMY-PRODUCT-PHASE-WORKFLOW-EXTENSION.md`, which is the multi-gate model the live dashboard actually implements. This gate covers **Context Review → Research** only. The owner's real, clickable options on the Research Review page are:

- `Approve Research Foundation`
- `Needs More Research`
- `Reject Research Direction`

`Approve Research Foundation` does **not** approve the Concept/Content/Materials/Pricing draft already sitting in this folder (`concept.md`, `master-content.md`, `activities/name-it-to-tame-it.md`, `pricing.md`) — those were produced ahead of this gate, following the older single-gate workflow document, and are marked `DRAFT_AHEAD_OF_GATE` in `project.json`. Under the real process, approving the research here only authorizes Product Opportunity Research to begin; the existing draft can be used as a head start on Product Design once that stage is properly reached, but it has not been reviewed as a product.

Nothing below this line is written until the owner actually decides through the real dashboard control (or explicitly tells this agent what to record). This file is not a substitute for that decision, and no status in Supabase or project.json will be marked `APPROVED` by an agent.

---

## Review #1

**Date:** 2026-09-14T11:22:56Z
**Gate:** RESEARCH_REVIEW
**Decision:** APPROVE RESEARCH FOUNDATION
**Recorded via:** the real dashboard `Approve Research Foundation` button → `submit_academy_stage_review()` RPC (not entered by an agent)
**Owner comment:** none supplied
**Resulting state:** `current_status = APPROVED`, `workflow_stage = PRODUCT_OPPORTUNITY_RESEARCH`

This approves the Research Foundation only (context review + research + sources). It does **not** approve `concept.md`, `master-content.md`, `activities/name-it-to-tame-it.md`, or `pricing.md` — those remain `DRAFT_AHEAD_OF_GATE` in `project.json` and were written before this gate existed in the real workflow sequence. The next authorized stage is Product Opportunity Research (with its own Recommendation Scorecard), not Product Design directly.

---

## Review #2

**Date:** 2026-09-14T11:36:07Z
**Gate:** PRODUCT_REVIEW
**Decision:** APPROVE PRODUCT DESIGN
**Recorded via:** the real dashboard `Approve Product Design` button → `submit_academy_stage_review()` RPC
**Owner comment:** none supplied
**Resulting state:** `current_status = APPROVED`, `workflow_stage = VISUAL_PRODUCTION`

This approves `product-opportunity-research.md`, `product-recommendation-scorecard.md`, `product-architecture.md`, `product-manuscript.md`, `activities/name-it-to-tame-it.md`, `pricing.md`, and `product-qa.md` as the Product Design package. It authorizes Visual Production to begin. It does **not** authorize release, publication, or a final price change — those require their own later gates (Final Product Review, then a separate Release Decision).

Visual Production has a real, documented limitation: under the current Image Production Standard, only an owner-started personal ChatGPT conversation can generate the two images specified in `visual-production-brief.md`. No backend worker or agent can invoke that step on its own. Both image assignments remain `BRIEF_REQUIRED` until the owner runs that step.
