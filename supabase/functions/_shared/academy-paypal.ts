// Rebel Ranch Academy — PayPal logic shared by academy-commerce and paypal-webhook.
// Academy records live in academy_* tables, separate from Creation Station.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { paypalRequest } from "./paypal.ts";

// deno-lint-ignore no-explicit-any
type Db = any;

export function money(v: unknown): string {
  return Number(v).toFixed(2);
}

/** Capture (or read an already-captured) PayPal order and mark the Academy purchase complete. */
export async function completeAcademyPurchase(db: Db, purchase: Record<string, any>) {
  if (purchase.status === "COMPLETED") return purchase;
  if (!purchase.paypal_order_id) throw new Error("Purchase has no PayPal order.");

  let order: Record<string, any>;
  try {
    order = await paypalRequest(`/v2/checkout/orders/${purchase.paypal_order_id}/capture`, {
      method: "POST",
      headers: { "PayPal-Request-Id": `rra-capture-${purchase.id}`, Prefer: "return=representation" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("ORDER_ALREADY_CAPTURED")) throw error;
    order = await paypalRequest(`/v2/checkout/orders/${purchase.paypal_order_id}`);
  }
  return await applyOrderState(db, purchase, order);
}

/** Record the result of a PayPal order on the purchase row (idempotent). */
export async function applyOrderState(db: Db, purchase: Record<string, any>, order: Record<string, any>) {
  const capture = order?.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) return purchase; // not captured yet (buyer has not approved)

  if (capture.status === "COMPLETED") {
    const paid = capture.amount?.value;
    if (money(paid) !== money(purchase.amount_usd) || capture.amount?.currency_code !== "USD") {
      throw new Error(`Paid amount ${paid} does not match price ${purchase.amount_usd}.`);
    }
    if (purchase.status === "COMPLETED") return purchase;
    const { data: receipt } = await db.rpc("academy_next_receipt_public");
    const { data, error } = await db.from("academy_purchases").update({
      status: "COMPLETED", paypal_capture_id: capture.id, receipt_number: purchase.receipt_number || receipt,
      completed_at: capture.create_time || new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq("id", purchase.id).neq("status", "COMPLETED").select().maybeSingle();
    if (error) throw error;
    return data || purchase;
  }
  if (capture.status === "DECLINED" || capture.status === "FAILED") {
    await db.from("academy_purchases").update({ status: "DENIED", updated_at: new Date().toISOString() })
      .eq("id", purchase.id).eq("status", "PENDING");
  }
  if (capture.status === "REFUNDED") {
    await db.from("academy_purchases").update({ status: "REFUNDED", updated_at: new Date().toISOString() })
      .eq("id", purchase.id);
  }
  return purchase;
}

const SUB_STATUS: Record<string, string> = {
  APPROVAL_PENDING: "PENDING", APPROVED: "PENDING", ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED", CANCELLED: "CANCELLED", EXPIRED: "EXPIRED",
};

/** Read the subscription from PayPal and mirror its state onto the Academy membership row. */
export async function syncAcademySubscription(db: Db, sub: Record<string, any>) {
  if (!sub.paypal_subscription_id) return sub;
  const pp = await paypalRequest(`/v1/billing/subscriptions/${sub.paypal_subscription_id}`);
  const status = SUB_STATUS[pp.status] || sub.status;
  const next = pp.billing_info?.next_billing_time || null;
  const failed = Number(pp.billing_info?.failed_payments_count || 0) > 0;
  const patch: Record<string, unknown> = {
    status: status === "ACTIVE" && failed ? "PAST_DUE" : status,
    current_period_end: next || sub.current_period_end,
    updated_at: new Date().toISOString(),
  };
  if (status === "ACTIVE" && !sub.started_at) patch.started_at = pp.start_time || new Date().toISOString();
  if (status === "CANCELLED" && !sub.cancelled_at) patch.cancelled_at = pp.status_update_time || new Date().toISOString();
  const { data, error } = await db.from("academy_member_subscriptions").update(patch).eq("id", sub.id).select().maybeSingle();
  if (error) throw error;
  return data || sub;
}

/** Record one membership charge with its own receipt (idempotent by PayPal sale id). */
export async function recordMembershipPayment(db: Db, sub: Record<string, any>, sale: Record<string, any>) {
  if (!sale?.id) return;
  const { data: existing } = await db.from("academy_membership_payments").select("id").eq("paypal_sale_id", sale.id).maybeSingle();
  if (existing) return;
  const { data: receipt } = await db.rpc("academy_next_receipt_public");
  const { error } = await db.from("academy_membership_payments").insert({
    subscription_id: sub.id, user_id: sub.user_id, paypal_sale_id: sale.id,
    amount_usd: Number(sale.amount?.total ?? sale.amount?.value ?? sub.amount_usd),
    currency: sale.amount?.currency || sale.amount?.currency_code || "USD",
    receipt_number: receipt, paid_at: sale.create_time || new Date().toISOString(),
  });
  if (error && !String(error.message).includes("duplicate")) throw error;
}

/**
 * Called by paypal-webhook for every verified PayPal notice.
 * Returns a response body if the notice belongs to the Academy, or null so the
 * existing Creation Station handling continues unchanged.
 */
export async function handleAcademyWebhookEvent(db: Db, event: Record<string, any>) {
  const type: string = event.event_type || "";
  const r = event.resource || {};

  // Which Academy record (if any) does this notice concern?
  let purchase: Record<string, any> | null = null;
  let sub: Record<string, any> | null = null;

  const orderId = type === "CHECKOUT.ORDER.APPROVED" ? r.id : r.supplementary_data?.related_ids?.order_id;
  if (orderId && (type.startsWith("CHECKOUT.ORDER") || type.startsWith("PAYMENT.CAPTURE"))) {
    const { data } = await db.from("academy_purchases").select("*").eq("paypal_order_id", orderId).maybeSingle();
    purchase = data;
  }
  const subId = r.billing_agreement_id || (String(r.id || "").startsWith("I-") ? r.id : null);
  if (!purchase && subId) {
    const { data } = await db.from("academy_member_subscriptions").select("*").eq("paypal_subscription_id", subId).maybeSingle();
    sub = data;
  }
  if (!purchase && !sub) return null; // not an Academy payment

  // Duplicate protection + audit trail.
  const { error: insErr } = await db.from("academy_payment_events").insert({
    paypal_event_id: event.id, event_type: type, resource_id: r.id || null, payload: event,
  });
  if (insErr) {
    if (!String(insErr.message).includes("duplicate")) throw insErr;
    const { data: prior } = await db.from("academy_payment_events").select("processing_status").eq("paypal_event_id", event.id).maybeSingle();
    if (prior?.processing_status === "processed" || prior?.processing_status === "ignored") {
      return { received: true, academy: true, status: "duplicate" };
    }
    // An earlier attempt failed: process this retry.
  }

  try {
    if (purchase) {
      if (type === "CHECKOUT.ORDER.APPROVED") {
        purchase = await completeAcademyPurchase(db, purchase);
      } else {
        const order = await paypalRequest(`/v2/checkout/orders/${purchase.paypal_order_id}`);
        purchase = await applyOrderState(db, purchase, order);
      }
    } else if (sub) {
      sub = await syncAcademySubscription(db, sub);
      if (type === "PAYMENT.SALE.COMPLETED" && sub) await recordMembershipPayment(db, sub, r);
      if (type === "PAYMENT.SALE.REFUNDED" || type === "PAYMENT.SALE.REVERSED") {
        const saleId = r.sale_id || r.parent_payment || r.id;
        await db.from("academy_membership_payments").update({ status: type.endsWith("REFUNDED") ? "REFUNDED" : "REVERSED" })
          .eq("paypal_sale_id", saleId);
      }
    }
    await db.from("academy_payment_events").update({ processing_status: "processed", processed_at: new Date().toISOString() })
      .eq("paypal_event_id", event.id);
    return { received: true, academy: true, status: "processed" };
  } catch (error) {
    await db.from("academy_payment_events").update({
      processing_status: "failed", error_message: String((error as Error)?.message || error).slice(0, 1000),
    }).eq("paypal_event_id", event.id);
    throw error; // 503 → PayPal retries; the failed row lets the retry run again
  }
}
