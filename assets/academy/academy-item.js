// Rebel Ranch Academy item page: what it is, the price, and the right action
// (Open / Buy with PayPal / Sign in to buy / Join membership). Access is decided
// by the database (academy_can_open), never by this page.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { mountShell, supabase, esc, money, money2, areaById, areaIcon, icon, typeLabel, commerce, signInUrl, membershipsOpen } from "./academy-common.js";

const params = new URLSearchParams(location.search);
const id = params.get("id") || "";
const { session } = await mountShell("library");
const root = document.getElementById("item-root");

const { data: items } = await supabase.rpc("get_academy_catalog");
const item = (items || []).find((c) => c.project_id === id && c.has_material);

if (!item) {
  root.innerHTML = `<section class="lx-section"><h1 class="lx-h2">This item isn't available.</h1><p class="lx-empty">It may not be released yet. <a class="lx-linkBtn" href="academy-library.html">Back to the Library</a></p></section>`;
} else {
  document.title = `${item.title} | Rebel Ranch Academy`;
  const price = Number(item.price_usd || 0);
  const [{ data: canOpen }, plansOpen] = await Promise.all([
    supabase.rpc("academy_can_open", { p_project_id: id }),
    price > 0 ? membershipsOpen().catch(() => false) : Promise.resolve(false),
  ]);

  let action;
  if (canOpen) action = `<a class="lx-btn" href="academy-lesson.html?id=${encodeURIComponent(id)}">Open${icon.arrow()}</a>`;
  else if (!session) action = `<a class="lx-btn" href="${signInUrl()}">${icon.lock()}Sign in to buy · ${esc(money2(price))}</a>`;
  else action = `<button type="button" class="lx-btn" id="buy">Buy for ${esc(money2(price))} with PayPal${icon.arrow()}</button>`;

  root.innerHTML = `
    <section class="lx-section">
      <a class="lx-linkBtn" href="academy-library.html">← Library</a>
      <article class="lx-card" style="max-width:760px">
        <div class="lx-cardImg" data-image-slot="material-${esc(id)}">${item.cover_image_url ? `<img src="${esc(item.cover_image_url)}" alt="">` : areaIcon(item.learning_area_id || "", 56)}</div>
        <div class="lx-cardBody">
          <p class="lx-cardMeta">${esc(typeLabel[item.item_type] || "Lesson")}${item.learning_area_id ? ` · ${esc(areaById(item.learning_area_id)?.title || "")}` : ""}</p>
          <h1 class="lx-h2">${esc(item.title)}</h1>
          ${item.summary ? `<p>${esc(item.summary)}</p>` : ""}
          <div class="lx-cardFoot"><span class="lx-label">${esc(money(price))}</span>${action}</div>
          ${!canOpen && plansOpen ? `<p class="lx-hint">Or get this and everything else with an <a class="lx-linkBtn" href="academy-membership.html">Academy membership</a>.</p>` : ""}
          ${params.get("paypal") === "cancelled" ? `<p class="lx-hint">Payment was cancelled. You have not been charged.</p>` : ""}
          <p class="lx-hint" id="buy-msg" role="status"></p>
        </div>
      </article>
    </section>`;

  document.getElementById("buy")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget, msg = document.getElementById("buy-msg");
    btn.disabled = true; msg.textContent = "Opening PayPal…";
    try {
      const r = await commerce("buy", { project_id: id });
      if (r.owned || r.free) { location.assign(`academy-lesson.html?id=${encodeURIComponent(id)}`); return; }
      location.assign(r.approve_url);
    } catch (err) {
      btn.disabled = false; msg.textContent = err.body?.error || "Payment could not start. Please try again.";
    }
  });
}
