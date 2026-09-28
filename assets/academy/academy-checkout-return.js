// Return from PayPal: confirm the payment on the server, then show the receipt/next step.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { mountShell, requireSignIn, commerce, esc, icon } from "./academy-common.js";

await mountShell("materials");
const root = document.getElementById("page-root");
const p = new URLSearchParams(location.search);
const session = await requireSignIn();
if (session) {
  const kind = p.get("kind");
  const show = (html) => { root.innerHTML = `<section class="lx-section">${html}</section>`; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    if (kind === "item") {
      let r;
      for (let i = 0; i < 4; i++) { r = await commerce("confirm_purchase", { purchase_id: p.get("purchase") }); if (["COMPLETED", "CANCELLED", "REFUNDED"].includes(r.status)) break; await wait(2500); }
      if (r.status === "CANCELLED" || r.status === "REFUNDED") {
        show(`<h1 class="lx-h2">You already own this item.</h1>
          <p class="lx-hint">${r.status === "REFUNDED" ? "The second payment was refunded to you through PayPal." : "You were not charged again."}</p>
          <div class="lx-cardFoot"><a class="lx-btn" href="academy-lesson.html?id=${encodeURIComponent(r.project_id)}">Open it${icon.arrow()}</a><a class="lx-linkBtn" href="academy-my-materials.html">My Materials</a></div>`);
      } else if (r.status === "COMPLETED") {
        show(`<h1 class="lx-h2">Thank you — your purchase is complete.</h1>
          <p class="lx-hint">Receipt ${esc(r.receipt_number)}. It's saved in My Materials.</p>
          <div class="lx-cardFoot"><a class="lx-btn" href="academy-lesson.html?id=${encodeURIComponent(r.project_id)}">Open it now${icon.arrow()}</a>
          <a class="lx-linkBtn" href="academy-my-materials.html">Go to My Materials</a></div>`);
      } else {
        show(`<h1 class="lx-h2">We're still waiting on PayPal.</h1><p class="lx-hint">If you finished paying, your item will appear in <a class="lx-linkBtn" href="academy-my-materials.html">My Materials</a> within a few minutes. You have not been charged twice.</p>`);
      }
    } else if (kind === "membership") {
      let r;
      for (let i = 0; i < 4; i++) { r = await commerce("confirm_membership", { sub_id: p.get("sub") }); if (r.status === "ACTIVE") break; await wait(2500); }
      if (r.status === "ACTIVE") {
        show(`<h1 class="lx-h2">Welcome — your membership is active.</h1><p class="lx-hint">Everything in the Library is open to you. Your receipt is in My Materials.</p>
          <div class="lx-cardFoot"><a class="lx-btn" href="academy-library.html">Go to the Library${icon.arrow()}</a><a class="lx-linkBtn" href="academy-my-materials.html">My Materials</a></div>`);
      } else {
        show(`<h1 class="lx-h2">We're still waiting on PayPal.</h1><p class="lx-hint">If you finished signing up, your membership will show in <a class="lx-linkBtn" href="academy-my-materials.html">My Materials</a> within a few minutes.</p>`);
      }
    } else {
      show(`<p class="lx-empty">Nothing to confirm. <a class="lx-linkBtn" href="academy-library.html">Back to the Library</a></p>`);
    }
  } catch (err) {
    show(`<h1 class="lx-h2">We couldn't confirm the payment yet.</h1><p class="lx-hint">${esc(err.body?.error || "Please refresh this page in a minute.")} If you paid, it will appear in <a class="lx-linkBtn" href="academy-my-materials.html">My Materials</a>.</p>`);
  }
}
