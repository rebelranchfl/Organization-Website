# Rebel Ranch Local Order Notifications

**Status:** Production implementation exists; end-to-end external delivery validation remains incomplete.

This document governs the current Rebel Ranch Local seller-order notification behavior. It is a system operations record, not a historical handoff.

## Purpose

Marketplace messages use two separate paths:

1. **Orders** — structured purchase or service requests that belong in the seller's Orders view and should create a clear, low-noise seller alert.
2. **Questions** — general buyer questions that remain separate from orders.

Rebel Ranch Local keeps the authenticated seller dashboard as the durable source of truth. External alerts tell the seller to sign in; they do not replace the order record.

The Marketplace does not process payment on behalf of sellers through this workflow. Sellers accept, propose changes, coordinate fulfillment, and provide their own payment instructions or direct payment link.

## Current production behavior

After a buyer submits a valid order:

1. `submit-marketplace-order` validates the seller, listings, quantities, fulfillment choice, and optional buyer photo.
2. The order is stored in `seller_orders`.
3. Marketplace database behavior creates the seller's internal order/notification records.
4. The Edge Function attempts a transactional email through Resend.
5. The Edge Function attempts a OneSignal push notification when the seller enabled browser notifications and OneSignal is configured.
6. The buyer receives the successful order number after the order is stored.

An external email or push-provider failure must not erase, reject, or duplicate a successfully stored order.

## Notification channels

| Channel | Current state | Seller action required | Contents |
|---|---|---|---|
| Seller dashboard Orders | Live | Sign in | Complete private order record |
| Marketplace dashboard notification | Live | Sign in | Internal new-order notice |
| Resend transactional email | Production code active | Maintain a valid seller account email | Generic new-order alert, order number, secure dashboard link |
| OneSignal web push — Android/desktop | Production code active | Sign in on that browser, select **Enable order alerts**, approve browser permission | Generic new-order alert and secure dashboard link |
| OneSignal web push — iPhone/iPad | Not complete | Future web-app manifest/Home Screen work and real-device testing required | Do not present as fully supported |
| SMS text message | Not implemented | None | Do not imply SMS is available |

## Privacy and security boundaries

- External email and push alerts contain only a generic notice, order number, and authenticated dashboard link.
- Buyer contact information, items, notes, address, fulfillment details, and uploaded photos remain inside the protected seller dashboard.
- OneSignal and Resend secret keys must remain outside HTML, browser JavaScript, Git, and documentation.
- `ONESIGNAL_REST_API_KEY` and `RESEND_API_KEY` are protected Supabase Edge Function secrets.
- The OneSignal App ID is public by design.
- OneSignal users are associated with the authenticated Supabase user ID through `OneSignal.login(userId)` and sends target the same ID through OneSignal's `external_id` alias.
- Signing out must disconnect the OneSignal identity before the Supabase session ends so another account on a shared browser cannot inherit the previous seller's notification identity.
- Existing private Marketplace order/photo storage boundaries must not be weakened.
- `submit-marketplace-order` remains callable by guest buyers, so server-side validation and service-role logic remain the security boundary.

## Seller experience

### Email

Seller email alerts should remain generic and direct the seller to the authenticated dashboard rather than exposing buyer/order details in email.

Sender identity:

`Rebel Ranch Local <noreply@rebelranchministries.org>`

### Android and desktop push

The seller enables push per browser/device from the authenticated seller dashboard by selecting **Enable order alerts** and approving the browser permission request.

This control is a real clickable action. Non-interactive pill-style status elements remain prohibited by repository rules.

### iPhone and iPad

Do not claim iPhone/iPad web push is complete. Apple-compatible web-app manifest/Home Screen support and real-device testing are still required before that capability can be described as supported.

## Implementation components

- `supabase/functions/submit-marketplace-order/index.ts`
- `marketplace-seller-dashboard.html`
- `assets/js/marketplace-seller-app.js`
- `OneSignalSDKWorker.js`

The root service worker must remain publicly reachable with a JavaScript content type while OneSignal web push is in use.

## External configuration

Required Supabase Edge Function secrets:

- `RESEND_API_KEY`
- `ONESIGNAL_REST_API_KEY`

Secret values must never be committed or pasted into documentation.

Resend and OneSignal are external notification providers. The authenticated seller dashboard remains the source of truth even when either provider is unavailable.

## Verification boundary

The production implementation and live code surfaces were previously verified, including the active Edge Function, seller-dashboard alert control, OneSignal SDK integration, root service worker, and public App ID wiring.

The following are **not yet verified end-to-end** and must not be described as complete:

1. Seller receipt of a fresh real Resend order email after a live test order.
2. Android/desktop push receipt on a real seller device from a fresh order submitted in another session.
3. OneSignal delivery-log confirmation for the intended seller external ID.
4. Supabase log confirmation showing no Resend/OneSignal provider error during that test.
5. iPhone/iPad web-push support.
6. Separate seller preference controls for independently enabling/disabling email and push.
7. Durable retry/queue infrastructure for failed external notifications.
8. SMS notifications.

## Troubleshooting

### Order exists but no email or push arrives

1. Confirm the order exists in `seller_orders` and the seller dashboard.
2. Check `submit-marketplace-order` Edge Function logs.
3. Check for Resend or OneSignal provider failures.
4. Confirm the seller profile has the correct `owner_user_id`.
5. Confirm the owner Auth account has a valid email.
6. Confirm required Supabase secrets still exist after credential rotation.

### Email arrives but push does not

1. Confirm alerts were enabled on that exact browser/device.
2. Confirm browser notification permission is allowed for `rebelranchministries.org`.
3. Confirm the seller signed in so `OneSignal.login(userId)` ran.
4. Confirm `OneSignalSDKWorker.js` returns JavaScript rather than an HTML error page.
5. Check OneSignal delivery logs for the seller's Supabase user ID as `external_id`.
6. Do not use incognito/private browsing for push testing.

### Push reaches the wrong account on a shared browser

Treat this as a privacy incident. Disable OneSignal sends until resolved, verify the dashboard sign-out path calls both OneSignal logout and Supabase logout, clear site data during diagnosis, and confirm the next seller sign-in receives the new external ID.

## Maintenance rules

- Preserve the seller dashboard order and internal notification as the source of truth.
- Never make order persistence depend on Resend or OneSignal availability.
- Never place buyer private information into external notification bodies.
- Never expose provider secrets to browser code.
- Keep Questions separate from Orders.
- Do not add SMS, payment processing, retry infrastructure, preference-center behavior, or iOS/PWA support without owner authorization.
- Verify the exact affected workflow end-to-end before describing a notification change as complete.
