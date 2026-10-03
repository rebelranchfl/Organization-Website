# Intended Change — Rebel Ranch Social Content Hub V1

AI-Agent: ChatGPT/GPT-5.6 Sol  
Session: Rebel Ranch Marketplace — Social Content Hub

Owner authorized creation of a separate working dashboard/app for organizing Rebel Ranch Ministries social-media content while other agents continue Academy work.

Scope:
- create an isolated social-content-hub workspace under `marketing/social-media/content-hub/`;
- seed the current Rebel Ranch Local / Marketplace two-week launch plan into the dashboard;
- show each content item with image/asset state, context, audience, purpose, caption, CTA, status and reel assignment;
- support local browser-side editing, approval state, reel selection, caption copying and posted tracking for V1;
- preserve existing Marketplace campaign files and all Academy files unchanged;
- do not add public navigation, database schema changes, automated posting, Canva publishing, Facebook publishing or deployment-specific configuration in V1.

Safety / collaboration:
- work is isolated on branch `rrm-social-content-hub-v1` to avoid collisions with concurrent Rebel Ranch Academy agents;
- no existing files are being modified in this change set;
- no public account-dashboard link is added yet;
- persistent cross-device/database storage remains a later phase and requires a separately scoped Supabase change.
