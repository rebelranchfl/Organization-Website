# Creation Station Backend Alignment — Production State

**Status:** Implemented in production  
**Updated:** 2026-08-25  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** Creation Station Studio Publishing and Orders

This document is the current backend handoff for Creation Station Studio publication and direct order requests. It supersedes the earlier “future migration” state recorded in this file.

## 1. Public Studio publication is self-service for the paid public-page tiers

Owner-confirmed product flow:

**qualifying public-page membership → Studio information → adult/parent acknowledgement → Studio goes live**

There is no ordinary RRM editorial approval step for a paid Creation Station Studio.

The dashboard continues to use `approved` as the compatibility status for a self-published Studio. Public visibility is controlled by the database helper `private.studio_is_publicly_listed(request_id)` rather than by the status label alone.

A Studio is publicly listable only when all of the following are true:

- status is `approved` or `published`;
- `public_slug` exists;
- adult/parent acknowledgement name is present;
- acknowledgement relationship is present;
- acknowledgement timestamp is present;
- acknowledgement statement is present; and
- the owner has a current qualifying Creation Station public-page membership (`creator_website` or `club_all_access_bundle`), unless an administrator is performing an authorized administrative action.

The publication guard also verifies that the authenticated owner owns both the Studio request and the selected creator profile.

### Adult vs. minor acknowledgement

Adults may acknowledge their own public Studio and use a relationship such as `Self`.

For creators in the minor age bands (`young_6_12` and `teen_13_17`), the publication guard rejects self-style relationships such as `Self`, `Me`, `Creator`, or `Adult account holder`. A parent/guardian relationship remains required.

### Protected fields

Normal Studio owners cannot forge or replace administrative/moderation fields such as:

- `admin_notes`;
- `moderation_note`; or
- `published_url`.

Existing administrative controls remain available for genuine moderation or support needs, but ordinary paid Studio publication no longer waits for an editorial review.

## 2. Production migrations

The repository contains and production Supabase has applied:

- `supabase/migrations/20260825235500_creation_station_studio_publish_orders.sql`
- `supabase/migrations/20260825235900_creation_station_studio_order_grants.sql`
- `supabase/migrations/20260826000500_creation_station_studio_minor_acknowledgement.sql`

These migrations align Studio self-publication, structured orders, table privileges, and the adult/minor acknowledgement boundary.

## 3. Creation Station Studio orders now use a structured order-request model

Creation Station Studio remains separate from Rebel Ranch Local. Studio orders are stored in `public.studio_order_requests`; they are **not** inserted into Marketplace `seller_orders` and Creation Station membership does not create Marketplace seller approval.

The existing Studio order table was extended rather than replaced so there is one Creation Station order system.

Current structured fields include:

- `order_number`;
- `website_request_id`;
- buyer name/contact;
- `items` JSONB with product snapshots, quantities, optional item notes, and price labels;
- `order_kind`;
- `fulfillment_method`;
- `preferred_date`;
- `delivery_address`;
- `buyer_note`;
- `estimated_total`;
- `confirmed_total`;
- `status`;
- `studio_owner_note`;
- `payment_instructions`;
- `fulfillment_details`;
- read state/timestamp;
- accepted/completed timestamps; and
- created/updated timestamps.

Supported order states are:

**new → accepted / change proposed / declined → ready → completed**

The Studio owner may update seller-side lifecycle fields but may not rewrite the buyer-submitted item snapshot, buyer identity/contact, requested fulfillment, estimated total, or creation timestamp.

## 4. Buyer submission is server-validated

Production Edge Function:

`submit-creation-studio-order`

Repository source:

`supabase/functions/submit-creation-studio-order/index.ts`

The function intentionally accepts guest buyers, but the browser no longer writes directly to `studio_order_requests`.

Before an order is accepted, the function validates:

- the Studio exists and has an approved/published state;
- the Studio has a public slug;
- required adult/parent acknowledgement is present;
- a current qualifying public-page membership exists;
- every submitted product ID belongs to that Studio and is active;
- requested quantities are within the allowed range;
- requested fulfillment is one of the Studio's configured options; and
- buyer name and contact information are present.

Product title/price information is read from Supabase and snapshotted server-side. A buyer cannot invent a product name or price by editing browser JavaScript.

If every selected product has a simple numeric price, the server calculates the estimated order total. The creator/family still confirms the final total before payment.

## 5. Direct table privileges

Public buyers have no direct privileges on `studio_order_requests`.

Authenticated users receive only `SELECT` and `UPDATE`, with RLS limiting access to orders belonging to Studios owned by that account. The order update trigger prevents normal owners from changing buyer/source fields.

Service-role insertion is performed only by the validating order Edge Function.

## 6. Public buyer experience

Files:

- `creation-station-studio.html`
- `assets/js/creation-station-studio-public.js`

Public flow:

**choose products → quantities/item notes → fulfillment → buyer details → optional timing/address/note → send order request**

The buyer is explicitly told that sending the request does not finalize payment. The creator/family confirms:

- availability;
- final total;
- fulfillment; and
- payment instructions.

RRM does not process the creator's payment.

## 7. Private creator/parent order inbox

Page:

`creation-station-orders.html`

The Creation Station Dashboard includes a **Studio Orders** destination for the adult account.

The order inbox shows:

- order number;
- buyer name/contact;
- item snapshots and quantities;
- item notes;
- requested fulfillment;
- estimated total;
- preferred timing/address when provided; and
- buyer notes.

The account owner can:

- accept;
- propose a change;
- decline;
- mark ready;
- complete;
- confirm the total;
- save an order note;
- provide payment instructions; and
- provide fulfillment details.

## 8. Kid Mode privacy boundary

Studio orders contain buyer personally identifiable information and are adult/parent data.

`creation-station-orders.html` checks the current account's Kid Mode state and refuses to show orders while Kid Mode is active.

`assets/js/creation-station-order-privacy.js` is loaded before the dashboard app. When Kid Mode is active it:

- hides the Studio Orders navigation destination;
- prevents the existing dashboard workspace loader from receiving `studio_order_requests` rows; and
- reloads the workspace when entering/exiting Kid Mode so the data boundary is reapplied.

Do not remove this boundary without replacing it with an equally strong adult/parent authorization mechanism.

## 9. Notifications

A successful new Studio order attempts external notifications to the Studio account owner using the same privacy principle as Marketplace:

- notification contains the order number and secure inbox destination;
- buyer/order details remain inside the authenticated order inbox.

The authenticated inbox remains the source of truth even if external email or push delivery fails.

The existing `notify-website-request` function is already aligned with self-publication: it describes a paid Studio as live and explicitly states that no review is needed. It functions as a notice, not an approval request.

## 10. Verification boundary

Production database/schema and Edge Function deployment were completed in this implementation session. The existing test Studio remained **not publicly listed** because it does not have a qualifying active public-page membership; the migration did not accidentally publish it.

A true buyer-to-owner transaction cannot be exercised against that test Studio without artificially granting it a paid public membership. Do not alter a real user's membership merely to manufacture an end-to-end test. Complete the first real buyer-order walkthrough when a legitimate qualifying Studio is live, or use a separately authorized disposable test account/membership.
