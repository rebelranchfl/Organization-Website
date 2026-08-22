# Rebel Ranch Academy — Late-Finding Control Standard

**Status:** Owner-approved operating standard  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RR Website — Academy Late-Finding Control

## Purpose

A useful discovery must never disappear simply because it appeared after a project had already moved past the stage where it would normally have been handled.

A late finding is any meaningful factual, safety, product, learner-experience, implementation, market, visual, delivery, or opportunity discovery that appears after work on the parent project is already underway.

The system must preserve the finding, present the owner with a clear routing decision, record the owner's decision, and track what happened next.

## Owner routes

Every unresolved late finding must support exactly these four owner routes:

### 1. Send Back Now

Use when the finding blocks, materially changes, or invalidates work already moving through the lifecycle.

The owner chooses the stage that must reopen:
- Research;
- Product Design; or
- Visual Production.

The parent project returns to that working stage. Existing useful work is preserved under the Revision Preservation Standard. The routed agent resolves the finding before the project can progress again.

### 2. Add to Current Version

Use when the finding belongs in V1 but does not require reopening an earlier discipline.

The system routes the finding to the worker that owns the project's current lifecycle area:
- Research / Research Review → Research;
- Product Opportunity / Product Design / Product Review → Product Design;
- Visual Production / Final Product Review → Visual Production.

If the project is sitting at an owner review gate, it returns to that area's working stage so the change can actually be made.

### 3. Finish V1 + Queue V2

Use when the finding is useful but should not delay or expand the approved current version.

The parent project continues unchanged. The finding remains a durable V2 record. It must not be silently deleted merely because V1 is released.

A future Product/Opportunity cycle may later convert the queued finding into a V2 project, bundle, revision, free resource, or other approved work.

### 4. Spin Off New Project

Use when the finding is important enough to become a separate Academy workstream rather than being forced into the parent product.

The finding is routed to the Research/Content Agent as a new-project candidate. The agent must check for an existing duplicate, preserve the parent project and discovery context, create a normal Academy project intake when appropriate, and record the spawned project ID back on the late-finding record.

A spin-off decision does not authorize pricing, publishing, release, or sale. The new project follows the normal Academy lifecycle and owner gates.

## Required record

Every late finding must preserve:
- parent project;
- stage where it was discovered;
- title;
- the finding itself;
- why it matters when known;
- source/reference when known;
- who/what discovered it;
- owner decision;
- routed stage and agent when applicable;
- owner note;
- status;
- spawned project ID when applicable;
- resolution note;
- resolving agent;
- discovery, decision, and resolution timestamps.

Findings are not deleted as a normal workflow action.

## Agent behavior

### All Academy agents

When a meaningful late discovery appears, first decide whether it is merely ordinary work inside the current authorized scope or a true late finding that changes, expands, corrects, or branches the approved work.

If it is a true late finding:
1. create/update a structured `academy_late_findings` record;
2. do not silently force it into the current version;
3. do not silently discard it;
4. if no owner decision exists, preserve it as `PENDING_OWNER` and continue only work that remains safe/correct without that decision;
5. obey the owner route when one exists.

### Research/Content Agent

Owns:
- findings routed to `RESEARCH_WORKING`;
- `SPIN_OFF_QUEUED` findings.

For a research-routed finding, perform the smallest evidence cycle necessary, preserve prior approved work, run the appropriate QA, update the finding to `IN_PROGRESS` while working and `RESOLVED` when complete, and record exactly what changed.

For a spin-off finding, check for an existing project/opportunity first. If no duplicate exists and the finding is sufficiently defined, create a normal Academy project intake carrying the parent project, late-finding ID, rationale, dependencies and known evidence/safety boundaries. Record the spawned project ID on the finding and mark the finding resolved once the handoff is durable.

### Product Design Agent

Owns findings routed to `PRODUCT_WORKING`.

Preserve approved evidence and prior design. Apply the finding to the smallest necessary product architecture/manuscript/activity/packaging scope. Mark the finding `IN_PROGRESS` while working and `RESOLVED` only after the durable product records and QA reflect the change.

### Visual Production Agent

Owns findings routed to `VISUAL_PRODUCTION`.

Preserve approved evidence, product meaning and safety boundaries. Apply the finding to the learner-facing experience and preview package. Mark the finding `IN_PROGRESS` while working and `RESOLVED` only after the actual learner-facing preview reflects the change and QA passes.

## Relationship to Opportunity Intelligence

Late Finding Control and Opportunity Intelligence are related but not interchangeable.

- Late Finding Control answers: **What do we do with this discovery in relation to the current version?**
- Opportunity Intelligence answers: **Is this a worthwhile product/resource/bundle/branch opportunity?**

A V2 or spin-off finding may later create or link to an `academy_opportunities` record. Do not use an opportunity record as a substitute for recording the late-finding owner route.

## Owner-facing design rule

The owner should be able to understand a finding without reading implementation records.

Each finding should answer at a glance:
- What did we discover?
- Why does it matter?
- Where did we find it?
- What are my four choices?
- Where did I send it?
- Is someone working it?
- Was it resolved?
- If it became another project, which project?

The detailed implementation record may remain underneath this compressed owner view.
