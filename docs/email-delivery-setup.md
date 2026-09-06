# Shared Email Delivery Setup

**Status:** Shared-system component record  
**Parent shared-system reference:** `docs/shared-systems-operations.md`

## Purpose

This document records the shared email-delivery configuration used by Rebel Ranch Ministries infrastructure. It does not define program-specific notification workflows.

Program-specific email behavior belongs in that program's own documentation and should reference this shared system rather than redefining it.

## Shared authentication email

Date originally configured: 2026-07-25

Supabase Auth's default built-in email sender was unreliable during production testing, so custom SMTP was configured on the production Supabase project:

`dfrwxpuojeiykaignyny`

Provider: Resend

- Host: `smtp.resend.com`
- Port: `465`
- Sender name: `Rebel Ranch Ministries`
- Sender address: `noreply@rebelranchministries.org`

The `rebelranchministries.org` domain was recorded as DNS-verified in Resend.

At the time of configuration, a password-reset email was tested end to end and received successfully from `noreply@rebelranchministries.org`.

That historical test proves the setup worked at that verification point. It does not prove current delivery without a new end-to-end test when current delivery status matters.

## Credentials and secrets

The Resend API key and Supabase access credentials are not committed to this repository.

Historical setup records state that the Resend API key and Supabase personal access token used for configuration were stored as local Windows user environment variables:

- `RESEND_API_KEY`
- `SUPABASE_ACCESS_TOKEN`

Protected server-side credentials must remain in appropriate secret/environment storage. Do not place them in browser JavaScript, Markdown documentation, commit messages, logs, or public configuration.

## Historical Management API configuration pattern

The recorded configuration pattern was:

```text
PATCH https://api.supabase.com/v1/projects/dfrwxpuojeiykaignyny/config/auth
Authorization: Bearer <supabase personal access token>
Content-Type: application/json
```

with SMTP values equivalent to:

```json
{
  "smtp_admin_email": "noreply@rebelranchministries.org",
  "smtp_host": "smtp.resend.com",
  "smtp_port": "465",
  "smtp_user": "resend",
  "smtp_pass": "<resend api key>",
  "smtp_sender_name": "Rebel Ranch Ministries"
}
```

Historical note: `smtp_port` was required as a string by the API used at that time.

Before changing current SMTP configuration, verify the current Supabase configuration/API requirements rather than assuming this historical request shape remains unchanged.

## Program-specific transactional email

Programs may use Resend or another approved delivery path for their own transactional messages, but that logic belongs to the program.

Example: Marketplace structured-order seller notifications are documented in:

`docs/marketplace-order-notifications-handoff-2026-08-25.md`

The Marketplace implementation has historically used a server-side Edge Function and protected `RESEND_API_KEY` secret for order alerts. Marketplace-specific message content, failure handling, privacy boundaries, and verification belong in Marketplace documentation, not here.

## Verification rule

Do not claim email delivery is working because configuration exists.

For a current "working" claim, verify the exact requested flow end to end, for example:

- account confirmation email;
- password-reset email;
- program transactional notification.

Record what was tested, the delivery path, and the observed result.