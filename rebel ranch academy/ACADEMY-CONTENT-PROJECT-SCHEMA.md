# Rebel Ranch Academy — Content Project Record & Dashboard Schema

**Status:** Working implementation standard  
**Program:** Rebel Ranch Academy (RRA)  
**Purpose:** Define the permanent project record shared by the Academy dashboard, AI agents, review workflow, and release process.

Read this together with `ACADEMY-CONTENT-PRODUCTION-WORKFLOW.md` and all required RRA governing documents.

---

## 1. Core rule

The dashboard is the traffic controller. GitHub is the permanent source of truth.

Every Academy content idea receives one permanent project ID and one machine-readable `project.json` record. The dashboard reads and updates that record. Agents read and update that same record. Human review decisions are preserved in the record and in the project review history.

Do not use chat memory, temporary agent state, or a dashboard-only database as the sole record of a project's status, research, pricing, approval, or release history.

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
- `AGENT_WORKING` — an agent has claimed the project and is actively moving it through context review, research, content, materials, pricing, and QA.
- `READY_FOR_REVIEW` — required work is complete enough for owner review. Nothing is published.
- `NEEDS_MORE_WORK` — owner has returned the project with comments. The latest owner comments become required revision instructions.
- `APPROVED` — owner approved the content/materials and proposed price or explicitly supplied a replacement price. Approval authorizes release preparation, not silent changes to unrelated systems.
- `REJECTED` — owner does not want the project released in its current concept. Preserve the record and reason.
- `PUBLISHING` — approved release work is underway.
- `LIVE` — approved material is publicly available at its recorded destination.

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

Allowed owner decisions:

- `APPROVE`
- `NEEDS_MORE_WORK`
- `REJECT`

### Release

- `release.status`
- `release.approved_at`
- `release.published_at`
- `release.destination`
- `release.live_url`
- `release.release_files`
- `release.release_notes`

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

Named programs such as Roots, Boots & Animal Poops remain nested under the correct learning area.

---

## 6. Internal production stage values

To support automation without cluttering the owner dashboard, agents may update these internal stages:

- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `COMPLETE`
- `NOT_APPLICABLE`

These values apply to context review, research, concept, content, materials, pricing, QA, and release.

An agent must not mark the owner-facing project `READY_FOR_REVIEW` until all required applicable production stages are complete and no unresolved blocker prevents meaningful owner review.

---

## 7. Owner-review rules

### Approve

When the owner selects `APPROVE`:

1. record the timestamp;
2. preserve the owner comment if one was supplied;
3. record the approved price;
4. change `current_status` to `APPROVED`;
5. unlock release preparation;
6. never rewrite the prior research or review history to make it look as though approval existed earlier.

### Needs more work

When the owner selects `NEEDS_MORE_WORK`:

1. append the full owner comment to the review history;
2. increment the revision number;
3. change `current_status` to `NEEDS_MORE_WORK`;
4. identify which production stages must reopen;
5. send the exact feedback into the next agent run;
6. preserve all prior versions and decisions;
7. return to `READY_FOR_REVIEW` only after the requested revision and required QA are complete.

### Reject

When the owner selects `REJECT`:

1. preserve the rejection reason;
2. change `current_status` to `REJECTED`;
3. stop publication;
4. archive rather than delete the project;
5. do not restart it unless the owner later reopens it.

---

## 8. Notification events

The automation layer should support owner notifications at these events:

- project reaches `READY_FOR_REVIEW`;
- project cannot continue because owner input is genuinely required;
- an approved release fails;
- an existing live product requires re-review because a material law, regulation, safety standard, source, or factual basis changed.

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
- products needing factual or regulatory re-review.

The most important owner-facing metric is **Waiting on You**, representing projects in `READY_FOR_REVIEW` or a true owner-decision blocker.

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

Files may be added when a project needs them, but these names are the standard baseline.

The `project.json` paths must point to the actual repository files. Do not create dashboard-only file references that cannot be resolved in GitHub.

---

## 11. Dashboard write boundaries

The dashboard may:

- create a new project idea record;
- capture owner notes;
- display production progress;
- display research/source links;
- display previews and pricing proposals;
- accept `APPROVE`, `NEEDS_MORE_WORK`, or `REJECT`;
- capture owner review comments;
- initiate the next authorized workflow stage.

The dashboard must not:

- publish unapproved content;
- silently change an approved price;
- erase review history;
- overwrite source decisions;
- make an AI-generated concept appear owner-approved;
- merge RRA with another RRM program;
- treat an agent completion event as owner approval.

---

## 12. Automation contract

A future automation should operate approximately as follows:

```text
Owner submits idea
→ create project ID and project.json
→ status NEW_IDEA
→ agent claims project
→ status AGENT_WORKING
→ required context review
→ research + source record
→ concept + TRANSFER THE PRINCIPLE
→ content + materials
→ pricing proposal
→ QA
→ status READY_FOR_REVIEW
→ notify owner

Owner APPROVE
→ status APPROVED
→ release workflow
→ status PUBLISHING
→ verify release
→ status LIVE

Owner NEEDS_MORE_WORK + comment
→ preserve comment/history
→ increment revision
→ status NEEDS_MORE_WORK
→ agent re-runs affected stages
→ QA
→ status READY_FOR_REVIEW
→ notify owner again

Owner REJECT
→ preserve reason
→ status REJECTED
→ no publication
```

---

## 13. Schema evolution

The project record will evolve as the dashboard and automation are built.

Changes to this schema must preserve backward readability of existing project records or include a documented migration plan. Do not casually rename or remove fields once automation depends on them.

The goal is a stable contract that allows different AI agents and future systems to work on the same Academy project without losing context, evidence, owner decisions, pricing history, or accountability.
