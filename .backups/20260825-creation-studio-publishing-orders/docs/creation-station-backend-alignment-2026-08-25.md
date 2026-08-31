# Creation Station Backend Alignment — 2026-08-25

**Status:** Owner-directed implementation handoff  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** Creation Station Documentation and Cleanup

This document records two backend gaps discovered while streamlining the Creation Station public experience. It prevents future work from changing public copy without understanding the real application/database behavior underneath it.

## 1. Public Studio publication — intended product behavior

The owner-confirmed Creation Station Studio workflow is:

**qualifying paid public-page tier → creator/family enters Studio information → required adult/parent acknowledgement → Studio may go live**

RRM is not intended to provide an editorial review service for ordinary paid Studio publication.

For minors, parent/guardian control remains mandatory.

### What the current dashboard code already tries to do

`assets/js/creation-station-app.js` currently collects:
- `parent_approver_name`
- `parent_approver_relationship`
- `parent_approved_at`
- `consent_statement`

For an account with the qualifying public-page tier, the dashboard currently attempts to save the request as `approved` and tells the user that the Studio is approved/live.

### What the current Supabase database still enforces

The production function `private.guard_website_publication()` contains older review-era logic.

For a non-admin account, it currently allows status changes such as:
- `draft → submitted`
- `changes_requested → submitted`
- `draft/rejected → archived`

It does **not** currently allow the normal Studio owner to move their own qualifying paid request to `approved` or `published`.

That conflicts with the current dashboard code and the owner-approved product flow.

### Related public-listing rule

`private.studio_is_publicly_listed(request_id)` currently treats a Studio as publicly listable when:
- request status is `approved` or `published`;
- `public_slug` exists; and
- the owner has an active qualifying Creation Station public-page membership (or is an admin).

The existing slug trigger assigns `public_slug` when a request becomes `approved` or `published`.

Therefore a secure self-service `approved` transition can support the intended public behavior without requiring a separate manual editorial-publication step.

### Required future migration

Before calling self-service publication fully production-verified, create and explicitly approve a Supabase migration that updates the publication guard so a normal owner can approve their own Studio **only when all required safeguards are true**, including:

1. the request belongs to the authenticated owner;
2. the creator profile belongs to that owner;
3. the account has an active qualifying Creation Station public-page tier;
4. required adult/parent acknowledgement fields are present;
5. parent/guardian protection for minors is preserved;
6. protected admin/moderation fields cannot be forged by the owner;
7. another user's Studio cannot be modified;
8. existing public-read/RLS protections remain intact.

Do not simply remove the publication guard.

**Live database status:** not changed by the 2026-08-25 documentation/cleanup commit. A live database migration requires separate explicit owner authorization.

---

## 2. Creation Station Studio ordering — current state

The public Studio currently supports:
- public products from `creator_studio_products`;
- quantity selection;
- a JavaScript cart;
- buyer name;
- buyer phone/email;
- optional message; and
- insertion into `studio_order_requests`.

Current `studio_order_requests` is a simple request/inbox table containing fields such as:
- `website_request_id`
- `sender_user_id`
- `sender_name`
- `sender_contact`
- `cart_summary` (plain text)
- `message`
- `is_read`
- `read_at`
- `created_at`

The public insert is protected by RLS so an order request may only be inserted for a Studio that is publicly listed.

The Studio owner/admin can read and mark their own requests read.

## 3. Rebel Ranch Local ordering — proven reference architecture

Rebel Ranch Local already has the more mature direct-to-seller ordering model Creation Station should learn from.

The Marketplace buyer flow supports:
- real listing selection;
- multiple items;
- quantities;
- item notes;
- product orders vs. service requests;
- fulfillment choice;
- buyer name/contact;
- preferred date;
- delivery address;
- service location;
- buyer note;
- optional private photo; and
- submission through the `submit-marketplace-order` Supabase Edge Function.

Marketplace `seller_orders` stores structured data including:
- order number;
- structured `items` JSON;
- order kind;
- fulfillment method;
- estimated and confirmed totals;
- status;
- seller note;
- payment instructions;
- fulfillment details;
- read state;
- accepted/completed timestamps; and
- created/updated timestamps.

The seller dashboard provides an Orders inbox where a seller can:
- read the order;
- accept it;
- propose a change;
- confirm a total;
- provide payment instructions/direct link;
- coordinate fulfillment; and
- mark the order complete.

A database trigger creates a Marketplace notification when a new order is inserted. Marketplace may also attempt external email/push alerts, but the authenticated dashboard remains the source of truth.

RRM does not process seller payment.

## 4. Target Creation Station Studio order experience

Creation Station Studio should mature toward the same interaction pattern while remaining a distinct Creation Station product.

Target flow:

**Choose products → Build order → Choose quantities → Choose fulfillment → Add buyer details → Send order → Creator/parent receives structured order → Accept/change → Confirm total/payment/fulfillment → Complete**

Recommended Studio order fields:
- `order_number`
- `website_request_id`
- `sender_user_id`
- `sender_name`
- `sender_contact`
- structured `items` JSONB
- `fulfillment_method`
- `preferred_date`
- `delivery_address`
- `buyer_note`
- `estimated_total`
- `confirmed_total`
- `status`
- `studio_owner_note`
- `payment_instructions`
- `fulfillment_details`
- `is_read`
- `read_at`
- `accepted_at`
- `completed_at`
- `created_at`
- `updated_at`

A future phase may add private order-photo support if it is useful for custom creative work.

## 5. Keep Studio orders separate from Marketplace seller orders

Do not automatically place Creation Station Studio orders into `seller_orders`.

A Creation Station Studio owner is not automatically an approved Rebel Ranch Local seller.

The two products may share interaction patterns and implementation ideas while preserving separate:
- program identity;
- seller/creator eligibility;
- database ownership relationship;
- dashboards;
- notifications; and
- Marketplace approval rules.

If code is shared later, share reusable mechanics rather than collapsing the programs into one data model without explicit owner approval.

## 6. Safe implementation sequence

1. Approve the exact Studio-order schema/migration.
2. Back up existing Studio order/publication schema and relevant app files.
3. Apply the Supabase migration only after explicit owner authorization.
4. Upgrade `creation-station-studio-public.js` to send structured Studio orders.
5. Upgrade Creation Station dashboard data/views/actions to manage the structured order lifecycle.
6. Add a creator/parent order notification path.
7. Test as a public buyer, Studio owner/parent, and admin.
8. Verify RLS with unauthenticated, unrelated authenticated, owner, and admin users.
9. Only then describe the structured order workflow as fully live.

## 7. Current action boundary

The 2026-08-25 documentation and public-page cleanup does **not** apply a production database migration. It documents the discrepancy and prepares the next implementation phase so the live system is not changed accidentally.
