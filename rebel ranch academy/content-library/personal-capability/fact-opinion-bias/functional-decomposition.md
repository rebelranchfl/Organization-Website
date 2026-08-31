# RRA-2026-0003 — Functional Decomposition

**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RRA Product Design Agent

## Desired outcome

Help a learner examine a meaningful claim or decision without beginning from agreement/disagreement, authority, popularity or emotion. The learner should end with a clearer evidence picture, calibrated confidence and a responsible next action.

## Required functions

1. **Capture the exact claim** — preserve wording before analysis.
2. **Split mixed claims** — separate event/factual assertion, inference, value judgment, prediction and recommendation when combined.
3. **Classify claim type** — type is not truth status.
4. **Map evidence** — what supports, challenges or remains missing.
5. **Trace sources** — identify closest source and distinguish independent evidence from copies/echoes.
6. **Expose assumptions** — what must be true for the conclusion to hold.
7. **Stress test** — consider alternatives/opposite, what would weaken/reverse the conclusion, and whether the same evidence standard would be accepted if it pointed elsewhere.
8. **Map social pressure** — information, belonging, norms and value weighting; public answer vs private belief where relevant.
9. **Calibrate confidence** — strongly corroborated / supported / reasonable inference / tentative / value judgment / unsupported assertion.
10. **Decide next action** — share, act, verify, wait, ask, test, gather more evidence or revise.
11. **Preserve a living record** — learner can update evidence/confidence later.
12. **Transfer the principle** — reuse method in another domain.

## Dependencies

`Exact claim → claim layers → evidence/source map → assumptions/social pressure → stress test → confidence → action`

Do not calculate confidence before the learner has had a chance to inspect evidence and assumptions.

## Minimum performance requirements

- Plain language first.
- Learner can handle more than one claim layer at once.
- Source map supports multiple sources and notes whether they are independent/copies.
- Tool never labels a person “biased” as a diagnosis.
- Tool never declares objective truth merely from user-entered answers.
- Social influence is shown as a pressure/pathway, not proof the conclusion is false.
- Value questions are not falsely converted into fact questions.
- State persists through deeper-learning navigation.
- Learner can edit earlier entries and dependent record updates.

## Resource spectrum

### Use what you have

- claim text or statement;
- browser/search access when available;
- notes, screenshots, receipts, records, timestamps, direct observations;
- people who were directly present;
- existing business/family records.

### Worth using/buying when justified

No paid external product is inherently required for the core skill. Optional paid databases or professional expertise may be justified for specialized legal, medical, financial or technical claims, but RRA should not turn that into a general requirement.

### Do not substitute

- popularity for evidence;
- one source repeated many times for independent corroboration;
- source prestige for claim-specific evidence;
- strong emotion for evidence strength;
- “bias detected” for a rebuttal;
- a user-entered confidence score for actual factual verification.

## Minimum viable system

A learner can complete one claim through:

`SORT → SOURCE → STRESS TEST → DECIDE`

The system outputs a Decision Record with:

- claim layers;
- current evidence status;
- source path;
- assumptions;
- social-pressure notes;
- current confidence;
- unresolved questions;
- next action;
- update date.

## Upgrade paths

- guided source tracing with link capture;
- source-echo visualization;
- scenario packs;
- family/group compare mode;
- business decision mode;
- version history for changed conclusions;
- optional evidence/source export;
- account-linked history only if separately approved.

## Verification

Success is verified by whether the learner can explain:

- what kind of claim they are examining;
- what evidence exists and how independent it is;
- what remains assumption/unknown;
- what could change their mind;
- what social pressure may be present;
- why their confidence is at its current level;
- what action is justified now.

A correct answer key is appropriate for prebuilt objective scenarios, but not for automatically scoring open real-life disputes as true/false.