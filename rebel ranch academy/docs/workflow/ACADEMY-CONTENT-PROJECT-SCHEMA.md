# Rebel Ranch Academy — Content Project Record & Dashboard Schema

**Status:** Working implementation standard  
**Program:** Rebel Ranch Academy (RRA)  
**Purpose:** Define the permanent project record shared by the Academy dashboard, AI agents, review workflow, release process, and continuous-improvement loop.

Read this together with `ACADEMY-CONTENT-PRODUCTION-WORKFLOW.md`, `/rebel ranch academy/docs/intelligence/ACADEMY-CONTINUOUS-IMPROVEMENT-LOOP.md`, and all required RRA governing documents.

---

## 1. Core rule

The dashboard is the traffic controller. GitHub is the permanent source of truth.

Every Academy content idea receives one permanent project ID and one machine-readable `project.json` record. The dashboard reads and updates that record. Agents read and update that same record. Human review decisions are preserved in the record and in the project review history.

Do not use chat memory, temporary agent state, or a dashboard-only database as the sole record of a project's status, research, pricing, approval, release history, or improvement lessons.

---

## 2. Project ID

Use this format:

`RRA-YYYY-NNNN`

Example: `RRA-2026-0001`

The ID never changes even if the working title changes.

---

## 3. Owner-facing workflow statuses

The dashboard should keep the owner's status choices simple:

1. `NEW_IDEA`
2. `AGENT_WORKING`
3. `READY_FOR_REVIEW`
4. `NEEDS_MORE_WORK`
5. `APPROVED`
6. `REJECTED`
7. `PUBLISHING`
8. `LIVE`

### Status behavior

- `NEW_IDEA` — owner has submitted an idea; no production work is complete.
- `AGENT_WORKING` — an agent has claimed the project and is actively moving it through the currently authorized production stage.
- `READY_FOR_REVIEW` — required work is complete enough for the applicable owner review gate. Nothing is published merely because this status is reached.
- `NEEDS_MORE_WORK` — owner has returned the project with comments. The latest owner comments become required revision instructions.
- `APPROVED` — owner approved the applicable reviewed work. Approval is stage-specific where the Product Phase Workflow Extension applies and does not silently authorize unrelated later gates.
- `REJECTED` — owner does not want the project/reviewed concept to continue in its current direction. Preserve the record and reason.
- `PUBLISHING` — separately authorized release work is underway.
- `LIVE` — approved material is publicly available at its recorded destination and live verification passed.

Agents may use detailed internal stage fields, but they must not expose unnecessary technical states as additional owner decisions.

---

## 4. Required `project.json` fields

Every project record must contain these top-level sections.

### Identity

- `project_id`
- `working_title`
- `slug`
- `learning_area`
- `named_program` when applicable
- `created_at`
- `created_by`
- `current_status`
- `revision_number`

### Owner input

- `idea`
- `owner_notes`
- `requested_audience`
- `requested_angle`
- `requested_sources`
- `excluded_sources`

Owner input may be minimal. The system must accept a project with only an idea.

### Context review

- `context_review.status`
- `context_review.completed_at`
- `context_review.documents_reviewed`
- `context_review.websites_reviewed`
- `context_review.audiences_identified`
- `context_review.learning_area_reason`
- `context_review.conflicts_found`

### Research

- `research.status`
- `research.started_at`
- `research.completed_at`
- `research.source_count`
- `research.primary_or_direct_source_count`
- `research.conflicts_found`
- `research.unresolved_questions`
- `research.sources_file`
- `research.research_file`

### Concept

- `concept.status`
- `concept.learning_outcome`
- `concept.central_question`
- `concept.major_principles`
- `concept.historical_or_lost_knowledge_angle`
- `concept.current_use_angle`
- `concept.transfer_the_principle_summary`
- `concept.proposed_format`
- `concept.activity_types`
- `concept.visual_needs`

### Content and materials

- `content.status`
- `content.master_content_file`
- `materials.status`
- `materials.material_types`
- `materials.files`
- `materials.preview_files`

### Pricing

- `pricing.status`
- `pricing.proposed_price`
- `pricing.currency`
- `pricing.role` — `FREE`, `PAID`, or `BUNDLE_COMPONENT`
- `pricing.reasoning_file`
- `pricing.owner_approved_price`

### Quality review

- `qa.status`
- `qa.completed_at`
- `qa.qa_file`
- `qa.blockers`

### Owner review

- `owner_review.status`
- `owner_review.latest_decision`
- `owner_review.latest_comment`
- `owner_review.reviewed_at`
- `owner_review.review_history_file`
- `owner_review.source_decisions_complete`

Allowed simple owner decisions remain:

- `APPROVE`
- `NEEDS_MORE_WORK`
- `REJECT`

Where the Product Phase Workflow Extension applies, the project must also preserve which exact gate the decision belongs to so an `APPROVE` value cannot be misread as approval of every later stage.

### Release

- `release.status`
- `release.approved_at`
- `release.published_at`
- `release.destination`
- `release.live_url`
- `release.release_files`
- `release.release_notes`
- `release.live_verified_at`

### Continuous improvement

The project record keeps a summary/pointer layer rather than trying to store every lesson inside `project.json`.

Use, when applicable:

- `improvement.status` — `NONE`, `OPEN`, `AWAITING_RESULT`, or `CURRENT`
- `improvement.latest_improvement_id`
- `improvement.open_count`
- `improvement.latest_signal_type`
- `improvement.latest_evidence_state`
- `improvement.latest_root_cause`
- `improvement.latest_correction`
- `improvement.latest_verification_result`
- `improvement.success_pattern_count`
- `improvement.failure_count`
- `improvement.improvement_file` — path/pointer to the durable project improvement record when one exists
- `improvement.last_reviewed_at`

A project may have no improvement events. Do not manufacture them merely to populate fields.

A correction is not marked as a verified improvement simply because it was implemented. If the next meaningful result has not occurred yet, use `AWAITING_RESULT`.

### Agent traceability

- `agent.active_agent`
- `agent.last_agent`
- `agent.session_title`
- `agent.last_updated_at`

Every AI-originated durable change must follow the repository's agent-attribution rules.

---

## 5. Learning-area values

Use the current public Program Hub learning-area names unless a newer owner-approved standard replaces them:

- `personal-capability`
- `communication-emotional-intelligence`
- `money-financial-life`
- `business-work-skills`
- `leadership-community`
- `sustainability-agriculture`

A project may connect to or teach subject matter that also relates to another RRM program, but that relationship does not place the other program underneath Rebel Ranch Academy.

For example, Roots, Boots & Animal Poops is a separate RRM program. RRA may create education that uses, supports, or expands RBAP-related subject matter, but the Academy project record must not treat RBAP as an Academy subprogram.

---

## 6. Internal production stage values

To support automation without cluttering the owner dashboard, agents may update these internal stages:

- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `COMPLETE`
- `NOT_APPLICABLE`

These values apply to context review, research, concept, content, materials, pricing, QA, release, and applicable improvement checks.

An agent must not mark the owner-facing project `READY_FOR_REVIEW` until all required applicable work for the **current authorized gate** is complete and no unresolved blocker prevents meaningful owner review.

---

## 7. Owner-review rules

### Approve

When the owner selects `APPROVE`:

1. record the timestamp;
2. preserve the owner comment if one was supplied;
3. preserve the exact review gate/stage being approved;
4. record the approved price when pricing is part of that gate;
5. change `current_status` according to the current workflow contract;
6. unlock only the next authorized stage;
7. never rewrite the prior research or review history to make it look as though approval existed earlier.

### Needs more work

When the owner selects `NEEDS_MORE_WORK`:

1. append the full owner comment to the review history;
2. create/update an improvement signal when the feedback identifies a meaningful reusable success/failure lesson;
3. increment the revision number when appropriate;
4. change `current_status` to `NEEDS_MORE_WORK` or the applicable reopened stage;
5. identify which production stages must reopen;
6. send the exact feedback into the next authorized agent run;
7. preserve all prior versions and decisions;
8. return to the applicable owner review gate only after the requested revision and required QA are complete.

### Reject

When the owner selects `REJECT`:

1. preserve the rejection reason;
2. create/update an improvement signal when the rejection reveals a reusable lesson;
3. change `current_status` to `REJECTED` or the workflow's applicable closed/review state;
4. stop publication;
5. preserve rather than silently erase the project/history;
6. do not restart it unless the owner later reopens it.

---

## 8. Notification events

The automation layer should support owner notifications at these events:

- project reaches the applicable `READY_FOR_REVIEW` gate;
- project cannot continue because owner input is genuinely required;
- an approved release fails;
- an existing live product requires re-review because a material law, regulation, safety standard, source, or factual basis changed;
- an improvement recommendation requires an owner decision because it would change a controlling rule, scope, brand, offer, pricing, release authority, or other owner-controlled matter.

Do not notify the owner for routine internal agent stage changes.

---

## 9. Dashboard summary metrics

The Academy dashboard may summarize:

- new ideas;
- agents working;
- ready for owner review;
- needs more work;
- approved;
- live;
- rejected/archived;
- products by learning area;
- free vs paid products;
- projected/approved pricing;
- products needing factual or regulatory re-review;
- open improvement issues;
- improvement items awaiting a result;
- supported success patterns;
- repeated failure categories or root causes when enough evidence exists.

The most important owner-facing metric remains **Waiting on You**, representing projects at a true owner-decision gate/blocker.

Improvement metrics should reduce repeated waste and improve decisions, not create a new owner paperwork burden.

---

## 10. File-location rules

Every project folder must include at minimum:

```text
project.json
concept.md
context-review.md
research.md
sources.md
content-outline.md
master-content.md
pricing.md
qa-review.md
owner-review.md
illustrations/
activities/
working-files/
final/
```

Additional durable files are created only when needed by the product/workflow. A project with meaningful improvement events may use a single durable improvement record such as `improvement-log.md` or an approved structured equivalent; do not create one file per lesson.

The `project.json` paths must point to actual durable records. Do not create dashboard-only file references that cannot be resolved to the approved source of truth.

---

## 11. Dashboard write boundaries

The dashboard may:

- create a new project idea record;
- capture owner notes;
- display production progress;
- display research/source links;
- display previews and pricing proposals;
- accept owner review decisions at the correct gate;
- capture owner review comments;
- display improvement signals/recommendations requiring owner attention;
- initiate the next authorized workflow stage.

The dashboard must not:

- publish unapproved content;
- silently change an approved price;
- erase review history;
- overwrite source decisions;
- make an AI-generated concept appear owner-approved;
- merge RRA with another RRM program;
- treat an agent completion event as owner approval;
- treat Final Product Approval as Release Approval;
- treat an implemented correction as a verified improvement before the required re-verification/result check;
- silently rewrite controlling Academy doctrine from analytics or agent opinion.

---

## 12. Automation contract

A future automation should operate approximately as follows:

```text
Owner submits idea
→ create project ID and project.json
→ status NEW_IDEA
→ authorized agent claims current stage
→ required context review
→ research + source record
→ applicable product/intelligence/design stages
→ QA
→ applicable owner review gate

Owner APPROVE
→ preserve exact gate approval
→ unlock only next authorized stage

Owner NEEDS_MORE_WORK + comment
→ preserve comment/history
→ capture improvement signal when meaningful
→ reopen affected stage(s)
→ perform requested revision
→ QA
→ return to applicable owner review gate

Owner REJECT
→ preserve reason
→ capture improvement signal when meaningful
→ stop unauthorized forward motion

Final Product Approved
→ Release Prep
→ separate Owner Release Decision
→ publish only if release authorized
→ verify exact live result
→ status LIVE only after live verification

Post-result signal
→ evaluate through Continuous Improvement Loop
→ preserve evidence/root cause
→ correct/test when authorized
→ verify
→ mark AWAITING_RESULT until a meaningful next result exists when required
→ promote reusable lesson only when sufficiently supported
```

---

## 13. Continuous-improvement storage rule

The project schema provides the summary/pointer layer. The Academy Continuous Improvement & Learning Loop controls the evidence and decision logic.

Do not:

- store only an AI conclusion with no evidence;
- call a root cause verified when it is a guess;
- create a new standard for every defect;
- retry repeatedly without identifying the failed gate;
- optimize marketing metrics at the expense of truth, learner fit, safety, or trust;
- reopen completed work endlessly for nonessential improvements.

When an improvement becomes durable, update the smallest appropriate controlling source and preserve why that change was made.

---

## 14. Schema evolution

The project record will evolve as the dashboard and automation are built.

Changes to this schema must preserve backward readability of existing project records or include a documented migration plan. Do not casually rename or remove fields once automation depends on them.

The goal is a stable contract that allows different AI agents and future systems to work on the same Academy project without losing context, evidence, owner decisions, pricing history, release state, improvement lessons, or accountability.
