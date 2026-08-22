# Intended Change — Run Agent Now v1

Date: 2026-08-22
AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Run Agent Now v1

Owner-authorized scope:
- add an admin-only Academy manual-run request queue;
- add a visible Run Agent Now control to Operations Review / Academy Stage Review for supported active build stages;
- add owner-readable run status;
- add a GitHub Actions worker that checks queued requests about every five minutes and runs the approved current-stage worker using OpenAI Codex;
- preserve all existing owner gates, holds, workflow-stage ownership, evidence/safety boundaries, and release restrictions.

V1 execution scope is deliberately narrow: PRODUCT_WORKING and VISUAL_PRODUCTION. Research-heavy and release stages remain on the existing scheduled workers until a later runner adds the required live research/release capabilities.

No public publishing, selling, pricing activation, release authorization, or owner-review bypass is authorized by this feature.
