# RRA-2026-0002 — Product Architecture

**Project:** Know Your Water — Home & Well Testing  
**Stage:** PRODUCT_WORKING  
**Working product family:** Know Your Water  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RRA Product Design Agent automation cycle  
**Date:** 2026-08-23

## 1. Product identity

### Free mission layer
**Working name:** What Should I Test — and Why?

A short interactive path that helps a household turn a vague question such as “Is my water okay?” into a useful testing-question map.

It must create a tangible output:
- water source;
- all intended uses selected by the learner;
- routine vs event-triggered reason for testing;
- local-risk questions to investigate;
- household vulnerability flags that change urgency or local follow-up;
- what evidence route is appropriate next;
- what can be learned or prepared before results exist;
- what decision should wait for a result.

### Paid core
**Working name:** My Well Test Plan

A persistent interactive planning and result-to-next-action system. It is not a contaminant encyclopedia and not a treatment catalog.

Primary audience:
- private-well households;
- rural Florida households;
- homeowners/homesteaders;
- parents and homeschool families using the system as real-life learning.

Secondary audience:
- household members who already have a lab result and need to organize what it means and what to do next.

Proposed delivery:
- responsive interactive web product;
- printable/exportable household testing plan generated from learner inputs;
- optional plain, detail, technical and evidence depth layers.

## 2. Learner outcome

By the end, the learner should be able to:
1. explain why “test everything” and “buy a filter first” are both weak starting points;
2. distinguish routine baseline testing from event-triggered and local-risk testing;
3. identify the question a test is supposed to answer;
4. compare local/county, certified private-lab, mail-to-lab and limited home-screening routes by function rather than advertising;
5. preserve sample and result context;
6. recognize when a result needs confirmation or local/professional interpretation;
7. turn a confirmed problem into a clearly defined next job: inspect/correct source or well, define a treatment job, maintain, monitor, or retest;
8. keep a living testing history and next due actions;
9. transfer the same diagnose-before-buying method to another real-life system.

The product does **not** promise:
- universal water safety certification;
- a nationwide universal testing panel;
- treatment prescriptions;
- equivalence between consumer screens and certified laboratory testing;
- suitability thresholds for uses not supported by the approved evidence.

## 3. Multi-use logic

Intended use is **multi-select** because one water source may serve several real jobs at the same time.

Learner-facing choices may include:
- drinking/cooking;
- infant formula/young-child use;
- household washing/fixtures/appliances;
- animals;
- irrigation/garden;
- emergency backup;
- checking whether an existing treatment step is working;
- other use to remember in the plan.

The product must not invent use-specific contaminant limits where the approved research does not contain them. Instead it uses intended uses to:
- keep the whole household system visible;
- show which decisions are health/safety-sensitive;
- identify when the learner needs use-specific local/subject evidence before acting;
- keep one source from being treated as if every branch has identical requirements.

## 4. Integrated learning sequence

### Step 1 — What water are we talking about?
**Plain question:** Where does this water come from?

Inputs:
- private well;
- public/community supply;
- other/unknown.

Action/result:
- explain that private-well households carry their own monitoring responsibility;
- keep public-water learners inside the educational sequence without pretending the same responsibility structure applies.

Visual:
- recognizable well/pump/home scene beside a public-water line/meter scene.

### Step 2 — What do you use it for?
Multi-select intended uses.

Action/result:
- build the first branch layer in My Well Test Plan;
- preserve all selected uses through the product.

Visual:
- one source feeding parallel household-use branches.

### Step 3 — Why are you testing now?
Learner may select more than one:
- routine baseline / annual check;
- flood or inundation;
- well/pump/plumbing/storage repair;
- sudden taste/odor/color/clarity change;
- known local spill/contamination issue;
- recurring illness concern;
- infant/pregnancy or other vulnerable household situation;
- treatment-performance question;
- new home / missing records;
- other change/event.

Result:
- separate routine and event-triggered work instead of flattening them into one checklist.

### Step 4 — What local risks should you investigate?
Teach categories supported by approved research:
- septic;
- livestock/agriculture/fertilizer;
- fuel/pesticide handling or storage;
- landfill/improper disposal;
- local geology/naturally occurring contaminants;
- known local groundwater issue.

Result:
- create questions to ask local health/environmental/lab resources;
- do not claim a specific analyte panel unless approved evidence supports it.

### Step 5 — Build the testing-question map
For every recommended question, the learner sees:
- **What are we trying to learn?**
- **What decision would the answer change?**
- **Routine, event or local-risk reason?**
- **What evidence route can answer it?**
- **Can anything useful be done before results?**
- **What should wait?**

This is the first tangible personalized output.

### Step 6 — Choose how to get the evidence
Use the Test Route Comparator:
- county/state route when verified available;
- certified local private laboratory;
- mail-to-lab service;
- limited home screening where its limits are clear.

Compare:
- what question it can answer;
- whether it is decision-grade for the consequence involved;
- verified cost band if current/local evidence exists;
- turnaround/logistics;
- sample container/handling requirements;
- whether an exact quantitative result is produced;
- what the learner still has to do afterward.

### Step 7 — Prepare the sample correctly
Teach the principle:
**The sample is part of the test.**

The product does not invent a universal collection method. It stores:
- selected provider/lab;
- collection instructions link/reference;
- bottle/container requirement;
- sample location;
- treatment bypass/inclusion status when relevant;
- collection date/time;
- delivery/preservation instructions supplied by the provider.

### Step 8 — Read the result without pretending it says more than it does
Result workspace fields:
- analyte/test name;
- detected/not detected/quantitative result;
- number;
- units;
- reporting/detection limit when supplied;
- sample location;
- before/after treatment status;
- benchmark/source used for comparison;
- confirmation/retest need;
- intended use(s) affected.

A result is taught as a measurement in context, not a complete diagnosis.

### Step 9 — What changes next?
Route only to the next **job**, not a product sale:
- confirm/retest;
- inspect well/source/plumbing/system;
- contact local public-health/environmental resource;
- define a treatment job for the parent Water product;
- maintain existing system;
- monitor;
- update annual/event plan.

### Step 10 — Verify the correction
Responsible Rebellion sequence:

`UNDERSTAND → OBSERVE → TEST → COMPARE → IMPROVE → DECIDE → TRANSFER THE PRINCIPLE`

For a treatment-performance question:
- preserve before/after sample context;
- compare an appropriate measurement;
- do not call visual/sensory improvement proof.

Permanent rule:
**A normal-looking sample or successful-looking treatment is not proof. Test the result.**

### Step 11 — My Well Test Plan
Living output includes:
- source;
- selected intended uses;
- routine baseline questions;
- event-triggered questions;
- local-risk questions;
- provider/lab route;
- sample-preparation notes;
- completed results with context;
- unresolved questions;
- next actions;
- due/retest dates;
- treatment-job handoff when relevant;
- local resource links the learner chose.

### Step 12 — TRANSFER THE PRINCIPLE
**Measure the condition that determines the decision before buying the solution.**

Transfer examples:
- soil amendments;
- business software/bottlenecks;
- household energy problem;
- repair diagnosis;
- spending/budget leak.

Boundary:
The diagnostic pattern transfers; the actual tests, stakes, evidence standards and professional requirements do not.

## 5. Depth controls and continuity

Every deeper control remains inside the coherent sequence:
- Tell me more;
- Show me why;
- Show me the science;
- See the system;
- Sources.

Requirements:
- return to exact prior step/scroll focus;
- preserve answers and selected uses;
- never reset My Well Test Plan;
- changing an earlier source/use/event answer recalculates dependent plan sections where practical;
- evidence-depth pages do not become dead-end URLs.

## 6. Tangible outputs

The paid product must produce more than text explanations:
- Testing Question Map;
- Test Route Comparison;
- Sample Journey card/checklist generated from the selected provider route;
- Result Context Record;
- Result-to-Next-Action map;
- annual/event-triggered calendar/history;
- living My Well Test Plan;
- printable/exportable summary for use with a lab, county health department or household records.

## 7. Required visuals

Visual Production must create, at minimum:
1. source-to-use multi-branch household water map;
2. routine vs event-triggered testing split;
3. local-risk pathway visual;
4. “test route” comparison visual using recognizable lab/local/mail/home-screen scenes;
5. sample journey visual from source → bottle → handling → lab → result;
6. result anatomy visual showing analyte, value, units, reporting limit, sample location and benchmark/source;
7. result-to-next-action flow;
8. before/after verification visual;
9. living My Well Test Plan preview.

Technical diagrams may be optional depth; recognizable scenes lead.

## 8. Safety and evidence boundaries

Use short, targeted warnings only where immediate risk exists. General educational/legal boundaries stay in the approved footer disclaimer.

Hard evidence boundaries:
- no universal consumer-kit endorsement;
- no universal state-by-state panel;
- no unsupported specialized-contaminant branch;
- no treatment prescription from an unconfirmed screen;
- no universal sample procedure;
- no claim that clear water is safe;
- Florida guidance remains labeled Florida-specific.

## 9. Product relationship to parent Water project

This product owns:
- deciding what question to test;
- choosing an evidence route;
- sample/result context;
- confirmation/retest logic;
- recurring testing history;
- defining the next treatment/source-correction job.

The parent Water product owns broader treatment-system architecture and implementation. The testing product hands off a **defined job**, not a treatment recommendation.

## 10. Product Value test

RRA performs work the learner otherwise has to reconstruct across federal/state/local guidance, laboratories and commercial services:
- diagnose which question matters;
- organize multiple simultaneous uses/events/risks;
- compare evidence routes;
- preserve sample context;
- organize results and benchmarks;
- decide what needs confirmation;
- define the next job;
- maintain recurrence/history.

The learner leaves with a usable household system, not more pages to read. This architecture passes the paid-value threshold at the design level.
