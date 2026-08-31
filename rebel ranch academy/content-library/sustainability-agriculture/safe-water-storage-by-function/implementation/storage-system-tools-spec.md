# RRA-2026-0004 — Storage System Tools Specification

## 1. Can I Use This Container? Quick Check — free

Inputs: intended use(s), prior contents, known material/condition, closure, dispensing, cleanability, location/exposure.

Output by selected use:
- works for this job;
- works after this correction;
- lower-consequence/non-potable use only;
- do not use for this job;
- verify this specific unknown first.

Never output a universal `SAFE` label.

## 2. Use What You Have Audit — paid core

Repeatable inventory rows for each real container.

Each row must show:
- plain container name;
- capacity;
- prior-use status;
- condition;
- closure/opening;
- dispensing method;
- cleanability;
- location/support;
- branch assignments;
- correction(s);
- `keep / correct / reassign / replace / verify` result.

The result must change if earlier inputs change.

## 3. Capacity + Weight + Redundancy Planner

### Household emergency branch
Use owner-approved evidence baseline of 1 gallon/person/day for at least 3 days, with longer planning horizon selectable when the learner chooses it.

Inputs:
- number of people;
- planning days;
- existing potable reserve capacity.

Outputs:
- baseline gallons;
- existing capacity gap/surplus;
- approximate water weight using 8.34 lb/gal;
- possible container combinations from learner inventory;
- one-large vs several-smaller tradeoff.

Do not automatically calculate species-specific livestock volumes without targeted evidence.

## 4. Storage-by-Function Branch Map

Render selected uses simultaneously.

Show:
- shared source/fill point where applicable;
- each selected branch;
- assigned containers;
- branch-specific corrections;
- verify-first unknowns;
- shared components versus components that cannot responsibly be shared.

## 5. Container Anatomy Inspector

Visual inspection points:
- closure/lid;
- fill opening;
- vent if present;
- outlet/spigot/valve;
- cleaning access;
- interior condition visibility;
- base/support;
- label/date;
- sun/heat exposure;
- nearby chemical/fuel/manure/feed risks;
- overflow/drainage where relevant.

Learner marks each as `good / needs correction / unknown / not applicable`.

## 6. Correction Priority Engine

Priority order:
1. hard disqualifier for selected job;
2. structural/load failure risk;
3. contamination entry/dispensing issue;
4. capacity gap;
5. maintenance/inspection gap;
6. optional convenience upgrade.

Output should explain **why** each item is prioritized.

## 7. Maintenance Planner

Learner chooses/records realistic tasks:
- inspect container/closure;
- clean as appropriate to the system;
- inspect dispensing path;
- record fill/rotation date where applicable;
- inspect site/support;
- inspect outdoor livestock contamination/algae conditions;
- verify water quality after a suspected contamination event or when a real concern changes the decision.

Do not invent one universal cleaning or rotation interval for every branch.

## 8. Failure-Mode Activity

Scenario prompts:
- lid left open;
- dirty spigot;
- tank beside fuel/chemicals;
- trough repeatedly receives feed/manure;
- support begins to sag;
- one large tank leaks;
- unknown-history tote is proposed for drinking water.

For each ask:
1. What function failed?
2. What is the consequence for the selected use?
3. What is the simplest correction?
4. What, if anything, must be verified afterward?

## 9. My Water Storage Plan — final paid output

Must materially reflect learner input and include:
- selected uses;
- real inventory;
- branch assignment by container;
- disqualifiers;
- corrections;
- verify-first unknowns;
- capacity and approximate water weight;
- redundancy choice;
- maintenance actions;
- optional upgrades;
- next-learning links.

Export/print should preserve the same plan, not replace it with a blank worksheet.

## 10. State requirements

Persist through normal navigation and optional depth:
- selected uses;
- inventory rows;
- inspection answers;
- calculations;
- classifications;
- corrections;
- maintenance choices;
- plan output.

Changing upstream values must recalculate dependent outputs where practical.

## 11. Product QA test profiles

### Profile A — household emergency
Family of four, drinking + emergency reserve, known potable jugs plus one unknown-history tote.
Expected: tote not declared potable-suitable; emergency capacity/weight plan generated; jugs assigned if they pass inspection.

### Profile B — homestead multi-use
Drinking + livestock + irrigation; one known food-use barrel, one livestock trough, one unknown drum.
Expected: parallel branches; barrel may classify differently by branch; trough not treated as human-potable storage; unknown drum receives verify/reassign logic rather than a universal answer.

The two profiles must produce materially different plans.