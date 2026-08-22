# Intended Changes — Academy Stage Review Owner Experience

Date: 2026-08-22

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Stage Review owner experience

Owner direction: The dedicated Academy Stage Review page must provide the same owner-first Research Review experience as Operations Review. The actual research is primary; returned revisions default to a green/red change review; sources/evidence are directly accessible; owner can highlight current text to replace/delete; raw markdown and agent paperwork remain available but are collapsed as Advanced / Stage Records.

Authorized existing file change:
- `academy-stage-review.html`: load a dedicated owner-review enhancement module after the existing Stage Review module.

New file:
- `assets/js/academy-stage-review-owner-experience.js`: owner-facing Research Review layer for the dedicated Stage Review page. It does not change lifecycle decisions, research content, RLS/auth, release controls, agent schedules, or project status.
