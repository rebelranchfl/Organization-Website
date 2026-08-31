# Rebel Ranch Local Seller Order Notifications — Production Handoff

**Status:** Production; follow-up validation and iOS support remain

**Implementation date:** 2026-08-25

**Production site:** `https://rebelranchministries.org`

**Seller dashboard:** `https://rebelranchministries.org/marketplace-seller-dashboard.html`

**Supabase project:** `dfrwxpuojeiykaignyny`

**OneSignal App ID:** `3d048078-bf37-42ff-a1b7-3c1994cc62af` (public identifier)

## Attribution

- **AI agent:** ChatGPT/Codex
- **Chat/session:** `Rebel Ranch Local seller order notifications`
- **Production implementation commit:** `8647acb2a75e228f6f4994080782cf722f61d6dc`
- **Commit title:** `Add seller order email and push alerts`
- **Supabase Edge Function:** `submit-marketplace-order`
- **Production Edge Function version after this work:** `3`, status `ACTIVE`

The production commit includes the required attribution trailers:

```text
AI-Agent: ChatGPT/Codex
Session: Rebel Ranch Local seller order notifications
```

## Owner-approved purpose

Marketplace messages were intentionally separated into two paths:

1. **Orders:** structured purchase or service requests that belong in the seller's Orders view and should create a clear, low-noise seller alert.
2. **Questions:** general buyer questions that remain separate from orders.

The notification feature was added so sellers do not have to continuously monitor Facebook, Instagram, email, and other unrelated inboxes to discover that someone placed an order. Rebel Ranch Local becomes the central order record, while external notifications tell the seller to sign in.

The Marketplace still does not process payment on behalf of sellers. Sellers accept, propose changes, coordinate fulfillment, and provide their own payment instructions or direct payment link through the existing order workflow.

## Current production behavior

After a buyer submits a valid order:

1. `submit-marketplace-order` validates the seller, listings, quantities, fulfillment choice, and optional buyer photo.
2. The order is saved in `seller_orders`.
3. The existing Marketplace database behavior creates the seller's internal order/notification records.
4. The Edge Function attempts a transactional email through the Resend API.
5. The Edge Function attempts a OneSignal push notification when the seller has enabled browser notifications and OneSignal is configured.
6. The buyer receives the successful order number after the order is stored.

An email or push-provider failure does **not** erase, reject, or duplicate the saved order. External notification failures are logged by the Edge Function and the order remains available in the seller dashboard.

## Notification channels

| Channel | Current state | Seller action required | Contents |
|---|---|---|---|
| Seller dashboard Orders | Live | Sign in | Complete private order record |
| Marketplace dashboard notification | Live | Sign in | Internal new-order notice |
| Resend transactional email | Production code active | Maintain a valid seller account email | Generic new-order alert, order number, secure dashboard link |
| OneSignal web push — Android/desktop | Production code active | Sign in on that browser, select **Enable order alerts**, approve browser permission | Generic new-order alert and secure dashboard link |
| OneSignal web push — iPhone/iPad | **Not complete** | Future web-app manifest work required | Do not present as fully supported yet |
| SMS text message | Not implemented | None | Explicitly deferred; Telnyx was identified as a possible later paid option |

## Privacy and security boundaries

- Email and push notifications contain only a generic alert, the order number, and a link to the authenticated seller dashboard.
- Buyer contact information, items, notes, address, fulfillment details, and uploaded photos remain inside the protected seller dashboard.
- The OneSignal REST API key is never present in HTML, client JavaScript, Git, or this document.
- `ONESIGNAL_REST_API_KEY` is stored as a protected Supabase Edge Function secret.
- `RESEND_API_KEY` is consumed as a protected Supabase Edge Function secret.
- The OneSignal App ID is public by design and is present in seller-dashboard JavaScript.
- OneSignal users are associated with the authenticated Supabase user ID through `OneSignal.login(userId)`.
- Push sends target that same ID through OneSignal's `external_id` alias.
- Signing out calls `OneSignal.logout()` before the Supabase session is ended, preventing the next account on a shared browser from inheriting the prior seller's OneSignal identity.
- The existing private `marketplace-order-private` storage rules and signed photo URLs were not weakened.
- The Edge Function remains public (`verify_jwt=false`) because buyers may place orders without signing in; server-side seller/listing validation and the service-role implementation remain the security boundary.

## Seller experience

### Email

The seller account email receives:

```text
New Rebel Ranch Local order <order number>
Sign in to review and respond.
```

The sender is:

```text
Rebel Ranch Local <noreply@rebelranchministries.org>
```

### Android and desktop push

The seller must perform this once per browser/device:

1. Open the seller dashboard.
2. Sign in.
3. Open the account menu.
4. Select **Enable order alerts**.
5. Approve the browser's notification request.

The control changes to **Order alerts enabled** after permission is granted. This is a real clickable button; no non-clickable pill-style element was introduced.

### iPhone and iPad

Apple requires a web app manifest and Home Screen installation for web push. This implementation added the OneSignal SDK and service worker but did **not** add the required Apple-compatible manifest. iPhone/iPad push must therefore remain listed as incomplete until that work is separately authorized, implemented, deployed, and tested on a real Apple device.

## Files changed in the production feature commit

### `supabase/functions/submit-marketplace-order/index.ts`

- Selects the seller's `owner_user_id` during order validation.
- Resolves the seller's account email server-side through Supabase Admin Auth.
- Sends the Resend transactional order alert after the order is stored.
- Sends the OneSignal push alert using the seller owner's Supabase user ID as `external_id`.
- Uses `Promise.allSettled` so a provider failure cannot turn a successfully stored order into a failed buyer submission.
- Logs provider failures for diagnosis.
- Keeps the dashboard URL fixed to `marketplace-seller-dashboard.html#orders`.

### `marketplace-seller-dashboard.html`

- Loads OneSignal Web SDK v16.
- Adds the clickable **Enable order alerts** control to the authenticated account-actions menu.

### `assets/js/marketplace-seller-app.js`

- Initializes OneSignal with the approved public App ID.
- Connects the current authenticated Supabase user to OneSignal.
- Requests notification permission only after the seller clicks the alert control.
- Updates the control when permission changes.
- Logs the OneSignal identity out during account sign-out.

### `OneSignalSDKWorker.js`

- Adds OneSignal's required service worker at the website root.
- Imports the official OneSignal Web SDK v16 service worker.
- Must remain publicly accessible at `https://rebelranchministries.org/OneSignalSDKWorker.js` with JavaScript content type.

### Production backups

The exact pre-change files and change description are stored under:

`.backups/20260825-marketplace-order-notifications/`

## External configuration

### Supabase Edge Function secrets

Required:

- `RESEND_API_KEY`
- `ONESIGNAL_REST_API_KEY`

Secret values must never be committed or pasted into documentation. Supabase makes changed secrets available to Edge Functions without redeploying the function.

### Resend

- `rebelranchministries.org` was already verified in Resend.
- `noreply@rebelranchministries.org` was already used for production Supabase Auth SMTP.
- Marketplace order alerts use the Resend HTTP API, which is separate from Supabase Auth's SMTP delivery even though both use the same provider/domain.

### OneSignal

- Platform: Web.
- Site origin: `https://rebelranchministries.org`.
- Public App ID: `3d048078-bf37-42ff-a1b7-3c1994cc62af`.
- Private REST API key: stored only in Supabase as `ONESIGNAL_REST_API_KEY`.
- Service worker: root `OneSignalSDKWorker.js`.

## Verification completed on 2026-08-25

- Local JavaScript syntax checks passed for the seller app and OneSignal worker.
- `git diff --check` passed before production publication.
- Supabase confirmed `submit-marketplace-order` version `3` as `ACTIVE`.
- GitHub `main` advanced to production commit `8647acb2a75e228f6f4994080782cf722f61d6dc` by a non-force fast-forward update.
- Live `OneSignalSDKWorker.js` returned HTTP 200.
- Live worker returned `content-type: application/javascript; charset=utf-8`.
- Live seller dashboard contained the **Enable order alerts** control.
- Live seller dashboard loaded `OneSignalSDK.page.js` v16.
- Live seller application JavaScript contained the correct OneSignal App ID and authenticated-user connection code.

## Remaining work and validation

These items were not completed and must not be described as verified:

1. **End-to-end seller email test:** place a fresh real test order and confirm the seller account receives the Resend order email.
2. **End-to-end Android/desktop push test:** enable alerts on a real seller device, place a fresh test order from another session, confirm the push appears, and confirm tapping it opens the Orders view.
3. **OneSignal delivery-log review:** after the first test order, confirm the intended external ID was targeted and delivery was accepted.
4. **Supabase log review:** confirm no Resend or OneSignal provider error was logged during the first test.
5. **iPhone/iPad support:** design and authorize the web app manifest/Home Screen experience, implement it, then test on a physical iPhone or iPad.
6. **Seller preference controls:** current push enrollment is browser permission based. There is no separate database preference center for independently enabling/disabling email and push.
7. **Delivery retry/queue:** external alerts are attempted during the order request. There is no durable notification queue or automatic retry table yet. The order itself remains durable in `seller_orders`.
8. **SMS:** not implemented. Do not imply sellers receive text messages.

## Hosting observation

The repository handoff originally identified Cloudflare Pages as hosting. During live verification on 2026-08-25, public responses for the Marketplace files reported `server: GitHub.com` and GitHub Pages cache headers. The production files did deploy automatically from `main`, but a future hosting/DNS audit should determine whether Cloudflare is proxying, no longer active, or configured differently than expected. Do not change hosting as part of notification maintenance without owner approval.

## Operational troubleshooting

### Order exists but no email or push arrives

1. Confirm the order appears in `seller_orders` and in the seller dashboard.
2. Check Supabase Edge Function logs for `submit-marketplace-order`.
3. Look for `Resend notification failed` or `OneSignal notification failed`.
4. Confirm the seller profile has the correct `owner_user_id`.
5. Confirm the owner account has a valid Auth email.
6. Confirm the relevant Supabase secret still exists after any credential rotation.

### Email arrives but push does not

1. Confirm the seller enabled alerts on that exact browser/device.
2. Confirm browser notification permission is allowed for `rebelranchministries.org`.
3. Confirm the seller signed in after the production update so `OneSignal.login(userId)` ran.
4. Confirm the worker URL returns JavaScript rather than an HTML error page.
5. Check OneSignal delivery logs for the seller's Supabase user ID as `external_id`.
6. Do not use incognito/private browsing for push testing.

### Push reaches the wrong account on a shared browser

1. Confirm the user used the dashboard's **Sign out** action; it calls both OneSignal and Supabase logout.
2. Clear the site's browser data during diagnosis.
3. Confirm the next seller signs in normally so OneSignal receives the new external ID.
4. Treat any reproducible cross-account delivery as a privacy incident and disable OneSignal sends until resolved.

## Maintenance rules

- Preserve the dashboard order and internal notification as the source of truth.
- Never make order persistence depend on Resend or OneSignal availability.
- Never place order details or buyer private information into external notification bodies.
- Never expose provider secrets to browser code.
- Keep Questions separate from Orders.
- Do not add SMS, payment processing, retry infrastructure, a preference center, or iOS/PWA behavior without separate owner authorization.
- Update this handoff whenever the notification architecture, provider, secret names, supported devices, or delivery workflow changes.
