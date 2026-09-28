// Rebel Ranch Academy — My Materials: what I own, my membership, and every receipt.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { mountShell, requireSignIn, supabase, commerce, esc, money2, fmtDate, areaById, areaIcon, icon, typeLabel } from "./academy-common.js";

await mountShell("materials");
const root = document.getElementById("page-root");
const session = await requireSignIn();
if (session) await load();

async function load() {
  const [lib, purchases, subs, payments] = await Promise.all([
    supabase.rpc("get_my_academy_library"),
    supabase.from("academy_purchases").select("id,item_title,amount_usd,status,receipt_number,completed_at,created_at,project_id").neq("status", "PENDING").order("created_at", { ascending: false }),
    supabase.from("academy_member_subscriptions").select("id,plan_name,amount_usd,billing_interval,status,started_at,current_period_end,cancelled_at").neq("status", "PENDING").order("created_at", { ascending: false }),
    supabase.from("academy_membership_payments").select("id,amount_usd,status,receipt_number,paid_at,subscription_id").order("paid_at", { ascending: false }),
  ]);
  const items = lib.data || [], buys = purchases.data || [], memberships = subs.data || [], mpays = payments.data || [];
  const planName = Object.fromEntries(memberships.map((s) => [s.id, s.plan_name]));

  const receipts = [
    ...buys.map((b) => ({ kind: "item", id: b.id, date: b.completed_at || b.created_at, what: b.item_title, amount: b.amount_usd, status: b.status, no: b.receipt_number })),
    ...mpays.map((m) => ({ kind: "membership", id: m.id, date: m.paid_at, what: `Membership — ${planName[m.subscription_id] || ""}`, amount: m.amount_usd, status: m.status, no: m.receipt_number })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const statusWord = { ACTIVE: "Active", PAST_DUE: "Payment problem — PayPal will retry", CANCELLED: "Cancelled", SUSPENDED: "Paused", EXPIRED: "Ended" };
  root.innerHTML = `
    <section class="lx-section">
      <h1 class="lx-h2">My Materials</h1>
      ${items.length ? `<div class="lx-cardGrid">${items.map((m) => `
        <article class="lx-card"><div class="lx-cardImg">${m.cover_image_url ? `<img src="${esc(m.cover_image_url)}" alt="">` : areaIcon(m.learning_area_id || "", 40)}</div>
        <div class="lx-cardBody"><p class="lx-cardMeta">${esc(typeLabel[m.item_type] || "Lesson")}${m.learning_area_id ? ` · ${esc(areaById(m.learning_area_id)?.short || "")}` : ""} · ${m.access_via === "MEMBERSHIP" ? "Membership" : "Purchased"}</p>
        <h3>${esc(m.title)}</h3><div class="lx-cardFoot"><a class="lx-btn" href="academy-lesson.html?id=${encodeURIComponent(m.project_id)}">Open${icon.arrow()}</a></div></div></article>`).join("")}</div>`
      : `<p class="lx-empty">Nothing here yet. Items you buy, or get with a membership, show up here. <a class="lx-linkBtn" href="academy-library.html">Browse the Library</a></p>`}
    </section>

    ${memberships.length ? `<section class="lx-section"><h2 class="lx-h2">My membership</h2>${memberships.map((s) => `
      <article class="lx-card"><div class="lx-cardBody">
        <p class="lx-cardMeta">${esc(statusWord[s.status] || s.status)}</p>
        <h3>${esc(s.plan_name)} · ${esc(money2(s.amount_usd))} / ${s.billing_interval === "YEAR" ? "year" : "month"}</h3>
        <p>${s.status === "ACTIVE" || s.status === "PAST_DUE" ? `Renews ${esc(fmtDate(s.current_period_end))}.` : s.current_period_end && new Date(s.current_period_end) > new Date() ? `Access continues until ${esc(fmtDate(s.current_period_end))}.` : `Started ${esc(fmtDate(s.started_at))}.`}</p>
        ${s.status === "ACTIVE" || s.status === "PAST_DUE" ? `<div class="lx-cardFoot"><button type="button" class="lx-linkBtn" data-cancel="${s.id}">Cancel membership</button></div>
        <div class="lx-cardFoot" data-confirm="${s.id}" hidden><span class="lx-hint">Cancel? You keep access until ${esc(fmtDate(s.current_period_end))}.</span><button type="button" class="lx-btn" data-cancel-yes="${s.id}">Yes, cancel</button><button type="button" class="lx-linkBtn" data-cancel-no="${s.id}">Keep it</button></div>` : ""}
      </div></article>`).join("")}</section>` : ""}

    <section class="lx-section"><h2 class="lx-h2">Receipts &amp; purchase history</h2>
      ${receipts.length ? `<div class="lx-receipts">${receipts.map((r) => `
        <a class="lx-receiptRow" href="academy-receipt.html?type=${r.kind}&id=${r.id}">
          <span>${esc(fmtDate(r.date))}</span><strong>${esc(r.what)}</strong><span>${esc(money2(r.amount))}${r.status !== "COMPLETED" ? ` · ${esc(r.status.toLowerCase())}` : ""}</span><span class="lx-hint">${esc(r.no || "")} ${icon.arrow(14)}</span>
        </a>`).join("")}</div>` : `<p class="lx-empty">No purchases yet.</p>`}
    </section>
    <p class="lx-hint" id="mm-msg" role="status"></p>`;
}

root.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-cancel],[data-cancel-yes],[data-cancel-no]"); if (!t) return;
  if (t.dataset.cancel) root.querySelector(`[data-confirm="${t.dataset.cancel}"]`).hidden = false;
  if (t.dataset.cancelNo) root.querySelector(`[data-confirm="${t.dataset.cancelNo}"]`).hidden = true;
  if (t.dataset.cancelYes) {
    t.disabled = true;
    try { await commerce("cancel_membership", { sub_id: t.dataset.cancelYes }); await load(); document.getElementById("mm-msg").textContent = "Your membership is cancelled. You keep access until the end of the paid period."; }
    catch (err) { t.disabled = false; document.getElementById("mm-msg").textContent = err.body?.error || "Could not cancel. Please try again."; }
  }
});
