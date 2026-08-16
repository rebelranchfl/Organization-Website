# PayPal link not showing in Payment card — 2026-08-16

**File:** `assets/js/creation-station-studio-public.js`

Owner set a real PayPal link on their request form, but it never showed
up as clickable on the live page. Root cause: the "Pay via PayPal" button
was only wired into `#studio-payment-link`, an element nested inside the
cart-checkout section, which stays hidden until a buyer adds something to
the cart. The static "Payment" info card — the thing the owner was
actually looking at — only ever showed "PayPal" as plain, non-clickable
text, since payment_link was never referenced there.

Fix: when `payment_methods` includes `paypal` and `payment_link` is set,
the Payment card now renders it as a real clickable link directly. The
existing checkout-flow button (which shows once items are in the cart)
is left as-is — it's still a valid, more prominent call-to-action once
someone is ready to buy, just no longer the *only* place the link shows.

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-16)
