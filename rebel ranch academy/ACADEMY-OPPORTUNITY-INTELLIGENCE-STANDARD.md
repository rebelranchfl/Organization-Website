# Rebel Ranch Academy — Opportunity Intelligence Standard

**Status:** Owner-approved governing standard
**Date:** 2026-08-21
**AI-Agent:** ChatGPT/GPT-5.6 Sol
**Session:** RR Website — Academy Opportunity Intelligence v1

## Purpose

Academy research produces more value than the single product being worked on. Every substantial project can reveal adjacent problems, transferable skills, new products, bundles, free resources, implementation tools, cross-program pathways and topics that are not worth pursuing.

The Opportunity Intelligence System exists to capture that value quickly and turn it into owner-readable decisions.

The system is not a prettier funnel. It is a decision engine and knowledge network.

## Authority

The agent may discover, screen, score and recommend.

**The owner is the ultimate authority.**

An agent may recommend that an opportunity is not worth pursuing, but it may not permanently erase or silently kill the opportunity. A low-value recommendation goes to `NOT_RECOMMENDED_OWNER_REVIEW` and remains available until the owner closes it or sends it back for reconsideration.

Owner direction overrides agent priority, recommendation and disposition.

## Core cycle

`DISCOVER → CONNECT → FAST SCREEN → SCORE → RECOMMEND → ACT OR HOLD → OWNER OVERRIDE/REVIEW`

A connection alone is not enough reason to create a project. The system asks whether the juice is worth the squeeze.

## Structured opportunity record

Every substantial opportunity should record, when known:

- parent Academy project;
- parent opportunity when the branch came from another branch;
- title and problem solved;
- opportunity type;
- primary Academy learning area;
- all Academy areas touched;
- other Rebel Ranch programs genuinely served or supported;
- transferable skills;
- source/evidence that caused the opportunity to be discovered;
- demand;
- mission value;
- marketability;
- implementation value;
- evidence readiness;
- cross-Academy value;
- production effort;
- overlap/redundancy risk;
- confidence;
- opportunity score;
- recommended action;
- recommended priority;
- dependencies;
- whether market research is still required;
- whether the opportunity is ready to spin into its own project;
- owner disposition and owner note;
- spawned project ID when it becomes a separate Academy project.

## Opportunity types

- `LEARNING_PATH`
- `STANDALONE_PRODUCT`
- `MODULE`
- `TOOL`
- `BUNDLE`
- `FREE_RESOURCE`
- `SERVICE`
- `RESEARCH_TOPIC`

These are working classifications, not permission to publish or sell.

## Recommendation states

### PURSUE_NOW
Strong enough to justify active forward motion now. If `spin_off_ready=true` and no gate blocks it, the system may create a new Academy project for Research intake.

### PURSUE_LATER
Worth preserving and likely worth building, but timing, dependencies, evidence readiness or current workload make immediate work inefficient.

### INCORPORATE_BUNDLE
Useful and valuable, but the current evidence suggests it belongs inside a parent product, bundle or reusable component rather than becoming a standalone product now.

### FREE_RESOURCE
High mission/search/education value with weak standalone paid-product economics, or strategically useful as a free entry/foundation layer.

### MONITOR
Interesting connection but insufficient evidence, demand, differentiation or timing information for an active build decision.

### NOT_RECOMMENDED_OWNER_REVIEW
The agent believes the opportunity is not worth further investment. It enters a low-urgency owner review bucket. It does **not** disappear and does **not** become permanently closed until owner disposition.

## Owner dispositions

The owner may set:

- `PURSUE_NOW`
- `PURSUE_LATER`
- `INCORPORATE_BUNDLE`
- `FREE_RESOURCE`
- `MONITOR`
- `REVISIT`
- `CLOSED_OWNER`

`REVISIT` means the owner believes the screen may have missed something and the opportunity needs another look.

`CLOSED_OWNER` is the final no-forward-motion state. The record remains in the intelligence history.

## Fast screening

Opportunity screening should happen as soon as a meaningful branch is discovered. Do not wait for the parent product to be complete simply to decide whether a branch is worth investigating.

The first pass is deliberately cheaper than full Product Opportunity Research. It answers:

1. Does this solve a real problem?
2. Is there evidence of audience need or likely repeated need?
3. Is it aligned with Academy mission and learning areas?
4. Is there a plausible marketable/free/bundle use?
5. Does implementation create meaningful learner value?
6. How much approved evidence already exists?
7. Does the skill transfer across Academy areas?
8. How hard will it be to build responsibly?
9. Does it duplicate something already planned/built?
10. How confident are we in this screen?

If the first pass is promising but market data is weak, mark `market_research_needed=true` instead of inventing demand or pricing facts.

## Scoring scale

Each factor uses 0–5 where 5 is strongest/highest.

Positive factors:
- demand;
- mission value;
- marketability;
- implementation value;
- evidence readiness;
- cross-Academy value;
- confidence.

Cost/risk factors:
- production effort;
- overlap/redundancy risk.

A high opportunity score is a prioritization signal, not owner approval and not a promise of commercial success.

The recommendation must remain explainable in plain language. Never show a score without the reason and unresolved gaps.

## Relationship graph

Opportunities may connect to:

- other opportunities;
- Academy projects;
- Academy learning areas;
- Rebel Ranch programs;
- transferable skills.

Relationship types:
- `DEPENDS_ON`
- `LEADS_TO`
- `SUPPORTS`
- `OVERLAPS`
- `TRANSFER_TO`
- `BUNDLE_WITH`
- `USES_SKILL`
- `SERVES_PROGRAM`

Cross-program connections are pathways and utility relationships. They do not merge program brands, finances, audiences or access rules.

## Spin-off rule

A strong branch should not have to wait for its parent product to finish.

When an opportunity is `PURSUE_NOW`, `spin_off_ready=true`, sufficiently defined, and not blocked by evidence/owner gates, an agent may create a new Academy idea/project record and route it to Research according to normal Academy workflow.

The spawned project must retain:
- its source opportunity ID/key;
- parent project;
- discovery rationale;
- dependencies;
- evidence boundaries already known.

Creating a project does not authorize publishing, selling, pricing or release.

## Low-value path

When the screen concludes the opportunity is weak:

`SCREEN → NOT_RECOMMENDED_OWNER_REVIEW → LOW-URGENCY OWNER BUCKET`

The owner may later choose:
- `CLOSED_OWNER` — confirmed wash;
- `REVISIT` — something may have been missed;
- any pursue/bundle/free/monitor disposition.

The agent must not repeatedly spend work cycles on an opportunity waiting in this owner bucket unless new evidence materially changes the screen.

## Owner-facing visual requirements

The Operations Review intelligence layer should let the owner see at a glance:

- the parent problem/project;
- opportunity branches;
- strength/score;
- recommendation;
- cross-Academy learning-area connections;
- relevant program connections;
- spin-off readiness;
- evidence/market gaps;
- owner disposition;
- which nodes are active, later, bundle/free, monitoring or awaiting owner review.

The owner should be able to click a node and answer: **What is this? Why does it matter? Is it worth the squeeze? What does it connect to? What happens next?**

## Water proof-of-concept

`RRA-2026-0001` is the first live proof of this system because its research already exposed a dense network:

- testing;
- result interpretation;
- treatment/disinfection;
- storage and rotation;
- rainwater;
- gravity/head/pressure/flow;
- pumps;
- automatic animal watering;
- farm water systems;
- emergency water;
- maintenance/retesting;
- source protection;
- troubleshooting;
- household resilience;
- cross-Academy function-before-form systems thinking.

Water should demonstrate whether the intelligence engine correctly identifies which branches deserve immediate work, which belong inside bundles/modules, and which should wait.
