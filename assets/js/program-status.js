// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Custom booking system build for rebelranchministries.org (2026-09-24/25) — coming-soon follow-up
// Owner-controlled "Coming Soon" markers for program cards (index.html accordion items and
// programs.html cards). Any element with data-program="<key>" is decorated when the owner has
// switched that program to Coming Soon in program-status.html (table program_status).
// The label reuses the homepage's approved "In Development" text treatment (.future-status):
// gold, uppercase, plain text — not a pill, because it is not clickable.
// One small read-only request with the public (publishable) key; nothing happens if it fails.

(() => {
  const SUPABASE_URL = 'https://dfrwxpuojeiykaignyny.supabase.co';
  // Same publishable browser key as assets/js/supabase-client.js (public by design).
  const PUBLISHABLE_KEY = 'sb_publishable_Ts45JL34s7yFGW5hlI0pUA_-HRUt18a';

  const cards = document.querySelectorAll('[data-program]');
  if (!cards.length) return;

  const style = document.createElement('style');
  style.textContent = `
    .cs-label{display:block;margin-top:.3rem;color:#EF9F27;font-size:.78rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .cs-marker{display:flex;flex-direction:column;gap:8px;margin-top:auto}
    .card .cs-marker{align-items:center;text-align:center}
    .cs-marker img{display:block;width:auto;max-width:160px;max-height:96px;object-fit:contain}
    .cs-marker .cs-note{margin:0;color:#D7D1B3}
  `;
  document.head.appendChild(style);

  const label = (text) => {
    const el = document.createElement('span');
    el.className = 'cs-label';
    el.textContent = text;
    return el;
  };

  const marker = (row, withLabel) => {
    const box = document.createElement('div');
    box.className = 'cs-marker';
    if (row.image_url) {
      const img = document.createElement('img');
      img.src = row.image_url;
      img.alt = '';
      img.loading = 'lazy';
      box.appendChild(img);
    }
    if (withLabel) box.appendChild(label(row.label_text));
    if (row.note_text) {
      const note = document.createElement('p');
      note.className = 'cs-note';
      note.textContent = row.note_text;
      box.appendChild(note);
    }
    return box;
  };

  const decorate = (el, row) => {
    if (el.dataset.comingSoonApplied) return;
    el.dataset.comingSoonApplied = 'true';
    if (el.classList.contains('accordion-item')) {
      // Homepage: label under the program name (visible while collapsed), details in the panel.
      el.querySelector('.accordion-summary')?.after(label(row.label_text));
      const panel = el.querySelector('.accordion-panel');
      const link = panel?.querySelector('.card-link');
      if (panel) {
        const box = marker(row, false);
        if (box.childNodes.length) (link ? link.before(box) : panel.appendChild(box));
      }
      if (link && !row.keep_link) link.style.display = 'none'; // .card-link sets display, which beats [hidden]
    } else {
      // Programs page card: label/note/image take the place of the card's link.
      const link = el.querySelector(':scope > a');
      const box = marker(row, true);
      if (link) link.before(box); else el.appendChild(box);
      if (link && !row.keep_link) link.style.display = 'none'; // .card-link sets display, which beats [hidden]
    }
  };

  fetch(`${SUPABASE_URL}/rest/v1/program_status?select=program_key,label_text,note_text,image_url,keep_link&coming_soon=eq.true`, {
    headers: { apikey: PUBLISHABLE_KEY, Accept: 'application/json' },
  })
    .then((response) => (response.ok ? response.json() : []))
    .then((rows) => {
      const byKey = new Map((rows || []).map((row) => [row.program_key, row]));
      cards.forEach((el) => {
        const row = byKey.get(el.dataset.program);
        if (row) decorate(el, row);
      });
    })
    .catch(() => { /* status markers are optional; the page works without them */ });
})();
