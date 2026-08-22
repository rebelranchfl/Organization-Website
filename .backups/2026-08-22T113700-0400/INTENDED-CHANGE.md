# Intended Change — Learner Intelligence Dashboard

**Target:** `assets/js/supabase-client.js`

Add one admin-only Operations Review module import for a new Learner Intelligence dashboard. The new module will read the existing `academy_learner_signals` table through current admin-only RLS and summarize real learner behavior without altering signal collection, project workflow, release controls, or public pages.

The dashboard will show an honest no-data state until real learner events exist and will distinguish Academy-wide learner behavior from the currently selected project's behavior.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Learner Intelligence Dashboard
