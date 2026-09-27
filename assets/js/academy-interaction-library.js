// Interaction & Assessment Library: every way learners interact with material or get
// tested, with a usage count per type. Uses are logged from each project page.
// Owner decision 2026-09-27: built into the back office + Supabase so usage is tracked.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { supabase } from './supabase-client.js';
import { esc, fmtDate, navHtml, requireAdmin } from './academy-admin-shared.js';

const view = document.getElementById('aa-view');
const loading = document.getElementById('aa-loading');
const notice = document.getElementById('aa-notice');
document.getElementById('aa-nav-host').innerHTML = navHtml('library');
const msg = (t, e = false) => { notice.textContent = t; notice.className = `aa-notice show${e ? ' error' : ''}`; };

async function load() {
  const [lib, projects] = await Promise.all([
    supabase.from('academy_interaction_library').select('*').order('times_used', { ascending: false }).order('name'),
    supabase.from('academy_content_projects').select('project_id,title')
  ]);
  if (lib.error) throw lib.error;
  const titles = new Map((projects.data || []).map(p => [p.project_id, p.title]));
  return { rows: lib.data || [], titles };
}

function render({ rows, titles }) {
  const used = rows.filter(r => r.times_used > 0).length;
  const total = rows.reduce((n, r) => n + r.times_used, 0);
  const unused = rows.filter(r => r.active && r.times_used === 0).length;
  const k = (n, l, cls = '') => `<div class="aa-kpi ${cls}"><div class="n">${esc(n)}</div><div class="l">${esc(l)}</div></div>`;
  view.innerHTML = `<div class="aa-kpis">${k(rows.length, 'Interaction types')}${k(total, 'Logged uses')}${k(used, 'Types used at least once')}${k(unused, 'Not used yet', unused ? 'alert' : 'zero')}</div>
  <section class="aa-section"><div class="aa-section-head"><h2>Library</h2><small>Uses are logged from each project page (Interactions &amp; tests). Fit is rated 1–5 per use.</small></div>
  <div class="aa-table-wrap"><table class="aa-table"><thead><tr><th>Interaction</th><th>What the learner does</th><th>Seems to fit</th><th>Used in</th><th>Times used</th><th>Avg fit</th><th>Last used</th><th>Fit notes</th></tr></thead><tbody>${rows.map(r => `<tr${r.active ? '' : ' style="opacity:.55"'}><td><b>${esc(r.name)}</b></td><td>${esc(r.learner_action)}</td><td>${esc(r.seems_to_fit || '—')}</td><td>${(r.used_in || []).map(id => `<a class="title" href="academy-stage-review.html?project=${encodeURIComponent(id)}">${esc(titles.get(id) || id)}</a>`).join('<br>') || '<span class="muted">—</span>'}</td><td class="num">${r.times_used}</td><td class="num${r.avg_fit == null ? ' muted' : ''}">${r.avg_fit ?? '—'}</td><td class="num muted">${r.last_used_at ? esc(fmtDate(r.last_used_at)) : '—'}</td><td><textarea class="aa-field" data-notes="${esc(r.id)}" rows="2" placeholder="What works, what doesn’t">${esc(r.fit_notes || '')}</textarea></td></tr>`).join('')}</tbody></table></div></section>
  <section class="aa-section"><div class="aa-section-head"><h2>Add an interaction type</h2><small>Add a new way of learning or testing so it can be picked and tracked.</small></div>
  <form class="aa-form" id="lib-add"><div><label for="lib-name">Name</label><input id="lib-name" required></div><div><label for="lib-action">What the learner does</label><input id="lib-action" required></div><div><label for="lib-fit">Seems to fit (optional)</label><input id="lib-fit"></div><div><button class="aa-btn" type="submit">Add to library</button></div></form></section>`;
  view.querySelectorAll('[data-notes]').forEach(t => t.addEventListener('change', async () => {
    const { error } = await supabase.from('academy_interaction_types').update({ fit_notes: t.value.trim() || null, updated_at: new Date().toISOString() }).eq('id', t.dataset.notes);
    if (error) msg(error.message, true); else msg('Fit notes saved.');
  }));
  document.getElementById('lib-add').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('lib-name').value.trim();
    const type_key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { error } = await supabase.from('academy_interaction_types').insert({ type_key, name, learner_action: document.getElementById('lib-action').value.trim(), seems_to_fit: document.getElementById('lib-fit').value.trim() || null, source: 'Owner' });
    if (error) { msg(error.message, true); return; }
    msg(`${name} added.`);
    render(await load());
  });
}

(async () => {
  try {
    if (!(await requireAdmin(supabase, loading))) return;
    const d = await load();
    loading.classList.add('hidden');
    render(d);
  } catch (e) {
    loading.classList.add('aa-error');
    loading.innerHTML = `<strong>The library could not load.</strong><p class="aa-note">${esc(e.message || 'Unknown error')}</p>`;
  }
})();
