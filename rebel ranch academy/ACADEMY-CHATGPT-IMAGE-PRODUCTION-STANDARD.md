# Rebel Ranch Academy — Image Production Standard

**Status:** CURRENT STANDARD; AUTOMATED ACADEMY PRODUCTION TEMPORARILY SUSPENDED  
**Current image mechanism:** Personal ChatGPT image generation requires an owner-started ChatGPT conversation  
**Program:** Rebel Ranch Academy (RRA)  
**Effective:** 2026-09-07

## Purpose

This standard controls how Academy learner-facing generated images move from an approved educational need to a verified visual asset.

The image system must not treat “an image was generated” as proof that the image is correct. It must separately verify the educational facts, physical relationships, branding, visible labels, file integrity, integration, and deployed learner experience.

This standard operates under:

- `/AGENTS.md`;
- `/rebel ranch academy/AGENTS.md`;
- `/rebel ranch academy/docs/VERIFICATION-AND-BRAND-CONTROL.md`;
- the applicable approved Academy research/product/visual brief;
- `/rebel ranch academy/systems/automation/runner-status.md` while automated production remains suspended.

## 1. Current operational truth

Academy automated production is currently offline pending backend/pipeline repair and end-to-end verification.

The existing Personal ChatGPT image mechanism is **not a fully autonomous backend image generator**. It requires the owner to start an eligible personal ChatGPT conversation so the active ChatGPT agent can perform the image-generation step.

Therefore:

- the current personal-ChatGPT handoff must not be described as fully automated;
- a ready image assignment must not display as though an image agent is already working;
- no background Academy runner may assume it can invoke personal ChatGPT image generation by itself;
- a future fully automated image path requires a separately approved and verified image-generation mechanism that an authorized worker can actually call without pretending a human-started conversation occurred.

This is a current system limitation, not permission to bypass image verification.

## 2. Required image-production state sequence

1. `NOT_REQUIRED` — the approved product does not require generated raster artwork.
2. `BRIEF_REQUIRED` — Product Design has not supplied a complete visual assignment.
3. `READY_FOR_IMAGE_PRODUCTION` — verified brief, source assets, evidence boundaries, and destination are ready; no generator is necessarily running.
4. `GENERATING` — an authorized image-production mechanism has actually claimed the assignment.
5. `GENERATED_PENDING_INSPECTION` — a generated image exists but has not passed inspection.
6. `REVISION_REQUIRED` — the image has a visible factual, brand, composition, labeling, accessibility, or quality defect.
7. `READY_FOR_INTEGRATION` — the inspected binary asset is stored at its approved repository destination.
8. `INTEGRATING` — the accepted asset is being connected to the approved learner/product surface.
9. `DEPLOYED_QA_PENDING` — integration is deployed but complete user-facing QA is unfinished.
10. `VERIFIED` — the exact deployed image and learner route passed every applicable verification gate.
11. `FAILED` — the current attempt failed; the failed step, reason, and safe retry point are recorded.

Only a state representing actual active work may be shown as “working.” A queued/ready state is not active execution.

## 3. Required image assignment

Every generated visual must have a durable assignment containing, when applicable:

- project ID;
- authorized workflow stage;
- image ID or stable assignment key;
- exact educational purpose;
- learner-facing concept the image must make easier to understand;
- approved factual claims or physical relationships the visual must preserve;
- evidence/source references for factual visual details;
- approved product/manuscript section the image supports;
- required real-world objects/components;
- required sequence, orientation, scale relationship, or cause/effect relationship where relevant;
- prohibited shortcuts or misleading representations;
- safety boundaries;
- required dimensions/aspect/use context;
- accessibility/legibility needs;
- exact repository destination;
- labeling/text plan;
- verified brand identity and exact source asset paths when branding applies;
- inspection checklist;
- integration checklist;
- deployed-QA checklist.

If the visual brief does not contain enough verified information to create the image responsibly, the assignment remains `BRIEF_REQUIRED` or `FAILED`; the generator must not fill evidence gaps by invention.

## 4. Brand hard gate

Before a branded RRA/RRM image is generated:

1. verify the exact program/brand;
2. verify the canonical approved logo/source asset;
3. make the actual source asset available to the production mechanism when the mechanism requires it;
4. verify all existing taglines/catchphrases/program wording;
5. obtain explicit owner approval for any new recurring brand phrase before production use;
6. instruct the generator to preserve verified branding rather than inventing or approximating it.

After generation, inspect the result against the verified source asset.

A redrawn, approximated, misspelled, replaced, or invented logo/brand mark fails verification even when the rest of the image looks good.

## 5. Educational/factual image verification

For an educational image, inspection must answer:

- Does the image show the same system/process/object relationships supported by the approved evidence?
- Did the generator add components, claims, labels, hazards, measurements, causes, or outcomes that were not approved?
- Are arrows, sequence, orientation, flow, before/after relationships, and relative position materially correct?
- Does the image accidentally imply certainty where the research is uncertain?
- Does it show a dangerous or incorrect procedure as normal?
- Does it simplify without changing the underlying truth?
- Is any learner-facing text spelled correctly and consistent with approved wording?

A visually attractive image that teaches the wrong thing fails.

## 6. Visual-quality and learner-experience verification

The image must also be checked for:

- whether it actually helps explain the intended concept;
- realistic/recognizable presentation where realism is educationally useful;
- unnecessary decorative clutter;
- cropping, clipping, overflow, unreadable labels, or tiny text;
- mobile and desktop readability when used on responsive web surfaces;
- print suitability when the asset is intended to print;
- accessibility concerns, including not relying on color alone for essential meaning;
- consistency with the approved learner-experience standard.

An image is not required merely because a page has empty space. Visuals must perform useful teaching, communication, navigation, or marketing work.

## 7. Current Personal ChatGPT handoff

Under the current personal-ChatGPT mechanism, the owner starts the ChatGPT Visual Production conversation.

The active agent must:

1. read the current GitHub/Supabase project state rather than relying on chat memory;
2. claim only an authorized ready assignment;
3. verify the visual brief and source assets before generation;
4. generate the image;
5. inspect the actual output;
6. revise visible defects when authorized;
7. save a real image file at the approved repository destination;
8. update the durable visual/manifest record;
9. dispatch or perform the authorized integration step;
10. verify the deployed learner surface;
11. record the exact failed step when any stage fails.

The owner should not be required to manually download, rename, move, or re-upload generated image files merely to complete the Academy pipeline when the active production tool can do that work.

## 8. Future fully automated image path

A future automated image-production mechanism may replace the owner-started personal-chat handoff only after the complete path is approved and verified.

The future worker must be able to prove, end to end, that it can:

1. receive the correct authorized assignment;
2. fetch the exact verified source assets and evidence-bound visual brief;
3. create the image through an actually callable approved generator;
4. retrieve the real binary output;
5. perform factual, brand, text, and visual inspection;
6. route failures for revision rather than accepting them automatically;
7. store the accepted asset at the approved GitHub location;
8. integrate it into the correct product/version;
9. deploy/preview through the authorized route;
10. inspect the exact deployed result;
11. synchronize accurate status back to the owner dashboard.

No future provider, API, worker, or agent is considered a replacement merely because it can create pictures. The full verified production chain is the requirement.

## 9. Verification gate

`VERIFIED` requires, as applicable:

- a valid image binary;
- correct repository path and file identity;
- correct direct asset resolution;
- correct approved logo/brand assets;
- correct learner-facing text/labels;
- factual/physical agreement with the approved evidence and visual brief;
- working wrapper/product/learner page;
- working nested resources;
- desktop/mobile inspection;
- no clipping/overflow that changes usability;
- correct integration into the approved product revision;
- agreement among GitHub, deployment, dashboard/control state, and the actual learner-facing result.

Until every applicable requirement passes, the project remains in Visual Production and no “fixed,” “complete,” “ready for owner review,” or equivalent state is permitted.

## 10. Visual failure and improvement loop

Every failed or owner-rejected visual should preserve enough information to prevent the same failure from becoming routine.

Record, when applicable:

- failure category: `FACTUAL`, `BRAND`, `TEXT`, `COMPOSITION`, `LEARNER_CLARITY`, `ACCESSIBILITY`, `FILE`, `INTEGRATION`, `DEPLOYMENT`, `STATE_SYNC`, or `OTHER`;
- what the intended visual was supposed to accomplish;
- what actually failed;
- whether the failure came from bad/missing research, an incomplete brief, generation error, inspection failure, integration error, or deployment/state error;
- correction made;
- whether the correction passed re-verification;
- whether a durable workflow/standard/prompt/schema improvement is recommended;
- owner decision when the improvement changes a controlling standard or expands scope.

The purpose is not to preserve every failed picture forever. The purpose is to preserve the **lesson that prevents repeated waste**.

The Academy improvement loop for visuals is:

**BRIEF → VERIFY → GENERATE → INSPECT → CORRECT → INTEGRATE → VERIFY DEPLOYED → OWNER REVIEW → LEARN FROM RESULT → IMPROVE THE CONTROL → REUSE THE LESSON**
