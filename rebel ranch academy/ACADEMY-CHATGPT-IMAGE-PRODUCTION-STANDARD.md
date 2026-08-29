# Rebel Ranch Academy — Personal ChatGPT Image Production Standard

**Owner model:** Personal ChatGPT; no Workspace Agent and no separately billed Image API  
**AI-Agent:** ChatGPT/Codex  
**Session:** Water Ops Dashboard and Supabase recovery  
**Effective:** 2026-08-29

## Purpose

Supabase is the Academy control center. It records the approved visual assignment and the true state of the work. It does not claim to generate an image and it does not claim an agent is running merely because an assignment exists.

The built-in ChatGPT image generator can be used only while an owner-started personal ChatGPT conversation is active. The active ChatGPT agent performs the image-generation handoff and records its durable result in GitHub and Supabase.

## Required state sequence

1. `NOT_REQUIRED` — the approved product does not require generated raster artwork.
2. `BRIEF_REQUIRED` — Product Design has not supplied a complete image assignment.
3. `READY_FOR_CHATGPT` — an approved prompt/brief and destination are ready; no agent is running.
4. `CHATGPT_GENERATING` — an active ChatGPT conversation has claimed the assignment.
5. `GENERATED_PENDING_INSPECTION` — an image exists but has not passed visual inspection.
6. `REVISION_REQUIRED` — the image has a visible factual, composition, labeling, or quality defect.
7. `READY_FOR_INTEGRATION` — the inspected binary image is stored at its approved GitHub destination.
8. `INTEGRATING` — the GitHub worker is integrating the accepted asset.
9. `DEPLOYED_QA_PENDING` — integration is deployed but full browser QA is incomplete.
10. `VERIFIED` — the exact deployed image and learner route passed the required checks.
11. `FAILED` — the current attempt failed; the recorded error and retry point are required.

Only `CHATGPT_GENERATING` and `INTEGRATING` describe active work. `READY_FOR_CHATGPT` must never display as “Agent working.”

## Required image assignment

Every generated visual requires project ID, authorized stage, educational purpose, physical relationships, evidence and safety boundaries, prohibited shortcuts, dimensions, GitHub destination, labeling plan, inspection checklist, and integration/deployed-QA checklist.

## Personal ChatGPT handoff

The owner starts a ChatGPT Visual Production conversation. The agent must read Supabase and GitHub, claim only a ready assignment, generate and inspect the image, revise visible defects, save a real repository image file, update the manifest, dispatch integration, and record the exact failed step if anything fails.

The owner is not required to download, rename, move, or upload the generated file.

## Verification gate

`VERIFIED` requires a valid binary, working direct image URL, working wrapper and learner page, working nested resources, desktop/mobile inspection, no clipping or overflow, correct educational content, and agreement among Supabase, GitHub, deployment, and dashboard.

Until every requirement passes, the project stays in Visual Production and no “fixed,” “complete,” or “ready for owner review” status is allowed.
