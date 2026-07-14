import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paypalRequest } from "../_shared/paypal.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({});
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Authentication required." }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Authentication required." }, 401);

    const { offer_code } = await req.json();
    if (typeof offer_code !== "string") return json({ error: "offer_code is required." }, 400);
    const admin = createClient(url, service);
    const environment = Deno.env.get("PAYPAL_ENVIRONMENT") === "live" ? "live" : "sandbox";
    const { data: mapping, error } = await admin.from("payment_plan_mappings")
      .select("provider_plan_id").eq("payment_provider", "paypal")
      .eq("payment_environment", environment).eq("program_code", "creation_station")
      .eq("offer_code", offer_code).eq("is_active", true).maybeSingle();
    if (error || !mapping) return json({ error: "Membership plan is unavailable." }, 404);

    const siteUrl = (Deno.env.get("SITE_URL") || "").replace(/\/$/, "");
    const subscription = await paypalRequest("/v1/billing/subscriptions", {
      method: "POST",
      headers: { "PayPal-Request-Id": crypto.randomUUID(), Prefer: "return=representation" },
      body: JSON.stringify({
        plan_id: mapping.provider_plan_id,
        custom_id: user.id,
        application_context: {
          brand_name: "Rebel Ranch Ministries",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${siteUrl}/membership-status.html?paypal=success`,
          cancel_url: `${siteUrl}/creation-station-membership.html?paypal=cancelled`,
        },
      }),
    });
    const approve_url = subscription.links?.find((link: { rel: string }) => link.rel === "approve")?.href;
    return json({ subscription_id: subscription.id, approve_url });
  } catch (error) {
    console.error(error);
    return json({ error: "Unable to start PayPal checkout." }, 500);
  }
});
