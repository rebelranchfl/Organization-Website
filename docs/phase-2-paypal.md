# Phase 2 PayPal subscriptions

## Sandbox catalog

Product: `PROD-4LY82075N1615481P` — Rebel Ranch Creation Station Memberships

| Offer code | Monthly price | Sandbox plan |
|---|---:|---|
| `young_creator_family` | $4.99 | `P-41484347F79488808NJLE2CA` |
| `creator_development` | $19.99 | `P-4LM62438SR045062ENJLE2CA` |
| `creator_website` | $49.99 | `P-3Y70407689889710CNJLE2CI` |

## Protected Supabase secrets

Configure `PAYPAL_ENVIRONMENT`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`,
`PAYPAL_WEBHOOK_ID`, and `SITE_URL` as Supabase Edge Function secrets. For Sandbox,
`PAYPAL_ENVIRONMENT` must be exactly `sandbox`. `SITE_URL` must be an HTTPS origin;
HTTP is accepted only for localhost testing. Supabase supplies `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` automatically.

Webhook URL:
`https://dfrwxpuojeiykaignyny.supabase.co/functions/v1/paypal-webhook`

## Reliability and security

- Checkout requires both platform JWT verification and an independent `getUser()` check.
- Browser CORS is restricted to the configured `SITE_URL`.
- The browser keeps one UUID request key per offer in session storage.
- The server reserves a 30-minute checkout attempt and sends its stable UUID as
  `PayPal-Request-Id`. A retry reuses the attempt and PayPal subscription instead of creating another.
- Webhook signatures are verified with PayPal before database work.
- Webhook membership changes and event completion occur in one database transaction.
- A failed transaction is recorded as `failed` and returns HTTP 503. A PayPal retry reprocesses
  failed or pending events; only processed or intentionally ignored events are dismissed as duplicates.
- The existing provider-subscription partial unique index remains the one-to-one guard. Transactional
  lookup-and-update logic is used instead of an incompatible `ON CONFLICT` target, preserving history
  and allowing a current membership to change tiers.
- Cancellation paid-through order is: PayPal next billing time, stored next billing time, last successful
  payment plus one month. If none is a valid future date, access ends at the cancellation event time.
  A canceled membership can never remain active with a null ending date.
- Payment failure stores `ends_at = failure time + 3 days`. A completed payment during grace restores
  active access and clears the failure ending date.
- Plan mappings, checkout attempts, and payment-event payloads are service-role-only.
- Existing household and creator-profile RLS policies were verified to call
  `private.has_active_creation_station_membership()`; the corrective migration does not replace them.

## Handled webhook events

- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
- `PAYMENT.SALE.COMPLETED`
- `PAYMENT.SALE.DENIED`
