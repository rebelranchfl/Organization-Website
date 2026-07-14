# Phase 2 PayPal subscriptions

## Sandbox catalog

Product: `PROD-4LY82075N1615481P` — Rebel Ranch Creation Station Memberships

| Offer code | Monthly price | Sandbox plan |
|---|---:|---|
| `young_creator_family` | $4.99 | `P-41484347F79488808NJLE2CA` |
| `creator_development` | $19.99 | `P-4LM62438SR045062ENJLE2CA` |
| `creator_website` | $49.99 | `P-3Y70407689889710CNJLE2CI` |

## Supabase configuration

Secrets required: `PAYPAL_ENVIRONMENT`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`,
`PAYPAL_WEBHOOK_ID`, and `SITE_URL`.

Webhook URL:

`https://dfrwxpuojeiykaignyny.supabase.co/functions/v1/paypal-webhook`

Handled events:

- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
- `PAYMENT.SALE.COMPLETED`
- `PAYMENT.SALE.DENIED`

The webhook verifies PayPal signatures before writing. Payment events are idempotent. Plan mappings
and webhook payloads are service-role-only. Cancellation keeps access through the current paid period;
a payment failure grants a three-day grace period.
