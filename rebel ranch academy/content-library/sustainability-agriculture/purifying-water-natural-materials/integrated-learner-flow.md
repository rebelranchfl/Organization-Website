# RRA-2026-0001 — Integrated Learner Flow

**Status:** PRODUCT WORKING — RESPONSIBLE REBELLION REBUILD  
**Purpose:** Define the complete learner journey, multi-use branch behavior, optional-depth behavior and state continuity before Visual Production.

## Main journey

1. **Start** — what this product will help the learner do.
2. **Tell Us About Your Water** — source/context.
3. **What Do You Need the Water to Do?** — multi-select intended uses.
4. **Your Water System at a Glance** — immediate shared-source + branch map.
5. **See How Water Systems Work** — visual treatment-function teaching.
6. **See Real System Options** — DIY/low-resource/modern/hybrid build concepts.
7. **What Do You Know / What Is Still Unknown?** — distinguish method knowledge from learner-specific knowledge.
8. **What Should You Test?** — testing linked to decisions, not used as a blanket gate.
9. **Build My Water System** — personalized branch architecture.
10. **Use What You Have / Decide What Is Worth Buying** — component/resource choices.
11. **Does Responsible Rebellion Hold Water?** — build/test/compare activity when appropriate.
12. **Scale / Automate / Back Up** — optional branch-specific improvements.
13. **My Water Plan** — living personalized payoff.
14. **TRANSFER THE PRINCIPLE** — reusable problem-solving model.

## Multi-use branch behavior

The learner may select multiple simultaneous uses. The system stores an array/set of selected uses rather than one scalar answer.

Example:
`uses = [DRINK_COOK, ANIMALS, IRRIGATION]`

The learner always has access to:
- **Whole System** view;
- **Drinking & Cooking** branch;
- **Animals** branch;
- **Garden / Irrigation** branch;
- other selected branches.

Each branch displays:
- inherited source/shared infrastructure;
- required jobs;
- branch-specific constraints;
- system/build options;
- test/verification logic;
- maintenance/backup.

## State persistence contract

At minimum preserve through the active learner session:
- source;
- selected uses;
- observations/known facts;
- unknowns;
- testing status/results categories;
- selected system options;
- resource inventory;
- build/buy choices;
- branch decisions;
- maintenance/backup selections;
- optional-depth location;
- learner's current step.

Device-local persistence may be used if consistent with the approved Academy implementation. Account-synced persistence is not assumed unless separately authorized.

## Dependency/update rules

If a learner changes:
- **source** → recalculate source-dependent considerations across all branches;
- **selected uses** → add/remove branches without deleting unrelated saved answers;
- **testing status/result category** → update affected treatment/verification options;
- **scale** → update storage/flow/support/maintenance constraints;
- **resource inventory** → update substitution/build/buy options.

Do not make the learner manually rebuild the entire plan after one upstream change.

## Optional depth contract

Depth controls include:
- Tell me more;
- Show me why;
- Show me the science;
- See the system;
- Technical details;
- Sources.

Every depth control must either:
1. open an in-context panel/modal/drawer; or
2. open a verified route with a working return path that restores the exact learner state and step.

Hard failures:
- 404;
- route exists but no Back/Return path;
- return resets answers;
- return changes selected branches;
- technical depth becomes the only path to continue.

## Visual-first rule

Before a long explanation, the learner should normally see:
- source/scene;
- system diagram/build concept;
- branch relationship;
- before/after or function visual.

Technical diagrams are available as depth when they are not the simplest first explanation.

## My Water Plan access

`My Water Plan` is visible after the first meaningful profile inputs and grows as the learner progresses. It is not hidden only at the end.

The learner can open it at any time to see:
- what the system currently knows;
- what branches exist;
- what is still missing;
- what changed after a new answer.

## QA test paths

Before Product Review, product architecture must specify these test journeys for future implementation QA:

### Path A — Private well + drink/cook + animals + irrigation
Must create three simultaneous branches and retain them through depth exploration.

### Path B — Municipal + drink/cook + renter/no-install
Must teach improvement options without pretending the learner has unknown source water.

### Path C — Rain + animals + irrigation + emergency storage
Must show shared catchment/storage considerations and branch-specific delivery/verification.

### Path D — Surface water + emergency backup
Must preserve the high-caution chemical/toxin uncertainty boundary while still teaching treatment functions and alternatives.

### Path E — Change answer mid-journey
Change one intended use and one upstream source/scale answer; unrelated answers must survive and dependent branches must update.

### Path F — Optional depth
Open `Show me the science`, `Show me why`, and `See Scale and Function Before Form`; return to the exact learner position with all answers intact.

---
AI-Agent: ChatGPT/GPT-5.6 Sol  
Session: RRA Product Design Agent
