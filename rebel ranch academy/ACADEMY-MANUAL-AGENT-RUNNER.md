# Rebel Ranch Academy — Manual Agent Runner

**Status:** Owner-approved V1 implementation  
**Date:** 2026-08-22  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RR Website — Run Agent Now v1

## Purpose

`Run Agent Now` exists to reduce testing/build delay. The normal Academy workers remain scheduled, but the owner can request an additional current-stage work cycle instead of waiting for the next hourly pickup.

The owner manages decisions. The system manages work.

## V1 supported stages

The V1 GitHub/Codex runner is intentionally limited to repository-focused build stages:

- `PRODUCT_WORKING` → RRA Product Design Agent
- `VISUAL_PRODUCTION` → RRA Visual Production Agent

Research-heavy stages, Product Opportunity Research, owner review gates, release preparation, publishing and Live are not manual-run stages in V1.

The dashboard must say when a stage is not supported instead of pretending the button can run it.

## Execution flow

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

The 5-minute check is a pickup interval, not a work-duration limit. Once claimed, the worker continues through as much safe current-stage work as practical during that execution.

## Collision rule

The normal scheduled Product Design and Visual Production workers must query `academy_agent_run_requests` before touching a project.

If a request for that project is `PENDING` or `RUNNING`, the scheduled worker skips it until the manual request becomes `COMPLETED`, `FAILED`, or `CANCELLED`.

This prevents the manual and scheduled workers from intentionally working the same project at the same time.

Git push/rebase protection remains a final defense if another actor changes the same files during an active run.

## Owner gates do not change

Run Agent Now does not authorize:

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

The runner may move a genuinely complete Product Working package to `PRODUCT_REVIEW` or a genuinely complete Visual Production package to `FINAL_PRODUCT_REVIEW`. It must then stop for the owner.

## Visual Production limitation

The GitHub/Codex V1 runner is strong at repository-native production: HTML, CSS, JavaScript, SVG/illustration, diagrams, interactions, copy, print layouts, manifests, review navigation and QA records.

It is not a substitute for ChatGPT-native image generation. If the approved learner experience still requires generated raster/photographic artwork that the runner cannot responsibly create, that requirement remains open for the normal Visual Production worker. The manual runner must not mark Final Product Review ready merely to hide a missing required visual.

## Required GitHub Actions secrets

The workflow requires two server-side GitHub Actions secrets:

- `OPENAI_API_KEY` — project API key used by the official `openai/codex-action`.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only Supabase credential used by the trusted GitHub runner to claim/finalize run requests and synchronize owner-facing progress.

Neither secret may appear in browser JavaScript, repository files, logs, owner comments, or product content.

Until both are configured, `academy_agent_runner_state.ready` remains false and Operations Review keeps the Run Agent Now button disabled. The normal scheduled Academy workers continue unaffected.

## Security boundaries

- The owner creates requests through `request_academy_agent_run`, which requires `private.is_admin()`.
- RLS protects manual-run request/status rows from non-admin authenticated users.
- The runner uses a service role only inside GitHub Actions.
- Codex receives the OpenAI key through the official action's secret-handling path.
- Repository writes are limited by post-run scope validation to the authorized project folder and required backup records.
- Manual runs cannot target owner holds, review gates, release stages, unrelated projects, or unsupported stages.
- If a lifecycle transition is outside the narrow allowed V1 transition, finalization fails rather than applying it.

## Runner health

`academy_agent_runner_state` is the owner-facing heartbeat.

The button is enabled only when:

- runner reports ready;
- the heartbeat is recent;
- the current stage is supported;
- project status is `AGENT_WORKING`;
- project is not on hold;
- no manual request is already Pending or Running.

## Future versions

Potential later expansion may add:

- research-capable manual runs with approved live-source tooling;
- Product Opportunity Research manual execution;
- native image-generation orchestration for Visual Production;
- richer live logs/progress;
- safe cancellation/retry controls;
- Audience Intelligence manual runs;
- a separately governed release worker.

Future capability does not weaken existing owner gates.
