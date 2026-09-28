// Rebel Ranch Academy Library (main site). Ported from the Program Hub Library.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { mountShell, supabase, learningAreas, esc, money, areaById, areaIcon, icon, typeLabel, readList, writeList } from "./academy-common.js";
import { experiences } from "./academy-data.js";

const areaIdByTitle = Object.fromEntries(learningAreas.map((a) => [a.title, a.id]));
let area = "all", catalog = [], plan = readList("rra-plan"), openId = null;

await mountShell("library");
const $ = (id) => document.getElementById(id);

supabase.rpc("get_academy_catalog").then(({ data, error }) => {
  if (!error && Array.isArray(data)) { catalog = data.filter((c) => c.has_material); render(); }
});

function render() {
  $("area-grid").innerHTML =
    `<button type="button" class="lx-areaTile ${area === "all" ? "lx-areaOn" : ""}" aria-pressed="${area === "all"}" data-area="all">${icon.all()}<span>All areas</span></button>` +
    learningAreas.map((a) => `<button type="button" class="lx-areaTile ${area === a.id ? "lx-areaOn" : ""}" aria-pressed="${area === a.id}" data-area="${a.id}">${areaIcon(a.id)}<span>${esc(a.short)}</span></button>`).join("");
  const note = $("area-note");
  note.hidden = area === "all";
  note.textContent = area === "all" ? "" : areaById(area)?.description || "";

  const released = catalog.filter((x) => area === "all" || x.learning_area_id === area);
  $("materials").hidden = released.length === 0;
  $("material-grid").innerHTML = released.map((m) => `
    <article class="lx-card">
      <div class="lx-cardImg" data-image-slot="material-${esc(m.project_id)}">${m.cover_image_url ? `<img src="${esc(m.cover_image_url)}" alt="">` : areaIcon(m.learning_area_id || "", 40)}</div>
      <div class="lx-cardBody">
        <p class="lx-cardMeta">${esc(typeLabel[m.item_type] || "Lesson")}${m.learning_area_id ? ` · ${esc(areaById(m.learning_area_id)?.short || "")}` : ""}</p>
        <h3>${esc(m.title)}</h3>
        ${m.summary ? `<p>${esc(m.summary)}</p>` : ""}
        <div class="lx-cardFoot"><span class="lx-label">${esc(money(m.price_usd))}</span><a class="lx-btn" href="academy-item.html?id=${encodeURIComponent(m.project_id)}">${Number(m.price_usd) > 0 ? "Details" : "Open"}${icon.arrow()}</a></div>
      </div>
    </article>`).join("");

  const acts = experiences.filter((x) => area === "all" || areaIdByTitle[x.area] === area);
  const areaName = area === "all" ? "" : areaById(area)?.title;
  $("free-count").textContent = `${acts.length} ${acts.length === 1 ? "activity" : "activities"}${areaName ? ` in ${areaName}` : ""}`;
  $("activity-grid").innerHTML = acts.length === 0
    ? `<p class="lx-empty">No free activity in this area yet. <button type="button" class="lx-linkBtn" data-area="all">See all areas</button></p>`
    : acts.map((x) => {
        const id = areaIdByTitle[x.area] || "";
        return `<article class="lx-card">
          <div class="lx-cardImg" data-image-slot="activity-${x.id}">${areaIcon(id, 40)}</div>
          <div class="lx-cardBody">
            <p class="lx-cardMeta">${esc(areaById(id)?.short)} · ${esc(x.ages)} · ${esc(x.time)}</p>
            <h3>${esc(x.title)}</h3><p>${esc(x.description)}</p>
            <div class="lx-cardFoot"><span class="lx-label">Free</span>${plan.includes(x.id) ? `<span class="lx-saved">${icon.check(14)}In my plan</span>` : ""}<button type="button" class="lx-btn" data-open="${x.id}">Open activity${icon.arrow()}</button></div>
          </div></article>`;
      }).join("");
  renderDialog();
}

function renderDialog() {
  const host = $("dialog-host");
  const x = openId ? experiences.find((e) => e.id === openId) : null;
  if (!x) { host.innerHTML = ""; return; }
  const saved = plan.includes(x.id);
  host.innerHTML = `<div class="lx-overlay" data-close>
    <div class="lx-dialog" role="dialog" aria-modal="true" aria-labelledby="act-title">
      <button type="button" class="lx-closeBtn" data-close aria-label="Close">${icon.close()}</button>
      <p class="lx-cardMeta">${esc(x.area)} · ${esc(x.ages)} · ${esc(x.time)}</p>
      <h2 id="act-title">${esc(x.title)}</h2>
      <p>${esc(x.description)}</p>
      <h3>What you will learn</h3>
      <ul class="lx-checks">${x.learn.map((l) => `<li>${icon.check(18)}${esc(l)}</li>`).join("")}</ul>
      <h3>Your challenge</h3>
      <p>${esc(x.challenge)}</p>
      <div class="lx-dialogFoot">
        <button type="button" class="lx-btn" data-plan="${x.id}" aria-pressed="${saved}">${saved ? `${icon.check()}Saved to my plan` : "Save to my plan"}</button>
        <span class="lx-hint">Your plan is saved on this device.</span>
      </div>
    </div></div>`;
  host.querySelector(".lx-closeBtn").focus();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-area],[data-open],[data-plan],[data-close]");
  if (!t) return;
  if (t.dataset.area) { area = t.dataset.area; render(); }
  else if (t.dataset.open) { openId = t.dataset.open; renderDialog(); }
  else if (t.dataset.plan) { const id = t.dataset.plan; plan = plan.includes(id) ? plan.filter((p) => p !== id) : [...plan, id]; writeList("rra-plan", plan); render(); }
  else if (t.hasAttribute("data-close") && (t === e.target || t.classList.contains("lx-closeBtn") || e.target.closest(".lx-closeBtn"))) { openId = null; renderDialog(); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openId) { openId = null; renderDialog(); } });

render();
