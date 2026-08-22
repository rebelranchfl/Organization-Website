# RRA-2026-0003 — Interactive Scenario Map

**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RRA Product Design Agent

## Core interaction

The learner may start from either a prebuilt scenario or a real low-risk claim/decision. The tool must avoid presenting itself as an automated truth detector.

## Inputs

- `scenario_domain[]` — family, social media, purchase/money, work/business, school/learning, community/news;
- `claim_text` — controlled length; optional for prebuilt scenarios;
- `claim_layers[]` — factual, inference, value, prediction, recommendation, mixed;
- `evidence_items[]` — direct observation/record, primary/direct source, near-primary, secondary, copied/repeated, unknown;
- `source_independence[]` — independent, same-origin/repeated, unclear;
- `contrary_evidence_present` — yes/no/not looked;
- `assumptions[]` — learner-created short entries;
- `social_pressure[]` — information, belonging, norm, value-weighting, none/unknown;
- `private_public_gap` — same/different/not relevant;
- `what_would_change_mind[]` — strengthen, weaken, reverse, not yet known;
- `confidence_state` — learner chooses after review;
- `cost_of_error` — low/moderate/high/unclear;
- `next_action[]` — act/share, verify more, wait, ask source, compare, test/measure, revise conclusion.

Multiple selections are allowed where real conditions coexist. Do not force one social-pressure pathway, one claim layer or one evidence item.

## Branch logic

### Mixed claim

If multiple claim layers are selected, the tool creates separate rows so each layer can have its own evidence/confidence state.

### Repeated-source branch

If several items share one origin, the source map visually collapses them into one evidence root and explains: `Repeated does not mean independently corroborated.`

### Value-judgment branch

If a value layer exists, the tool separates factual consequence questions from the value/priority decision. It must not output `true/false` for the value itself.

### Social-influence branch

If any social pressure is selected, show the four approved pathways and ask what changed: evidence, interpretation, confidence, preference, or public willingness. Do not imply that influence proves the learner is wrong.

### High cost-of-error branch

If error cost is high, the next-action panel emphasizes verification/professional/primary evidence where applicable, without inventing a regulated-service recommendation.

## Output — My Decision Record

The visible output should update as inputs change:

- **What I am actually looking at** — claim layers;
- **What I know** — strongest current evidence;
- **What is still assumption/inference**;
- **Where the evidence came from** — source roots and copies;
- **What pushes on my judgment** — social-pressure pathways;
- **What would change my mind**;
- **My current confidence**;
- **What I am doing next**;
- **What remains unresolved**;
- **Last updated**.

## Practice mode

Prebuilt scenarios should include answer/reasoning keys only where the underlying factual structure is deliberately defined. Practice should progress from obvious classification to mixed claims and social-pressure situations.

## Navigation/state requirement

`Why?`, `Show me the research`, `See an example`, and `Technical terms` must open inline or return to the same step. All learner answers survive those depth routes. Changing earlier claim layers must update the Decision Record without deleting unrelated evidence entries.