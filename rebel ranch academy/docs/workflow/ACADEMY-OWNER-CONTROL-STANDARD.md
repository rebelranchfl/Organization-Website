# Rebel Ranch Academy — Owner Control Standard

**Status:** Governing workflow standard  
**AI-Agent:** ChatGPT/GPT-5.6 Sol

## Purpose

The Academy automation exists to reduce owner workload, not to force the owner to read, remember, and manually synthesize every line produced by an agent.

The owner must retain direct control over:

- the authoritative workflow gate;
- queue priority and sequence;
- holds/resumes;
- direct wording edits;
- approval reversals;
- review of changes rather than mandatory full rereads;
- visual decision summaries.

Detailed research and product files remain the audit/evidence layer. The Operations Review dashboard is the owner decision layer.

## 1. Authoritative workflow stage

`public.academy_content_projects.workflow_stage` is the authoritative owner-facing lifecycle state.

The existence of later-stage files does **not** move or redefine the current owner gate.

Example: Product Design artifacts may already exist when a targeted evidence gap returns to Research Review. During that return, the owner gate is still `RESEARCH_REVIEW` until the owner submits a new Research Review decision.

## 2. Owner queue control

Owner priority overrides normal FIFO.

Priority order:

1. `IMMEDIATE`
2. `HIGH`
3. `NORMAL`

Within the same priority, `owner_queue_order` is honored when present, followed by ordinary age/FIFO logic.

### Hold

`owner_hold=true` means agents must skip the project until the owner resumes it.

### Move to Top

Move to Top sets the project to Immediate priority and gives it the earliest owner queue order.

### Meaning of Immediate

Immediate means **first at the next agent pickup**. It does not bypass review gates, safety/evidence requirements, release authorization, or the automation platform's actual wake cadence.

## 3. Owner Quick Edit

The owner may directly alter wording without writing a separate agent instruction and waiting through a full revision cycle.

Owner Quick Edit stores:

- project;
- revision;
- target file;
- exact original text;
- exact replacement text;
- surrounding context;
- occurrence information;
- optional owner note;
- requester;
- timestamp;
- application status;
- resulting Git commit when applied.

A submitted owner edit automatically moves the project to Immediate priority.

### Owner-authored wording

Ordinary wording/copy edits are binding owner changes and do not require the owner to approve their own wording again.

### Evidence/safety boundary

If an owner edit materially changes a factual, legal, evidence, health/safety, or claim boundary, the responsible agent must verify the change before permanent GitHub commit.

If the edit cannot be supported or located reliably, mark it `BLOCKED` with a clear reason. Never silently substitute different wording and never erase the requested edit from history.

## 4. Approval reversal

Approvals are immutable historical events.

The owner may reverse an active Research Review, Product Review, or Final Product Review approval. Reversal:

- does not delete the original approval;
- creates its own audit event;
- may include an optional reason;
- reopens the exact review gate;
- returns owner review status to Pending;
- neutralizes an unprocessed approval so an agent cannot consume a decision the owner has already taken back.

## 5. Changes-first review

For revisions, Operations Review should default toward reviewing the change rather than rereading the entire unchanged body.

Supported owner views include:

- Changes Only;
- Full Context;
- Sources Changed;
- Preservation Check.

Actual Git history is the objective comparison layer. KEEP / ADD / STRENGTHEN / CORRECT / REMOVE-REPLACE records explain why the change occurred.

## 6. Visual decision compression

The owner should not be required to synthesize hundreds of lines to understand the state of a project.

Where the data exists, Operations Review should provide visual/summary forms such as:

- lifecycle Kanban;
- progress/status cards;
- Product Recommendation scorecard bars;
- opportunity/funnel maps;
- pricing-position snapshots;
- counts of entry paths, future opportunities, products, risks and open questions;
- review-stage summaries.

Detailed source files remain available for audit and drill-down.

## 7. Pricing and market position

For paid Product Design recommendations, Product Design must create an apples-to-apples market-position record rather than compare unrelated products merely because they contain a price.

When meaningful, distinguish local/regional from national/online comparables and show:

- proposed RRA price;
- comparable low / median / high;
- RRA relative position: LOW / MID / HIGH / PREMIUM;
- scope differences;
- source/date;
- confidence/caveats.

If a reliable local benchmark does not exist, say so instead of fabricating one.

## 8. Owner-facing summary rule

At every substantial owner gate, the detailed work may be extensive, but the owner-facing dashboard should answer quickly:

1. Where is this project now?
2. What changed?
3. What stayed intact?
4. What is the recommendation?
5. What are the strongest opportunities?
6. What are the meaningful risks/gaps?
7. How does pricing/market position look where applicable?
8. What exact decision is required from the owner?

**Complexity belongs in the research and design process — not in the owner's way.**
