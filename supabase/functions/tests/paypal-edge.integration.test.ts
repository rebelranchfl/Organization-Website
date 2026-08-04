import { assertEquals } from "jsr:@std/assert@1";

const functionsUrl = Deno.env.get("TEST_SUPABASE_FUNCTIONS_URL");
const siteUrl = Deno.env.get("TEST_SITE_URL");

Deno.test({
  name: "CORS preflight returns the authenticated browser contract",
  ignore: !functionsUrl || !siteUrl,
  fn: async () => {
    const response = await fetch(`${functionsUrl}/paypal-create-subscription`, {
      method: "OPTIONS",
      headers: { Origin: siteUrl! },
    });
    assertEquals(response.status, 204);
    assertEquals(response.headers.get("access-control-allow-origin"), new URL(siteUrl!).origin);
    assertEquals(response.headers.get("access-control-allow-methods"), "POST, OPTIONS");
    if (!response.headers.get("access-control-allow-headers")?.includes("authorization")) {
      throw new Error("Authorization was not allowed by CORS.");
    }
  },
});

Deno.test({
  name: "signed-out checkout is rejected",
  ignore: !functionsUrl || !siteUrl,
  fn: async () => {
    const response = await fetch(`${functionsUrl}/paypal-create-subscription`, {
      method: "POST",
      headers: { Origin: siteUrl!, "Content-Type": "application/json" },
      body: JSON.stringify({ offer_code: "young_creator_family", request_id: crypto.randomUUID() }),
    });
    assertEquals(response.status, 401);
  },
});

Deno.test({
  name: "signed-out one-time order checkout is rejected",
  ignore: !functionsUrl || !siteUrl,
  fn: async () => {
    const response = await fetch(`${functionsUrl}/paypal-create-order`, {
      method: "POST",
      headers: { Origin: siteUrl!, "Content-Type": "application/json" },
      body: JSON.stringify({ creator_id: crypto.randomUUID(), request_id: crypto.randomUUID() }),
    });
    assertEquals(response.status, 401);
  },
});

Deno.test({
  name: "one-time order CORS preflight returns the authenticated browser contract",
  ignore: !functionsUrl || !siteUrl,
  fn: async () => {
    const response = await fetch(`${functionsUrl}/paypal-create-order`, {
      method: "OPTIONS",
      headers: { Origin: siteUrl! },
    });
    assertEquals(response.status, 204);
    assertEquals(response.headers.get("access-control-allow-origin"), new URL(siteUrl!).origin);
    assertEquals(response.headers.get("access-control-allow-methods"), "POST, OPTIONS");
  },
});

Deno.test({
  name: "invalid PayPal webhook signature is rejected",
  ignore: !functionsUrl,
  fn: async () => {
    const response = await fetch(`${functionsUrl}/paypal-webhook`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "WH-INVALID-SIGNATURE", event_type: "BILLING.SUBSCRIPTION.ACTIVATED", resource: {} }),
    });
    assertEquals(response.status, 400);
  },
});

// Authenticated checkout cases (paypal-create-subscription and paypal-create-order) use
// TEST_USER_JWT and a disposable Sandbox user. Database state assertions for both the
// subscription and one-time order RPCs are in supabase/tests/phase_2_paypal.sql.
