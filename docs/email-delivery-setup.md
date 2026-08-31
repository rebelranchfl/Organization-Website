# Email Delivery Setup

## Summary

Date: 2026-07-25

Supabase Auth's default built-in email sender was unreliable for this
project — signup confirmation and password-reset emails were not
arriving (confirmed during Marketplace Gate 2 testing; see
`docs/marketplace-gate-2-frontend-deployment-record.md`). This is a
known limitation of Supabase's default emailer, meant for development
only, not production use.

## What was configured

Custom SMTP was configured on the production Supabase project
(`dfrwxpuojeiykaignyny`) via the Management API's `/config/auth`
endpoint, using [Resend](https://resend.com) as the SMTP provider:

- Host: `smtp.resend.com`
- Port: `465`
- Sender name: `Rebel Ranch Ministries`
- Sender address: `noreply@rebelranchministries.org`

The `rebelranchministries.org` domain was added and DNS-verified in
Resend, which is what allows sending to any recipient (not just the
account owner's own email — Resend's default sandbox address,
`onboarding@resend.dev`, only sends to the account's own verified
email until a real domain is verified).

Confirmed working end-to-end: a password-reset email requested for
`rebelranchfl@gmail.com` was received, correctly sent from
`noreply@rebelranchministries.org`.

## Where the credentials live

The Resend API key and the Supabase personal access token used to make
this change are stored as local Windows user environment variables
(`RESEND_API_KEY`, `SUPABASE_ACCESS_TOKEN`) on the machine used for
this session — not committed to the repository. If SMTP settings need
to be changed again (e.g. rotating the Resend API key), use the same
Management API pattern:

```
PATCH https://api.supabase.com/v1/projects/dfrwxpuojeiykaignyny/config/auth
Authorization: Bearer <supabase personal access token>
Content-Type: application/json

{
  "smtp_admin_email": "noreply@rebelranchministries.org",
  "smtp_host": "smtp.resend.com",
  "smtp_port": "465",
  "smtp_user": "resend",
  "smtp_pass": "<resend api key>",
  "smtp_sender_name": "Rebel Ranch Ministries"
}
```

Note `smtp_port` must be sent as a string, not a number, or the API
rejects the request.

## Marketplace seller order email — added 2026-08-25

Resend is also used by the production `submit-marketplace-order` Edge
Function to alert a seller after a structured Marketplace order has
been stored. This use is separate from Supabase Auth SMTP:

- Auth confirmation/reset mail is sent through Supabase's configured
  Resend SMTP connection.
- Marketplace order alerts are sent directly to Resend's HTTP API by
  the Edge Function.
- The Edge Function reads `RESEND_API_KEY` from protected Supabase
  Edge Function secrets.
- The alert includes only the order number and the authenticated seller
  dashboard link. Private buyer and order details stay in the dashboard.
- A Resend failure is logged but does not undo or reject a saved order.

See `docs/marketplace-order-notifications-handoff-2026-08-25.md` for
the production architecture, exact files, verification, limitations,
and remaining end-to-end testing.
