import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paypalEnvironment, paypalRequest, verifyWebhookSignature } from "../_shared/paypal.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const ORDER_EVENT_TYPES = ["CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.DENIED"];

async function handleOrderEvent(
  db: ReturnType<typeof createClient>,
  environment: "sandbox" | "live",
  event: Record<string, any>,
) {
  const resource = event.resource || {};

  if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
    const orderId = resource.id;
    if (orderId) {
      try {
        await paypalRequest(`/v2/checkout/orders/${orderId}/capture`, { method: "POST" });
      } catch (error) {
        // A retried webhook can arrive after the order is already captured — that's not a
        // failure, the PAYMENT.CAPTURE.COMPLETED webhook already processed (or will process) it.
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("ORDER_ALREADY_CAPTURED")) throw error;
      }
    }
    return json({ received: true, status: "capture_requested" });
  }

  const captureId = resource.id || null;
  const orderId = resource.supplementary_data?.related_ids?.order_id || null;
  const customId: string = resource.custom_id || "";
  const [userId, creatorId] = customId.split(":");
  const occurredAt = event.create_time || new Date().toISOString();

  const { data, error } = await db.rpc("process_paypal_order_webhook_event", {
    p_environment: environment,
    p_event_id: event.id,
    p_event_type: event.event_type,
    p_payload: event,
    p_order_id: orderId,
    p_capture_id: captureId,
    p_user_id: userId || null,
    p_creator_id: creatorId || null,
    p_status: resource.status || null,
    p_occurred_at: occurredAt,
  });
  if (error) throw error;
  return json({ received: true, ...data });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  let event: Record<string, any> | null = null;
  let db: ReturnType<typeof createClient> | null = null;
  let environment: "sandbox" | "live" | null = null;

  try {
    environment = paypalEnvironment();
    event = await req.json();
    if (!(await verifyWebhookSignature(req.headers, event))) {
      return json({ error: "Invalid webhook signature." }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !service) throw new Error("Supabase function environment is incomplete.");
    db = createClient(url, service);

    if (ORDER_EVENT_TYPES.includes(event.event_type)) {
      return await handleOrderEvent(db, environment, event);
    }

    const resource = event.resource || {};
    const subscriptionId = resource.billing_agreement_id ||
      (String(resource.id || "").startsWith("I-") ? resource.id : null);

    let subscription = resource;
    if (subscriptionId && (!subscription.plan_id || !subscription.custom_id)) {
      subscription = await paypalRequest(`/v1/billing/subscriptions/${subscriptionId}`);
    }

    const occurredAt = event.create_time || new Date().toISOString();
    const nextBillingAt = subscription.billing_info?.next_billing_time || null;
    const userId = subscription.custom_id || null;
    const planId = subscription.plan_id || null;

    const { data, error } = await db.rpc("process_paypal_webhook_event", {
      p_environment: environment,
      p_event_id: event.id,
      p_event_type: event.event_type,
      p_payload: event,
      p_subscription_id: subscriptionId,
      p_user_id: userId,
      p_plan_id: planId,
      p_provider_status: subscription.status || resource.status || null,
      p_next_billing_at: nextBillingAt,
      p_occurred_at: occurredAt,
    });
    if (error) throw error;
    return json({ received: true, ...data });
  } catch (error) {
    console.error(error);
    if (db && environment && event?.id && event?.event_type) {
      const resource = event.resource || {};
      const subscriptionId = resource.billing_agreement_id ||
        (String(resource.id || "").startsWith("I-") ? resource.id : null);
      const orderId = ORDER_EVENT_TYPES.includes(event.event_type)
        ? (event.event_type === "CHECKOUT.ORDER.APPROVED"
            ? resource.id
            : resource.supplementary_data?.related_ids?.order_id) || null
        : null;
      const failure = {
        payment_provider: "paypal",
        payment_environment: environment,
        provider_event_id: event.id,
        event_type: event.event_type,
        provider_subscription_id: subscriptionId,
        provider_order_id: orderId,
        verification_status: "verified",
        processing_status: "failed",
        error_message: String(error?.message || error).slice(0, 1000),
        payload: event,
        processed_at: null,
      };
      const { error: recordError } = await db.from("payment_events").upsert(failure, {
        onConflict: "payment_provider,payment_environment,provider_event_id",
      });
      if (recordError) console.error("Could not record webhook failure:", recordError);
    }
    return json({ error: "Webhook processing failed; retry required." }, 503);
  }
});
