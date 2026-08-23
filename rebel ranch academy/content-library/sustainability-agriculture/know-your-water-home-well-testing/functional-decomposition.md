# RRA-2026-0002 — Functional Decomposition

**Project:** Know Your Water — Home & Well Testing  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RRA Product Design Agent  
**Date:** 2026-08-23

## Desired outcome

A household can build and maintain a defensible testing system that answers the right water-quality questions at the right time, uses evidence appropriate to the consequence, and turns results into a clear next decision without buying treatment first.

## Governing principle

**Testing is a verification and diagnostic function, not permission to educate.** The learner can understand testing systems, contamination pathways, test functions, tradeoffs and preparation before a learner-specific result exists. The result refines the learner's exact decision.

## System function map

### Function 1 — Define the decision question
Inputs:
- water source;
- intended use(s);
- current concern;
- prior test history;
- recent event/change;
- household vulnerability;
- local geology/land-use clues;
- existing treatment state.

Required output:
- a plain-language statement of what the learner actually needs to know.

Failure mode:
- ordering a large panel or treatment because “more data must be better” without defining the decision.

### Function 2 — Establish a routine baseline
The system must distinguish:
- general EPA baseline guidance;
- Florida-specific routine guidance;
- state/local additions;
- household-specific additions.

Required output:
- routine test schedule and last/next due date.

Failure mode:
- flattening federal/state/local guidance into one universal rule.

### Function 3 — Detect event-triggered needs
Trigger classes include, when supported by the approved evidence:
- flood/inundation;
- well/pump/casing/plumbing work;
- abrupt sensory/clarity change;
- treatment-performance question;
- known local contamination event;
- household vulnerability change.

Required output:
- event test question + urgency + what can happen before a result + what decision should wait.

Failure mode:
- treating the annual plan as sufficient after a meaningful event.

### Function 4 — Add local-risk questions
The product does not need to know every contaminant nationwide. It needs to teach the learner how to identify what local question must be verified.

Inputs:
- septic proximity/issues;
- agriculture/livestock/fertilizer;
- fuel/chemical storage;
- landfill/industrial/airport/military activity where relevant;
- known state/county advisories;
- geology/naturally occurring concerns.

Required output:
- “ask your local health department/certified lab about ___ because ___” rather than an invented national panel.

Failure mode:
- creating false certainty from ZIP code alone or claiming an analyte is required without current evidence.

### Function 5 — Choose the evidence route
Forms may include:
- county/state public-health testing;
- certified local private laboratory;
- certified mail-to-lab service;
- limited home screening where evidence supports the specific use.

Selection criteria:
- analyte/question fit;
- consequence of error;
- accuracy/quantitation need;
- certification/method needs;
- sampling/holding-time logistics;
- turnaround;
- cost;
- repeatability.

Required output:
- chosen route + why it fits + what it cannot prove.

Failure mode:
- equating “home kit,” “mail kit,” “certified lab,” “free test,” or “dealer test” as if the labels alone establish evidence quality.

### Function 6 — Preserve sample quality
The product must organize, not invent, the chosen provider's requirements.

Required record:
- bottle/container source;
- sample point;
- treatment bypass/inclusion;
- date/time;
- preservation/cooling requirement where supplied;
- holding/delivery requirement;
- provider-specific instructions completed.

Failure mode:
- using one generic sampling procedure for all analytes.

### Function 7 — Preserve result context
Every result workspace must preserve:
- analyte;
- result/number;
- units;
- reporting/detection limit if provided;
- sample location;
- treatment status at sample point;
- applicable benchmark/source;
- jurisdiction/intended-use context;
- whether confirmation/retest is needed.

Required output:
- result record that can be interpreted later without losing the conditions that produced it.

Failure mode:
- displaying a naked number or “pass/fail” without enough context to understand what it means.

### Function 8 — Route the next decision
Allowed decision categories:
- confirm/retest;
- inspect well/source/plumbing;
- define treatment job;
- correct source/well condition;
- maintain existing treatment;
- monitor;
- seek local/professional/public-health help for a specific reason.

Required output:
- next action + what evidence will verify success.

Failure mode:
- jumping directly from a result to a branded filter/device recommendation.

### Function 9 — Verify the correction
The product must preserve the loop:

`UNDERSTAND → IMPLEMENT/CORRECT → OBSERVE → TEST → COMPARE → IMPROVE → DECIDE → TRANSFER THE PRINCIPLE`

Required output:
- before/after or pre/post correction verification record where applicable.

Failure mode:
- assuming a successful-looking treatment/build proves water quality.

### Function 10 — Maintain a living household record
State must persist across normal deeper-learning navigation and future sessions where practical.

Required persistent state:
- source/household profile;
- selected uses/risks;
- routine plan;
- event history;
- lab/provider route;
- sample records;
- result records;
- confirmation/retest;
- next actions;
- completed verification.

Failure mode:
- forcing the learner to re-enter answers after viewing science/evidence details or restarting each annual cycle from zero.

## Function Before Form matrix

| Required function | Low-resource / local form | Modern convenience form | What cannot be assumed |
| --- | --- | --- | --- |
| Establish routine bacteria/nitrate baseline in Florida | local/county/public-health or certified local lab when available | certified mail-to-lab service | availability, analytes, price and turnaround must be verified |
| Screen a limited property between lab tests | observation + supported low-consequence screening tool | digital meter/consumer screen | screening equivalence to decision-grade lab evidence |
| Test a local-risk contaminant | targeted certified lab analyte/panel | specialized mail-in panel | that a broad panel is more appropriate than targeted testing |
| Interpret result | lab report + current benchmark/source + local help | digital report/decision workspace | that vendor interpretation removes need for context/confirmation |
| Verify treatment | appropriate pre/post sampling and retest | planned before/after lab package | that equipment operation proves contaminant removal |
| Maintain history | paper household water record | persistent digital My Well Test Plan | that digital storage alone creates understanding |

## Shared versus branch-specific infrastructure

### Shared across branches
- household/source profile;
- local-risk inventory;
- certified-lab/local-resource finder;
- sample-quality organizer;
- result-context record;
- state persistence;
- annual/event history;
- next-action/verification loop.

### Routine baseline branch
Focus: recurring schedule and trend/history.

### Event-triggered branch
Focus: what changed, urgency, event-specific questions and confirmation after correction.

### Vulnerable-household branch
Focus: consequence/urgency changes supported by evidence; does not invent a universal vulnerability panel.

### Treatment-verification branch
Focus: before/after sample conditions, treatment job, comparison and retest.

### Well/source troubleshooting branch
Focus: whether result pattern points toward well/source/plumbing inspection or correction rather than a device.

## Tangible learner outputs required in Product Design

The architecture phase must produce or specify:
1. **My Well Test Plan** — persistent household plan.
2. **Testing Question Map** — what decision each test is meant to change.
3. **Routine vs Event Branch Visual** — whole-system view.
4. **Test Route Comparator** — local/public/certified/mail/home-screening function and tradeoff.
5. **Sample Journey Visual** — sample point → container/instructions → transport/holding → lab → result.
6. **Result Anatomy Visual** — analyte, value, units, limit, benchmark, sample point, treatment state.
7. **Result-to-Next-Action Map** — confirm / inspect / define treatment job / source correction / monitor / retest.
8. **Before/After Verification Record** — treatment or correction comparison.
9. **Testing Calendar** — routine + event-triggered history.
10. **Use-What-You-Have/Local Resource Path** — local health department, certified lab lists and free expert routes before defaulting to expensive broad panels.

## Product boundary from parent Water Through the Layers

This product owns **diagnostic testing and evidence navigation**. It may define the treatment job and route the learner to the next resource, but it must not rebuild the parent project's broad treatment-system architecture.

## TRANSFER THE PRINCIPLE

The transferable function is:

**Define the decision → measure the condition that controls the decision → interpret the evidence in context → verify the correction.**

This transfers to soil amendments, equipment troubleshooting, business bottlenecks, household budgeting and other systems only at the reasoning level. Their measurement methods and consequence thresholds remain domain-specific.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RRA Product Design Agent
