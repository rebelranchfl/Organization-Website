# Intended change

Owner reported Operations Review shell loads but center remains black with `Loading live state…` indefinitely.

Authorized scope: `assets/js/operations-review-dashboard-v3.js` only.

Change intent:
- prevent optional opportunity/audience intelligence queries from blocking the entire Overview;
- place bounded timeouts around live dashboard queries;
- treat Academy project state as the required core Overview data and allow optional intelligence sections to degrade gracefully;
- render a visible first-load error/retry state instead of leaving the page black when required live data fails;
- preserve auth, RLS, lifecycle data, owner controls, navigation, styling, and all unrelated behavior.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Academy owner platform usability and account recovery
