# Evidence-Backed Verification Gates

## Purpose

Repository instructions say what must happen. They do not physically prevent an agent from skipping a check or overstating a result. This workflow turns the most important instructions into a software gate: required evidence passes and the work may advance, or a requirement fails and the requested claim is refused.

The controlling principle is:

**CHAT CLAIMS HAVE NO AUTHORITY. ONLY A SUCCESSFUL VERIFICATION REPORT ESTABLISHES THE REQUESTED VERIFIED STATUS.**

This is a control system, not a promise that AI is infallible. It makes skipped steps visible, blocks unsupported status claims, preserves evidence, and requires correction followed by a new run.

### Enforcement boundary

This repository checker is operational, but it cannot intercept or physically stop a Codex chat message. It establishes which status the repository recognizes and returns a failing exit code that a local workflow, pull-request check, or release process can block on. `AGENTS.md` now requires agents to run it, while the calculated report makes an unsupported chat statement invalid and auditable.

Making the gate physically unavoidable at a GitHub merge or deployment boundary requires connecting it to that specific automated workflow and configuring the workflow as required. That is a separate repository/release change because a gate must not be attached to unrelated programs or block all releases with a deliberately pending page manifest. Until that integration is explicitly designed and authorized, the local checker prevents a false claim from becoming an authoritative repository status but cannot guarantee that an agent will never type false words in chat.

## What lives where

- Markdown authorities such as `AGENTS.md`, the shared design system, program standards, and page records define the rules and owner decisions.
- A JSON manifest is the machine-readable checklist for one exact target and one requested claim.
- `tools/visual-verification-gate.mjs` reads the manifest and evidence and calculates PASS or FAIL.
- A project evidence directory holds screenshots and the generated report. Evidence is part of the result, not an optional explanation added afterward.
- Supabase is not required for the local gate. It may later centralize run history, approval records, evidence metadata, and status changes across machines or agents.

Supabase is a hosted platform built around PostgreSQL, a structured database. A table can resemble a spreadsheet, but the database also enforces relationships, permissions, constraints, and server-side rules. It is not intelligent by itself. The same gate rules would still need to be written and enforced.

## Controlled status vocabulary

Use these states separately:

1. `BUILT LOCALLY` — the exact target and authorized scope are locked and the local artifact exists.
2. `TECHNICALLY CHECKED` — required build and technical checks pass.
3. `VISUALLY REVIEWED` — required screenshots exist and an independent reviewer passed the visual questions.
4. `LOCALLY VERIFIED` — source, scope, build, asset/overlay, measurement, screenshot, and independent visual-review gates all pass.
5. `OWNER APPROVED` — the locally verified result has an explicit owner approval record.
6. `DEPLOYED` — the owner-approved result has authorized deployment evidence.
7. `PUBLICLY VERIFIED` — the deployed public experience has been rechecked at the required routes and viewports.

If the evidence required for the requested state is missing, stale, failed, or contradictory, the requested result is `NOT VERIFIED`. The report may also show the highest narrower state actually supported.

## Required gates

### 1. Source gate

Lock the exact target, approved visual/reference, and SHA-256 file fingerprint. Record whether edits, replacement, cropping, and overlays are permitted. A similar file, remembered image, or later substitute does not pass.

### 2. Scope gate

Record the authorized mode (`discussion`, `concept only`, `implementation`, or `correction`), authorized files, protected areas, exclusions, and owner decisions. A correction does not reopen the rest of a page.

### 3. Build and technical gate

Check loading, exact copy and states, links, controls, keyboard behavior, responsive behavior, overflow, runtime errors, dimensions, and default selection as applicable. Technical proof cannot substitute for visual proof.

### 4. Asset-and-overlay gate

For every interactive state, inventory what is baked into the image and what is added by live HTML/CSS. Confirm the final composite has only the intended marks, labels, icons, or badges and has no duplication, clipping, collision, or covered action.

### 5. Measurement gate

Record objective measurements and tolerances: half-panel bounds, symbol centers, edge clearance, collision distances, viewport size, crop behavior, and overflow. Mathematical centering is evidence, but the independent reviewer must also judge optical centering.

### 6. Screenshot gate

For responsive interactive visuals, require:

- a full-page phone capture at `456px` wide or less;
- a full-page desktop capture at `1180px` wide or more;
- a phone close crop for every interactive state; and
- a desktop close crop for every interactive state.

Use the exact viewport from an approved reference when one exists. Screenshots prove appearance only; they do not prove interaction.

### 7. Independent visual-review gate

The builder cannot grade their own visual work. A different reviewer must inspect the real rendered result and answer the required questions: two-second meaning, subject visibility, human relatability, hierarchy, scale, crop safety, optical balance, symbol purpose, natural wording, concept fidelity, professional quality, and whether every state advances the sales story.

This gate cannot reduce aesthetics to a number. It forces a separate judgment and records who made it. Important owner-facing visual decisions still require owner approval.

### 8. Claim gate

The manifest must not contain `status`, `verified`, `claimAllowed`, or another self-assigned result. The checker calculates the result. Failure means stop, correct, update the evidence, and rerun.

### 9. Release gate

`LOCALLY VERIFIED` does not mean approved or public. The complete chain is:

**LOCALLY VERIFIED → OWNER APPROVED → DEPLOYMENT AUTHORIZED AND CONFIRMED → PUBLIC EXPERIENCE RECHECKED → PUBLICLY VERIFIED**

Each arrow requires its own dated evidence. Commit, push, merge, or successful deployment alone does not prove the public experience.

## Evidence manifest and local checker

Start from `verification/visual/manifest.template.json`. Replace every placeholder with the exact target evidence; do not change failed checks to `true` until the cited evidence exists.

Run:

```text
node tools/visual-verification-gate.mjs verification/visual/<project-manifest>.json --out verification/visual/<project>-report.json
```

The process exits with code `0` only when the requested claim passes. A refusal exits nonzero and explains every missing or failed requirement. The report contains the calculated result and a SHA-256 fingerprint of the manifest used for that run.

The checker validates evidence presence and objective structure. It cannot know whether an uncited statement is truthful. That is why evidence files, independent review, owner decisions, and honest source locking remain mandatory.

## Minimum evidence rules

- Every check needs a plain-language evidence reference.
- State-specific categories must cover every required interactive state, either individually or through a truthful `all` check supported by one evidence source that actually covers all states.
- Screenshot evidence must be PNG, must exist, and must match the named viewport width.
- The default state needs the full-page captures; every required state needs phone and desktop close captures.
- The independent reviewer name must differ from the builder name.
- Owner approval, deployment, and public recheck fields are required only when requesting those higher claims; they may never be inferred from silence.

## Failure response

When a gate fails:

1. preserve the failure report;
2. describe the exact missing or failed facts without upgrading the result;
3. correct only the authorized scope;
4. capture fresh evidence rather than reusing stale proof;
5. rerun the gate; and
6. report the calculated result and remaining uncertainty.

Do not bypass a failure by renaming the status, using a synonym such as “ready,” or claiming that the result was “manually verified” without the required record.

## Product reliability principle

An AI product should not be sold as a system that never makes mistakes or always follows natural-language instructions. The defensible promise is controlled AI inside software boundaries: approved sources, allow/deny actions, structured inputs and outputs, automatic tests, retry and correction loops, human approvals for consequential decisions, monitoring, and an audit trail. Logic gates make expected behavior more reliable and failures easier to catch; they do not turn probabilistic AI into perfect software.

## Optional future Supabase phase

Add centralized storage only when multiple machines, agents, reviewers, or production workflows need shared history. A later design may use tables such as `verification_runs`, `verification_checks`, `verification_artifacts`, `verification_approvals`, and `verification_status_history`, with database rules that refuse a verified state while required rows are incomplete.

That phase requires separate owner authorization, database design, access-control review, backup/recovery planning, and implementation. It is not a prerequisite for the local gate and must not be purchased or deployed merely to make this workflow sound more sophisticated.
