# RRA-2026-0003 — Integrated Learner Flow

**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RRA Product Design Agent

## Entry

Learner chooses:
- quick free claim sorter; or
- full Think It Through workflow.

They may begin with a prebuilt scenario or a real low-risk claim/decision.

## Full flow

1. **What are you actually looking at?** — plain example; split one mixed statement visually.
2. **Two labels, not one** — claim type and evidence strength are separate.
3. **SORT** — learner creates all relevant claim layers.
4. **SOURCE** — learner adds evidence/source items and marks whether they are independent or repeated.
5. **See the echo** — source map shows repeated items sharing one root.
6. **STRESS TEST** — strengthen/weaken/reverse, alternative explanation, same-standard test.
7. **Check your side too** — Bias Mirror.
8. **The room around the decision** — multi-select social-pressure pathways; public/private distinction if relevant.
9. **DECIDE** — confidence + cost of error + next action.
10. **My Decision Record** — living personalized output.
11. **Practice** — learner chooses at least one scenario/activity.
12. **TRANSFER THE PRINCIPLE** — run a second short example in another domain.

## Depth controls

At any step learner may open:
- Why?
- Show me the research
- Technical terms
- See an example
- Sources

Depth is optional. Returning from depth restores the exact step and all answers.

## State contract

Persist at minimum:
- active scenario;
- claim text/layers;
- evidence/source items;
- source independence relationships;
- assumptions;
- stress-test entries;
- social-pressure selections;
- confidence/cost-of-error;
- next action;
- Decision Record state.

Changing an earlier claim layer must update dependent displays without deleting unrelated source notes. Changing source-independence relationships must update the echo visualization and Decision Record.

## Human-facing progress

Use task/result names, not internal system stages:

`Break it apart → Trace it → Challenge it → Check the pressure → Decide → Keep the record`

These progress labels may be clickable controls only if they actually navigate. Do not render non-clickable labels as pill buttons.

## Completion

Completion means the learner has a usable Decision Record and can explain the reasoning path. It does not mean the system certifies the underlying claim as objectively true.