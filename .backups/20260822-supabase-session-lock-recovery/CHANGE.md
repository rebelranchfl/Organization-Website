# Supabase session lock recovery

Owner-reported failure: `account.html` remains stuck on “Checking your secure account session…” and Operations Review remains stuck on “Loading live state…”. The account record, admin role, profile, and membership remain intact in Supabase.

Intended change: preserve normal Supabase authentication and browser cross-tab locking, but add a bounded lock wrapper so a stale browser lock cannot block account/session and live dashboard requests indefinitely. No authentication, RLS, role, membership, or authorization rules are weakened or removed.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Academy owner platform usability and account recovery
