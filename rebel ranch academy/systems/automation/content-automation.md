# Rebel Ranch Academy — Content Automation Implementation

**Status:** TEMPORARILY SUSPENDED PENDING BACKEND/PIPELINE REPAIR AND END-TO-END VERIFICATION  
**Program:** Rebel Ranch Academy (RRA)  
**Parent:** Rebel Ranch Ministries (RRM)

## 1. Purpose

This document records how the RRA content-production system is intended to work and the current operational boundary.

Read this together with:

1. `/AGENTS.md`
2. `/docs/rebel-ranch-ecosystem-charter.md`
3. `/rebel ranch academy/AGENTS.md`
4. `/rebel ranch academy/REBEL-RANCH-ACADEMY-CONCEPT-AND-DIRECTION.md`
5. `/rebel ranch academy/Rebel-Ranch-Academy-Program-Hub/README.md`
6. `/rebel ranch academy/docs/workflow/ACADEMY-CONTENT-PRODUCTION-WORKFLOW.md`
7. `/rebel ranch academy/docs/workflow/ACADEMY-CONTENT-PROJECT-SCHEMA.md`
8. `/rebel ranch academy/docs/intelligence/ACADEMY-CONTINUOUS-IMPROVEMENT-LOOP.md`
9. `/rebel ranch academy/docs/intelligence/ACADEMY-RESPONSIBLE-REBELLION-EVIDENCE-FIRST-STANDARD.md`
10. `/rebel ranch academy/docs/qa/ACADEMY-RENDERED-PRODUCT-QA-STANDARD.md`
11. `/rebel ranch academy/docs/qa/ACADEMY-FINAL-PRODUCT-ACCEPTANCE-STANDARD.md`
12. `/rebel ranch academy/docs/workflow/ACADEMY-RELEASE-WORKFLOW-STANDARD.md`
13. `/rebel ranch academy/systems/automation/runner-status.md`
14. this file.

The owner manages decisions. The system manages work only when the system is verified and authorized to run.

## 2. Current operating state — authoritative

Academy automated production is temporarily offline.

The owner stopped the automation because unresolved backend/pipeline problems could allow AI work to continue upstream while downstream functions were not reliable. That creates unnecessary rework and wasted production time.

Current rule:

> Do not run Academy content-production automation until the intended backend/pipeline path is repaired, tested end to end, and explicitly reauthorized by the owner.

This suspension applies to scheduled, hourly, manual, polling, dispatch, or other automated Academy production triggers. Old records or dormant infrastructure do not make a capability active.

The former hourly cadence is not a current requirement. Timing should be reconsidered only after the system is functional.

The current Personal ChatGPT image mechanism is also not a fully autonomous backend image worker. Its limitation is controlled by the Academy Image Production Standard and must be included in any reactivation architecture decision.

## 3. System boundary

### GitHub is the permanent content record

Every real project ultimately lives under:

`rebel ranch academy/content-library/<learning-area>/<project-slug>/`

Its project record, research, source record, product records, QA, owner-review history, improvement records, release history and final assets are the durable source of truth.

Chat memory, an AI agent's internal state, and Supabase dashboard rows are not substitutes for the GitHub project record.

### Supabase is the shared control plane

The existing shared RRM Supabase project provides or is intended to provide:

- owner idea intake;
- dashboard-visible project state;
- administrator permissions;
- owner review decisions and comments;
- review-event history;
- worker queue/control state;
- owner-facing improvement signals where implemented.

It is a control/mirror layer, not the only copy of the educational material.

The presence of a table, RPC, function, row, or historical migration is not proof that the current end-to-end behavior works. Current backend objects must be verified directly before reactivation.

### Automation agents are workers, not authorities

When reauthorized, an Academy worker may consume authorized work, perform the stage it owns, write durable results, synchronize state, and hand off to the next verified gate.

A worker may not:

- infer owner approval from its own completion;
- skip a required review gate;
- continue into an unauthorized later stage;
- publish because a final-product package exists;
- call a retry a fix;
- hide a downstream failure behind upstream success;
- silently rewrite controlling standards based on its own interpretation of results.

### Owner approval is the gate

No automated step may publish, deploy, sell, make a public price final, change an approved offer, or set a project to `LIVE` merely because research/content/QA finished.

## 4. Intended production chain

The target controlled chain is:

```text
OWNER IDEA / AUTHORIZED INTAKE
→ CONTEXT VERIFICATION
→ RESEARCH
→ CLAIM / SOURCE VERIFICATION
→ RESEARCH REVIEW
→ AUDIENCE / OPPORTUNITY INTELLIGENCE
→ PRODUCT DESIGN
→ PRODUCT QA
→ OWNER PRODUCT REVIEW
→ VISUAL / LEARNER-EXPERIENCE PRODUCTION
→ FACT / BRAND / VISUAL VERIFICATION
→ RENDERED PRODUCT QA
→ OWNER FINAL PRODUCT REVIEW
→ RELEASE PREP
→ OWNER RELEASE DECISION
→ PUBLISH / DEPLOY
→ VERIFY LIVE
→ LIVE
→ OBSERVE LEGITIMATE RESULTS
→ CONTINUOUS-IMPROVEMENT EVALUATION
→ FUTURE AUTHORIZED CORRECTION / NEXT VERSION
```

Not every project requires every optional artifact, but no required gate may be silently removed because an agent believes it is unnecessary.

## 5. Stage-ownership and handoff contract

Each worker must receive:

- exact project ID;
- exact revision/version;
- exact current authorized stage;
- durable input files/records;
- owner instructions relevant to that stage;
- applicable standards;
- unresolved blockers;
- expected output;
- exact success verification;
- exact handoff destination.

Each worker must return:

- work performed;
- durable files/records changed;
- evidence/sources used where applicable;
- QA/verification performed;
- failures/blockers;
- exact resulting stage/status;
- next authorized stage or owner gate;
- improvement signal when a meaningful reusable lesson was discovered.

A handoff is not successful until the receiving state/record reflects the same project, revision and gate that the sending worker completed.

## 6. Failure propagation — hard stop

When a stage fails in a way that makes downstream work unreliable or likely to require rework:

1. stop the affected downstream chain;
2. preserve the last known-good project/revision state;
3. record the exact failed stage/gate;
4. record what was expected and what actually happened;
5. identify the downstream work that must **not** continue;
6. identify root cause when verified, or mark `UNKNOWN_PENDING_RESEARCH`;
7. apply only the smallest authorized correction;
8. re-run the failed verification;
9. resume downstream work only from the verified safe point.

The system must not continue producing expensive downstream assets while a prerequisite is unverified.

This is the central control intended to prevent the rework pattern that caused the current automation suspension.

## 7. Retry rule

Retries must be deliberate.

Allowed retry:

- transient failure is identified;
- the retry is safe/idempotent or duplicate handling is verified;
- attempt count is bounded;
- the system records the attempts;
- repeated failure escalates to `BLOCKED` rather than looping indefinitely.

Not allowed:

- blindly regenerate content/images until something looks acceptable;
- repeatedly re-dispatch the same job without understanding duplicate effects;
- call a second successful attempt proof that the root cause is fixed;
- continue to the next stage after a partial success.

Use the Continuous Improvement Loop for repeated or consequential failures.

## 8. Shared Supabase project

Current connected project reference:

`dfrwxpuojeiykaignyny`

The RRA content module is additive to the existing RRM backend. A separate Academy database was intentionally not created.

## 9. Backend objects — intended/currently documented, not production-proven

### `public.academy_content_projects`

Documented dashboard/control mirror for Academy content projects.

Historically documented fields include:

- `project_id`
- `github_branch`
- `github_path`
- `title`
- `learning_area`
- `current_status`
- `revision_number`
- `owner_idea`
- `owner_notes`
- `proposed_price`
- `source_count`
- `material_summary`
- `qa_status`
- `owner_review_status`
- `latest_owner_comment`
- `last_agent`
- `last_synced_at`

RLS is intended to restrict access to authenticated administrators through the existing `private.is_admin()` permission model.

**These field names and behaviors must be checked against the live Supabase schema before backend repair or reactivation. This document is not proof that all of them currently exist or function as described.**

### `public.academy_content_review_events`

Documented owner review history/control queue.

Review events are intended to preserve:

- project;
- revision;
- exact review gate;
- decision;
- owner comment;
- source-specific decisions when used;
- reviewing user;
- creation time;
- processing time;
- processing agent.

When automation is restored, the agent must preserve review history durably rather than overwriting prior decisions.

## 10. Owner actions — documented interfaces requiring live verification

### Create an idea

Historically documented RPC:

`public.create_academy_content_idea(p_idea, p_owner_notes)`

Intended behavior:

1. require administrator access;
2. require a nonblank idea;
3. assign the next `RRA-YYYY-NNNN` project ID;
4. create a `NEW_IDEA` queue record;
5. not require the owner to choose a learning area or write a research brief.

Do not treat this as production-functional until the live function, permissions, result, dashboard state and downstream handoff are verified.

### Submit a review

Historically documented RPC:

`public.submit_academy_content_review(p_project_id, p_decision, p_comment, p_source_decisions)`

Expected simple decisions include:

- `APPROVE`
- `NEEDS_MORE_WORK`
- `REJECT`

The live implementation must also preserve the exact review gate so `APPROVE` cannot be mistaken for approval of all later stages.

## 11. Owner dashboard

Protected page:

`/operations-review.html`

The page is intended to use the existing shared RRM Supabase account/session and administrator role.

Its Academy functions have included or are intended to include:

- submit a new Academy idea;
- list the Academy content queue;
- show project state and exact review gate;
- show which worker/stage is actually active vs merely queued;
- load durable working material;
- review research/sources/product/visual/final material;
- display proposed pricing and market position where applicable;
- display meaningful improvement signals requiring owner attention;
- accept owner comments and stage-appropriate decisions;
- keep release approval separate from final-product approval.

These functions must be re-verified against the repaired backend before being treated as production-functional.

UI hiding alone is never security; database/server authorization remains required.

## 12. Intended agent behavior after reauthorization

### New dashboard ideas

1. read mandatory context;
2. read owner idea/notes;
3. verify project identity and current state;
4. determine the correct learning area without merging another RRM program into RRA;
5. create/synchronize the permanent project record;
6. perform only the authorized current stage;
7. verify stage output;
8. hand off to the correct next stage/owner gate.

### Needs More Work

1. read the exact review event and gate;
2. preserve the owner's comment/history;
3. apply Revision Preservation rules;
4. create an improvement signal when the feedback reveals a meaningful reusable lesson;
5. reopen only the affected stages;
6. perform the required additional work;
7. QA/verify the correction;
8. return to the same applicable owner gate;
9. mark the review event processed only when durable and control-plane state agree.

### Approved

1. preserve the exact owner approval and gate;
2. synchronize the approved state;
3. unlock only the next authorized stage;
4. mark the review event processed only after successful synchronization;
5. never reinterpret Product/Final Product approval as release approval.

### Rejected

1. preserve rejection/reason/gate;
2. create an improvement signal when the rejection reveals a reusable lesson;
3. synchronize the rejected/returned state;
4. stop unauthorized forward work;
5. never publish.

## 13. Required intellectual / evidence standards

Every future automated content run remains bound by:

> **Authority does not replace evidence. Proximity to the source, transparency, corroboration, and relevance matter more than institutional prestige.**

and:

> **Teach transferable principles, not isolated facts.**

and the Responsible Rebellion rule:

> **Question assumptions. Understand the function. Study the evidence. Build or compare alternatives responsibly. Test the result. Compare it with the modern/default system. Let evidence decide.**

Every substantial project must preserve source traceability, uncertainty, conflicting evidence, applicable testing/verification, `TRANSFER THE PRINCIPLE`, and the approved RRA voice.

## 14. Visual-production boundary

A project requiring generated images cannot be considered fully automatable through the current Personal ChatGPT handoff alone.

Before future full automation is claimed, the system must have an approved image-generation mechanism that can actually be invoked by the authorized worker and can pass the complete Image Production Standard:

- verified brief/source assets;
- generation;
- real binary retrieval;
- factual/brand/text inspection;
- revision routing;
- repository storage;
- integration;
- deployed QA;
- correct status synchronization.

Do not fill this gap by pretending that “READY_FOR_IMAGE_PRODUCTION” means an image agent is working.

## 15. Rendered-product and final-product boundary

Agent/machine QA must inspect the **actual rendered learner-facing release candidate** under the Rendered Product QA Standard.

A manifest, product architecture, file list, screenshot, or worker-completion record cannot substitute for exercising the actual product.

Only after rendered QA passes may the project be presented for Owner Final Product Review.

Owner Final Product Approval still does not authorize release.

## 16. Release boundary

A dashboard/product approval must never be reinterpreted as unlimited permission to:

- deploy website changes;
- make a paid product public;
- create a checkout link;
- publish final pricing;
- email customers;
- advertise/announce availability;
- create credentials/certificates;
- change a legal or organizational promise.

The Release Workflow requires a separate Owner Release Decision, actual publication, and live verification before `LIVE`.

## 17. Continuous-improvement execution

When a meaningful success/failure signal occurs, the system should:

1. preserve the evidence;
2. classify the signal and evidence strength;
3. distinguish symptom from root cause;
4. correct/test only within authorized scope;
5. verify the exact correction;
6. mark `AWAITING_RESULT` when a real next-result check is still needed;
7. update the smallest appropriate control only when the lesson is sufficiently supported and owner-authorized where required;
8. reuse verified lessons on future applicable work.

Automation should reduce repeated work, not create autonomous policy drift.

## 18. Existing test project

`RRA-2026-0001`

Working title:

**Water Through the Layers**

GitHub path:

`rebel ranch academy/content-library/sustainability-agriculture/purifying-water-natural-materials/`

This project exposed important production/pipeline/product lessons and has been used to exercise the Academy system.

Its existence is not proof that the current automation chain is functioning correctly. The exact current project state must be read from today's durable records before further production work.

## 19. Reactivation verification requirement

Before Academy automation is restored, verify the complete intended chain, including as applicable:

1. owner action or authorized scheduled trigger;
2. backend request creation and authorization;
3. correct project/revision/gate identity;
4. dispatch/start behavior;
5. worker claim/execution;
6. required source/context access;
7. durable GitHub output;
8. control-plane/Supabase synchronization;
9. correct stop at owner gates;
10. Product/Visual stage handoff behavior;
11. image-generation path where required;
12. rendered-product QA;
13. release prep and separate owner release decision;
14. deployment/publication;
15. exact live verification;
16. failure propagation and safe-stop behavior;
17. retry/duplicate protection;
18. improvement-signal recording and next-result handling;
19. owner-facing status accuracy throughout the chain.

Test both **success paths and deliberate failure paths**. A pipeline is not verified if only the happy path was exercised.

At minimum, deliberately prove that:

- a failed prerequisite prevents downstream production;
- a failed image/integration step prevents Final Product Review;
- a failed rendered QA prevents owner final review;
- Final Product Approval does not publish;
- Release Approval publishes only the authorized revision;
- a deployment success with a broken live page does not become LIVE;
- a retry does not create duplicate project/review/release records;
- a failure leaves a clear safe point for repair/resume;
- owner dashboard state matches durable project state.

The critical requirement is that an upstream success must not hide a downstream failure or allow additional work to continue when that failure would force rework.

No Academy automation is considered restored until the exact production path passes this end-to-end verification and the owner explicitly authorizes reactivation.