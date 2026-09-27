// Academy project page: decision first, evidence on demand.
// Owner decisions 2026-09-27: one title, 5-phase bar, Park/Resume, "What's ready",
// decision box, readable evidence, agent log drawer, value screen, interaction log.
// Keeps the DOM hooks used by the completion router, research reader, final product
// acceptance and late findings modules: .asr-page .asr-status .asr-review
// .asr-review-actions [data-review] #asr-review-comment and the
// `academy-stage-review-ready` event.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { supabase } from './supabase-client.js';
import {
  STAGES, PHASES, stageKey, stageIndex, stageOf, stageLabel, phaseOf, isParked, isWaitingOnOwner,
  esc, price, money, daysSince, fmtDate, stateOf, requireAdmin
} from './academy-admin-shared.js';

const ARTIFACTS = {
  IDEA: ['project.json', 'concept.md', 'context-review.md'],
  PRODUCT_OPPORTUNITY_RESEARCH: ['product-opportunity-research.md', 'product-opportunity-research-uv-closeout.md', 'product-recommendation-scorecard.md', 'functional-decomposition.md', 'interactive-scenario-map.md', 'opportunity-funnel-map.md', 'market-positioning.md', 'pricing.md'],
  VALUE_SCREEN_REVIEW: ['product-opportunity-research.md', 'product-recommendation-scorecard.md', 'market-positioning.md', 'pricing.md'],
  RESEARCH_WORKING: ['research.md', 'master-content.md', 'sources.md', 'qa-review.md', 'revision-impact.md', 'research-uv-addendum.md', 'sources-uv-addendum.md', 'uv-gap-qa.md'],
  RESEARCH_REVIEW: ['owner-review.md', 'revision-impact.md', 'product-design-handoff.md'],
  PRODUCT_WORKING: ['product-architecture.md', 'product-manuscript.md', 'product-evidence-crosswalk.md', 'product-preservation-check.md', 'visual-production-brief.md'],
  PRODUCT_REVIEW: ['product-qa.md', 'owner-product-review.md', 'visual-production-brief.md', 'visual-production-handoff.md'],
  VISUAL_PRODUCTION: ['visual-production/production-status.md', 'visual-production/cycle-01-closeout.md', 'visual-production/cycle-02-closeout.md', 'visual-production-handoff.md', 'visual-production-brief.md'],
  FINAL_PRODUCT_REVIEW: ['final-product-qa.md', 'owner-final-product-review.md', 'visual-production/production-status.md', 'visual-production/cycle-02-closeout.md'],
  AWAITING_RELEASE: ['release-record.md'], PUBLISHING: ['release-record.md'], LIVE: ['release-record.md']
};
const REVIEW_LABELS = {
  RESEARCH_REVIEW: ['Approve research', 'Needs more research', 'Reject direction', 'Approve the research so it moves to Product Design.'],
  PRODUCT_REVIEW: ['Approve design', 'Needs more work', 'Reject concept', 'Approve the product design so it moves to visual build.'],
  FINAL_PRODUCT_REVIEW: ['Approve final product', 'Needs visual / delivery work', 'Reject product', 'Open the actual product preview, verify images and materials, then decide.']
};
const DESIGN_ON = new Set(['PRODUCT_WORKING', 'PRODUCT_REVIEW', 'VISUAL_PRODUCTION', 'FINAL_PRODUCT_REVIEW', 'AWAITING_RELEASE', 'PUBLISHING', 'LIVE']);

const params = new URLSearchParams(location.search);
const projectId = params.get('project') || '';
const requested = params.get('stage') || '';
const content = document.getElementById('asr-content');
const loading = document.getElementById('asr-loading');
const notice = document.getElementById('asr-notice');
let data, viewKey;

function msg(t, error = false) { notice.textContent = t; notice.className = `aa-notice show${error ? ' error' : ''}`; }
const current = p => (stageIndex(p.workflow_stage) >= 0 ? stageKey(p.workflow_stage) : (p.workflow_stage === 'REJECTED' ? 'REJECTED' : 'IDEA'));
const stageUrl = k => `academy-stage-review.html?project=${encodeURIComponent(projectId)}&stage=${encodeURIComponent(k)}`;
function raw(p, file) { const branch = encodeURIComponent(p.github_branch || 'main'); const path = [p.github_path, file].filter(Boolean).join('/').split('/').map(encodeURIComponent).join('/'); return `https://raw.githubusercontent.com/rebelranchfl/Organization-Website/${branch}/${path}`; }
async function file(p, f) { if (!p.github_path) return ''; try { const r = await fetch(raw(p, f), { cache: 'no-cache' }); return r.ok ? await r.text() : ''; } catch { return ''; } }

async function load() {
  const fields = 'project_id,title,learning_area,revision_number,progress_updated_at,workflow_stage,current_status,last_agent,owner_hold,archived,owner_priority,proposed_price,projected_revenue,owner_summary,progress_detail,progress_next,progress_stage,owner_review_status,github_branch,github_path';
  const [p, r, v, s, runner] = await Promise.all([
    supabase.from('academy_content_projects').select(fields).eq('project_id', projectId).single(),
    supabase.from('academy_agent_run_requests').select('id,status,agent_name,requested_at').eq('project_id', projectId).order('requested_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('academy_visual_production_jobs').select('asset_key,state,updated_at,last_error').eq('project_id', projectId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('academy_value_screens').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('academy_agent_runner_state').select('ready,last_heartbeat')
  ]);
  if (p.error) throw p.error;
  const runnerReady = !runner.error && (runner.data || []).some(x => x.ready && x.last_heartbeat && (Date.now() - new Date(x.last_heartbeat).getTime()) < 12 * 60000);
  return { project: p.data, run: r.error ? null : r.data, visualJob: v.error ? null : v.data, screen: s.error ? null : s.data, runnerReady };
}

// ---------- pieces ----------
function header(p) {
  const pr = price(p);
  const st = stateOf(p, data.runnerReady);
  document.getElementById('asr-title').textContent = p.title;
  document.getElementById('asr-subtitle').innerHTML = `${esc(p.project_id)} · ${esc(p.learning_area || 'Unassigned')} · Rev ${esc(p.revision_number || 1)} · ${pr.set ? `${esc(pr.text)}${Number(p.proposed_price) ? ' proposed' : ''}` : 'Price not set'} · <span class="aa-state ${st.cls}">${esc(st.text)}${isWaitingOnOwner(p) ? ` · ${esc(stageLabel(p.workflow_stage))}` : ''}</span>`;
  document.title = `${p.title} · Academy | Rebel Ranch Ministries`;
}

function phaseBar(p) {
  const cur = current(p), ci = stageIndex(cur), curPhase = phaseOf(cur)?.key;
  const curPhaseIdx = PHASES.findIndex(x => x.key === curPhase);
  const legacy = !data.screen;
  const cells = PHASES.map((ph, i) => {
    let cls = '', txt = 'Not started';
    if (cur === 'REJECTED') { txt = '—'; }
    else if (i < curPhaseIdx) { cls = 'done'; txt = ph.key === 'research' && p.proposed_price != null ? `Done · ${price(p).text}` : 'Done'; }
    else if (i === curPhaseIdx) { cls = 'now'; txt = isWaitingOnOwner(p) ? `${stageLabel(cur)} · your gate` : stageLabel(cur); }
    return `<div class="${cls}"><b>${esc(ph.label)}</b><span>${esc(txt)}</span></div>`;
  }).join('');
  // Older projects (no value screen) ran research first; their Product Opportunity comes after Research Review.
  const legacyPre = legacy && ci <= stageIndex('RESEARCH_REVIEW');
  const steps = STAGES.map((s, i) => {
    const valueStage = s.key === 'PRODUCT_OPPORTUNITY_RESEARCH' || s.key === 'VALUE_SCREEN_REVIEW';
    let state = i < ci ? 'done' : i === ci ? 'now' : 'future';
    let note = '';
    if (valueStage && legacyPre && i < ci) { state = 'future'; note = s.key === 'VALUE_SCREEN_REVIEW' ? ' (not run · older project)' : ' (after research · older project)'; }
    else if (s.key === 'VALUE_SCREEN_REVIEW' && legacy && i < ci) note = ' (not run · older project)';
    const done = state === 'done';
    return `<a class="pp-step ${state}${s.key === viewKey ? ' viewing' : ''}" href="${stageUrl(s.key)}">${done ? '✓ ' : ''}${esc(s.label)}${esc(note)}</a>`;
  }).join('<span class="pp-sep">›</span>');
  return `<div class="pp-phasebar">${cells}</div><nav class="pp-steps" aria-label="Stages">${steps}</nav>`;
}

function statusLine(p) {
  const cur = current(p), v = data.visualJob;
  let cls = '', title, body = '';
  if (viewKey !== cur) {
    const past = stageIndex(viewKey) < stageIndex(cur);
    cls = past ? '' : 'blocked';
    title = past ? `Viewing a finished stage: ${stageLabel(viewKey)}` : `Not reached yet: ${stageLabel(viewKey)}`;
    body = past ? 'Open the agent log below for this stage’s records.' : 'Nothing to do here yet.';
  } else if (isParked(p)) {
    cls = 'blocked'; title = 'Parked'; body = 'The agent won’t pick this up until you resume it.';
  } else if (cur === 'REJECTED') {
    cls = 'blocked'; title = 'Rejected'; body = p.progress_next || 'Forward movement is stopped. History is preserved.';
  } else if (isWaitingOnOwner(p)) {
    cls = 'owner'; title = `Waiting on you · ${stageLabel(cur)}`; body = '';
  } else if (v && ['REVISION_REQUIRED', 'FAILED'].includes(v.state) && cur === 'VISUAL_PRODUCTION') {
    cls = 'blocked'; title = 'Image work needs correction'; body = v.last_error || '';
  } else if (['AGENT_WORKING', 'APPROVED', 'NEEDS_MORE_WORK'].includes(p.current_status)) {
    title = data.runnerReady ? (p.current_status === 'AGENT_WORKING' ? 'Agent working' : 'Queued for the agent') : 'Waiting for the agent';
    body = data.runnerReady ? '' : 'Automated production is turned off, so nothing moves until it’s turned back on or the work is done by hand.';
  } else if (p.current_status === 'NEW_IDEA') {
    title = 'New idea'; body = 'Next: Product Opportunity, then the automatic value screen.';
  } else {
    title = stageLabel(cur);
  }
  const park = viewKey === cur && cur !== 'REJECTED'
    ? `<button class="aa-btn ghost" type="button" id="pp-park">${isParked(p) ? 'Resume work' : 'Park project'}</button>` : '';
  return `<section class="asr-status pp-status ${cls}"><div><h3>${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ''}</div>${park}</section>`;
}

function readyBox(p) {
  const cur = current(p);
  if (viewKey !== cur) return '';
  const main = p.owner_summary || p.progress_detail || 'No update recorded yet.';
  const next = p.progress_next && p.progress_next !== main && !isWaitingOnOwner(p) && !isParked(p) ? p.progress_next : '';
  const v = data.visualJob;
  const vis = v && ['VISUAL_PRODUCTION', 'FINAL_PRODUCT_REVIEW'].includes(cur) ? `<p class="aa-note">Latest image job: ${esc(v.asset_key || '')} · ${esc(String(v.state || '').toLowerCase().replaceAll('_', ' '))} · ${esc(fmtDate(v.updated_at))}</p>` : '';
  return `<div class="pp-box"><span class="pp-k">What’s ready for you</span><p>${esc(main)}</p>${next ? `<p class="aa-note"><b>Next:</b> ${esc(next)}</p>` : ''}${vis}<p class="aa-note">Last update ${esc(fmtDate(p.progress_updated_at))}${daysSince(p.progress_updated_at) !== null ? ` · ${daysSince(p.progress_updated_at)} days ago` : ''}</p></div>`;
}

function valueBox(p) {
  const s = data.screen;
  if (!s && p.proposed_price == null && p.projected_revenue == null) return '';
  const rows = [
    ['Price', price(p).text], ['Projected revenue', money(p.projected_revenue)],
    s ? ['Screen result', String(s.recommendation).toLowerCase().replaceAll('_', ' ')] : null,
    s ? ['Demand · confidence', `${s.demand_score} · ${s.confidence_score} (of 5)`] : null,
    s?.format_recommendation ? ['Format', s.format_recommendation] : null,
    s?.distribution ? ['Distribution', s.distribution] : null,
    s?.future_format_note ? ['Future format', s.future_format_note] : null,
    s ? ['Routed', `${s.routed_to.toLowerCase().replace('_', ' ')} · ${s.routed_reason}`] : null
  ].filter(Boolean);
  return `<div class="pp-box"><span class="pp-k">Value</span><dl class="pp-dl">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>${s?.rationale ? `<p class="aa-note">${esc(s.rationale)}</p>` : ''}${s?.competitor_summary ? `<p class="aa-note"><b>Who else sells it:</b> ${esc(s.competitor_summary)}</p>` : ''}${!s ? '<p class="aa-note">This project predates the value screen.</p>' : ''}</div>`;
}

function decisionBox(p) {
  const cur = current(p);
  if (viewKey !== cur || p.current_status !== 'READY_FOR_REVIEW') return '';
  const parked = isParked(p);
  const lock = parked ? ' disabled' : '';
  const parkedNote = parked ? '<p class="aa-note"><b>This project is parked.</b> Resume it first; the buttons unlock once it’s active.</p>' : '';
  if (cur === 'VALUE_SCREEN_REVIEW') {
    return `<section class="pp-box pp-decide" id="review-content"><span class="pp-k">Your decision</span><p class="aa-note">The value screen was borderline, so this came to you. Nothing here publishes or sells anything.</p>${parkedNote}<textarea id="pp-vs-note" class="aa-field" placeholder="Note (required to reject)"></textarea><div class="pp-btns"><button class="asr-approve" type="button" data-vs="PROCEED"${lock}>Go to research</button><button class="asr-more" type="button" data-vs="PARK"${lock}>Park</button><button class="asr-reject" type="button" data-vs="REJECT"${lock}>Reject</button></div></section>`;
  }
  const L = REVIEW_LABELS[cur];
  if (!L) return '';
  const help = cur === 'RESEARCH_REVIEW' && !data.screen ? 'Approve the research. This project predates the value-first order, so Product Opportunity (pricing and market) comes next.' : L[3];
  return `<section class="asr-review pp-box pp-decide" id="review-content"><span class="pp-k">Your decision</span><p class="aa-note">${esc(help)} Nothing here publishes or sells the product.</p>${parkedNote}<textarea id="asr-review-comment" class="aa-field" placeholder="Note (required for Needs work or Reject)"></textarea><div class="asr-review-actions pp-btns"><button class="asr-approve" data-review="APPROVE"${lock}>${esc(L[0])}</button><button class="asr-more" data-review="NEEDS_MORE_WORK"${lock}>${esc(L[1])}</button><button class="asr-reject" data-review="REJECT"${lock}>${esc(L[2])}</button></div></section>`;
}

function interactionsShell(p) {
  if (!DESIGN_ON.has(current(p))) return '';
  return `<section class="pp-box" id="pp-interactions"><div class="pp-row"><span class="pp-k">Interactions &amp; tests</span><a class="aa-note" href="academy-interaction-library.html">Open the library</a></div><div id="pp-int-body"><p class="aa-note">Loading…</p></div></section>`;
}

function drawers(p) {
  const preview = ['VISUAL_PRODUCTION', 'FINAL_PRODUCT_REVIEW'].includes(viewKey)
    ? `<details class="pp-drawer asr-heavy" id="asr-preview-lazy"><summary>Product preview <span class="aa-note">· the learner-facing product</span></summary><div id="asr-preview-host"><p class="aa-note">Opens when you expand this.</p></div></details>` : '';
  return `${preview}<details class="pp-drawer asr-heavy" id="asr-history"><summary>Decision history</summary><div class="asr-lazy-body"><p class="aa-note">Opens when you expand this.</p></div></details><details class="pp-drawer asr-heavy" id="asr-records"><summary>Agent log <span class="aa-note">· technical records for ${esc(stageLabel(viewKey))}</span></summary><div class="asr-lazy-body"><p class="aa-note">Opens when you expand this.</p></div></details>`;
}

function bottomNav() {
  const i = stageIndex(viewKey);
  if (i < 0) return '';
  const prev = STAGES[i - 1], next = STAGES[i + 1];
  return `<nav class="asr-bottom-nav">${prev ? `<a href="${stageUrl(prev.key)}">← ${esc(prev.label)}</a>` : '<a class="disabled" href="#">←</a>'}<span>${esc(stageLabel(viewKey))} · ${i + 1} of ${STAGES.length}</span>${next ? `<a href="${stageUrl(next.key)}">${esc(next.label)} →</a>` : '<a class="disabled" href="#">→</a>'}</nav>`;
}

// ---------- lazy content ----------
async function loadHistory() {
  const box = document.querySelector('#asr-history .asr-lazy-body'); if (!box || box.dataset.loaded) return;
  box.innerHTML = '<p class="aa-note">Loading…</p>';
  const q = await supabase.from('academy_content_review_events').select('decision,review_stage,created_at,comment').eq('project_id', projectId).order('created_at', { ascending: true });
  if (q.error) { box.innerHTML = `<p class="aa-note">${esc(q.error.message)}</p>`; return; }
  const rows = q.data || []; box.dataset.loaded = '1';
  box.innerHTML = rows.length ? `<div class="asr-history">${rows.map(e => `<div class="asr-history-row"><time>${esc(fmtDate(e.created_at))}</time><div><strong>${esc(stageLabel(e.review_stage))} · ${esc(String(e.decision).toLowerCase().replaceAll('_', ' '))}</strong><p>${esc(e.comment || 'No note.')}</p></div></div>`).join('')}</div>` : '<p class="aa-note">No decisions recorded yet.</p>';
}
async function loadRecords() {
  const box = document.querySelector('#asr-records .asr-lazy-body'); if (!box || box.dataset.loaded) return;
  box.innerHTML = '<p class="aa-note">Loading…</p>';
  const found = [];
  for (const f of (ARTIFACTS[viewKey] || [])) { const t = await file(data.project, f); if (t) found.push([f, t]); }
  box.dataset.loaded = '1';
  const summary = document.querySelector('#asr-records summary');
  if (summary) summary.innerHTML = `Agent log <span class="aa-note">· ${found.length} record${found.length === 1 ? '' : 's'} for ${esc(stageLabel(viewKey))}</span>`;
  box.innerHTML = found.length ? `<div class="asr-artifacts">${found.map(([f, t]) => `<details class="asr-artifact"><summary>${esc(f.split('/').pop())}</summary><pre>${esc(t)}</pre></details>`).join('')}</div>` : '<p class="aa-note">No records are stored for this stage.</p>';
}
async function loadVisualFeedback(a, host) {
  const q = await supabase.from('academy_stage_feedback').select('feedback_type,status,note,created_at,resolution_note').eq('project_id', projectId).eq('stage', 'VISUAL_PRODUCTION').order('created_at', { ascending: false });
  const rows = q.error ? [] : (q.data || []);
  host.insertAdjacentHTML('beforeend', `<section class="asr-section"><h4>Visual feedback</h4><div class="asr-feedback"><div><label for="asr-feedback-type">Type</label><select id="asr-feedback-type"><option value="CHANGE_REQUEST">Change request</option><option value="COMMENT">Comment</option><option value="APPROVAL_NOTE">Approval note</option></select></div><div><label for="asr-feedback-component">Visual / component</label><select id="asr-feedback-component"><option value="">Whole visual product</option>${a.map(x => `<option value="visual-production/${esc(x.file)}">${esc(x.label)}</option>`).join('')}</select></div><div class="wide"><label for="asr-feedback-note">What should change or be noted?</label><textarea id="asr-feedback-note"></textarea></div><button id="asr-feedback-save" type="button" class="aa-btn">Save feedback</button></div><div class="asr-feedback-list">${rows.map(r => `<div class="asr-feedback-row"><strong>${esc(String(r.feedback_type).toLowerCase().replaceAll('_', ' '))} · ${esc(String(r.status).toLowerCase())}</strong><p>${esc(r.note)}</p><small>${esc(fmtDate(r.created_at))}${r.resolution_note ? ` · ${esc(r.resolution_note)}` : ''}</small></div>`).join('') || '<p class="aa-note">No visual feedback yet.</p>'}</div></section>`);
  document.getElementById('asr-feedback-save')?.addEventListener('click', async e => {
    const note = document.getElementById('asr-feedback-note').value.trim();
    if (!note) { msg('Write what you want changed or noted.', true); return; }
    e.currentTarget.disabled = true;
    const { error } = await supabase.rpc('submit_academy_stage_feedback', { p_project_id: projectId, p_stage: 'VISUAL_PRODUCTION', p_component_key: document.getElementById('asr-feedback-component').value || null, p_feedback_type: document.getElementById('asr-feedback-type').value, p_note: note });
    if (error) { e.currentTarget.disabled = false; msg(error.message, true); return; }
    msg('Visual feedback saved.');
  });
}
async function loadPreview() {
  const host = document.getElementById('asr-preview-host'); if (!host || host.dataset.loaded) return;
  host.innerHTML = '<p class="aa-note">Loading…</p>';
  const manifest = await file(data.project, 'visual-production/preview-manifest.json');
  let a = [];
  if (manifest) { try { const j = JSON.parse(manifest); a = (Array.isArray(j) ? j : j.assets) || []; } catch {} }
  a = a.map(x => ({ label: x.label || x.file, file: x.file, description: x.description || '' }));
  if (!a.length) { host.innerHTML = '<p class="aa-note">There is no preview to open yet. Don’t approve Final Product Review until one exists.</p>'; return; }
  host.dataset.loaded = '1';
  host.innerHTML = `<div class="asr-preview-shell"><div class="asr-preview-tabs">${a.map((x, i) => `<button class="asr-preview-tab${i ? '' : ' active'}" data-file="${esc(x.file)}" data-description="${esc(x.description)}">${esc(x.label)}</button>`).join('')}</div><div class="asr-preview-toolbar"><span id="asr-preview-description" class="asr-preview-description">${esc(a[0].description)}</span><button id="asr-open-preview" class="aa-btn ghost" type="button">Open full screen</button></div><iframe id="asr-preview-frame" class="asr-preview-frame" title="Learner-facing preview"></iframe></div>`;
  async function show(f) {
    const html = await file(data.project, `visual-production/${f}`), frame = document.getElementById('asr-preview-frame');
    if (frame) frame.srcdoc = html || '<p style="padding:20px;font-family:Arial">Preview unavailable.</p>';
    document.querySelectorAll('.asr-preview-tab').forEach(b => b.classList.toggle('active', b.dataset.file === f));
    const tab = [...document.querySelectorAll('.asr-preview-tab')].find(b => b.dataset.file === f);
    if (tab) document.getElementById('asr-preview-description').textContent = tab.dataset.description || '';
    const open = document.getElementById('asr-open-preview');
    if (open) open.onclick = () => { const w = window.open(); if (w) { w.document.open(); w.document.write(html || '<p>Preview unavailable.</p>'); w.document.close(); } };
  }
  document.querySelectorAll('.asr-preview-tab').forEach(b => b.onclick = () => show(b.dataset.file));
  await show(a[0].file);
  await loadVisualFeedback(a, host);
  document.dispatchEvent(new CustomEvent('academy-product-preview-loaded', { detail: { projectId, stage: viewKey } }));
}

async function loadInteractions() {
  const body = document.getElementById('pp-int-body'); if (!body) return;
  const [types, uses] = await Promise.all([
    supabase.from('academy_interaction_types').select('id,type_key,name').eq('active', true).order('name'),
    supabase.from('academy_interaction_uses').select('id,type_id,usage_note,fit_rating,fit_note,created_at').eq('project_id', projectId).order('created_at')
  ]);
  if (types.error || uses.error) { body.innerHTML = `<p class="aa-note">${esc((types.error || uses.error).message)}</p>`; return; }
  const byId = new Map((types.data || []).map(t => [t.id, t]));
  const used = new Set((uses.data || []).map(u => u.type_id));
  const list = (uses.data || []).map(u => `<div class="pp-int"><div><b>${esc(byId.get(u.type_id)?.name || 'Interaction')}</b>${u.usage_note ? `<small>${esc(u.usage_note)}</small>` : ''}${u.fit_note ? `<small>${esc(u.fit_note)}</small>` : ''}</div><label class="aa-note">Fit <select class="aa-field pp-fit" data-use="${esc(u.id)}"><option value="">—</option>${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${u.fit_rating === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>`).join('');
  const options = (types.data || []).filter(t => !used.has(t.id)).map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
  body.innerHTML = `${list || '<p class="aa-note">No interactions logged for this project yet.</p>'}<div class="pp-int-add"><select id="pp-int-type" class="aa-field"><option value="">Add an interaction…</option>${options}</select><input id="pp-int-note" class="aa-field" placeholder="How it’s used (optional)"><button class="aa-btn ghost" type="button" id="pp-int-save">Log it</button></div>`;
  document.getElementById('pp-int-save').onclick = async () => {
    const type_id = document.getElementById('pp-int-type').value;
    if (!type_id) { msg('Pick an interaction to log.', true); return; }
    const { error } = await supabase.from('academy_interaction_uses').insert({ type_id, project_id: projectId, stage: current(data.project), usage_note: document.getElementById('pp-int-note').value.trim() || null, recorded_by: 'OWNER' });
    if (error) { msg(error.message, true); return; }
    msg('Interaction logged.'); loadInteractions();
  };
  body.querySelectorAll('.pp-fit').forEach(s => s.onchange = async () => {
    const { error } = await supabase.from('academy_interaction_uses').update({ fit_rating: s.value ? Number(s.value) : null }).eq('id', s.dataset.use);
    if (error) msg(error.message, true); else msg('Fit rating saved.');
  });
}

// ---------- wiring ----------
function releaseHeavy() {
  document.querySelectorAll('.asr-heavy').forEach(d => { d.open = false; });
  const f = document.getElementById('asr-preview-frame'); if (f) { try { f.srcdoc = ''; } catch {} }
}
function wire() {
  document.getElementById('asr-history')?.addEventListener('toggle', e => { if (e.currentTarget.open) loadHistory(); });
  document.getElementById('asr-records')?.addEventListener('toggle', e => { if (e.currentTarget.open) loadRecords(); });
  document.getElementById('asr-preview-lazy')?.addEventListener('toggle', e => { if (e.currentTarget.open) loadPreview(); });
  window.addEventListener('pagehide', releaseHeavy, { once: true });
  document.getElementById('pp-park')?.addEventListener('click', async e => {
    const b = e.currentTarget, parked = isParked(data.project);
    b.disabled = true;
    const { error } = await supabase.rpc('set_academy_project_parked', { p_project_id: projectId, p_parked: !parked, p_note: null });
    if (error) { b.disabled = false; msg(error.message, true); return; }
    msg(parked ? 'Resumed. The project is active again.' : 'Parked. It moved to the Parked list.');
    data = await load(); render();
  });
  document.querySelectorAll('[data-vs]').forEach(b => b.addEventListener('click', async () => {
    const decision = b.dataset.vs, note = document.getElementById('pp-vs-note')?.value.trim() || '';
    if (decision === 'REJECT' && !note) { msg('Add a note explaining the rejection.', true); return; }
    document.querySelectorAll('[data-vs]').forEach(x => { x.disabled = true; });
    const { error } = await supabase.rpc('decide_academy_value_screen', { p_project_id: projectId, p_decision: decision, p_note: note || null });
    if (error) { document.querySelectorAll('[data-vs]').forEach(x => { x.disabled = false; }); msg(error.message, true); return; }
    try { sessionStorage.setItem('rrmJustCompletedReview', `${projectId}|VALUE_SCREEN_REVIEW|${Date.now()}`); } catch {}
    location.assign('operations-review.html');
  }));
  loadInteractions();
}

function render() {
  const p = data.project;
  const cur = current(p);
  viewKey = stageIndex(requested) >= 0 ? stageKey(requested) : cur;
  header(p);
  content.innerHTML = `${phaseBar(p)}${statusLine(p)}<article class="asr-page pp-page"><div class="pp-grid"><div class="pp-col">${readyBox(p)}${decisionBox(p)}</div><div class="pp-col">${valueBox(p)}${interactionsShell(p)}</div></div>${drawers(p)}${bottomNav()}</article>`;
  loading.classList.add('hidden');
  content.classList.remove('hidden');
  wire();
  document.dispatchEvent(new CustomEvent('academy-stage-review-ready', { detail: { projectId, stage: viewKey } }));
}

async function init() {
  try {
    if (!projectId) { loading.innerHTML = 'No project selected. <a href="operations-review.html#projects">Open the project list</a>.'; return; }
    if (!(await requireAdmin(supabase, loading))) return;
    data = await load();
    render();
  } catch (e) {
    loading.classList.add('aa-error');
    loading.textContent = 'The project could not be loaded.';
    msg(e.message, true);
  }
}
init();
