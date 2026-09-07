# Rebel Ranch Academy — Content Automation Implementation

**Status:** TEMPORARILY SUSPENDED PENDING BACKEND/PIPELINE REPAIR AND END-TO-END VERIFICATION  
**Program:** Rebel Ranch Academy (RRA)  
**Parent:** Rebel Ranch Ministries (RRM)

## 1. Purpose

This document records how the RRA content-production system is intended to work and the current operational boundary.

Read this together with:

1. `/AGENTS.md`
2. `/docs/rebel-ranch-ecosystem-charter.md`
3. `/rebel ranch academy/REBEL-RANCH-ACADEMY-CONCEPT-AND-DIRECTION.md`
4. `/rebel ranch academy/Rebel-Ranch-Academy-Program-Hub/README.md`
5. `/rebel ranch academy/ACADEMY-CONTENT-PRODUCTION-WORKFLOW.md`
6. `/rebel ranch academy/ACADEMY-CONTENT-PROJECT-SCHEMA.md`
7. `/rebel ranch academy/ACADEMY-MANUAL-AGENT-RUNNER.md`
8. this file.

The owner manages decisions. The system manages work only when the system is verified and authorized to run.

## 2. Current operating state — authoritative

Academy automated production is temporarily offline.

The owner stopped the automation because unresolved backend/pipeline problems could allow AI work to continue upstream while downstream functions were not reliable. That creates unnecessary rework and wasted production time.

Current rule:

> Do not run Academy content-production automation until the intended backend/pipeline path is repaired, tested end to end, and explicitly reauthorized by the owner.

This suspension applies to scheduled, hourly, manual, polling, dispatch, or other automated Academy production triggers. Old records or dormant infrastructure do not make a capability active.

The former hourly cadence is not a current requirement. Timing should be reconsidered only after the system is functional.

## 3. System boundary

### GitHub is the permanent content record

Every real project ultimately lives under:

`rebel ranch academy/content-library/<learning-area>/<project-slug>/`

Its `project.json`, research, source record, content, pricing, QA, owner-review history and final assets are the durable source of truth.

Chat memory, an AI agent's internal state, and Supabase dashboard rows are not substitutes for the GitHub project record.

### Supabase is the shared control plane

The existing shared RRM Supabase project provides or is intended to provide:

- owner idea intake;
- dashboard-visible project state;
- administrator permissions;
- owner review decisions and comments;
- review-event history;
- a queue the content agent can inspect.

It is a control/mirror layer, not the only copy of the educational material.

### The automation agent is a worker, not the authority

When reauthorized, the RRA content agent may consume approved ideas and owner feedback, perform documented work, write durable results to GitHub, and synchronize dashboard state.

While the system is suspended, no automation agent should perform production work merely because a queue item, workflow, RPC, table, or old schedule exists.

### Owner approval is the gate

No automated step may publish, deploy, sell, make a public price final, or set a project to `LIVE` merely because research/content/QA finished.

## 4. Shared Supabase project

Current connected project reference:

`dfrwxpuojeiykaignyny`

The RRA content module is additive to the existing RRM backend. A separate Academy database was intentionally not created.

## 5. Database objects

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

RLS is intended to restrict access to authenticated administrators through the existing `private.is_admin()` permission model. Current backend behavior must be verified before production reactivation.

### `public.academy_content_review_events`

Owner review history/control queue.

Each review event is intended to record:

- project;
- revision;
- decision;
- owner comment;
- source-specific decisions when used;
- reviewing user;
- creation time;
- processing time;
- processing agent.

When automation is restored, the agent must preserve this history in the project's GitHub `owner-review.md` rather than overwriting prior decisions.

## 6. Owner actions

### Create an idea

Database RPC:

`public.create_academy_content_idea(p_idea, p_owner_notes)`

Intended behavior:

1. require administrator access;
2. require a nonblank idea;
3. assign the next `RRA-YYYY-NNNN` project ID;
4. create a `NEW_IDEA` queue record;
5. not require the owner to choose a learning area or write a research brief.

Do not treat this as production-verified until it has been tested through the repaired end-to-end path.

### Submit a review

Database RPC:

`public.submit_academy_content_review(p_project_id, p_decision, p_comment, p_source_decisions)`

Expected decisions:

- `APPROVE`
- `NEEDS_MORE_WORK`
- `REJECT`

`APPROVE` is content/pre-release approval only. It does not independently authorize public release.

## 7. Owner dashboard

Protected page:

`/operations-review.html`

The page is intended to use the existing shared RRM Supabase account/session and administrator role.

Its Academy functions have included:

- submit a new Academy idea;
- list the Academy content queue;
- show project state and review information;
- load working GitHub material;
- review material, sources, pricing, QA, research and concept files;
- accept owner review comments;
- submit Approve / Needs More Work / Reject.

These functions must be re-verified against the repaired backend before being treated as production-functional.

UI hiding alone is never security; database/server authorization remains required.

## 8. Intended agent behavior after reauthorization

When the system is eventually restored, the automation may handle:

### New dashboard ideas

1. read mandatory context;
2. read `owner_idea` and `owner_notes`;
3. review applicable live RRM/RRA context;
4. determine the correct learning area;
5. create the permanent GitHub project;
6. synchronize the control plane;
7. complete approved research/content/pricing/QA work;
8. return the project to owner review.

### Needs More Work

1. read the review event;
2. preserve the owner's comment in review history;
3. increment the revision where appropriate;
4. perform the required additional work;
5. document what changed;
6. return to owner review;
7. mark the event processed only when the state change is actually successful.

### Approved

1. preserve the owner approval in GitHub;
2. synchronize the approved state;
3. mark the review event processed only after successful synchronization;
4. stop before public release unless separate release authorization exists.

### Rejected

1. preserve the rejection and reason;
2. synchronize the rejected state;
3. mark the review event processed only after successful synchronization;
4. do not publish.

## 9. Required intellectual standards

Every future automated content run remains bound by:

> **Authority does not replace evidence. Proximity to the source, transparency, corroboration, and relevance matter more than institutional prestige.**

and:

> **Teach transferable principles, not isolated facts.**

Every substantial project must include `TRANSFER THE PRINCIPLE` and preserve the approved RRA voice and production standards.

## 10. Existing test project

`RRA-2026-0001`

Working title:

**Water Through the Layers**

GitHub path:

`rebel ranch academy/content-library/sustainability-agriculture/purifying-water-natural-materials/`

This project has been used to exercise the Academy pipeline. Its existence is not proof that the current automation chain is functioning correctly. The exact current project state must be read from today's repository/control records before further production work.

## 11. Safety and release boundary

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

## 12. Reactivation verification requirement

Before Academy automation is restored, verify the complete intended chain, including as applicable:

1. owner action or scheduled trigger;
2. backend request creation and authorization;
3. dispatch/start behavior;
4. correct project and stage selection;
5. agent execution;
6. durable GitHub output;
7. Supabase synchronization;
8. downstream production functions;
9. deployment or preview behavior;
10. owner-facing status/result accuracy;
11. failure handling and stop conditions.

The critical requirement is that an upstream success must not hide a downstream failure or allow additional work to continue when that failure would force rework.

No Academy automation is considered restored until the exact production path passes this end-to-end verification and the owner explicitly authorizes reactivation.
