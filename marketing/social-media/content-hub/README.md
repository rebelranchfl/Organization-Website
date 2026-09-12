# Rebel Ranch Ministries Social Content Hub

## Purpose

This is the working dashboard for organizing social-media content across Rebel Ranch Ministries programs without relying on chat history to remember what each image was created for.

V1 begins with the August 2026 Rebel Ranch Local launch campaign and is intentionally isolated from concurrent Rebel Ranch Academy work.

## V1 workflow

Each content record includes:
- asset ID and campaign day;
- program;
- audience;
- primary marketing job;
- intended format;
- visual status;
- why the asset exists;
- core message;
- post / reel context;
- primary CTA;
- approval / posted status;
- working notes;
- optional reel-builder placement.

The page supports:
- filters by program, audience, status and format;
- keyword search;
- caption copying;
- editing caption/context, CTA, notes and status;
- approving content;
- marking content posted;
- selecting frames into a reel queue and preserving frame order.

## Storage in V1

V1 stores owner edits, statuses, notes and the reel queue in browser `localStorage`. This is deliberate for the first workflow test: it adds no database schema and does not interfere with Academy/Supabase work occurring in parallel.

Limitations:
- edits are saved only in the browser/device where they were made;
- clearing browser storage clears those working edits;
- V1 is not yet a cross-device shared workspace;
- V1 does not publish to Facebook, Canva or another social platform.

## Planned next phase after owner validates V1

1. Create a dedicated Supabase content table with RLS/admin-only write access.
2. Move content records, approval status, captions, reel sequences and posting history into shared persistent storage.
3. Add actual repo image links as final visuals are approved and placed.
4. Add real website/app screenshots for seller onboarding, buyer onboarding and proof reels.
5. Add other programs using the same content-record model: Rebel Ranch Academy, Creation Station, Business Freedom and RRM General.
6. Add account-dashboard access through the existing admin-only injection pattern only after owner approval.
7. Consider publishing integrations separately; no automated publishing is authorized by this V1.

## Current route

Branch preview source:
`marketing/social-media/content-hub/index.html`

The page is intentionally not linked from public navigation or the account dashboard yet.

## Related Marketplace records

- `../rebel-ranch-marketplace/README.md`
- `../rebel-ranch-marketplace/campaigns/2026-08-launch/CONTENT-MAP.md`
- `../rebel-ranch-marketplace/campaigns/2026-08-launch/visuals/README.md`

AI-Agent: ChatGPT/GPT-5.6 Sol  
Session: Rebel Ranch Marketplace — Social Content Hub
