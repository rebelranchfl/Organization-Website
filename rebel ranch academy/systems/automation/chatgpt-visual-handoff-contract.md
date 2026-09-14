# Rebel Ranch Academy — ChatGPT ↔ Claude Visual Handoff Contract

**Status:** Owner-approved working contract; supervised phase (see Section 7)
**Effective:** 2026-09-14
**Program:** Rebel Ranch Academy (RRA)

## 1. Purpose

This document is the single real, shared contract between two independent agents — a ChatGPT Scheduled Task (image generation) and Claude (research, product design, and independent verification) — that hand work to each other only through Supabase.

It exists because two earlier things went wrong and must not happen a third time:

1. **Schema forking.** Twice in one session (2026-09-14), a backend field/state model was reinvented by a different worker instead of reusing the real one already live (`workflow_stage` vs `current_status`; four RPCs that existed live but were never committed to GitHub). While designing this handoff, it happened a third time in the design conversation itself — ChatGPT independently proposed `READY_FOR_IMAGE` for a state that already exists as `READY_FOR_CHATGPT`. This document is the fix: **one real schema, named here, used by both agents.** Do not invent a parallel one.
2. **Unverified automation being trusted as verified.** The prior "automated" Visual Production path referenced GitHub and Supabase in its prompts and appeared to run, but there was never proof that native image generation was reliably invoked inside that same unattended run, and no structured record of what was actually checked. This contract requires **structured, data-based proof at every step** — never a bare pass/fail assertion.

## 2. The real, shared table

Everything both agents read and write is this one table. Do not create a second table or a differently-named set of columns for this purpose.

`public.academy_visual_production_jobs` (Supabase project `dfrwxpuojeiykaignyny`)

| Column | Who writes it | Purpose |
|---|---|---|
| `project_id`, `asset_key` | Claude (at brief time) | Identifies the exact project and exact image assignment. |
| `state` | Both, per Section 3 | The real, only state machine. See allowed values below. |
| `approved_brief_path` | Claude | Path to the full human-readable brief (`visual-production-brief.md`) — background context, not the operational contract. |
| `destination_path` | Claude | Exact repository path the final image file belongs at. |
| `prompt_text` | Claude | The exact generation prompt. ChatGPT should use this, not re-derive its own from the brief file. |
| `must_include` | Claude | JSON array of specific, checkable required content. |
| `must_avoid` | Claude | JSON array of specific prohibited shortcuts/inventions. |
| `aspect_ratio` | Claude | Required dimensions/legibility constraint. |
| `generation_provider`, `image_width`, `image_height`, `image_format` | ChatGPT | Factual metadata about the actual generated file. |
| `generation_self_check` | ChatGPT | See Section 4. Structured, data-based self-observation — never yes/no. |
| `github_commit_sha`, `deployed_url` | Whoever commits/deploys | Where the real file actually landed. |
| `verification_report` | Claude only | See Section 5. Independent re-derivation, never copied from `generation_self_check`. |
| `verification_outcome` | Claude only | `PASS` / `CONFLICT` / `FAIL`. |
| `owner_decision`, `owner_decision_note`, `owner_decision_at` | Owner only | See Section 6. Required before a `CONFLICT`/`FAIL` row may proceed or retry. |
| `attempt_count`, `last_error` | Whoever fails a step | Bounded-retry tracking. |

## 3. The real state machine

```
BRIEF_REQUIRED
→ READY_FOR_CHATGPT        (Claude: brief + prompt_text/must_include/must_avoid ready)
→ CHATGPT_GENERATING       (ChatGPT: claimed the job)
→ GENERATED_PENDING_INSPECTION  (ChatGPT: image exists + generation_self_check written)
→ [Claude independently verifies -- Section 5]
   → READY_FOR_INTEGRATION      (verification_outcome = PASS, clean, no conflict)
   → REVISION_REQUIRED          (verification_outcome = CONFLICT or FAIL -- STOPS, see Section 6)
→ INTEGRATING              (Claude: committing/wiring the accepted asset)
→ DEPLOYED_QA_PENDING      (deployed, full page QA not yet run)
→ VERIFIED                 (exact deployed result passed every applicable gate)

FAILED                     (any step fails outright; last_error records why; does not auto-retry)
```

**Do not use any state name not in this list.** If a name seems missing for something you need to express, that is a sign to re-read this contract, not to invent one.

## 4. What ChatGPT's Scheduled Task must actually do

1. Query `academy_visual_production_jobs` for exactly one row with `state = 'READY_FOR_CHATGPT'`.
2. Update that row to `state = 'CHATGPT_GENERATING'` before starting (claims it, so a second run doesn't duplicate work).
3. Generate the image using `prompt_text` exactly, respecting `must_include` and `must_avoid` exactly.
4. **Look at the actual image you just produced** (not your intention, the real output) and write `generation_self_check` as structured data — specific observations, not a verdict. Example shape:
   ```json
   {
     "observed_labels": ["Perceive", "Use", "Understand", "Manage"],
     "observed_dimensions": "1024x768",
     "layout_description": "four connected circular nodes arranged in a ring, each with an icon and the label beneath it",
     "self_flagged_concerns": []
   }
   ```
   Not acceptable: `{"looks correct": true}`.
5. Save the real binary at `destination_path`; if your task has real GitHub write access to this repository, commit it there and record `github_commit_sha`. If it does not, leave the file wherever you can and say so in `last_error`/a note — do not claim a commit that didn't happen.
6. Set `state = 'GENERATED_PENDING_INSPECTION'`. Stop. Do not proceed to integration, deployment, or marking anything approved — that is never this agent's job.

## 5. What Claude does on pickup — independent verification

On a scheduled wake, Claude queries for rows in `GENERATED_PENDING_INSPECTION`.

**Before reading `generation_self_check`**, Claude opens the actual committed/saved image file and independently re-derives every item in `must_include` and `must_avoid` against the real pixels — what labels are actually visible, whether a prohibited element was added, whether legibility/accessibility requirements hold. This produces `verification_report`, in the same structured-data style as Section 4 — real observations, not a verdict copied from the generator.

Only after `verification_report` is written does Claude compare it against `generation_self_check`:

- Both independently confirm the required content, nothing prohibited was found, and legibility holds → `verification_outcome = 'PASS'`, `state = 'READY_FOR_INTEGRATION'`. Claude proceeds with integration/deployment automatically — no owner click needed for a clean pass.
- They disagree on something specific, or Claude's independent read fails a requirement outright → `verification_outcome = 'CONFLICT'` or `'FAIL'`, `state = 'REVISION_REQUIRED'`. **Stop. Do not regenerate. Do not retry. Go to Section 6.**

## 6. Owner decision on conflict/fail — no automatic retry

This is the rule the owner set explicitly, and it overrides any instinct an agent has to "just try again":

> A `CONFLICT` or `FAIL` never triggers another generation attempt by itself. This is a new, unproven system; an unsupervised generate-fail-retry loop risks the exact "system claims progress it isn't making" pattern that caused the original automation suspension. A disagreement can also just mean two systems used different words for the same thing rather than a real defect — that must be resolved by a person, not assumed either way.

A `REVISION_REQUIRED` row with no `owner_decision` set must appear in the owner's action queue (Section 8) with both `generation_self_check` and `verification_report` shown side by side, plus the specific point of disagreement named — not a summary, the actual specifics.

The owner chooses exactly one:

- **`OVERRIDE_PROCEED`** — the flagged issue is not a real defect (e.g., a wording/vocabulary mismatch, not a content problem). Row proceeds to `READY_FOR_INTEGRATION` despite the conflict, with the owner's reasoning preserved in `owner_decision_note`.
- **`AUTHORIZE_RETRY`** — it's a real defect. Exactly one new generation attempt is authorized; the row resets to `READY_FOR_CHATGPT`, `attempt_count` increments, and the previous `generation_self_check`/`verification_report`/`verification_outcome` are preserved in history (do not silently erase them).
- **`FIX_CHECKER`** — Claude's verification logic was wrong, not the image. Routes to correcting the verification check itself, not regenerating the image. The row stays parked until that's done.

Each owner decision is itself evidence for whether the automated verification is calibrated well enough to eventually run with less supervision (see Section 7). Do not discard the record of past decisions.

## 7. Current phase: supervised, not autonomous

As of this contract's effective date, both the `READY_FOR_CHATGPT → CHATGPT_GENERATING` handoff and any `REVISION_REQUIRED` decision require the owner's real-time involvement (a Scheduled Task run they've configured, and a real click for conflicts). This is deliberate, not a limitation to route around.

**Graduation criterion:** once a meaningful run of owner decisions on `CONFLICT`/`FAIL` rows shows the verification logic is well-calibrated (consistently agrees with the owner's own judgment), the owner may authorize loosening this — for example, allowing a bounded number of automatic `AUTHORIZE_RETRY`-equivalent attempts before escalating, rather than every conflict requiring a click. That change requires an explicit owner decision recorded in this file's revision history, not an agent's own judgment that "it's probably fine now."

## 8. Action-queue requirement

The owner's action queue (`operations-review.html`, action-inbox) must surface, without the owner needing to know to look:

- Any row in `state = 'READY_FOR_CHATGPT'` — "your ChatGPT Scheduled Task needs to run" (or, while unattended running is unproven, "open ChatGPT and run this").
- Any row in `state = 'REVISION_REQUIRED'` with `owner_decision IS NULL` — "verification conflict, your decision needed," linking directly to the comparison view.

A queue that only shows the three content-approval gates and misses this category is exactly the bug that was found and fixed earlier in this session — do not reintroduce it.

## 9. Relationship to other standards

This contract implements, and does not replace:

- `rebel ranch academy/docs/production/ACADEMY-CHATGPT-IMAGE-PRODUCTION-STANDARD.md` — the governing image-verification requirements (factual, brand, text, accessibility).
- `rebel ranch academy/docs/production/ACADEMY-VISUAL-PRODUCTION-AGENT-STANDARD.md` — the broader visual production role and boundaries.
- `rebel ranch academy/systems/automation/content-automation.md` Section 7 (Retry rule) — this contract's no-auto-retry-on-conflict rule is a stricter, concrete application of that existing principle, not a new one.

AI-Agent: Claude (Claude Code)
Session: RRA pipeline reactivation verification, owner-directed, 2026-09-14
