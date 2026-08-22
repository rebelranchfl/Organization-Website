# Intended changes — Academy owner usability pass

Scope: owner-only Academy Operations Review and Academy Stage Review usability.

Authorized direction:
- improve layout, visibility, hierarchy, readability, navigation, and ease of use;
- keep the existing dark Academy control-center visual identity;
- make the current owner task and next action visually dominant;
- collapse secondary/system-heavy sections such as Late Findings and raw records until the owner opens them;
- add quick navigation to review content, sources, decision controls, and advanced records;
- improve desktop and mobile spacing/type sizes without changing lifecycle, auth, RLS, research content, product content, release state, pricing, or agent behavior.

Planned files:
- `assets/js/supabase-client.js` — load the shared owner-usability layer on both owner pages.
- `assets/js/academy-owner-usability.js` — shared DOM usability enhancements.
- `assets/css/academy-owner-usability.css` — shared owner-facing layout/readability improvements.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Academy owner usability
