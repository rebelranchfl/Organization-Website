# Intended Change — Run Agent Now Supabase Secret-Key Compatibility

Date: 2026-08-22
AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RR Website — Run Agent Now v1

Update the newly added Academy manual runner to prefer Supabase's current server-side Secret key (`sb_secret_...`) while retaining temporary compatibility with the legacy `service_role` key. Keep all credentials server-side in GitHub Actions. No workflow-stage, owner-gate, RLS, publishing, pricing, or release behavior changes.
