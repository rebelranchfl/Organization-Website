# RRA-2026-0004 — Interactive Scenario Map

## Product interaction goal

Turn a learner's actual inventory and intended uses into a **storage-system plan**, not a generic container recommendation.

Multiple intended uses may coexist. The interface must therefore use **multi-select** for use branches and preserve all selected branches through the complete experience.

## Step 1 — What do you need stored water to do?

Multi-select:
- Drinking / cooking
- Emergency household reserve
- Livestock / animals
- Garden / ordinary irrigation
- Produce-contact / postharvest agricultural use
- Other non-potable use

Output: selected branches + plain explanation that different jobs can share some infrastructure but not all requirements.

## Step 2 — What containers do you already have?

For each container, learner may add:
- common name: jug / bucket / barrel / drum / tote / tank / cistern / trough / other;
- approximate capacity;
- prior contents: known water/food use, known non-toxic non-food use, toxic chemical/pesticide/petroleum, unknown;
- material/rating information known or unknown;
- condition: intact / scratched-damaged / corroded / unknown;
- opening: narrow / wide / removable lid / unknown;
- dispensing: pour / spigot / valve / pump / dipping/open access / other;
- cleaning access: easy / possible but difficult / effectively inaccessible;
- current location: indoor/protected / outdoor shaded / direct sun/heat / near chemicals/fuel / other;
- current support/base: floor/ground / rack/platform / unknown.

Do not collect brand/product model unless learner voluntarily chooses technical depth and it is genuinely needed.

## Step 3 — Container history gate

Hard rule for potable branch:
- toxic chemical / pesticide / petroleum prior contents → **Do not use for drinking/cooking storage**.
- unknown history → do not declare potable-safe; identify what must be verified or recommend a known-suitable potable vessel for that branch.

Lower-consequence non-potable uses may continue to a conditional suitability evaluation where the approved evidence permits it.

## Step 4 — What each branch requires

### Drinking / cooking
Show required jobs:
- suitable known prior use/material context;
- protected closure/opening;
- sanitary dispensing;
- cleanability;
- protected placement;
- maintenance/labeling.

### Emergency reserve
Add:
- household capacity target;
- portability vs bulk-storage decision;
- outage-access method;
- rotation/fill date;
- redundancy choice;
- separation from fuel/chemicals.

### Livestock
Add:
- adequate capacity/refill reliability;
- animal access without injury/system damage;
- cleanability;
- contamination/algae/manure/feed control;
- maintenance/testing trigger.

### Garden / ordinary irrigation
Add:
- capacity/refill;
- delivery method compatibility;
- placement/overflow;
- maintenance appropriate to the actual use.

### Produce-contact / postharvest
Show a stronger consequence flag:
- do not apply generic ordinary-irrigation assumptions;
- V1 may teach branch distinction and general function only;
- crop/commodity-specific thresholds/rules require targeted evidence.

## Step 5 — Container classification

For each selected branch, classify each container separately:

1. **Works for this job** — evidence supplied by learner is sufficient for the product's general criteria.
2. **Works after this correction** — e.g. replace open-dip dispensing, move away from chemicals, improve closure, verify support.
3. **Lower-consequence / non-potable use only** — appropriate branch-specific use without pretending potable suitability.
4. **Do not use for this job** — explicit evidence-backed failure such as toxic prior contents for potable storage.
5. **Verify this first** — a specific unknown materially changes the answer.

Never output a universal `SAFE` badge.

## Step 6 — Capacity + weight + redundancy

Inputs:
- household count and duration for emergency branch;
- learner-selected volume target for other branches;
- container capacities already available.

Outputs:
- total required / planned gallons;
- approximate water weight using 8.34 lb/gal for planning;
- current capacity gap/surplus;
- container count options;
- `one large vs several smaller` tradeoff;
- portability warning when filled weight is substantial;
- support/base check prompt.

Do not invent species-specific livestock intake volumes in this product unless later research authorizes them.

## Step 7 — See the system

Render a visual branch map:

`SOURCE / FILL POINT`
→ shared fill/transfer where appropriate
→ **Potable branch**
→ **Emergency branch**
→ **Livestock branch**
→ **Irrigation branch**
→ **Produce-contact branch**

For each branch show assigned real containers and unresolved gaps.

## Step 8 — Fix what matters first

Prioritized action list:
1. hard disqualifiers / contamination risks;
2. structural/support problems;
3. missing closure/dispensing function;
4. capacity gaps;
5. maintenance/rotation gaps;
6. optional convenience upgrades.

This prevents the product from becoming a shopping list.

## Step 9 — Build My Storage Plan

Living output should include:
- selected uses;
- container inventory;
- branch assignment for each container;
- containers excluded from specific jobs and why;
- needed corrections;
- capacity/weight calculation;
- shared infrastructure;
- branch-specific components;
- maintenance schedule / inspection tasks;
- specific unknowns to verify;
- optional upgrades;
- next learning path.

When an earlier answer changes, all dependent classifications and plan branches update where practical.

## Step 10 — Responsible experiment / inspection

Learner challenge: **Does Function Before Form Hold Water?**

For one real container:
`UNDERSTAND → INSPECT → ASSIGN A JOB → OBSERVE USE → CHECK FAILURE POINTS → IMPROVE → DECIDE → TRANSFER THE PRINCIPLE`

This is an inspection/operations exercise, not a claim that stored potable water is microbiologically safe without appropriate evidence.

## Deeper-learning controls

Optional controls may include:
- Why does prior use matter?
- Why does a narrow opening help?
- See contamination paths
- Show me the weight math
- Why does one big tank create a different failure risk?
- See the evidence / sources

Requirements:
- no dead links;
- learner remains on the same step/context;
- opening depth does not reset answers;
- returning from depth preserves branch state.

## Privacy-minimized learner signals

Useful structured events:
- branch(es) selected;
- number/type of containers inventoried;
- history status distribution: known / unknown / disqualifying;
- capacity-planner started/completed;
- classification outcomes by category;
- most common correction needed;
- depth layer opened;
- plan completed / printed;
- follow-on topic chosen.

Do not collect names, emails, addresses, exact farm/house location, unrestricted personal narratives, IP address or browser fingerprints for product intelligence.