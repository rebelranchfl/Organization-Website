# RRA-2026-0001 — Interactive Scenario Map

## Recommendation

Build an interactive **Water Profile** decision tool. A static guide alone is not sufficient because source, intended use, known contaminants, setting, resources, budget and infrastructure materially change the responsible recommendation.

The tool's job is to **narrow the learner's research and next action**, not pretend to diagnose water quality from a questionnaire.

## Core interaction flow

`YOUR SITUATION → WHAT WE KNOW → WHAT WE DON'T KNOW → WHAT TO TEST → REQUIRED FUNCTIONS → RESOURCES YOU HAVE → SAFE OPTIONS → BUILD / BUY PATH → VERIFY → MAINTAIN → NEXT LEARNING PATH`

## Step 1 — Water source

Select one:
- Municipal/city water
- Private well
- Rainwater
- Pond/lake/creek/surface water
- Stored water
- Mixed/multiple sources
- Not sure

### Branch behavior

**Municipal:** ask for utility water-quality information and household/plumbing concerns before recommending treatment.

**Private well:** ask when it was last tested and whether results are available. If no/unknown, route to **Know Your Water / What Should I Test?** before potable-water treatment recommendation.

**Rainwater:** ask intended use, catchment/storage method and whether human drinking is intended. Do not assume potable use.

**Pond/surface water:** mark as a different risk profile. If human consumption is intended, require a higher-caution path and explicit testing/treatment verification. If use is animals/irrigation, branch separately.

## Step 2 — Intended use

Allow multiple selections but generate separate requirement paths where necessary:
- Drinking
- Cooking
- Animals/livestock/poultry
- Irrigation/garden
- Emergency backup
- Cleaning/general household
- Educational demonstration

**Important:** The interface must not merge human potable-water requirements with animal/agriculture, irrigation or demonstration requirements.

## Step 3 — What do you know?

Questions:
- Has this water been professionally/laboratory tested?
- Have you used an at-home screening kit?
- Do you have utility/public water-quality data?
- When was the last test?
- Which results do you actually have?
- Is there visible sediment?
- Unusual odor/taste/color?
- Known local issue?
- Recent flooding, well repair, contamination event or long period of disuse?

### Output rule

If critical information is unknown, the tool should say:

**“Your next job is not buying a purifier. Your next job is learning what needs treatment.”**

Then route to testing options.

## Step 4 — What should I test?

Decision support tiers:

### SCREEN IT
Low-cost at-home screening where appropriate for preliminary information.

Purpose: identify a possible issue or monitor a simple parameter; not equivalent to comprehensive certified laboratory analysis.

### TARGET IT
A specific concern exists, so use a test appropriate to that concern.

Examples of triggers may include local groundwater concerns, plumbing/lead concern, nitrate risk, bacterial concern, hardness/iron issues, etc. Final contaminant-specific logic must follow approved research.

### KNOW IT
Use certified/laboratory testing when the decision stakes require higher confidence or when the water source/problem is unknown and human drinking-water treatment decisions depend on the result.

Private-well baseline should surface current EPA/Florida guidance in learner language after approved integration.

## Step 5 — Setting / constraints

Inputs:
- Apartment/renter
- Suburban/homeowner
- Rural/private well
- Farm/homestead
- Off-grid/limited power
- Emergency/temporary

Other constraints:
- Cannot modify plumbing
- No electricity
- Limited counter space
- Need portable system
- Need large-volume storage
- Need automatic animal watering
- Need low maintenance
- Need lowest upfront cost
- Need lowest ongoing consumable cost

## Step 6 — Resources already available

Checkbox inventory:
- Food-safe jugs/containers
- 5-gallon food-safe buckets
- 55-gallon food-safe drums
- Larger tank
- Sand
- Gravel/rock
- Approved carbon/filter media
- Screens/cloth
- Tubing/hose
- PVC/pipe
- Valves
- Float valves
- Pump
- Elevated location/stand for gravity
- Roof/rain catchment
- Pond/surface source
- Electricity
- Solar power
- Basic hand tools
- Plumbing skills

The tool must distinguish **“available”** from **“appropriate for this function/use.”**

## Step 7 — Priority

Rank:
- Lowest cost
- Fastest setup
- Least maintenance
- Highest independence
- Lowest power use
- Most portable
- Best automation
- Highest treatment confidence
- Fewest replacement consumables

The tool should expose tradeoffs rather than claim one option maximizes everything.

## Step 8 — Functional result

The output should show the treatment/system jobs first, for example:

**Your system needs to solve:**
1. Verify source condition
2. Reduce sediment
3. Address identified contaminant X
4. Address microbial risk Y
5. Store treated water safely
6. Deliver 2 gallons/day at the countertop
7. Retest/maintain on schedule

Only then show forms/products/build paths that can perform those jobs.

## Step 9 — Build / Buy / Reuse output

For every required function, show:

- **USE WHAT YOU HAVE**
- **REUSE / REPURPOSE**
- **SOURCE LOCALLY**
- **WORTH BUYING**
- **OPTIONAL UPGRADE**
- **DO NOT SUBSTITUTE**

Example for `STORE`:

- use existing appropriate food-safe jug;
- reuse an appropriate known food-grade container after proper cleaning;
- source a food-safe bucket/drum locally;
- buy purpose-built storage if existing materials are unsuitable;
- upgrade to larger/automated storage if capacity requires it;
- do not use an unknown chemical container for potable water.

## Step 10 — Scenario outputs

### Scenario A — Rural well + household drinking + no testing

Output priority:
1. establish testing baseline;
2. interpret results;
3. identify treatment jobs;
4. compare countertop/point-of-use options based on actual need;
5. verify and maintain.

### Scenario B — Rural well + household + tested contaminant(s)

Output starts with the known treatment jobs and compares suitable pathways.

### Scenario C — Farm + animal watering + 55-gallon drum + tubing + gravity

Output may recommend a storage/distribution architecture, while separately flagging any water-quality issue that requires animal-use-specific guidance.

### Scenario D — Rainwater + chickens + automation goal

Output should branch to catchment/debris management → storage → gravity/pump → line → float/nipple/cup control → maintenance.

### Scenario E — Pond + emergency human-use backup

Output must not present ordinary sand/charcoal filtration as sufficient. Route to the higher-caution emergency/surface-water treatment path and verification requirements.

### Scenario F — Renter + city water + no plumbing modification

Output should prioritize public water data / identified concern, then no-install/countertop treatment options matched to the actual treatment job.

## Results Interpreter

Future interactive layer:

User enters or selects test results → system explains:
- what the value/flag means;
- whether it is aesthetic, operational, or health/safety relevant based on approved research;
- what treatment functions are commonly associated with that problem;
- what additional information is still needed;
- which RRA learning path comes next.

Do not provide unsupported medical risk interpretation.

## Output format

Each personalized result should contain:

1. **YOUR WATER PROFILE**
2. **WHAT YOU KNOW**
3. **WHAT YOU STILL NEED TO KNOW**
4. **YOUR REQUIRED FUNCTIONS**
5. **WHAT YOU ALREADY HAVE**
6. **WHAT CAN SAFELY SUBSTITUTE**
7. **SIMPLEST RESPONSIBLE PATH**
8. **BUILD / BUY OPTIONS**
9. **WHAT NOT TO ASSUME**
10. **HOW TO VERIFY**
11. **MAINTENANCE / RETESTING**
12. **OPTIONAL UPGRADES**
13. **THINK LIKE A REBEL — WHERE ELSE THIS PRINCIPLE APPLIES**
14. **NEXT LEARNING PATH**

## Safety behavior

The tool must stop and route to testing/research rather than prescribe when:
- source is unknown and human drinking is intended;
- significant contamination is suspected but not characterized;
- chemical/toxin contamination may be present in emergency surface water;
- the requested treatment function is not supported by approved research;
- a learner proposes an unsafe storage/material substitution;
- a treatment technology is being used outside its validated role.

## Product value

This interactive layer is the major differentiator. It converts RRA from a library of facts into a guided real-life decision system while still teaching the learner why the path was chosen.