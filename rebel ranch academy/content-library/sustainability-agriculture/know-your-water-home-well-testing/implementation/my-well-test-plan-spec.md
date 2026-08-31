# My Well Test Plan — Product Specification

**Project:** RRA-2026-0002  
**Role:** Paid-core learner output and repeat-use household record  
**Status:** Product Design specification

## Purpose

Turn learner inputs into a persistent testing-and-next-action system. The output must materially change when the learner changes source, use, event, risk, route or result data.

## Required learner inputs

### Source
- private well;
- public/community supply;
- other/unknown.

### Intended uses — multi-select
- drinking/cooking;
- infant/young-child use;
- household washing/fixtures/appliances;
- animals;
- irrigation/garden;
- emergency backup;
- treatment-performance check;
- other.

### Why testing now — multi-select
- routine baseline;
- flood/inundation;
- well/pump/casing/storage/plumbing repair;
- sudden taste/odor/color/clarity change;
- local spill/contamination issue;
- recurring illness concern;
- infant/pregnancy/other vulnerability;
- new home/no records;
- treatment-performance question;
- other change/event.

### Local-risk categories — multi-select
- septic;
- livestock/agriculture/fertilizer;
- fuel/pesticide source;
- landfill/improper waste disposal;
- local geology/naturally occurring concern;
- known groundwater issue;
- unknown / need local guidance.

### Existing evidence/history
- last test date if known;
- provider/lab if known;
- prior result records;
- existing treatment step if relevant;
- unresolved question.

## Generated outputs

### A. Testing Question Map
For each active branch:
- question to answer;
- reason it matters;
- selected use/event/risk that triggered it;
- evidence route needed;
- decision the result changes;
- what can be prepared now;
- what should wait.

### B. Test Route Comparator
Fields:
- route type;
- verified provider/resource name;
- question/analyte fit;
- decision-grade suitability;
- result type: exact number / presence-absence / broad screen;
- current verified cost or `verify current cost`;
- turnaround/logistics;
- sample bottle/handling dependency;
- what remains after the result.

No route receives a universal “best” label.

### C. Sample Journey
Fields:
- selected provider;
- provider instructions reference/link;
- container/bottle requirement;
- sample location;
- treatment included/bypassed if relevant;
- collection time/date;
- preservation/transport instruction;
- delivery deadline;
- notes.

### D. Result Context Record
Fields:
- analyte/test;
- result type;
- value;
- units;
- reporting/detection limit;
- sample location;
- before/after treatment status;
- benchmark/source;
- intended uses affected;
- confirmation status;
- next job.

### E. Next-Action Map
Allowed job categories:
- confirm/retest;
- inspect source/well/plumbing/system;
- contact local public-health/environmental resource;
- define treatment job;
- maintain existing system;
- monitor;
- schedule next routine/event check.

### F. Calendar / history
- due date;
- reason due;
- completed date;
- result link/reference;
- next due rule selected from the supported guidance or learner/local resource;
- event history.

## State rules

1. Answers persist during normal navigation and optional depth exploration.
2. `Show me why`, `Show me the science`, `See the system`, and `Sources` return to the exact originating step.
3. Changing source recalculates source-responsibility explanation and dependent route logic.
4. Changing intended uses preserves all non-conflicting history but refreshes affected-use labels.
5. Adding an event creates an event-triggered branch without deleting routine history.
6. Removing an event may retire that open branch but must not silently delete completed historical records.
7. Result records never lose units/sample location/benchmark context when displayed in summaries.
8. The plan clearly distinguishes learner-entered facts, source-backed defaults/guidance, and unresolved unknowns.
9. No generalized text output may pretend a user-specific contaminant recommendation was made when supporting evidence is absent.

## Branch behavior

The learner sees one whole-system view with expandable branches:

`SOURCE → SELECTED USES → ROUTINE / EVENT / LOCAL-RISK QUESTIONS → TEST ROUTES → SAMPLES → RESULTS → NEXT JOBS → RETEST/HISTORY`

Shared infrastructure:
- source record;
- local resource list;
- provider/lab contacts;
- testing history;
- household intended uses.

Branch-specific information:
- event reason;
- risk question;
- sample/test context;
- result;
- next action.

## Printable/export output

Generate a plain household summary suitable for:
- bringing to a laboratory/local health department;
- household records;
- discussing a defined treatment job with the parent Water product or a qualified provider.

It should include no decorative non-clickable pills. Status text must read as ordinary text/labels unless it is an actual clickable control.

## Targeted warning logic

Only display a short targeted warning when the product is presenting a specific supported immediate hazard, for example the approved nitrate/infant example. Do not repeat generic disclaimer boxes throughout the plan.

## Acceptance test

The tool fails Product Value QA if two materially different learner profiles produce substantially the same generalized paragraph instead of different question maps, route needs, event branches, records and next actions.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RRA Product Design Agent automation cycle
