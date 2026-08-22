# Intended changes — Operations Review readability preview

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Operations Review readability preview
Date: 2026-08-21

Authorized scope: improve readability across Operations Review without changing Academy data, workflow, owner controls, review gates, or business logic.

Planned changes:
- add one shared Operations Review readability module loaded only on `operations-review.html`;
- allow long text to wrap instead of clipping or forcing panels wider than the available column;
- make nested grid/flex children shrink safely with `min-width: 0`;
- allow cards and content blocks to grow naturally in height;
- improve paragraph/list line-height and spacing in dense owner-review sections;
- keep intentionally scrollable artifacts/maps/flows scrollable rather than flattening them;
- improve desktop/tablet/mobile behavior without redesigning the dashboard or changing colors/branding;
- preserve existing interactive controls and do not make non-interactive elements look clickable.

Files expected to change:
- `assets/js/supabase-client.js` — load the shared readability layer on Operations Review.
- `assets/js/operations-review-readability.js` — new shared readability/style override module.
