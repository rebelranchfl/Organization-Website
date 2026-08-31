# Water navigation return hardening — pre-change scope

**Project:** RRA-2026-0001 — Water Through the Layers  
**Stage:** VISUAL_PRODUCTION  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RRA Visual Production Agent

## Authorized change

Harden the learner-facing `Back to where I was` behavior on the two deeper Water visual pages so the control only uses browser history when the learner actually arrived from `water-learning-experience-final.html` on the same origin. Otherwise the existing explicit fallback href returns to the Water evidence section.

This prevents an unrelated prior browser-history entry from being treated as the learner's Water return location while preserving exact browser-history return when the deeper page was opened from the Water release candidate.

## Files to change

- `visual-production/water-system-visual-preview.html`
- `visual-production/water-system-implementation-visuals.html`

Exact pre-change copies are stored beside this scope record before either source file is edited.

No research, product architecture, learner copy, evidence boundaries, diagrams, pricing, release state, or public deployment is authorized by this change.
