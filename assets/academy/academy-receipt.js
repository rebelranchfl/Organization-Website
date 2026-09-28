// Printable receipt for one Academy purchase or membership payment.
// The database only returns rows that belong to the signed-in person (or the owner).
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { supabase, requireSignIn, esc, money2, LOGO } from "./academy-common.js";

const el = document.getElementById("receipt");
const p = new URLSearchParams(location.search);
const session = await requireSignIn();
if (session) {
  const type = p.get("type"), id = p.get("id");
  let r = null;
  if (type === "item") {
    const { data } = await supabase.from("academy_purchases").select("*").eq("id", id).maybeSingle();
    if (data) r = { no: data.receipt_number, date: data.completed_at || data.created_at, email: data.buyer_email, what: data.item_title, kind: "Single item", amount: data.amount_usd, currency: data.currency, status: data.status, txn: data.paypal_capture_id, order: data.paypal_order_id };
  } else if (type === "membership") {
    const { data } = await supabase.from("academy_membership_payments").select("*, academy_member_subscriptions(plan_name,billing_interval,buyer_email,paypal_subscription_id)").eq("id", id).maybeSingle();
    if (data) { const s = data.academy_member_subscriptions || {}; r = { no: data.receipt_number, date: data.paid_at, email: s.buyer_email, what: `Academy membership — ${s.plan_name || ""}`, kind: s.billing_interval === "YEAR" ? "Membership (yearly)" : "Membership (monthly)", amount: data.amount_usd, currency: data.currency, status: data.status, txn: data.paypal_sale_id, order: s.paypal_subscription_id }; }
  }
  if (!r) {
    el.innerHTML = `<h1>Receipt not found</h1><p class="muted">This receipt doesn't exist or belongs to a different account.</p>`;
  } else {
    const when = new Date(r.date).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
    const statusWord = { COMPLETED: "Paid", REFUNDED: "Refunded", REVERSED: "Reversed", DENIED: "Declined", CANCELLED: "Cancelled" }[r.status] || r.status;
    el.innerHTML = `
      <div class="head"><img src="${LOGO}" alt=""><div><strong>Rebel Ranch Academy</strong><span>Rebel Ranch Ministries · a ministry of Faith, Family &amp; Nature Church, Inc.</span></div></div>
      <h1>Receipt</h1><p class="muted">Receipt number ${esc(r.no || "—")}</p>
      <table>
        <tr><th>Date</th><td>${esc(when)}</td></tr>
        <tr><th>Billed to</th><td>${esc(r.email || "")}</td></tr>
        <tr><th>Item</th><td>${esc(r.what)}<br><span class="muted">${esc(r.kind)}</span></td></tr>
        <tr><th>Payment method</th><td>PayPal</td></tr>
        <tr><th>PayPal transaction</th><td>${esc(r.txn || "—")}</td></tr>
        <tr><th>Status</th><td>${esc(statusWord)}</td></tr>
        <tr class="total"><th>Total</th><td>${esc(money2(r.amount))} ${esc(r.currency || "USD")}</td></tr>
      </table>
      <p class="foot">Questions about this purchase? <a href="contact.html">Contact Rebel Ranch Ministries</a>. Keep this receipt for your records.</p>`;
    document.title = `Receipt ${r.no || ""} | Rebel Ranch Academy`;
  }
}
