import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, paypalEnvironment, paypalRequest, validatedSiteUrl } from "../_shared/paypal.ts";

function response(body: unknown, status: number, origin: string | null) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  try {
    const site = validatedSiteUrl();
    if (origin && origin !== site.origin) return response({ error: "Origin is not allowed." }, 403, origin);
    if (req.method === "OPTIONS") return response(null, 204, origin);
    if (req.method !== "POST") return response({ error: "Method not allowed." }, 405, origin);

    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return response({ error: "Authentication required." }, 401, origin);

    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !service) throw new Error("Supabase function environment is incomplete.");

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const token = authorization.slice(7);
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) return response({ error: "Authentication required." }, 401, origin);

    const body = await req.json().catch(() => ({}));
    if (typeof body.creator_id !== "string" || !uuid.test(body.creator_id)) {
      return response({ error: "A valid creator_id is required." }, 400, origin);
    }
    if (typeof body.request_id !== "string" || !uuid.test(body.request_id)) {
      return response({ error: "A valid request_id is required." }, 400, origin);
    }

    const environment = paypalEnvironment();
    const admin = createClient(url, service);
    const { data: reserved, error: reserveError } = await admin.rpc("reserve_paypal_order_attempt", {
      p_user_id: user.id, p_creator_id: body.creator_id,
      p_environment: environment, p_request_key: body.request_id,
    });
    if (reserveError) {
      const message = reserveError.message || "";
      if (message.includes("unknown_plan")) return response({ error: "This offer is unavailable." }, 404, origin);
      if (message.includes("unknown_creator_profile")) return response({ error: "Creator profile not found." }, 404, origin);
      throw reserveError;
    }

    let order;
    if (reserved.provider_order_id) {
      order = await paypalRequest(`/v2/checkout/orders/${reserved.provider_order_id}`);
    } else {
      order = await paypalRequest("/v2/checkout/orders", {
        method: "POST",
        headers: { "PayPal-Request-Id": reserved.request_id, Prefer: "return=representation" },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            custom_id: `${user.id}:${body.creator_id}`,
            description: "Creation Station — one live session",
            amount: { currency_code: "USD", value: Number(reserved.amount_usd).toFixed(2) },
          }],
          application_context: {
            brand_name: "Rebel Ranch Ministries", user_action: "PAY_NOW",
            return_url: new URL("/membership-status.html?paypal=session-success", site).href,
            cancel_url: new URL("/creation-station-live-classes.html?paypal=cancelled", site).href,
          },
        }),
      });
      const { error: completeError } = await admin.rpc("complete_paypal_order_checkout_attempt", {
        p_attempt_id: reserved.attempt_id, p_order_id: order.id,
      });
      if (completeError) throw completeError;
    }

    const approveUrl = order.links?.find((link: { rel: string }) => link.rel === "approve")?.href;
    if (!approveUrl) throw new Error("PayPal did not return an approval URL.");
    return response({ order_id: order.id, approve_url: approveUrl }, 200, origin);
  } catch (error) {
    console.error(error);
    return response({ error: "Unable to start PayPal checkout." }, 500, origin);
  }
});
