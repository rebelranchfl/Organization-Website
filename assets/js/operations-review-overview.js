// Academy owner back office: Overview, Projects and New Idea views.
// Replaces operations-review-action-inbox.js (kept in the repo, no longer loaded).
// Owner decisions 2026-09-27: parked projects shown separately, 5-phase value stream,
// decision queue with price, compact system health.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { supabase } from './supabase-client.js';
import {
  STAGES, PHASES, stageKey, stageIndex, stageLabel, phaseOf, isParked, isWaitingOnOwner,
  esc, price, money, daysSince, fmtDate, stateOf, PRIORITY_ORDER, navHtml, requireAdmin
} from './academy-admin-shared.js';

const view = document.getElementById('aa-view');
const loading = document.getElementById('aa-loading');
const notice = document.getElementById('aa-notice');
const title = document.getElementById('aa-title');
let data = null;

const FIELDS = 'project_id,title,learning_area,workflow_stage,current_status,owner_hold,archived,owner_priority,proposed_price,projected_revenue,progress_updated_at,updated_at,owner_summary,progress_next';
const projectUrl = p => `academy-stage-review.html?project=${encodeURIComponent(p.project_id)}&stage=${encodeURIComponent(stageKey(p.workflow_stage))}`;

function msg(text, error = false) {
  notice.textContent = text;
  notice.className = `aa-notice show${error ? ' error' : ''}`;
}

async function siteDeploy() {
  try {
    const r = await fetch('https://api.github.com/repos/rebelranchfl/Organization-Website/actions/runs?per_page=10&branch=main', { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) return null;
    const j = await r.json();
    const run = (j.workflow_runs || []).find(w => w.status === 'completed');
    return run ? { ok: run.conclusion === 'success', name: run.name, at: run.updated_at } : null;
  } catch { return null; }
}

async function load() {
  const [projects, runner, releases, findings, visuals, deploy] = await Promise.all([
    supabase.from('academy_content_projects').select(FIELDS).order('project_id'),
    supabase.from('academy_agent_runner_state').select('runner_key,ready,last_heartbeat'),
    supabase.from('academy_release_records').select('id', { count: 'exact', head: true }),
    supabase.from('academy_late_findings').select('id', { count: 'exact', head: true }).eq('status', 'PENDING_OWNER'),
    supabase.from('academy_visual_production_jobs').select('state'),
    siteDeploy()
  ]);
  if (projects.error) throw projects.error;
  const runnerRows = runner.error ? [] : (runner.data || []);
  const runnerReady = runnerRows.some(r => r.ready && r.last_heartbeat && (Date.now() - new Date(r.last_heartbeat).getTime()) < 12 * 60000);
  return {
    projects: projects.data || [],
    runnerReady,
    runnerKnown: !runner.error,
    releases: releases.error ? null : releases.count,
    findings: findings.error ? null : findings.count,
    visualsVerified: visuals.error ? null : (visuals.data || []).filter(v => ['VERIFIED', 'DEPLOYED', 'COMPLETE', 'INTEGRATED'].includes(v.state)).length,
    deploy
  };
}

// ---------- Overview ----------
function kpis(d) {
  const active = d.projects.filter(p => stageKey(p.workflow_stage) !== 'REJECTED');
  const waiting = active.filter(isWaitingOnOwner).length;
  const parked = active.filter(isParked);
  const parkedReady = parked.filter(p => p.current_status === 'READY_FOR_REVIEW').length;
  const priced = active.filter(p => price(p).set).length;
  const revenue = active.filter(p => p.projected_revenue !== null && p.projected_revenue !== undefined).length;
  const live = active.filter(p => stageKey(p.workflow_stage) === 'LIVE').length;
  const k = (n, l, cls = '') => `<div class="aa-kpi ${cls}"><div class="n">${esc(n)}</div><div class="l">${esc(l)}</div></div>`;
  return `<div class="aa-kpis">${
    k(waiting, 'Waiting on your decision', waiting ? 'alert' : 'zero')}${
    k(parked.length, parkedReady ? `Parked (${parkedReady} ready to review on resume)` : 'Parked', parked.length ? 'alert' : 'zero')}${
    k(active.length, 'Projects in the pipeline')}${
    k(`${priced} / ${active.length}`, revenue ? `Priced · ${revenue} with projected revenue` : 'Priced · projected revenue: none set', priced < active.length ? 'bad' : '')}${
    k(live, 'Released and sellable', live ? '' : 'zero')}</div>`;
}

function card(p, d) {
  const st = stateOf(p, d.runnerReady);
  const pr = price(p);
  const bits = [p.project_id.replace('RRA-2026-', ''), pr.set ? pr.text : '', p.owner_priority === 'IMMEDIATE' ? 'IMMEDIATE' : ''].filter(Boolean).join(' · ');
  return `<a class="aa-card${isParked(p) ? ' is-parked' : ''}" href="${projectUrl(p)}"><span class="t">${esc(p.title)}</span><span class="meta"><span class="aa-state ${st.cls}">${esc(st.text)}</span>${esc(bits)}</span></a>`;
}

function stream(d) {
  const active = d.projects.filter(p => stageKey(p.workflow_stage) !== 'REJECTED');
  const cols = PHASES.map(ph => {
    const items = active.filter(p => phaseOf(p.workflow_stage)?.key === ph.key)
      .sort((a, b) => (isParked(a) - isParked(b)) || (stageIndex(b.workflow_stage) - stageIndex(a.workflow_stage)) || a.project_id.localeCompare(b.project_id));
    return `<div class="aa-phase"><div class="aa-phase-head"><div class="row"><b>${esc(ph.label)}</b><span class="count">${items.length}</span></div><span class="gates">${esc(ph.gates)}</span></div><div class="aa-cards">${items.map(p => card(p, d)).join('') || '<p class="aa-empty">Nothing here yet.</p>'}</div></div>`;
  }).join('');
  return `<section class="aa-section"><div class="aa-section-head"><h2>Value stream</h2><small>Faded cards are parked. Click any card to open the project.</small></div><div class="aa-stream"><div class="aa-stream-grid">${cols}</div></div></section>`;
}

function queue(d) {
  const rows = d.projects.filter(isWaitingOnOwner).sort((a, b) =>
    ((PRIORITY_ORDER[a.owner_priority] ?? 3) - (PRIORITY_ORDER[b.owner_priority] ?? 3)) ||
    (stageIndex(b.workflow_stage) - stageIndex(a.workflow_stage)) ||
    ((daysSince(b.progress_updated_at) ?? 0) - (daysSince(a.progress_updated_at) ?? 0)));
  const parkedReady = d.projects.filter(p => isParked(p) && p.current_status === 'READY_FOR_REVIEW').length;
  const body = rows.length
    ? `<div class="aa-table-wrap"><table class="aa-table"><thead><tr><th>Priority</th><th>Project</th><th>Gate</th><th>Price</th><th>Waiting</th><th></th></tr></thead><tbody>${rows.map(p => {
        const pr = price(p); const w = daysSince(p.progress_updated_at);
        return `<tr><td><span class="aa-pri ${esc(p.owner_priority || 'NORMAL')}">${esc(p.owner_priority || 'NORMAL')}</span></td><td><a class="title" href="${projectUrl(p)}">${esc(p.title)}</a></td><td>${esc(stageLabel(p.workflow_stage))}</td><td class="num${pr.set ? '' : ' muted'}">${esc(pr.text)}</td><td class="num">${w === null ? '—' : `${w} d`}</td><td><a class="aa-btn" href="${projectUrl(p)}">Review</a></td></tr>`;
      }).join('')}</tbody></table></div>`
    : `<div class="aa-queue-empty"><b>Nothing active is waiting on you.</b>${parkedReady ? ` ${parkedReady} parked project${parkedReady === 1 ? ' is' : 's are'} at a review gate. Resume one from the Parked list and it shows up here.` : ''}</div>`;
  return `<div class="aa-section" style="margin-top:0"><div class="aa-section-head"><h2>Decision queue</h2><small>Active projects only. Sorted by priority, then closest to sellable.</small></div>${body}</div>`;
}

function health(d) {
  const row = (dot, label, value) => `<div class="aa-hrow"><span><i class="aa-dot ${dot}"></i>${esc(label)}</span><span>${esc(value)}</span></div>`;
  return `<aside class="aa-health"><h2>System health</h2>${
    row(d.runnerKnown ? (d.runnerReady ? 'ok' : 'bad') : 'idle', 'Agent runner', d.runnerKnown ? (d.runnerReady ? 'On' : 'Off') : 'Unknown')}${
    row(d.deploy ? (d.deploy.ok ? 'ok' : 'bad') : 'idle', 'Site deploy', d.deploy ? (d.deploy.ok ? 'Passing' : 'Failed') : 'Unknown')}${
    row(d.visualsVerified ? 'ok' : 'idle', 'Images verified', d.visualsVerified ?? 'Unknown')}${
    row(d.releases ? 'ok' : 'idle', 'Releases', d.releases ?? 'Unknown')}${
    row(d.findings ? 'warn' : 'ok', 'Late findings', d.findings === null ? 'Unknown' : (d.findings ? `${d.findings} waiting` : 'None'))}</aside>`;
}

function parkedList(d) {
  const rows = d.projects.filter(p => isParked(p) && stageKey(p.workflow_stage) !== 'REJECTED')
    .sort((a, b) => ((PRIORITY_ORDER[a.owner_priority] ?? 3) - (PRIORITY_ORDER[b.owner_priority] ?? 3)) || (stageIndex(b.workflow_stage) - stageIndex(a.workflow_stage)));
  if (!rows.length) return '';
  return `<section class="aa-parked aa-section"><div class="aa-section-head"><h2>Parked · ${rows.length}</h2><small>Resume moves a project back into the queue and the stream.</small></div><div class="aa-parked-list">${rows.map(p => {
    const pr = price(p);
    const sub = [phaseOf(p.workflow_stage)?.label, stageLabel(p.workflow_stage), p.owner_priority || 'NORMAL', pr.set ? pr.text : 'price not set'].filter(Boolean).join(' · ');
    return `<div class="aa-prow"><div><a href="${projectUrl(p)}">${esc(p.title)}</a><small>${esc(sub)}</small></div><button class="aa-btn ghost" type="button" data-resume="${esc(p.project_id)}">Resume</button></div>`;
  }).join('')}</div></section>`;
}

function overview(d) {
  return `${kpis(d)}${stream(d)}<section class="aa-section"><div class="aa-split">${queue(d)}${health(d)}</div></section>${parkedList(d)}`;
}

// ---------- Projects ----------
function projects(d) {
  const rows = [...d.projects].sort((a, b) => (stageIndex(b.workflow_stage) - stageIndex(a.workflow_stage)) || a.project_id.localeCompare(b.project_id));
  return `<section class="aa-section"><div class="aa-section-head"><h2>All projects · ${rows.length}</h2><small>Every project, including parked and rejected.</small></div><div class="aa-table-wrap"><table class="aa-table"><thead><tr><th>Project</th><th>Phase</th><th>Stage</th><th>State</th><th>Priority</th><th>Price</th><th>Projected revenue</th><th>Updated</th></tr></thead><tbody>${rows.map(p => {
    const st = stateOf(p, d.runnerReady); const pr = price(p);
    return `<tr><td><a class="title" href="${projectUrl(p)}">${esc(p.title)}</a><br><span class="muted" style="font-size:.75rem">${esc(p.project_id)}</span></td><td>${esc(phaseOf(p.workflow_stage)?.label || '—')}</td><td>${esc(stageLabel(p.workflow_stage))}</td><td><span class="aa-state ${st.cls}">${esc(st.text)}</span></td><td><span class="aa-pri ${esc(p.owner_priority || 'NORMAL')}">${esc(p.owner_priority || 'NORMAL')}</span></td><td class="num${pr.set ? '' : ' muted'}">${esc(pr.text)}</td><td class="num${p.projected_revenue == null ? ' muted' : ''}">${esc(money(p.projected_revenue))}</td><td class="num muted">${esc(fmtDate(p.progress_updated_at || p.updated_at))}</td></tr>`;
  }).join('')}</tbody></table></div></section>`;
}

// ---------- New Idea ----------
function newIdea() {
  return `<section class="aa-section"><div class="aa-section-head"><h2>Start a new Academy idea</h2><small>New ideas start at Idea + Context, then go to Product Opportunity and the value screen before any research.</small></div><form class="aa-form" id="aa-idea-form"><div><label for="aa-idea">Idea</label><input id="aa-idea" required autocomplete="off"></div><div><label for="aa-notes">Notes (optional)</label><textarea id="aa-notes"></textarea></div><div><button class="aa-btn" id="aa-idea-submit" type="submit">Submit idea</button></div></form></section>`;
}

// ---------- Render ----------
function currentView() {
  const h = location.hash.replace('#', '');
  return ['projects', 'new'].includes(h) ? h : 'overview';
}

function render() {
  const v = currentView();
  document.getElementById('aa-nav-host').innerHTML = navHtml(v);
  title.textContent = v === 'projects' ? 'Projects' : v === 'new' ? 'New Idea' : 'Overview';
  document.title = `${title.textContent} · Academy Control | Rebel Ranch Ministries`;
  view.innerHTML = v === 'projects' ? projects(data) : v === 'new' ? newIdea() : overview(data);
  wire();
}

function wire() {
  view.querySelectorAll('[data-resume]').forEach(b => b.addEventListener('click', async () => {
    const id = b.dataset.resume;
    b.disabled = true; b.textContent = 'Resuming…';
    const { error } = await supabase.rpc('set_academy_project_parked', { p_project_id: id, p_parked: false, p_note: null });
    if (error) { b.disabled = false; b.textContent = 'Resume'; msg(error.message, true); return; }
    msg(`${id} resumed. It is back in the queue and the stream.`);
    data = await load(); render();
  }));
  const form = document.getElementById('aa-idea-form');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('aa-idea-submit');
    const idea = document.getElementById('aa-idea').value.trim();
    if (!idea) return;
    btn.disabled = true;
    const { data: row, error } = await supabase.rpc('create_academy_content_idea', { p_idea: idea, p_owner_notes: document.getElementById('aa-notes').value.trim() || null });
    btn.disabled = false;
    if (error) { msg(error.message, true); return; }
    msg(`Idea saved as ${row?.project_id || 'a new project'}.`);
    form.reset();
    data = await load();
  });
}

async function boot() {
  try {
    if (!(await requireAdmin(supabase, loading))) return;
    data = await load();
    loading.classList.add('hidden');
    render();
    try {
      const raw = sessionStorage.getItem('rrmJustCompletedReview');
      if (raw) { const [project, stage] = raw.split('|'); sessionStorage.removeItem('rrmJustCompletedReview'); msg(`Decision saved for ${project} (${stageLabel(stage)}).`); }
    } catch {}
  } catch (e) {
    console.error('Academy overview', e);
    loading.classList.remove('hidden');
    loading.classList.add('aa-error');
    loading.innerHTML = `<strong>The Overview could not load.</strong><p class="aa-note">${esc(e.message || 'Unknown error')}</p>`;
  }
}

window.addEventListener('hashchange', () => { if (data) render(); });
boot();
