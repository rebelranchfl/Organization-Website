# RRA-2026-0001 — Final Product QA

**Project:** Water Through the Layers  
**Product system:** Know Your Water + Build Your Water System  
**QA status:** IN PROGRESS — RUNTIME BEHAVIOR PARTIALLY EXERCISED; NOT READY FOR OWNER FINAL PRODUCT REVIEW  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RRA Visual Production Agent

## Why this QA was reopened

The owner inspected the actual learner-facing product after the previous PASS and found contradictions between the QA record and the rendered experience: intended use was still single-select, deeper routes produced 404s in the owner experience, tangible visual teaching was insufficient, and My Water Plan was too generalized/text-heavy.

Under `ACADEMY-RENDERED-PRODUCT-QA-STANDARD.md`, documentation is evidence of intent; the rendered release candidate is evidence of delivery. The previous PASS remains superseded.

## Exact GitHub-main release-candidate package checked

Current Visual Production package on `main`:

- `visual-production/water-learning-experience-final.html` — primary release candidate, Git blob `5114800371d47fb25b97816097c1bc9ac8f48751`;
- `visual-production/water-system-visual-preview.html` — deeper decision/evidence layer, Git blob `a29354c5c629192bba3350c19982a4f325a29b2d`;
- `visual-production/water-system-implementation-visuals.html` — deeper implementation layer, Git blob `c8e637325e74be5c7cfb18ead923da193cb5e7c9`;
- `visual-production/index.html` — rendered-QA entry, Git blob `3b8cba86b39aaf57c04c07084daa88f5c7981cc3`;
- `visual-production/preview-manifest.json` — still correctly marked `VISUAL_PRODUCTION / RENDERED_QA_IN_PROGRESS` and names `water-learning-experience-final.html` as `primary_release_candidate`.

## Corrections already durable in the release candidate

- intended uses are checkboxes/multi-select;
- all selected uses are stored together and each selected use generates a distinct My Water Plan branch;
- My Water Plan includes shared infrastructure, branch-specific jobs, verification notes, next actions, and a personalized SVG branch diagram;
- source/use/testing/concern/scale are persisted in browser storage and dependent plan output rebuilds from those inputs;
- tangible whole-system, 55-gallon cutaway, historical/regional/modern, clear-vs-safe, testing, treatment-job, UV, substitution, scale, surface-water and evidence-ladder teaching is physically present in learner-facing files;
- the known `#testing` and `#uv` fragment mismatches were corrected with compatibility anchors;
- deeper pages use **Back to where I was in Water Through the Layers** through browser history when available, with a direct fallback to the main experience.

## Exact route/file/anchor verification

All learner-facing file routes currently referenced by the primary candidate resolve to files present on GitHub `main`:

- `index.html` — present;
- `water-system-visual-preview.html` — present;
- `water-system-implementation-visuals.html` — present.

Primary internal navigation IDs present:

- `#start`;
- `#use`;
- `#know`;
- `#system`;
- `#activity`;
- `#history`;
- `#myplan`;
- `#evidence`.

Referenced deeper fragments present in the exact destination files:

- decision/evidence page: `#clear-safe`, `#testing`, `#uv`, plus existing `#test-tree`, `#uv-train`, `#uv-class-pou`;
- implementation page: `#scale`, `#substitutions`, `#animals`, `#surface`, `#evidence-ladder`, `#history`, `#whole-system`.

No currently referenced learner-facing file or fragment is missing in the GitHub-main package.

## Browser-runtime exercise completed 2026-08-22 19:53 ET

A functioning Python Playwright + system Chromium runtime was found in the execution environment. Direct URL/file navigation is blocked by the environment's browser administrator policy, so this cycle used an in-memory browser document to exercise the current release-candidate interaction logic and required learner controls while keeping exact GitHub-main route existence/anchors as a separate static check.

### Profile A — multi-use / high-stakes branch test

Exercised simultaneously:

- source: `well`;
- intended uses: `drink`, `animal`, `emergency`;
- testing: `lab`;
- concern: `microbial`;
- scale: `farm`.

Observed browser result:

- saved state preserved all three intended uses at the same time;
- My Water Plan rendered **3 distinct branches**;
- branch output included Drinking / cooking, Animal water, and Emergency backup separately;
- the personalized branch diagram included all three selected uses;
- saved state contained the selected source, all uses, testing state, concern and scale together.

### Persistence / new-document restore test

The saved browser-storage record from Profile A was carried into a fresh browser document using the same release-candidate load/restore behavior.

Observed:

- `well` restored;
- `drink + animal + emergency` all restored together;
- `lab`, `microbial`, and `farm` restored;
- My Water Plan rebuilt the same three branches without re-entering the answers.

This directly exercises the state-restoration defect corrected in the prior cycle and confirms the corrected restore logic does not overwrite saved concern/scale during load.

### Profile B — materially different-output test

Exercised:

- source: `rain`;
- intended uses: `house`, `irrigation`;
- testing: `screen`;
- concern: `particles`;
- scale: `55gal`.

Observed:

- saved state differed materially from Profile A;
- My Water Plan rendered **2 different branches** — Household and Garden / irrigation;
- summary and branch output materially differed from the well/drinking/animal/emergency profile.

### Mobile behavior

Chromium viewport exercised at **375 × 812**.

Observed document width:

- `scrollWidth = 375`;
- `clientWidth = 375`.

No document-level horizontal overflow was produced in the exercised primary interaction surface.

### Print behavior

Print media was emulated in Chromium.

Observed:

- progress navigation hides under print media;
- action controls hide under print media;
- the Print My Water Plan control invokes the page print action in the exercised browser runtime.

## Water regression test status

1. **Choose at least three intended uses simultaneously and keep all three through My Water Plan:** **BROWSER INTERACTION PASS** for well + drinking + animal + emergency; three distinct plan branches observed.
2. **Every deeper-learning route resolves with zero 404s and correct destination:** **EXACT GITHUB FILE/ANCHOR PASS; DIRECT BROWSER CLICK-THROUGH STILL BLOCKED BY EXECUTION-ENVIRONMENT NAVIGATION POLICY.** No referenced file/fragment is missing, but this cycle cannot honestly certify actual URL navigation/history return in this runtime.
3. **State survives deeper navigation and return:** **FRESH-DOCUMENT STORAGE RESTORE PASS; ACTUAL LINK-OUT/HISTORY-BACK STILL NOT CERTIFIED** because direct navigation is blocked by the environment.
4. **Tangible treatment/purification visuals actually exist:** **EXACT GITHUB CONTENT PASS.** Required whole-system/cutaway/function/comparison visuals are present in learner-facing files.
5. **My Water Plan visibly represents shared infrastructure and distinct use branches:** **BROWSER INTERACTION PASS** in the exercised primary interaction surface.
6. **Two materially different learner profiles produce meaningfully different outputs:** **BROWSER INTERACTION PASS** — Profile A produced 3 well/drinking/animal/emergency branches; Profile B produced 2 rain/household/irrigation branches with different summary/next-path logic.
7. **Final Product Review preview is the exact corrected release candidate:** **MANIFEST/ENTRY FILE PASS, FINAL CERTIFICATION PENDING.** Manifest and entry point at the current primary file, but Final Product Review must not reopen until the remaining actual navigation/history-back check is exercised in a browser that permits normal navigation.

## Current hard-gate decision

**DO NOT MARK PASS. DO NOT RETURN TO FINAL PRODUCT REVIEW YET.**

This cycle materially advanced rendered QA by exercising multi-use behavior, state restoration, meaningful personalization differences, mobile width, and print behavior in Chromium. It also confirmed the exact GitHub-main files/anchors for all learner-facing routes.

One hard gate remains: exercise the actual linked main → deeper page → **Back to where I was** navigation/history path in a browser/runtime that permits normal URL/file navigation, and confirm the learner lands back at the exact prior place with state intact. The current execution environment blocks direct navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so certifying that behavior here would be false.

## Release boundary

No public release, deployment, storefront activation, sale, public price activation, promotion, affiliate placement or SEO/public publication is authorized or performed by this QA state.
