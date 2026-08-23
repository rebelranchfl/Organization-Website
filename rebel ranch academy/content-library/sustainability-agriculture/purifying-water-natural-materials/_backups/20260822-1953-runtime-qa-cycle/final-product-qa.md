# RRA-2026-0001 — Final Product QA

**Project:** Water Through the Layers  
**Product system:** Know Your Water + Build Your Water System  
**QA status:** IN PROGRESS — NOT READY FOR OWNER FINAL PRODUCT REVIEW  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RRA Visual Production Agent

## Why this QA was reopened

The owner inspected the actual learner-facing product after the previous PASS and found contradictions between the QA record and the rendered experience: intended use was still single-select, deeper routes produced 404s in the owner experience, tangible visual teaching was insufficient, and My Water Plan was too generalized/text-heavy.

Under `ACADEMY-RENDERED-PRODUCT-QA-STANDARD.md`, documentation is evidence of intent; the rendered release candidate is evidence of delivery. The previous PASS is superseded.

## Corrections now durable in the release candidate

Primary release-candidate work already present on GitHub `main`:
- `visual-production/water-learning-experience-final.html` uses checkbox/multi-select for intended uses rather than radio/single-select;
- selected uses are stored together in browser state and each selected use generates its own visible My Water Plan branch;
- My Water Plan contains a personalized whole-system SVG branch diagram, shared infrastructure, branch-specific jobs, verification notes and next three actions;
- source/use/testing/concern/scale inputs are saved in browser localStorage and the plan rebuilds when upstream answers change;
- a real 55-gallon layered-filtration cutaway is in the learner sequence with labeled function/limit teaching;
- a source → shared infrastructure → multi-use branch system diagram is in the learner sequence;
- historical/regional/modern comparison is an explanatory visual rather than only prose;
- `visual-production/water-system-implementation-visuals.html` exposes explicit `substitutions`, `scale`, `animals`, `surface`, `evidence-ladder`, `history`, and `whole-system` anchors.

Rendered-QA corrections completed in the 2026-08-22 17:47 ET cycle:
- static inspection found two wrong fragment destinations in the exact primary release candidate: links requested `water-system-visual-preview.html#testing` and `#uv`, while the deeper page exposed `#test-tree` and `#uv-train`;
- compatibility anchors `#testing` and `#uv` were added to the deeper decision visual page without removing the existing anchors;
- both deeper visual pages now provide **Back to where I was in Water Through the Layers** behavior using browser history when the learner arrived from the main experience, with a direct-file fallback to the main experience;
- the owner entry `visual-production/index.html` no longer describes the package as Final Product Review-ready while rendered QA remains incomplete. It now identifies the exact current release candidate and the remaining hard gate.

## Static route verification completed this cycle

The learner-facing release candidate currently routes only to repository-backed files in the Visual Production package:

- `index.html` — exists;
- `water-system-visual-preview.html` — exists;
- `water-system-implementation-visuals.html` — exists.

Referenced fragments checked against the destination files:

- decision visuals: `#clear-safe`, `#testing`, `#uv` — present after correction;
- implementation visuals: `#scale`, `#substitutions` — present;
- direct deeper-page entries also preserve their existing detailed anchors such as `#test-tree`, `#uv-train`, `#animals`, `#surface`, `#history`, and `#whole-system`.

This closes the known static missing-file/fragment mismatch. It does **not** substitute for the required rendered browser exercise.

## Water regression test status

1. **Choose at least three intended uses simultaneously and keep all three through My Water Plan:** IMPLEMENTED IN RELEASE-CANDIDATE CODE; rendered runtime verification still required before PASS.
2. **Every deeper-learning route resolves with zero 404s and correct destination:** STATIC FILE/ANCHOR CHECK PASSED after correcting `#testing` and `#uv`; rendered click-through verification and exact-return behavior still required before PASS.
3. **State survives deeper navigation and return:** localStorage persistence and history-return behavior implemented; rendered runtime verification still required.
4. **Tangible treatment/purification visuals actually exist:** STATIC CONTENT CHECK PASSED. Whole-system branch map, 55-gallon cutaway, clear-vs-safe, treatment-job, UV, Function Before Form, scale, surface-water, evidence-ladder and historical/global visual teaching are present in learner-facing files.
5. **My Water Plan visibly represents shared infrastructure and distinct use branches:** IMPLEMENTED in the release-candidate code; rendered runtime verification still required.
6. **Two materially different learner profiles produce meaningfully different outputs:** branch/source/concern/scale logic exists in the exact release candidate; rendered runtime comparison still required.
7. **Final Product Review preview is the exact corrected release candidate:** NOT YET CERTIFIED. `preview-manifest.json` correctly remains `VISUAL_PRODUCTION / RENDERED_QA_IN_PROGRESS`, and `visual-production/index.html` now matches that gate instead of claiming Final Product Review readiness.

## Current hard-gate decision

**DO NOT MARK PASS. DO NOT RETURN TO FINAL PRODUCT REVIEW YET.**

This cycle removed a real route mismatch and aligned the preview entry with the true gate. The remaining mandatory work is a browser/runtime exercise of the exact GitHub-main release candidate: select 3+ uses; navigate every depth route; verify return/state persistence; compare two materially different profiles; inspect responsive/mobile and print behavior; and confirm the exact files tested are the files surfaced for Final Product Review.

## Release boundary

No public release, deployment, storefront activation, sale, public price activation, promotion, affiliate placement or SEO/public publication is authorized or performed by this QA state.
