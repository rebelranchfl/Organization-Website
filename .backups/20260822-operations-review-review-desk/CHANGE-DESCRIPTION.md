# Operations Review Review-Desk Cleanup — Intended Change

**Date:** 2026-08-22
**AI-Agent:** ChatGPT/GPT-5.6 Sol
**Session:** RR Website — Operations Review review desk

## Owner feedback
The project-detail view contains valuable data but is too tall and too narrow. The project queue consumes horizontal space, intelligence modules split the remaining area into narrow columns, and long signal lists make the browser page require excessive scrolling.

## Intended change
- Preserve all existing project data, controls, reviews, workflows and intelligence records.
- Move the project queue into a compact horizontal selector above the selected project.
- Give the selected project detail the full available workspace width.
- Make Audience Intelligence use a readable wide layout.
- Keep long signal collections inside their own bounded, scrollable review area rather than extending the entire browser page.
- Keep pathway content full-width and readable.
- Preserve responsive/mobile behavior.
- Do not modify Supabase, workflow stages, scoring, owner decisions, automation behavior, pricing, publishing or release behavior.

## Existing file
- `assets/css/operations-review-dashboard-v3.css`

## Safety
Presentation-only owner-review cleanup.