// Rebel Ranch Academy — shared learner-area code for main-site pages.
// Shell (sidebar, phone menu, RRM parent footer), sign-in state, and calls to the
// academy-commerce server function. Ported from the Program Hub learner shell.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { supabase, SUPABASE_URL } from "/assets/js/supabase-client.js";
import { learningAreas } from "./academy-data.js";

export { supabase, learningAreas };

export const LOGO = "/assets/rebel_ranch_academy_logo_transparent-cropped.png";
export const RRM_LOGO = "/assets/brand/Rebel%20Ranch%20Ministries/rrm-logo-white.png";
const COMMERCE_URL = `${SUPABASE_URL}/functions/v1/academy-commerce`;

export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const money = (v) => { const n = Number(v || 0); return n === 0 ? "Free" : `$${n.toFixed(n % 1 ? 2 : 0)}`; };
export const money2 = (v) => `$${Number(v || 0).toFixed(2)}`;
export const areaById = (id) => learningAreas.find((a) => a.id === id);
export const typeLabel = { LESSON: "Lesson", GUIDE: "Guide", WORKSHEET: "Worksheet", TOOL: "Tool", VIDEO: "Video", BUNDLE: "Bundle" };
export const fmtDate = (v) => v ? new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

// ── Icons (24px grid, stroke = currentColor) — same drawings as the Program Hub ──
const svg = (s, inner) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
export const icon = {
  library: (s = 20) => svg(s, '<path d="M4 4h3v16H4zM9 4h3v16H9z"/><path d="M14.5 4.8l2.9-.8 3.6 15.4-2.9.8z"/>'),
  home: (s = 18) => svg(s, '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>'),
  arrow: (s = 16) => svg(s, '<path d="M5 12h14M13 6l6 6-6 6"/>'),
  close: (s = 20) => svg(s, '<path d="M6 6l12 12M18 6L6 18"/>'),
  menu: (s = 22) => svg(s, '<path d="M4 7h16M4 12h16M4 17h16"/>'),
  check: (s = 16) => svg(s, '<path d="M5 12.5l4.5 4.5L19 7"/>'),
  all: (s = 26) => svg(s, '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'),
  materials: (s = 20) => svg(s, '<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8 13h8M8 17h5"/>'),
  member: (s = 20) => svg(s, '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>'),
  user: (s = 20) => svg(s, '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>'),
  lock: (s = 18) => svg(s, '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
};
export function areaIcon(id, s = 26) {
  switch (id) {
    case "personal-strength": return svg(s, '<path d="M3 19l6-10 4 6 3-4 5 8z"/><circle cx="16.5" cy="6" r="1.8"/>');
    case "communication": return svg(s, '<path d="M4 5h11v8H9l-3.5 3V13H4z"/><path d="M17 9h3v7h-1.5v2.5L16 16h-4"/>');
    case "business": return svg(s, '<rect x="3.5" y="7.5" width="17" height="11" rx="2"/><path d="M9 7.5V5.5h6v2M3.5 12.5h17"/>');
    case "money": return svg(s, '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.3c-.5-.8-1.4-1.3-2.5-1.3-1.5 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2-.5-2.6-1.3M12 6.5V8M12 16v1.5"/>');
    case "sustainability": return svg(s, '<path d="M12 20v-7"/><path d="M12 13c0-4 3-7 7.5-7 0 4.5-3 7-7.5 7z"/><path d="M12 15.5c0-3-2.3-5.5-6.5-5.5 0 3.5 2.3 5.5 6.5 5.5z"/>');
    case "family": return svg(s, '<circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M3.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5M11.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5"/>');
    default: return icon.all(s);
  }
}

// ── Sign-in state ────────────────────────────────────────────────────────────
export async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}
export function signInUrl() {
  const here = window.location.pathname.replace(/^\//, "") + window.location.search;
  return `account.html?returnTo=${encodeURIComponent(here)}`;
}
export async function requireSignIn() {
  const session = await currentSession();
  if (!session) { window.location.assign(signInUrl()); return null; }
  return session;
}

// ── Server calls ─────────────────────────────────────────────────────────────
export async function commerce(action, payload = {}) {
  const session = await currentSession();
  if (!session) { window.location.assign(signInUrl()); throw new Error("sign-in required"); }
  const res = await fetch(COMMERCE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(body.error || `Request failed (${res.status})`); e.status = res.status; e.body = body; throw e; }
  return body;
}

// Is there at least one membership people can join? (Membership menu item shows only then.)
export async function membershipsOpen() {
  const { data } = await supabase.from("academy_membership_plans").select("id").limit(1);
  return Array.isArray(data) && data.length > 0;
}

// ── Shell ────────────────────────────────────────────────────────────────────
// Menu items appear only when there is something behind them.
export async function mountShell(active) {
  const [session, plansOpen] = await Promise.all([currentSession(), membershipsOpen().catch(() => false)]);
  const items = [
    { key: "library", href: "academy-library.html", label: "Library", ic: icon.library() },
    session ? { key: "materials", href: "academy-my-materials.html", label: "My Materials", ic: icon.materials() } : null,
    plansOpen ? { key: "membership", href: "academy-membership.html", label: "Membership", ic: icon.member() } : null,
    { key: "account", href: session ? "account.html" : signInUrl(), label: session ? "My Account" : "Sign in", ic: icon.user() },
  ].filter(Boolean);

  const content = document.getElementById("lx-content");
  const app = document.createElement("div");
  app.className = "lx-app";
  app.innerHTML = `
    <header class="lx-topbar">
      <a class="lx-brand" href="academy-library.html" aria-label="Rebel Ranch Academy Library"><img src="${LOGO}" alt="" width="40" height="40"><span><strong>Rebel Ranch</strong><small>Academy</small></span></a>
      <button class="lx-menuBtn" type="button" aria-expanded="false" aria-controls="lx-nav">${icon.menu()}<span class="lx-srOnly">Open menu</span></button>
    </header>
    <aside id="lx-nav" class="lx-sidebar">
      <a class="lx-brand lx-sideBrand" href="academy-library.html" aria-label="Rebel Ranch Academy Library"><img src="${LOGO}" alt="" width="56" height="56"><span><strong>Rebel Ranch</strong><small>Academy</small></span></a>
      <nav class="lx-nav" aria-label="Learner area">
        ${items.map((i) => `<a href="${i.href}" ${i.key === active ? 'class="lx-navActive" aria-current="page"' : ""}>${i.ic}<span>${i.label}</span></a>`).join("")}
      </nav>
      <div class="lx-sideFoot">
        <a href="rebel-ranch-academy.html">${icon.home()}<span>Academy home</span></a>
        <a href="index.html">Rebel Ranch Ministries</a>
      </div>
    </aside>
    <div class="lx-main">
      <main class="lx-content" id="lx-main"></main>
      <footer class="lx-footer">
        <div class="lx-footAcademy"><img src="${LOGO}" alt="" width="44" height="44"><div><strong>Rebel Ranch Academy</strong><span>A program of Rebel Ranch Ministries</span></div></div>
        <div class="lx-footParent">
          <a class="lx-footRrm" href="index.html"><img src="${RRM_LOGO}" alt="Rebel Ranch Ministries" height="36"></a>
          <nav aria-label="Rebel Ranch Ministries">
            <a href="contact.html">Contact</a><a href="privacy-policy.html">Privacy Policy</a><a href="legal-disclosures.html">Legal Disclosures</a>
            <a href="https://www.facebook.com/rebelranchministries" rel="noopener">Facebook</a><a href="https://www.instagram.com/rebel_ranch_fl" rel="noopener">Instagram</a><a href="https://www.youtube.com/@RebelRanchMinistries" rel="noopener">YouTube</a>
          </nav>
          <p>© 2026 Faith, Family &amp; Nature Church, Inc.</p>
        </div>
      </footer>
    </div>`;
  content.replaceWith(app);
  const main = app.querySelector("#lx-main");
  main.append(...content.childNodes);
  const btn = app.querySelector(".lx-menuBtn"), side = app.querySelector(".lx-sidebar");
  btn.addEventListener("click", () => {
    const open = !side.classList.contains("lx-sidebarOpen");
    side.classList.toggle("lx-sidebarOpen", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.innerHTML = (open ? icon.close(22) : icon.menu()) + `<span class="lx-srOnly">${open ? "Close menu" : "Open menu"}</span>`;
  });
  return { session, main };
}

// Device-saved learning plan (same keys the Academy home page uses).
export function readList(key) {
  try { const v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
}
export function writeList(key, list) { try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* ignore */ } }
