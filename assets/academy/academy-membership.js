// Rebel Ranch Academy memberships: shows the owner's active plans; Join goes to PayPal.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { mountShell, supabase, commerce, esc, money2, icon, signInUrl } from "./academy-common.js";

const { session } = await mountShell("membership");
const root = document.getElementById("page-root");
const cancelled = new URLSearchParams(location.search).get("paypal") === "cancelled";
const { data: plans } = await supabase.from("academy_membership_plans")
  .select("code,name,description,price_usd,billing_interval,includes_all").order("sort_order").order("price_usd");

let mine = null;
if (session) {
  const { data } = await supabase.from("academy_member_subscriptions").select("plan_name,status,current_period_end")
    .eq("user_id", session.user.id).in("status", ["ACTIVE", "PAST_DUE"]).limit(1);
  mine = data?.[0] || null;
}

if (!plans?.length) {
  root.innerHTML = `<section class="lx-section"><h1 class="lx-h2">Memberships aren't open yet.</h1><p class="lx-empty">You can still buy single items or try the free activities. <a class="lx-linkBtn" href="academy-library.html">Go to the Library</a></p></section>`;
} else {
  root.innerHTML = `
    <section class="lx-hero"><div class="lx-heroText"><p class="lx-eyebrow">Membership</p><h1>Everything in the Academy, one price.</h1><p>Open every Academy lesson, guide and tool while your membership is active. Cancel any time from My Materials.</p></div></section>
    ${cancelled ? `<p class="lx-hint">Sign-up was cancelled. You have not been charged.</p>` : ""}
    ${mine ? `<p class="lx-hint">You're a member (${esc(mine.plan_name)}). Manage it in <a class="lx-linkBtn" href="academy-my-materials.html">My Materials</a>.</p>` : ""}
    <section class="lx-section"><div class="lx-cardGrid">
      ${plans.map((p) => `<article class="lx-card"><div class="lx-cardBody">
        <p class="lx-cardMeta">${p.billing_interval === "YEAR" ? "Yearly" : "Monthly"}</p>
        <h3>${esc(p.name)}</h3>${p.description ? `<p>${esc(p.description)}</p>` : ""}
        <div class="lx-cardFoot"><span class="lx-label">${esc(money2(p.price_usd))} / ${p.billing_interval === "YEAR" ? "year" : "month"}</span>
        ${mine ? "" : session ? `<button type="button" class="lx-btn" data-join="${esc(p.code)}">Join with PayPal${icon.arrow()}</button>` : `<a class="lx-btn" href="${signInUrl()}">Sign in to join${icon.arrow()}</a>`}
        </div></div></article>`).join("")}
    </div><p class="lx-hint" id="join-msg" role="status"></p></section>`;
  root.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-join]"); if (!b) return;
    const msg = document.getElementById("join-msg"); b.disabled = true; msg.textContent = "Opening PayPal…";
    try { const r = await commerce("subscribe", { plan_code: b.dataset.join }); location.assign(r.approve_url); }
    catch (err) { b.disabled = false; msg.textContent = err.body?.error || "Sign-up could not start. Please try again."; }
  });
}
