# Academy Owner Controls + Visual Dashboard — Change Description

Date: 2026-08-21  
AI-Agent: ChatGPT/GPT-5.6 Sol

## Modified existing file
- `assets/js/supabase-client.js`
- Immutable pre-change blob: `e1ecc5d7ac7f0bcccf3a64681826b18120f8c02b`

## New files
- `assets/js/operations-review-owner-controls.js`
- `rebel ranch academy/ACADEMY-OWNER-CONTROL-STANDARD.md`
- `supabase/migrations/20260821190443_academy_owner_queue_and_inline_edits.sql`
- `supabase/migrations/20260821190722_academy_owner_edit_agent_note.sql`

## Intended changes
1. Treat `workflow_stage` as the authoritative owner-facing gate even when later-stage files already exist.
2. Add lifecycle Kanban visualization.
3. Add owner priority controls: Normal, High, Immediate, Move to Top, Hold/Resume, optional queue note.
4. Add tracked Owner Quick Edit workflow for highlighted words/sentences.
5. Add owner-facing Scorecard, Funnel and Pricing quick visuals.
6. Add authoritative stage-aware owner decision controls when the base page inference is stale.
7. Persist queue/edit schema and admin-only RPC controls in Supabase.
8. Preserve existing revision-diff and approval-reversal functionality.

## Safety / release boundary
- No Academy product is published or released by this change.
- Immediate priority does not bypass review or release gates.
- Owner edits that materially change factual/safety/evidence claims remain subject to evidence verification before permanent application.
