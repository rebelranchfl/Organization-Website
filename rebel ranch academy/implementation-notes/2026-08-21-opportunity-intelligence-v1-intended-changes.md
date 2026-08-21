# Academy Opportunity Intelligence System v1 — Intended Changes

**Date:** 2026-08-21
**Owner authorization:** Explicitly approved in chat.
**AI-Agent:** ChatGPT/GPT-5.6 Sol
**Session:** RR Website — Academy Opportunity Intelligence v1

## Purpose
Turn opportunity discoveries already produced by Academy Research/Product Design into structured, scored, connected decision data instead of leaving them buried in Markdown.

## Authorized scope
1. Add a Supabase opportunity data model and relationship model.
2. Seed Water (`RRA-2026-0001`) with initial opportunity candidates derived from existing approved Academy opportunity work.
3. Add an Operations Review Opportunity Intelligence dashboard module that renders a true network/decision view, not a simple sequence.
4. Add owner-facing states: PURSUE_NOW, PURSUE_LATER, INCORPORATE_BUNDLE, FREE_RESOURCE, MONITOR, NOT_RECOMMENDED_OWNER_REVIEW, CLOSED_OWNER.
5. Add fast screening data for mission value, audience demand, marketability, implementation value, evidence readiness, cross-Academy value, production effort, overlap/redundancy, confidence, total score and recommendation.
6. Preserve owner authority: agents recommend; owner decides final disposition, especially before permanently closing a not-recommended opportunity.
7. Update Research and Product Design automation instructions so substantial discoveries create/update structured opportunities and strong opportunities can be spun into the Academy queue without waiting for the parent product to finish, while respecting owner gates.

## Existing file to change
- `assets/js/supabase-client.js` — load the new Opportunity Intelligence module on Operations Review only.

## New files
- `assets/js/operations-review-opportunity-intelligence.js`
- `rebel ranch academy/ACADEMY-OPPORTUNITY-INTELLIGENCE-STANDARD.md`
- `supabase/migrations/2026082122xxxx_academy_opportunity_intelligence_v1.sql` (exact migration timestamp assigned during implementation)

## Preservation boundaries
- Do not replace or remove the current lifecycle Kanban, Quick Visuals, revision review, owner inline edit, queue override, or approval controls.
- Do not change Water's current research/product approval state except through the existing stage-aware workflow.
- Do not publish, sell, release, or establish public pricing.
- Do not let an agent silently kill an opportunity; low-value recommendations remain available for owner disposition.
- Do not merge program identities. Cross-program relationships are pathways/knowledge connections, not brand or organizational mergers.
