import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paypalRequest, verifyWebhookSignature } from "../_shared/paypal.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  try {
    const event = await req.json();
    if (!(await verifyWebhookSignature(req.headers, event))) return json({ error: "Invalid webhook signature." }, 400);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: eventError } = await db.from("payment_events").insert({
      payment_provider: "paypal", provider_event_id: event.id, event_type: event.event_type, payload: event,
    });
    if (eventError?.code === "23505") return json({ received: true, duplicate: true });
    if (eventError) throw eventError;

    const resource = event.resource || {};
    let subscriptionId = resource.billing_agreement_id || resource.id;
    if (!subscriptionId || !String(subscriptionId).startsWith("I-")) return json({ received: true });

    let subscription = resource;
    if (!subscription.plan_id || !subscription.custom_id) {
      subscription = await paypalRequest(`/v1/billing/subscriptions/${subscriptionId}`);
    }
    const userId = subscription.custom_id;
    if (!userId) return json({ received: true });

    const common = {
      user_id: userId,
      program_code: "creation_station",
      payment_provider: "paypal",
      provider_subscription_id: subscriptionId,
      provider_plan_id: subscription.plan_id,
      updated_at: new Date().toISOString(),
    };
    const type = event.event_type;
    const nextBilling = subscription.billing_info?.next_billing_time || null;

    if (type === "BILLING.SUBSCRIPTION.PAYMENT.FAILED" || type === "PAYMENT.SALE.DENIED") {
      const endsAt = new Date(Date.now() + 3 * 86400000).toISOString();
      await db.from("memberships").upsert({ ...common, status: "past_due", payment_failed_at: new Date().toISOString(), ends_at: endsAt }, { onConflict: "payment_provider,provider_subscription_id" });
    } else if (type === "BILLING.SUBSCRIPTION.CANCELLED") {
      await db.from("memberships").upsert({ ...common, status: "active", cancel_at_period_end: true, cancelled_at: new Date().toISOString(), ends_at: nextBilling }, { onConflict: "payment_provider,provider_subscription_id" });
    } else if (["BILLING.SUBSCRIPTION.SUSPENDED", "BILLING.SUBSCRIPTION.EXPIRED"].includes(type)) {
      await db.from("memberships").upsert({ ...common, status: type.endsWith("EXPIRED") ? "expired" : "suspended", ends_at: new Date().toISOString() }, { onConflict: "payment_provider,provider_subscription_id" });
    } else if (["BILLING.SUBSCRIPTION.ACTIVATED", "PAYMENT.SALE.COMPLETED"].includes(type)) {
      await db.from("memberships").upsert({ ...common, status: "active", starts_at: subscription.start_time || new Date().toISOString(), provider_next_billing_at: nextBilling, payment_failed_at: null, ends_at: null }, { onConflict: "payment_provider,provider_subscription_id" });
    }
    return json({ received: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Webhook processing failed." }, 500);
  }
});
