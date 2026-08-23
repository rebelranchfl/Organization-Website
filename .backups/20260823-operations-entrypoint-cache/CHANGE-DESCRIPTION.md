# Intended change

Owner reports Operations Review still hangs on a black center with `Loading live state…` even in a fresh Brave session after loader repairs.

Root issue identified: `operations-review.html` still imports `assets/js/supabase-client.js` through an unversioned module URL, allowing the CDN/browser module cache chain to serve stale owner-platform JavaScript even when the downstream dashboard module itself is versioned.

Authorized scope:
- `operations-review.html`
- `assets/js/supabase-client.js`
- `assets/js/operations-review-dashboard-v3.js`

Change intent:
- version the Operations Review entry-point Supabase module import so the live page must fetch the current shared client;
- expose the current Supabase client as a page singleton for the versioned dashboard module, avoiding a second stale bare import;
- keep the dashboard module versioned through the same release token;
- add a fail-safe so an Overview bootstrap failure cannot leave the project workspace visually hidden behind a blank center;
- preserve auth, RLS, project data, lifecycle decisions and all unrelated functionality.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Academy owner platform recovery