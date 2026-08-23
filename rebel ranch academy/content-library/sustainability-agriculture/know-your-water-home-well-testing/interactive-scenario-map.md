# RRA-2026-0002 — Interactive Scenario Map

**Project:** Know Your Water — Home & Well Testing  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RRA Product Design Agent  
**Date:** 2026-08-23

## Design purpose

Scenarios must make the learner **use the diagnostic system**, not merely read about testing. Each scenario changes the learner's plan and produces a tangible record. The architecture should support more than one active condition at once where conditions coexist.

## Shared learner state

All scenarios read/write the same persistent state:
- source type and basic well history;
- intended water uses;
- last known test date/results;
- local-risk clues;
- household vulnerabilities;
- recent events/repairs/changes;
- current treatment and sample-point context;
- selected testing route;
- results and next actions.

Depth controls such as `Show me why`, `Show me the science`, and `See the system` must return to the exact scenario step with answers preserved.

## Scenario 1 — “Nothing seems wrong. Do I still test?”

**Starting condition:** private well; water looks/tastes normal; no recent testing record.

Learner actions:
1. identify source and intended uses;
2. review routine federal/state baseline distinctions;
3. record local-risk questions;
4. choose a practical first testing route;
5. build the next-test date.

Tangible outputs:
- baseline Test Plan;
- “why this test?” explanation for each selected question;
- local questions to verify;
- annual/retest calendar entry.

Learning point: sensory normality is not proof; routine measurement creates a baseline.

## Scenario 2 — “I’m in rural Florida near septic, livestock and fertilizer.”

**Starting condition:** private well; drinking/cooking + household uses; multiple local-risk clues.

Learner actions:
1. keep Florida routine guidance distinct from broader EPA guidance;
2. identify which local-risk factors justify asking about additional analytes;
3. identify Gilchrist County Environmental Health as a local starting contact without assuming service/analyte availability;
4. compare local/certified/mail testing routes by purpose and cost/logistics.

Tangible outputs:
- Routine + Local Risk branch map;
- questions to ask the county/lab;
- chosen evidence route and reason;
- unresolved-risk list.

Learning point: local context expands the question; it does not justify guessing a universal panel.

## Scenario 3 — “The well flooded.”

**Starting condition:** existing household plan + flood/inundation event.

Learner actions:
1. add an event to the living plan;
2. distinguish what can be understood/prepared immediately from decisions that require testing;
3. route to current event-specific official/local instructions;
4. record retest/confirmation requirement after correction.

Tangible outputs:
- Event Test Plan;
- immediate preparation/action list supported by current guidance;
- result-dependent decision list;
- verification/retest record.

Learning point: an annual test schedule is not an event-response plan.

## Scenario 4 — “I repaired the well/pump/plumbing. Now what?”

**Starting condition:** repair/change event; prior baseline exists.

Learner actions:
1. mark what system component changed;
2. identify what evidence should be refreshed;
3. preserve sample point and treatment state;
4. compare post-change result with prior baseline where comparable.

Tangible outputs:
- post-repair test question;
- before/after comparison record;
- confirmation/next-action route.

Learning point: changing the system can change the evidence needed.

## Scenario 5 — “I have a home kit result. Is that enough?”

**Starting condition:** learner enters a limited home-screening result.

Learner actions:
1. identify exactly what the tool measured and its output type;
2. classify whether the intended decision is low-consequence screening or drinking-water health/safety;
3. preserve the approved boundary that an unverified consumer screen is not automatically equivalent to certified laboratory evidence;
4. identify the next evidence step if the consequence requires it.

Tangible outputs:
- Evidence Confidence record;
- “this result can/cannot answer” statement;
- confirmation route.

Learning point: evidence quality is tied to the question and consequence, not to whether the result looks precise.

## Scenario 6 — “The broad test is expensive. What can I do first?”

**Starting condition:** cost-sensitive learner comparing local targeted testing with commercial broad panels.

Learner actions:
1. define the decision question first;
2. compare verified current local/state/certified/commercial routes;
3. separate routine baseline from specialized risk-driven panels;
4. select the least-wasteful route that can answer the question.

Tangible outputs:
- Test Route Comparator;
- cost/coverage/logistics comparison using current verified inputs;
- questions postponed because they lack evidence/risk justification;
- next action.

Learning point: more analytes do not automatically mean more useful evidence.

## Scenario 7 — “My nitrate screen looks high. What filter do I buy?”

**Starting condition:** approximate or screening result; learner wants treatment immediately.

Learner actions:
1. stop the device-shopping path;
2. record analyte/result/units/method/sample point;
3. determine whether confirmation is needed for the intended decision;
4. preserve household vulnerability/urgency context;
5. only after adequate evidence, define the **treatment job** or source/well correction question.

Tangible outputs:
- Result Anatomy record;
- confirmation decision;
- treatment-job handoff, not a device recommendation;
- retest/verification requirement.

Learning point: diagnose before prescribing.

## Scenario 8 — “I installed treatment. The water looks better.”

**Starting condition:** treatment/correction implemented; sensory improvement reported.

Learner actions:
1. identify the specific treatment job;
2. choose appropriate pre/post or post-treatment verification evidence;
3. compare results under documented sample conditions;
4. decide whether maintenance, adjustment, further investigation or monitoring is warranted.

Tangible outputs:
- Treatment Verification record;
- before/after comparison;
- next maintenance/retest date.

Recurring challenge: **Does Responsible Rebellion Hold Water?**

Rule: **A successful build/treatment is not proof. Test the result.**

## Scenario 9 — “We’re buying a house with a well.”

**Starting condition:** unknown/incomplete well history; no trusted baseline.

Learner actions:
1. collect available well/test/treatment records;
2. identify baseline questions and local-risk research;
3. distinguish buyer uncertainty from evidence-backed general education;
4. build a first-year testing/maintenance record rather than a one-time “safe/unsafe” label.

Tangible outputs:
- New Well Baseline Plan;
- missing-record checklist;
- first-test route;
- first-year calendar.

## Scenario 10 — “Several conditions apply at once.”

**Starting condition:** rural Florida household + infant/pregnancy + recent repair + treatment system + no recent test.

The learner must be able to select multiple applicable conditions. The system should show:
- shared testing infrastructure;
- routine baseline branch;
- event-triggered branch;
- vulnerability-driven urgency;
- treatment-verification branch;
- what can be combined into one sampling event when the selected laboratory says it can;
- what must remain distinct because methods/sample handling/holding times differ.

Tangible output:
- one coherent Whole Household Test Plan, not four disconnected checklists.

## Responsible Rebellion experiment loop

Where safe and evidence-supported, scenarios use:

`UNDERSTAND → IMPLEMENT/PREPARE → OBSERVE → TEST → COMPARE → IMPROVE → DECIDE → TRANSFER THE PRINCIPLE`

The product must not imply that observation alone proves water safety.

## QA requirements for architecture

A later architecture fails if:
- the learner can only choose one condition when several realistically coexist;
- scenarios end in generalized text instead of updated plan outputs;
- `Show me why/science/system` loses state;
- a home screen is silently elevated to decision-grade evidence;
- commercial tests are ranked without current, functional evidence;
- a result jumps directly to treatment equipment;
- the testing spin-off duplicates the parent Water product's treatment architecture;
- generic disclaimer boxes interrupt the experience;
- `TRANSFER THE PRINCIPLE` is absent.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RRA Product Design Agent
