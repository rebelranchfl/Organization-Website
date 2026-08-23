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

Current Visual Production package on `main`, re-read directly during Cycle 05e:

- `visual-production/water-learning-experience-final.html` — primary release candidate, Git blob `5114800371d47fb25b97816097c1bc9ac8f48751`;
- `visual-production/water-system-visual-preview.html` — deeper decision/evidence layer, Git blob `957852ebeea266db5ac68870f366b5e390b82015`;
- `visual-production/water-system-implementation-visuals.html` — deeper implementation layer, Git blob `cbd4285d436e05de67fc91cc63d0d805c08f1f3c`;
- `visual-production/index.html` — rendered-QA entry, Git blob `3b8cba86b39aaf57c04c07084daa88f5c7981cc3`;
- `visual-production/preview-manifest.json` — Git blob `9ed402122383136a4f5bed0800a10178ccaabc49`, marked `VISUAL_PRODUCTION / RENDERED_QA_IN_PROGRESS`, with `water-learning-experience-final.html` as `primary_release_candidate`.

### Cycle 05e evidence-record correction

The prior version of this QA record still listed the **pre-Cycle-05d** deeper-page blob SHAs even though GitHub `main` had already advanced to the hardened Cycle 05d files. Fresh current-file reads confirmed the learner-facing pages themselves were correct; the stale part was this QA evidence record.

Current deeper-page return logic now checks the actual referrer before using browser history:

- `document.referrer` must exist;
- referrer origin must equal the current page origin;
- referrer path must end in `/water-learning-experience-final.html`;
- only then, and only when history exists, does the control call `history.back()`;
- otherwise the normal link fallback goes to `water-learning-experience-final.html#evidence`.

That prevents a directly opened deeper page from using unrelated browser history merely because `history.length > 1`.

No Cycle 05e edit was made to the current learner-facing HTML after the fresh read showed Cycle 05d had already applied this safeguard.

## Corrections durable in the release candidate

- intended uses are checkboxes/multi-select;
- all selected uses are stored together and each selected use generates a distinct My Water Plan branch;
- My Water Plan includes shared infrastructure, branch-specific jobs, verification notes, next actions, and a personalized SVG branch diagram;
- source/use/testing/concern/scale are persisted in browser storage and dependent plan output rebuilds from those inputs;
- tangible whole-system, 55-gallon cutaway, historical/regional/modern, clear-vs-safe, testing, treatment-job, UV, substitution, scale, surface-water and evidence-ladder teaching is physically present in learner-facing files;
- the known `#testing` and `#uv` fragment mismatches are corrected with compatibility anchors;
- both deeper pages have explicit **Back to where I was in Water Through the Layers** controls with same-origin/referrer-guarded history return and a direct fallback to the main experience.

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

A functioning Python Playwright + system Chromium runtime was found in the execution environment. Direct URL/file navigation is blocked by the environment's managed browser policy, so the prior cycle used an in-memory browser document to exercise the current release-candidate interaction logic and required learner controls while keeping exact GitHub-main route existence/anchors as a separate static check.

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

This directly exercises the state-restoration defect corrected earlier and confirms the corrected restore logic does not overwrite saved concern/scale during load.

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

## Cycle 05e — actual navigation gate recheck

The required remaining test was attempted again against the execution browser environment. The managed Chromium policy contains a catch-all URL block, and normal URL/file navigation is rejected with `ERR_BLOCKED_BY_ADMINISTRATOR`. This affects the environment itself rather than a missing Water file or anchor.

Because the governing QA standard requires the actual learner-facing round trip to be exercised, static inspection of the correct return-handler code is **not** being substituted for the missing runtime proof.

Cycle 05e therefore:

1. re-read the exact current GitHub-main files rather than relying on older recorded blob SHAs;
2. confirmed both deeper pages contain the Cycle 05d same-origin/referrer return safeguard;
3. confirmed the manifest still names the same primary release candidate and remains `RENDERED_QA_IN_PROGRESS`;
4. corrected this QA record so it now references the exact current learner-facing blobs;
5. kept the hard gate closed.

## Water regression test status

1. **Choose at least three intended uses simultaneously and keep all three through My Water Plan:** **BROWSER INTERACTION PASS** for well + drinking + animal + emergency; three distinct plan branches observed.
2. **Every deeper-learning route resolves with zero 404s and correct destination:** **EXACT GITHUB FILE/ANCHOR PASS; DIRECT BROWSER CLICK-THROUGH STILL BLOCKED BY EXECUTION-ENVIRONMENT NAVIGATION POLICY.** No referenced file/fragment is missing.
3. **State survives deeper navigation and return:** **FRESH-DOCUMENT STORAGE RESTORE PASS; ACTUAL LINK-OUT/HISTORY-BACK STILL NOT CERTIFIED.** Current return-handler code is statically correct, but the required real round trip has not been exercised.
4. **Tangible treatment/purification visuals actually exist:** **EXACT GITHUB CONTENT PASS.** Required whole-system/cutaway/function/comparison visuals are present in learner-facing files.
5. **My Water Plan visibly represents shared infrastructure and distinct use branches:** **BROWSER INTERACTION PASS** in the exercised primary interaction surface.
6. **Two materially different learner profiles produce meaningfully different outputs:** **BROWSER INTERACTION PASS** — Profile A produced 3 well/drinking/animal/emergency branches; Profile B produced 2 rain/household/irrigation branches with different summary/next-path logic.
7. **Final Product Review preview is the exact corrected release candidate:** **MANIFEST/ENTRY FILE PASS, FINAL CERTIFICATION PENDING.** Manifest and entry point at the current primary file, but Final Product Review must not reopen until the remaining actual navigation/history-back check is exercised in a browser that permits normal navigation.

## Current hard-gate decision

**DO NOT MARK PASS. DO NOT RETURN TO FINAL PRODUCT REVIEW YET.**

One hard gate remains: exercise the actual linked main → deeper page → **Back to where I was** navigation/history path in a browser/runtime that permits normal URL/file navigation, and confirm the learner lands back at the exact prior place with the full Water Plan state intact.

The current release-candidate code and repository routes are aligned for that test, but the execution environment cannot honestly certify it while its managed browser policy blocks navigation.

## Release boundary

No public release, deployment, storefront activation, sale, public price activation, promotion, affiliate placement or SEO/public publication is authorized or performed by this QA state.
