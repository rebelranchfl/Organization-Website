# Marketplace copy fix + Creation Station footer merch link — 2026-08-15

Two small, owner-approved, unrelated fixes made together since both are
one-line copy/markup changes.

## 1. Marketplace seller page — stop promising "place an order"
**File:** `assets/js/marketplace-seller-public.js`
The public seller page told buyers to "Message [Seller] directly to place
an order" — but the underlying system is a free-text message with no
line items, quantity, or order status. Confirmed with the owner this is
misleading given the current free-tier design (Marketplace intentionally
stays message-only; a real order/payment system is a separate, paid
upsell via 3P Business Fixes — not something to build into free
Marketplace). Reworded to describe an inquiry, not a completed order
mechanism.

## 2. Creation Station shared footer — add a merch link
**File:** `assets/components/creation-station-footer/footer.html`
Owner is building a merch page (rebelranchministries.org/merch.html,
currently being categorized in a separate in-flight session) and wants
Creation Station merch surfaced within the Creation Station "realm."
Added a link to the shared footer component, which already renders on
the dashboard, live-classes page, and young-creators page — broadest
reach for one small edit. Links to the general `merch.html` for now since
a Creation-Station-filtered URL doesn't exist yet; can be updated to a
filtered link once that categorization work lands.

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-15)
