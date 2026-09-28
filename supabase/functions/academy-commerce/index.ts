// Rebel Ranch Academy commerce: buy an item, confirm payment, join/cancel a
// membership, open locked material, and (owner only) sync a membership plan to PayPal.
// Prices always come from the database — never from the browser.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, paypalRequest, validatedSiteUrl } from "../_shared/paypal.ts";
import { completeAcademyPurchase, money, syncAcademySubscription } from "../_shared/academy-paypal.ts";

const reply = (body: unknown, status: number, origin: string | null) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const projectRe = /^[A-Za-z0-9_-]{3,80}$/;
const INTERVAL: Record<string, string> = { MONTH: "MONTH", YEAR: "YEAR" };

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  try {
    const site = validatedSiteUrl();
    if (origin && origin !== site.origin) return reply({ error: "Origin is not allowed." }, 403, origin);
    if (req.method === "OPTIONS") return reply(null, 204, origin);
    if (req.method !== "POST") return reply({ error: "Method not allowed." }, 405, origin);

    const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!url || !anon || !service) throw new Error("Supabase function environment is incomplete.");
    const authorization = req.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) return reply({ error: "Please sign in first." }, 401, origin);
    const userDb = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: { user } } = await userDb.auth.getUser(authorization.slice(7));
    if (!user) return reply({ error: "Please sign in first." }, 401, origin);
    const db = createClient(url, service);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    // ── Buy one item ──────────────────────────────────────────────────────
    if (action === "buy") {
      const projectId = String(body.project_id || "");
      if (!projectRe.test(projectId)) return reply({ error: "Unknown item." }, 400, origin);
      const { data: items, error: catErr } = await db.rpc("get_academy_catalog");
      if (catErr) throw catErr;
      const item = (items || []).find((c: any) => c.project_id === projectId);
      if (!item || !item.has_material) return reply({ error: "This item is not available." }, 404, origin);
      const price = Number(item.price_usd || 0);
      if (price <= 0) return reply({ free: true }, 200, origin);

      const { data: owned } = await db.from("academy_purchases").select("id").eq("user_id", user.id)
        .eq("project_id", projectId).eq("status", "COMPLETED").maybeSingle();
      if (owned) return reply({ owned: true }, 200, origin);

      const { data: purchase, error: pErr } = await db.from("academy_purchases").insert({
        user_id: user.id, buyer_email: user.email, project_id: projectId, release_id: item.release_id,
        item_title: item.title, amount_usd: price,
      }).select().single();
      if (pErr) throw pErr;

      const order = await paypalRequest("/v2/checkout/orders", {
        method: "POST",
        headers: { "PayPal-Request-Id": `rra-order-${purchase.id}`, Prefer: "return=representation" },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            reference_id: purchase.id, custom_id: `rra-item:${purchase.id}`,
            description: `Rebel Ranch Academy — ${String(item.title).slice(0, 100)}`,
            amount: { currency_code: "USD", value: money(price) },
          }],
          application_context: {
            brand_name: "Rebel Ranch Ministries", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING",
            return_url: new URL(`/academy-checkout-return.html?kind=item&purchase=${purchase.id}`, site).href,
            cancel_url: new URL(`/academy-item.html?id=${encodeURIComponent(projectId)}&paypal=cancelled`, site).href,
          },
        }),
      });
      await db.from("academy_purchases").update({ paypal_order_id: order.id }).eq("id", purchase.id);
      const approve = (order.links || []).find((l: any) => l.rel === "approve" || l.rel === "payer-action")?.href;
      if (!approve) throw new Error("PayPal did not return a payment link.");
      return reply({ approve_url: approve }, 200, origin);
    }

    // ── Confirm an item payment after returning from PayPal ───────────────
    if (action === "confirm_purchase") {
      const id = String(body.purchase_id || "");
      if (!uuid.test(id)) return reply({ error: "Unknown purchase." }, 400, origin);
      const { data: purchase } = await db.from("academy_purchases").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
      if (!purchase) return reply({ error: "Unknown purchase." }, 404, origin);
      const done = await completeAcademyPurchase(db, purchase);
      return reply({ status: done.status, receipt_number: done.receipt_number, project_id: done.project_id }, 200, origin);
    }

    // ── Join a membership ─────────────────────────────────────────────────
    if (action === "subscribe") {
      const code = String(body.plan_code || "");
      const { data: plan } = await db.from("academy_membership_plans").select("*").eq("code", code).eq("active", true).maybeSingle();
      if (!plan?.paypal_plan_id) return reply({ error: "This membership is not available." }, 404, origin);
      const { data: current } = await db.from("academy_member_subscriptions").select("id")
        .eq("user_id", user.id).in("status", ["ACTIVE", "PAST_DUE"]).maybeSingle();
      if (current) return reply({ error: "You already have an active membership." }, 409, origin);

      const { data: sub, error: sErr } = await db.from("academy_member_subscriptions").insert({
        user_id: user.id, buyer_email: user.email, plan_id: plan.id, plan_name: plan.name,
        amount_usd: plan.price_usd, billing_interval: plan.billing_interval, includes_all: plan.includes_all,
      }).select().single();
      if (sErr) throw sErr;
      const pp = await paypalRequest("/v1/billing/subscriptions", {
        method: "POST",
        headers: { "PayPal-Request-Id": `rra-sub-${sub.id}`, Prefer: "return=representation" },
        body: JSON.stringify({
          plan_id: plan.paypal_plan_id, custom_id: `rra-sub:${sub.id}`,
          application_context: {
            brand_name: "Rebel Ranch Ministries", user_action: "SUBSCRIBE_NOW", shipping_preference: "NO_SHIPPING",
            return_url: new URL(`/academy-checkout-return.html?kind=membership&sub=${sub.id}`, site).href,
            cancel_url: new URL(`/academy-membership.html?paypal=cancelled`, site).href,
          },
        }),
      });
      await db.from("academy_member_subscriptions").update({ paypal_subscription_id: pp.id }).eq("id", sub.id);
      const approve = (pp.links || []).find((l: any) => l.rel === "approve")?.href;
      if (!approve) throw new Error("PayPal did not return a membership link.");
      return reply({ approve_url: approve }, 200, origin);
    }

    // ── Confirm a membership after returning from PayPal ──────────────────
    if (action === "confirm_membership") {
      const id = String(body.sub_id || "");
      if (!uuid.test(id)) return reply({ error: "Unknown membership." }, 400, origin);
      const { data: sub } = await db.from("academy_member_subscriptions").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
      if (!sub) return reply({ error: "Unknown membership." }, 404, origin);
      const done = await syncAcademySubscription(db, sub);
      return reply({ status: done.status }, 200, origin);
    }

    // ── Cancel my membership (access continues to the end of the paid period) ─
    if (action === "cancel_membership") {
      const id = String(body.sub_id || "");
      const { data: sub } = await db.from("academy_member_subscriptions").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
      if (!sub?.paypal_subscription_id) return reply({ error: "Unknown membership." }, 404, origin);
      await paypalRequest(`/v1/billing/subscriptions/${sub.paypal_subscription_id}/cancel`, {
        method: "POST", body: JSON.stringify({ reason: "Cancelled by member on rebelranchministries.org" }),
      }).catch((e: Error) => { if (!String(e.message).includes("SUBSCRIPTION_STATUS_INVALID")) throw e; });
      const done = await syncAcademySubscription(db, sub);
      return reply({ status: done.status, access_until: done.current_period_end }, 200, origin);
    }

    // ── Open locked material ──────────────────────────────────────────────
    if (action === "open") {
      const projectId = String(body.project_id || "");
      if (!projectRe.test(projectId)) return reply({ error: "Unknown item." }, 400, origin);
      const { data: allowed, error: aErr } = await userDb.rpc("academy_can_open", { p_project_id: projectId });
      if (aErr) throw aErr;
      if (!allowed) return reply({ error: "locked" }, 403, origin);
      const { data: rel } = await db.from("academy_release_records").select("id,material_path,material_kind,material_filename,public_title")
        .eq("project_id", projectId).not("material_path", "is", null)
        .order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (!rel?.material_path) return reply({ error: "No material has been attached yet." }, 404, origin);
      if (rel.material_kind === "LESSON_HTML") {
        const { data: file, error: dErr } = await db.storage.from("academy-materials").download(rel.material_path);
        if (dErr) throw dErr;
        return reply({ kind: rel.material_kind, title: rel.public_title, html: await file.text() }, 200, origin);
      }
      const { data: signed, error: sErr } = await db.storage.from("academy-materials")
        .createSignedUrl(rel.material_path, 600, rel.material_kind === "FILE" ? { download: rel.material_filename || true } : undefined);
      if (sErr) throw sErr;
      return reply({ kind: rel.material_kind, title: rel.public_title, url: signed.signedUrl, expires_in: 600 }, 200, origin);
    }

    // ── Owner: send a membership plan's price to PayPal ───────────────────
    if (action === "sync_plan") {
      const { data: isAdmin } = await userDb.rpc("academy_is_admin");
      if (!isAdmin) return reply({ error: "Administrator access required." }, 403, origin);
      const id = String(body.plan_id || "");
      const { data: plan } = await db.from("academy_membership_plans").select("*").eq("id", id).maybeSingle();
      if (!plan) return reply({ error: "Unknown plan." }, 404, origin);

      let productId = plan.paypal_product_id;
      if (!productId) {
        const product = await paypalRequest("/v1/catalogs/products", {
          method: "POST", headers: { "PayPal-Request-Id": `rra-product-${plan.id}` },
          body: JSON.stringify({ name: "Rebel Ranch Academy Membership", type: "DIGITAL", category: "EDUCATIONAL_AND_TEXTBOOKS" }),
        });
        productId = product.id;
      }
      const unchanged = plan.paypal_plan_id && money(plan.paypal_plan_price) === money(plan.price_usd) && plan.paypal_plan_interval === plan.billing_interval;
      let planId = plan.paypal_plan_id;
      if (!unchanged) {
        // New PayPal plan for a new price/interval; existing members stay on their old plan and price.
        const created = await paypalRequest("/v1/billing/plans", {
          method: "POST", headers: { "PayPal-Request-Id": `rra-plan-${plan.id}-${money(plan.price_usd)}-${plan.billing_interval}`, Prefer: "return=representation" },
          body: JSON.stringify({
            product_id: productId, name: `Rebel Ranch Academy — ${String(plan.name).slice(0, 90)}`,
            description: String(plan.description || plan.name).slice(0, 127), status: "ACTIVE",
            billing_cycles: [{
              frequency: { interval_unit: INTERVAL[plan.billing_interval], interval_count: 1 },
              tenure_type: "REGULAR", sequence: 1, total_cycles: 0,
              pricing_scheme: { fixed_price: { value: money(plan.price_usd), currency_code: "USD" } },
            }],
            payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 1 },
          }),
        });
        planId = created.id;
      }
      const { error: uErr } = await db.from("academy_membership_plans").update({
        paypal_product_id: productId, paypal_plan_id: planId, paypal_plan_price: plan.price_usd,
        paypal_plan_interval: plan.billing_interval, paypal_synced_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq("id", plan.id);
      if (uErr) throw uErr;
      return reply({ paypal_plan_id: planId, created_new_plan: !unchanged }, 200, origin);
    }

    return reply({ error: "Unknown action." }, 400, origin);
  } catch (error) {
    console.error(error);
    return reply({ error: "Something went wrong. Please try again.", detail: String((error as Error)?.message || error).slice(0, 300) }, 500, origin);
  }
});
