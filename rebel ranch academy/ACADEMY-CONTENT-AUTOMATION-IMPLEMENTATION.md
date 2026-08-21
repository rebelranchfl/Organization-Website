# Rebel Ranch Academy — Content Automation Implementation

**Status:** Working implementation standard  
**Program:** Rebel Ranch Academy (RRA)  
**Parent:** Rebel Ranch Ministries (RRM)  
**Implementation branch:** `rra-content-dashboard-foundation`

## 1. Purpose

This document explains how the approved RRA content-production workflow is implemented so a future human or AI agent does not have to reconstruct the system from chat history.

Read this together with:

1. `/AGENTS.md`
2. `/docs/rebel-ranch-ecosystem-charter.md`
3. `/docs/non-negotiables.md`
4. `/rebel ranch academy/REBEL-RANCH-ACADEMY-CONCEPT-AND-DIRECTION.md`
5. `/rebel ranch academy/Rebel-Ranch-Academy-Program-Hub/README.md`
6. `/rebel ranch academy/ACADEMY-CONTENT-PRODUCTION-WORKFLOW.md`
7. `/rebel ranch academy/ACADEMY-CONTENT-PROJECT-SCHEMA.md`
8. this file.

The owner manages decisions. The system manages work.

## 2. System boundary

### GitHub is the permanent content record

Every real project ultimately lives under:

`rebel ranch academy/content-library/<learning-area>/<project-slug>/`

Its `project.json`, research, source record, content, pricing, QA, owner-review history and final assets are the durable source of truth.

Chat memory, an AI agent's internal state, and Supabase dashboard rows are not substitutes for the GitHub project record.

### Supabase is the shared control plane

The existing shared RRM Supabase project provides:

- owner idea intake;
- dashboard-visible project state;
- administrator permissions;
- owner review decisions and comments;
- immutable review-event history;
- a queue the content agent can inspect.

It is deliberately a mirror/control layer, not the only copy of the educational material.

### The automation agent is the worker

The recurring RRA Content Agent consumes new ideas and owner feedback, performs the documented work, writes durable results to GitHub, and synchronizes dashboard state.

### Owner approval is the gate

No automated step may publish, deploy, sell, make a public price final, or set a project to `LIVE` merely because research/content/QA finished.

## 3. Shared Supabase project

Current connected project reference:

`dfrwxpuojeiykaignyny`

The RRA content module is additive to the existing RRM backend. A separate Academy database was intentionally not created.

## 4. Database objects

### `public.academy_content_projects`

Dashboard/control mirror for each Academy content project.

Important fields include:

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

RLS is enabled. Access is restricted to authenticated administrators through the existing `private.is_admin()` permission model.

### `public.academy_content_review_events`

Append-only owner review history/control queue.

Each review event records:

- project;
- revision;
- decision;
- owner comment;
- source-specific decisions when used;
- reviewing user;
- creation time;
- processing time;
- processing agent.

The agent must preserve this history in the project's GitHub `owner-review.md` rather than overwriting prior decisions.

## 5. Owner actions

### Create an idea

Database RPC:

`public.create_academy_content_idea(p_idea, p_owner_notes)`

This function:

1. requires administrator access;
2. requires a nonblank idea;
3. safely assigns the next `RRA-YYYY-NNNN` project ID;
4. creates a `NEW_IDEA` queue record;
5. does not require the owner to choose a learning area or write a research brief.

The agent later performs the context review, chooses the correct learning area, creates the GitHub folder, and fills the permanent project record.

### Submit a review

Database RPC:

`public.submit_academy_content_review(p_project_id, p_decision, p_comment, p_source_decisions)`

Allowed decisions:

- `APPROVE`
- `NEEDS_MORE_WORK`
- `REJECT`

The action is atomic: the review event and dashboard project state change in one transaction or neither change is saved.

`NEEDS_MORE_WORK` and `REJECT` should carry useful owner comments so the next agent or future reviewer understands why.

`APPROVE` is content/pre-release approval only. It does not silently authorize public release.

## 6. Owner dashboard

Working protected page:

`/operations-review.html`

The page uses the existing shared RRM Supabase account/session and `user_roles` administrator role. It does not create a new login system.

Current functions:

- submit a new Academy idea;
- list the Academy content queue;
- prioritize `READY_FOR_REVIEW` items;
- show project ID, learning area, revision, status, proposed price, source count and QA state;
- load working GitHub material directly from the project's recorded branch/path;
- review Material, Sources, Pricing, QA, Research and Concept files;
- keep source URLs clickable for owner audit;
- accept owner review comments;
- submit Approve / Needs More Work / Reject through the atomic review RPC.

The page is intentionally protected by both UI role checking and database RLS. UI hiding alone is never treated as security.

## 7. Current recurring agent

Automation title:

`RRA Content Agent`

Current cadence:

Hourly condition watch.

The agent is instructed to remain silent when there is nothing to do and to surface a project when it newly reaches `READY_FOR_REVIEW` or when a real owner blocker exists.

The agent handles:

### New dashboard ideas

1. read mandatory context;
2. read `owner_idea` and `owner_notes`;
3. review live RRM/RRA websites;
4. determine the correct learning area;
5. create the permanent GitHub project;
6. synchronize Supabase;
7. complete research/content/pricing/QA;
8. return the project to `READY_FOR_REVIEW`.

### Needs More Work

1. read the unprocessed review event;
2. preserve the owner's exact comment in review history;
3. increment the revision;
4. perform the required additional work;
5. document what changed;
6. return to `READY_FOR_REVIEW`;
7. mark the event processed.

### Approved

1. preserve the owner approval in GitHub;
2. set GitHub and dashboard state to `APPROVED`;
3. mark the review event processed;
4. stop before public release unless separate release authorization exists.

### Rejected

1. preserve the rejection and reason;
2. set permanent/dashboard status to `REJECTED`;
3. mark the event processed;
4. do not publish.

## 8. Required intellectual standards

Every automated content run remains bound by:

> **Authority does not replace evidence. Proximity to the source, transparency, corroboration, and relevance matter more than institutional prestige.**

and:

> **Teach transferable principles, not isolated facts.**

Every substantial project must include `TRANSFER THE PRINCIPLE` and must preserve the RRA owner voice defined in the production workflow.

## 9. Current end-to-end test project

`RRA-2026-0001`

Working title:

**Water Through the Layers**

GitHub path:

`rebel ranch academy/content-library/sustainability-agriculture/purifying-water-natural-materials/`

Current state at implementation time:

- status: `READY_FOR_REVIEW`
- revision: 1
- sources: 12
- proposed paid price: $29
- proposed format: illustrated RRA Field Guide + Family Lab with a free public sample
- QA: passed with owner-review items
- owner decision: pending
- release: not started

This project is the first real proof that an owner idea can be converted into context review, auditable research, content, a practical activity, pricing, QA and an owner-review package without publishing it.

## 10. Safety and release boundary

A dashboard content approval must never be reinterpreted as unlimited permission to:

- deploy website changes;
- make a paid product public;
- create a checkout link;
- publish final pricing;
- email customers;
- announce availability;
- create credentials/certificates;
- change a legal or organizational promise.

Those release actions remain separately controlled until the owner explicitly changes the release policy.

## 11. Future implementation work

Once the owner approves moving this working implementation toward production, the next technical steps are:

1. merge the reviewed branch into the appropriate production branch;
2. expose the protected Operations Review path through the signed-in administrator experience;
3. verify the page on the actual hosted site using the owner's administrator account;
4. verify idea intake from the hosted dashboard;
5. verify one disposable `NEEDS_MORE_WORK` review cycle end-to-end;
6. verify the recurring content agent consumes dashboard events;
7. establish the separate approved release/publishing automation only after the owner locks the release destination and payment/delivery rules.

Do not skip the owner release gate merely because the earlier content-production automation works.
