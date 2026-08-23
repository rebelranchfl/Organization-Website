# Intended change

Owner reports Operations Review still spins on `Loading live state…` after the loader repair was merged, while account access is restored.

Authorized scope: `assets/js/supabase-client.js` only.

Change intent:
- force the Operations Review dashboard module to load from a versioned URL so Chrome/Cloudflare cannot continue reusing the pre-fix cached JavaScript module;
- preserve Supabase auth, RLS, existing imports, lifecycle logic and all unrelated behavior.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Academy owner platform usability and account recovery