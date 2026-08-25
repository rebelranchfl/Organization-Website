# Rebel Ranch Local order submission hotfix

Production orders reached the Edge Function but failed because the hardened
`seller_listings` table did not grant `SELECT` to `service_role`. This pass
adds the minimum server-only grants needed to validate listings and create an
order, and surfaces the function's actual error message in the storefront.

AI-Agent: ChatGPT/Codex
Session: Rebel Ranch Local order system

