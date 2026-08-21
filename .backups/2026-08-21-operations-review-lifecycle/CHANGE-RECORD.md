# Operations Review Dashboard Upgrade — Change Record

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Academy Operations Review lifecycle upgrade
Date: 2026-08-21

## Target
- `operations-review.html`

## Immutable pre-change backup
- GitHub blob SHA: `b31b0a6774e48cceb33e8806f24e1b1101d05e23`
- Source branch: `main`
- This blob is the exact pre-change file content and is immutable in Git history.

## Intended changes
1. Preserve current admin authentication, idea submission, research-source override, research-review RPC, queue, progress, and health behavior.
2. Add an owner-facing Academy lifecycle display:
   Research Working → Research Review → Product Opportunity → Product Design → Product Review → Visual Production → Final Product Review → Awaiting Release → Publishing → Live.
3. Derive the detailed lifecycle stage from current project progress plus durable GitHub product files so the database schema does not need to change for this display upgrade.
4. Add grouped direct-access project records for research, product opportunity, product development, and visual/release artifacts.
5. Include direct visibility for `product-opportunity-research.md`, `functional-decomposition.md`, `interactive-scenario-map.md`, `opportunity-funnel-map.md`, `product-recommendation-scorecard.md`, `product-architecture.md`, `product-manuscript.md`, `product-qa.md`, product review, visual brief, handoffs, final QA, and release record.
6. Keep Optional Source Overrides clearly optional.
7. Keep the existing research-review submit controls functional.
8. Do NOT connect Product Review or Final Product Review buttons to the legacy research-review RPC. Show those gates as visible but awaiting a stage-aware backend review-event upgrade.
9. Preserve existing RRM colors/components and avoid pill-shaped noninteractive labels.

## Out of scope
- Supabase schema/migration changes.
- Product/Final review RPC changes.
- Automation review-event routing changes.
- Release/deployment.
