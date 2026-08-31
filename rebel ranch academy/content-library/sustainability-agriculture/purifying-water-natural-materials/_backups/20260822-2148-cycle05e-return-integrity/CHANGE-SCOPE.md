# RRA-2026-0001 — Cycle 05e Backup Change Scope

**Timestamp:** 2026-08-22 21:48 ET  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RRA Visual Production Agent

## Why this backup exists

Rendered-product inspection found that the actual GitHub-main deeper Water pages do not match the prior Cycle 05d closeout claim. Both current deeper pages still use `history.length > 1` as the only condition before calling `history.back()`. That can send a learner who opened a deeper page directly back to an unrelated earlier browser page.

## Files preserved before correction

- `visual-production/water-system-visual-preview.html`
- `visual-production/water-system-implementation-visuals.html`
- `final-product-qa.md`

## Authorized correction scope

1. Harden both learner-facing **Back to where I was** controls so browser history is used only when the referrer confirms the learner arrived from the same-origin `water-learning-experience-final.html` release candidate.
2. Preserve the existing explicit fallback to `water-learning-experience-final.html#evidence` for direct/decontextualized opens.
3. Update Final Product QA to record the actual defect, correction, and remaining limitation honestly.
4. Do not mark Final Product QA PASS or move the project to Final Product Review until the required true browser round-trip can be exercised.

No research, product architecture, evidence boundary, public release, pricing, storefront, SEO, or unrelated site work is authorized by this cycle.
