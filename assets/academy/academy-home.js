// Rebel Ranch Academy home page behaviour. Ported line-for-line from the Program Hub
// React page (app/page.tsx): audience choice, learning areas, sample activities,
// device-saved learning plan, and the activity pop-up.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { audiences, learningAreas, experiences } from "./academy-data.js";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const read = (k) => { try { const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; } };
const $ = (id) => document.getElementById(id);

let audience = "Everyone", area = "All", selected = null, plan = read("rra-plan"), done = read("rra-done");

const save = (key, value) => { if (key === "rra-plan") plan = value; else done = value; try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } render(); };
const relevantAreas = () => audience === "Everyone" ? learningAreas : learningAreas.filter((i) => i.audiences.includes(audience));
const visibleExperiences = () => experiences.filter((i) => (area === "All" || i.area === area) && (audience === "Everyone" || i.audiences.includes(audience)));
const togglePlan = (id) => save("rra-plan", plan.includes(id) ? plan.filter((x) => x !== id) : [...plan, id]);
const toggleDone = (id) => save("rra-done", done.includes(id) ? done.filter((x) => x !== id) : [...done, id]);
function chooseAudience(v) {
  audience = v;
  if (v !== "Everyone" && area !== "All" && !learningAreas.find((i) => i.title === area)?.audiences.includes(v)) area = "All";
  render();
}
function chooseArea(title) { area = title; render(); document.getElementById("sample-learning")?.scrollIntoView({ behavior: "smooth", block: "start" }); }

function render() {
  $("plan-count").textContent = plan.length;
  $("plan-count").setAttribute("aria-label", `${plan.length} saved activities`);
  $("audience-grid").innerHTML = audiences.map((i) => `<button type="button" class="${audience === i.value ? "audience-choice selected" : "audience-choice"}" aria-pressed="${audience === i.value}" data-audience="${esc(i.value)}"><span>${esc(i.label)}</span><small>${esc(i.copy)}</small></button>`).join("");
  $("audience-label").textContent = audience;
  const areas = relevantAreas();
  $("learning-grid").innerHTML = areas.map((i) => `<button class="learning-card" type="button" data-choose-area="${esc(i.title)}"><span class="area-number">${i.number}</span><div><h3>${esc(i.title)}</h3><p>${esc(i.description)}</p><strong>${esc(i.outcomes)}</strong></div><span class="card-link">Explore sample learning →</span></button>`).join("");
  $("filter-row").innerHTML = `<button type="button" class="${area === "All" ? "active" : ""}" aria-pressed="${area === "All"}" data-area="All">All relevant areas</button>` +
    areas.map((i) => `<button type="button" class="${area === i.title ? "active" : ""}" aria-pressed="${area === i.title}" data-area="${esc(i.title)}">${esc(i.short)}</button>`).join("");
  const vis = visibleExperiences();
  $("experience-grid").innerHTML = vis.map((i) => `<article class="${done.includes(i.id) ? "experience-card complete" : "experience-card"}"><div class="experience-meta"><span>${esc(i.level)}</span><span>${esc(i.ages)} · ${esc(i.time)}</span></div><p class="area-label">${esc(i.area)}</p><h3>${esc(i.title)}</h3><p>${esc(i.description)}</p><div class="card-actions"><button type="button" data-open="${i.id}">Open activity <span aria-hidden="true">→</span></button><button type="button" class="${plan.includes(i.id) ? "saved" : ""}" data-plan="${i.id}">${plan.includes(i.id) ? "Remove from my plan" : "+ Add to my plan"}</button></div></article>`).join("");
  $("no-results").innerHTML = vis.length === 0 ? `<div class="no-results"><strong>No sample activity is posted for this exact combination yet.</strong><p>Choose another learning area or view all relevant areas.</p><button type="button" data-area="All">View all relevant activities</button></div>` : "";

  const planned = plan.map((id) => experiences.find((i) => i.id === id)).filter(Boolean);
  const completed = planned.filter((i) => done.includes(i.id)).length;
  const progress = planned.length ? (completed / planned.length) * 100 : 0;
  $("plan-board").innerHTML = `<div class="progress" role="progressbar" aria-label="Learning plan progress" aria-valuemin="0" aria-valuemax="${planned.length}" aria-valuenow="${completed}"><span style="width:${progress}%"></span></div><p>${completed} of ${planned.length} complete</p>` +
    (planned.length === 0
      ? `<div class="empty-plan"><strong>Your learning plan is wide open.</strong><p>Add a sample activity that solves a problem you actually have.</p><a href="#sample-learning">Browse sample learning →</a></div>`
      : `<ul class="plan-list">${planned.map((i) => `<li><button class="${done.includes(i.id) ? "check checked" : "check"}" type="button" data-done="${i.id}" aria-label="Mark ${esc(i.title)} ${done.includes(i.id) ? "incomplete" : "complete"}">${done.includes(i.id) ? "✓" : ""}</button><button class="plan-title" type="button" data-open="${i.id}">${esc(i.title)}<small>${esc(i.area)} · ${esc(i.time)}</small></button><button class="remove" type="button" data-plan="${i.id}" aria-label="Remove ${esc(i.title)} from your plan">×</button></li>`).join("")}</ul>`);
  renderModal();
}

let previousOverflow = "";
function renderModal() {
  const host = $("modal-host");
  if (!selected) { if (host.innerHTML) { host.innerHTML = ""; document.body.style.overflow = previousOverflow; } return; }
  const s = selected, wasOpen = !!host.innerHTML;
  host.innerHTML = `<div class="modal-backdrop" data-backdrop><section class="lesson-modal" role="dialog" aria-modal="true" aria-labelledby="lesson-title"><button class="modal-close" type="button" data-close aria-label="Close activity">×</button><p class="eyebrow">${esc(s.area)}</p><p class="modal-meta">${esc(s.level)} · ${esc(s.ages)} · ${esc(s.time)}</p><h2 id="lesson-title">${esc(s.title)}</h2><p class="lesson-description">${esc(s.description)}</p><h3>What you will learn</h3><ol>${s.learn.map((l, n) => `<li><span>0${n + 1}</span>${esc(l)}</li>`).join("")}</ol><div class="challenge"><strong>Put it to work</strong><p>${esc(s.challenge)}</p></div><div class="modal-actions"><button class="button button-gold" type="button" data-plan="${s.id}">${plan.includes(s.id) ? "Remove from my plan" : "Add to my plan →"}</button><button class="button button-dark" type="button" data-done="${s.id}">${done.includes(s.id) ? "✓ Completed" : "Mark complete"}</button></div></section></div>`;
  if (!wasOpen) { previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; host.querySelector(".modal-close").focus(); }
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-audience],[data-choose-area],[data-area],[data-open],[data-plan],[data-done],[data-close],[data-backdrop]");
  if (!t) return;
  if (t.dataset.audience) chooseAudience(t.dataset.audience);
  else if (t.dataset.chooseArea) chooseArea(t.dataset.chooseArea);
  else if (t.dataset.area) { area = t.dataset.area; render(); }
  else if (t.dataset.open) { selected = experiences.find((i) => i.id === t.dataset.open) || null; renderModal(); }
  else if (t.dataset.plan) togglePlan(t.dataset.plan);
  else if (t.dataset.done) toggleDone(t.dataset.done);
  else if (t.hasAttribute("data-close") || (t.hasAttribute("data-backdrop") && e.target === t)) { selected = null; renderModal(); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && selected) { selected = null; renderModal(); } });

const menuBtn = $("menu-button"), nav = $("primary-navigation");
menuBtn.addEventListener("click", () => { const open = !nav.classList.contains("nav-open"); nav.classList.toggle("nav-open", open); menuBtn.setAttribute("aria-expanded", String(open)); menuBtn.textContent = open ? "Close" : "Menu"; });
nav.addEventListener("click", (e) => { if (e.target.closest("a")) { nav.classList.remove("nav-open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.textContent = "Menu"; } });

render();
