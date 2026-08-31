AI-Agent: ChatGPT/Codex
Session: Audit Repository Handoff

Attribution correction: the prior descriptive session label was not the actual ChatGPT conversation title. Corrected by ChatGPT/Codex after the owner identified the real title.

Purpose: preserve the exact current production files before adding seller order email and optional OneSignal web-push notifications.

Authorized scope:
- Send a Resend email to the seller after a valid Marketplace order is stored.
- Preserve the existing Marketplace dashboard notification and order record.
- Add optional OneSignal web-push enrollment for authenticated sellers and send a generic new-order alert.
- Add OneSignal's required root service-worker file so subscribed browsers can receive background alerts.
- Keep private order and buyer details inside the authenticated seller dashboard.

No redesign, unrelated cleanup, payment changes, SMS implementation, or directory changes are authorized.
