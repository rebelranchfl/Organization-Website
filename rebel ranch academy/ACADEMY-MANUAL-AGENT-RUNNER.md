# Rebel Ranch Academy — Manual Agent Runner

**Status:** DORMANT / DISABLED BY OWNER DIRECTION  
**Original implementation date:** 2026-08-22  
**Disabled:** 2026-08-22  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Original session:** RR Website — Run Agent Now v1

## Current state — authoritative

`Run Agent Now` is **not an active Academy capability**.

The owner explicitly chose not to use the separate OpenAI API execution path because it would create additional API fees beyond the normal ChatGPT-based Academy workflow.

Current operating rules:

- no Run Agent Now control should be presented as available to the owner;
- the GitHub Actions runner is hard-disabled and does not poll or execute manual requests;
- `academy_agent_run_requests` and `academy_agent_runner_state` are dormant preserved infrastructure, not active work queues;
- normal scheduled Academy agents remain the active background execution system;
- no OpenAI API key should be added or manual runner re-enabled without a new explicit owner decision made with the separate billing path understood;
- dormant runner code is preserved only for possible future reuse and historical traceability.

This current-state section overrides the historical V1 implementation description below wherever the two conflict.

The owner manages decisions. The system manages work.

---

# Historical V1 design — preserved for reference only

The sections below document how the former V1 manual runner was designed. They are **not instructions to enable or operate it today**.

## Former purpose

`Run Agent Now` was designed to reduce testing/build delay by allowing the owner to request an additional current-stage work cycle instead of waiting for the next hourly pickup.

## Former V1 supported stages

The V1 GitHub/Codex runner was intentionally limited to repository-focused build stages:

- `PRODUCT_WORKING` → RRA Product Design Agent
- `VISUAL_PRODUCTION` → RRA Visual Production Agent

Research-heavy stages, Product Opportunity Research, owner review gates, release preparation, publishing and Live were not manual-run stages in V1.

Any future reactivation must still say when a stage is unsupported instead of pretending the runner can execute it.

## Historical execution flow

```text
Owner clicks Run Current Stage Now
→ admin-only Supabase RPC validates project/stage/hold/runner health
→ academy_agent_run_requests = PENDING
→ GitHub Actions runner checks about every 5 minutes
→ request becomes RUNNING
→ current main is checked out
→ live project context + pending stage feedback are captured
→ OpenAI Codex performs one substantial current-stage work cycle
→ scope validation blocks unrelated repository edits
→ durable work is committed to main
→ allowed owner-facing project progress fields are synced to Supabase
→ request becomes COMPLETED or FAILED
→ Operations Review displays the result
```

This flow is dormant. The current GitHub workflow does not perform these steps.

The former 5-minute check was a pickup interval, not a work-duration limit. Once claimed, the worker would continue through as much safe current-stage work as practical during that execution.

## Historical collision rule

The V1 design required normal scheduled Product Design and Visual Production workers to query `academy_agent_run_requests` before touching a project.

If a request for that project was `PENDING` or `RUNNING`, the scheduled worker would skip it until the manual request became `COMPLETED`, `FAILED`, or `CANCELLED`.

Because the manual runner is disabled, no new manual request should enter an active Pending or Running state during normal Academy operation.

Git push/rebase protection was intended as a final defense if another actor changed the same files during an active run.

## Owner gates do not change

Even if the manual runner is ever reactivated, it does not authorize:

- Research Review approval;
- Product Review approval;
- Final Product Review approval;
- release preparation decisions;
- publishing;
- selling;
- public pricing;
- storefront activation;
- affiliate links;
- public promotion;
- deployment of a product merely because production work finished.

The historical runner could move a genuinely complete Product Working package to `PRODUCT_REVIEW` or a genuinely complete Visual Production package to `FINAL_PRODUCT_REVIEW`. It then had to stop for the owner.

## Historical Visual Production limitation

The GitHub/Codex V1 runner was designed for repository-native production: HTML, CSS, JavaScript, SVG/illustration, diagrams, interactions, copy, print layouts, manifests, review navigation and QA records.

It was not a substitute for ChatGPT-native image generation. If an approved learner experience required generated raster/photographic artwork that the runner could not responsibly create, that requirement remained open for the normal Visual Production worker. The manual runner was not allowed to mark Final Product Review ready merely to hide a missing required visual.

## Historical server-secret requirements

The former workflow required two server-side GitHub Actions secrets:

- `OPENAI_API_KEY` — project API key used by the official `openai/codex-action`.
- `SUPABASE_SECRET_KEY` — preferred current Supabase server Secret key (`sb_secret_...`) used only by the trusted GitHub runner to claim/finalize run requests and synchronize owner-facing progress.

Temporary compatibility existed for a legacy `SUPABASE_SERVICE_ROLE_KEY` if the project had not yet created a current Supabase Secret key.

Neither secret may appear in browser JavaScript, repository files, logs, owner comments, or product content.

**Current rule:** do not configure or rely on these runner secrets for Academy execution unless the owner explicitly reauthorizes the separate API-billed manual runner.

## Historical security boundaries

- The owner created requests through `request_academy_agent_run`, which requires `private.is_admin()`.
- RLS protects manual-run request/status rows from non-admin authenticated users.
- The runner used an elevated Supabase server credential only inside GitHub Actions.
- Codex received the OpenAI key through the official action's secret-handling path.
- Repository writes were limited by post-run scope validation to the authorized project folder and required backup records.
- Manual runs could not target owner holds, review gates, release stages, unrelated projects, or unsupported stages.
- If a lifecycle transition was outside the narrow allowed V1 transition, finalization failed rather than applying it.

These protections remain useful historical design requirements if the feature is reconsidered later.

## Historical runner health

`academy_agent_runner_state` was the owner-facing heartbeat.

The historical button would be enabled only when:

- runner reported ready;
- the heartbeat was recent;
- the current stage was supported;
- project status was `AGENT_WORKING`;
- project was not on hold;
- no manual request was already Pending or Running.

**Current state:** the runner is intentionally not ready. The normal scheduled Academy agents continue independently.

## Future reconsideration

Potential future work may reconsider manual execution only if the owner explicitly chooses to reopen the feature and accepts the separate API billing path.

Possible future capabilities could include:

- research-capable manual runs with approved live-source tooling;
- Product Opportunity Research manual execution;
- native image-generation orchestration for Visual Production;
- richer live logs/progress;
- safe cancellation/retry controls;
- Audience Intelligence manual runs;
- a separately governed release worker.

Future capability does not weaken existing owner gates and is not authorized by this historical document.
