// Rebel Ranch Academy lesson player. Opens locked material only after the server
// confirms access; links expire after 10 minutes. Not in the menu — reached from an
// item or My Materials, so it never shows with nothing to play.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { mountShell, currentSession, commerce, esc, icon, signInUrl } from "./academy-common.js";

await mountShell("materials");
const root = document.getElementById("page-root");
const id = new URLSearchParams(location.search).get("id") || "";
const back = `<a class="lx-linkBtn" href="academy-item.html?id=${encodeURIComponent(id)}">← Back</a>`;

if (!(await currentSession())) {
  root.innerHTML = `<section class="lx-section">${back}<h1 class="lx-h2">Please sign in to open this.</h1><div class="lx-cardFoot"><a class="lx-btn" href="${signInUrl()}">Sign in${icon.arrow()}</a></div></section>`;
} else {
  try {
    const m = await commerce("open", { project_id: id });
    document.title = `${m.title || "Lesson"} | Rebel Ranch Academy`;
    let body = "";
    if (m.kind === "LESSON_HTML") body = `<iframe class="lx-player" title="${esc(m.title)}" sandbox="allow-scripts allow-forms allow-popups allow-modals"></iframe>`;
    else if (m.kind === "PDF") body = `<iframe class="lx-player" title="${esc(m.title)}" src="${esc(m.url)}"></iframe>`;
    else if (m.kind === "VIDEO") body = `<video class="lx-player" controls controlsList="nodownload" src="${esc(m.url)}"></video>`;
    else if (m.kind === "AUDIO") body = `<audio controls src="${esc(m.url)}"></audio>`;
    else body = `<div class="lx-cardFoot"><a class="lx-btn" href="${esc(m.url)}">Download${icon.arrow()}</a><span class="lx-hint">This link works for 10 minutes.</span></div>`;
    root.innerHTML = `<section class="lx-section">${back}<h1 class="lx-h2">${esc(m.title)}</h1>${body}</section>`;
    if (m.kind === "LESSON_HTML") root.querySelector("iframe").srcdoc = m.html;
  } catch (err) {
    if (err.status === 403) root.innerHTML = `<section class="lx-section">${back}<h1 class="lx-h2">${icon.lock(22)} This is a paid item.</h1><p class="lx-hint">Buy it or join a membership to open it.</p><div class="lx-cardFoot"><a class="lx-btn" href="academy-item.html?id=${encodeURIComponent(id)}">See options${icon.arrow()}</a></div></section>`;
    else root.innerHTML = `<section class="lx-section">${back}<h1 class="lx-h2">This couldn't be opened.</h1><p class="lx-hint">${esc(err.body?.error || "Please try again in a minute.")}</p></section>`;
  }
}
