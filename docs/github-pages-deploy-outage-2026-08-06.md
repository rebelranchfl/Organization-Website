# GitHub Pages Deploy Outage — 2026-08-06/07

**Status:** HISTORICAL INCIDENT RECORD — NOT CURRENT DEPLOYMENT AUTHORITY  
**AI-Agent:** Claude Code  
**Original session:** Creation Station dashboard access + site-wide deploy fix (2026-08-07)  
**Shared-system reference:** `docs/shared-systems-operations.md`

## Use of this document

This file preserves a verified historical deployment incident and the lesson learned from it.

Do **not** use this incident record as proof of the repository's current main-site hosting or deployment architecture. Before changing or troubleshooting current deployment, verify the active hosting/deployment path from current infrastructure/configuration.

The repository now also contains a separate current RRA deployment workflow using Cloudflare Wrangler for the Academy Program Hub. That RRA workflow is program-specific and does not prove the current host of the main RRM site.

## What happened at the time

GitHub Pages (`build_type: legacy`, source `main` branch, custom domain `rebelranchministries.org`) stopped successfully building the site after commit `474474d` ("Add site-wide sign-in/out access and admin seller pause/archive", pushed 2026-08-06 14:10 local time).

Recorded build history:

| Commit | Status | Created |
|---|---|---|
| `84d8972d` | built | 2026-08-06 15:30 UTC — last known-good deploy in this incident |
| `474474d8` | errored — "Page build failed." | 2026-08-06 18:10 UTC |
| `474474d8` | building, never completed | 2026-08-06 20:09 UTC |

At that time, later commits existed in GitHub but were not reaching the served site. The visible symptom was that the expected sign-in/account link was absent from the live Marketplace page because the browser was still receiving the pre-outage build.

This incident was separate from Supabase production database state. Direct Supabase changes were not dependent on the static GitHub Pages build.

## Root cause recorded at the time

No `.nojekyll` file existed at the repository root and no `_config.yml` was present. The site was hand-built static HTML/CSS/JS rather than a Jekyll site, but GitHub Pages still routed deployment through Jekyll by default.

The legacy Pages API exposed only the generic `Page build failed` message, so the exact file/pattern that triggered Jekyll was not identified from the available API output.

## Historical fix

An empty `.nojekyll` file was added to the repository root so GitHub Pages would bypass the Jekyll build step and serve the static files directly.

That file still exists in the repository. Its presence is historical/current repository state; it is **not by itself proof that GitHub Pages is still the active main-site host.**

## Verification procedure used for this incident

The incident procedure required:

1. verifying the GitHub Pages build for the new commit reached `built`; and
2. spot-checking the actual public Marketplace page for the user-facing feature that had previously failed to deploy.

The lasting lesson is still valid regardless of host:

**A GitHub commit is not proof that a website change is live. Verify the actual deployment and the exact affected user path end to end.**

## Archive classification

During physical repository reorganization, this file belongs in shared-system deployment **history / incidents**, not active deployment instructions. Check references before moving or renaming it.