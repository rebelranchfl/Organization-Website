# Rebel Ranch Local order submission hotfix

Production orders reached the Edge Function but failed because the hardened
`seller_listings` table did not grant `SELECT` to `service_role`. This pass
adds the minimum server-only grants needed to validate listings and create an
order, and surfaces the function's actual error message in the storefront.

AI-Agent: ChatGPT/Codex
Session: Audit Repository Handoff

Attribution correction: the prior descriptive session label was not the actual ChatGPT conversation title. Corrected by ChatGPT/Codex after the owner identified the real title.
