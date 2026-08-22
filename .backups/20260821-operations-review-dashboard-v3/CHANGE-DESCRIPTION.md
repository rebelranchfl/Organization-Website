# Operations Review Dashboard v3 — Intended Change

Date: 2026-08-21
AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Operations Review dashboard v3

Owner approved converting the accepted Operations Review visual concept into the real owner dashboard.

## Scope
- Preserve existing Operations Review auth, owner-review, inline-edit, source-review and project-detail logic.
- Add a real owner-facing dashboard shell modeled on the approved concept.
- Add left navigation, live KPI strip, Opportunity Intelligence network summary, Audience + Conversion pathway summary, active projects, agent activity, and owner-attention summary.
- Use live Supabase data already present in the Academy control plane.
- Reuse the official Rebel Ranch Ministries logo asset; do not invent a new mark.
- Keep the existing detailed project queue/review interface available as the Projects workspace.
- Preserve the readability layer and existing intelligence modules.
- Do not alter database schema, workflow gates, approvals, product data, pricing, publishing or release behavior.

## Existing file to modify
- `assets/js/supabase-client.js` — load the new dashboard shell module on Operations Review.

## New files
- `assets/css/operations-review-dashboard-v3.css`
- `assets/js/operations-review-dashboard-v3.js`

## Safety copy
- Exact pre-change copy of `assets/js/supabase-client.js` stored beside this record.
