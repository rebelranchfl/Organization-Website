// Social Content Hub v2 — owner control panel for every Rebel Ranch Ministries program.
// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Social Content Hub — verify system + all-programs full-control v2 (2026-09-25)
// Security boundary is the database (RLS: private.is_admin()); the UI role check is convenience only.
import { supabase } from './supabase-client.js';

const BUCKET = 'social-media';
const ITEM_STATUSES = ['Idea','Draft','Planned','Needs Review','Needs Edit','Visual Ready','Approved','Scheduled','Posted','Rejected','Archived'];
const IMAGE_STATUSES = ['Not Needed','Prompt Needed','Ready for Image','Generating','Needs Review','Revision Needed','Approved'];
const FORMATS = ['Standalone','Reel','Reel + Standalone','Carousel','Story','Text Only','Video'];
const WORKERS = ['Unassigned','Owner','Claude','ChatGPT','Other'];
const LIST_STATUSES = ['Active','Paused','Archived'];
const CAMPAIGN_STATUSES = ['Planned','Active','Paused','Completed','Archived'];
const OUTREACH_STATUSES = ['Prospect','Prospect Approved','Researched','Draft','Needs Edit','Approved','Sent','Replied','Follow-Up','In Conversation','Partner','Declined','Rejected','Archived'];
const OUTREACH_CATEGORIES = ['A — Fund request','B — Service/resource exchange','C — Reduced/free service RRM provides','General alignment','Program affiliation','Other'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const PLATFORMS = ['Facebook','Instagram','YouTube','TikTok','X','LinkedIn','Pinterest','Nextdoor','Email','Website','Other'];
const CHANNEL_KINDS = ['Page','Group','Profile','Account','Email List','Other'];
const LEARNING_STATUSES = ['Proposed','Approved','Applied','Rejected','Noted'];
const POST_STATUSES = ['Published','Scheduled','Failed','Removed'];
const ASSET_STATUSES = ['Planned','Visual Ready','Needs Review','Approved','Archived'];

const S = {
  programs: [], purposes: [], campaigns: [], links: [], channels: [],
  items: [], assets: [], reels: [], frames: [], history: [], outreach: [], learnings: [], activity: [], messages: [], settings: [], areas: [], ptypes: [], needs: [], templates: [],
  signed: {}, selectedReelId: null, tab: 'content', preset: 'all',
};

const $ = (id) => document.getElementById(id);
const notice = $('notice');
function msg(text, type = '') { notice.textContent = text; notice.className = `notice visible ${type}`.trim(); clearTimeout(msg.t); if (type === 'success') msg.t = setTimeout(clearMsg, 5000); }
function clearMsg() { notice.className = 'notice'; notice.textContent = ''; }
function esc(v = '') { return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function byId(list, id) { return list.find((x) => String(x.id) === String(id)); }
function nameOf(list, id, key = 'name') { const r = byId(list, id); return r ? r[key] : ''; }
function fmtDate(v) { if (!v) return '—'; const d = new Date(v); return d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
function toLocalInput(v) { if (!v) return ''; const d = new Date(v); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }
function fromLocalInput(v) { return v ? new Date(v).toISOString() : null; }
function actor() { try { return localStorage.getItem('sch-actor') || 'Owner'; } catch { return 'Owner'; } }
function friendlyError(e) {
  const m = e?.message || String(e);
  if (e?.code === '23503' || /foreign key/i.test(m)) return 'This is still being used by other records. Pause or archive it instead, or move those records first.';
  if (e?.code === '23505' || /duplicate key/i.test(m)) return 'Something with that name already exists. Use a different name.';
  if (/check constraint/i.test(m) && /url|link/i.test(m)) return 'Links must start with http:// or https://';
  if (/check constraint/i.test(m) && /code/i.test(m)) return 'Program code must be 2–6 capital letters or numbers (example: CS).';
  return m;
}

async function log(entity_type, entity_id, action, detail = null) {
  const { data } = await supabase.from('social_activity_log').insert({ entity_type, entity_id: entity_id == null ? null : String(entity_id), action, detail, actor: actor() }).select().single();
  if (data) S.activity.unshift(data);
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------
async function loadAll() {
  const q = (t, order = 'id', asc = true) => supabase.from(t).select('*').order(order, { ascending: asc });
  const res = await Promise.all([
    q('social_programs', 'sort_order'), q('social_purposes', 'sort_order'), q('social_campaigns', 'created_at', false),
    q('social_links', 'label'), q('social_channels', 'sort_order'), q('social_content_items', 'updated_at', false),
    q('social_content_assets', 'id'), q('social_reels', 'created_at', false),
    supabase.from('social_post_history').select('*').order('published_at', { ascending: false }).limit(300),
    q('social_outreach', 'ref'), q('social_learnings', 'created_at', false),
    supabase.from('social_activity_log').select('*').order('created_at', { ascending: false }).limit(200),
    q('social_outreach_messages', 'created_at'), q('social_settings', 'sort_order'),
    q('social_service_areas', 'name'), q('social_prospect_types', 'name'), q('social_needs', 'category'), q('social_templates', 'name'),
  ]);
  const err = res.find((r) => r.error)?.error; if (err) throw err;
  [S.programs, S.purposes, S.campaigns, S.links, S.channels, S.items, S.assets, S.reels, S.history, S.outreach, S.learnings, S.activity, S.messages, S.settings, S.areas, S.ptypes, S.needs, S.templates] = res.map((r) => r.data || []);
  await signAssets();
  renderAll();
  await loadFrames();
}

async function signAssets() {
  const paths = S.assets.map((a) => a.storage_path).filter((p) => p && !S.signed[p]);
  if (!paths.length) return;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 6);
  (data || []).forEach((d) => { if (d.signedUrl) S.signed[d.path] = d.signedUrl; });
}
function assetUrl(a) { if (!a) return ''; if (a.storage_path) return S.signed[a.storage_path] || ''; return a.preview_path || ''; }
function itemAssets(id) { return S.assets.filter((a) => a.content_item_id === id && a.asset_status !== 'Archived'); }
function mainAsset(id) { const list = itemAssets(id); return list.find((a) => a.asset_status === 'Approved') || list[0]; }
function itemLink(i) { return i.link_url || nameOf(S.links, i.link_id, 'url') || ''; }
function readyToPost(i) { return !i.is_paused && i.status === 'Approved' && ['Approved', 'Not Needed'].includes(i.image_status); }
function postText(i) {
  const link = itemLink(i); let t = (i.caption || '').trim();
  if (link && !t.includes(link)) t += `\n\n${link}`;
  if (i.hashtags) t += `\n\n${i.hashtags.trim()}`;
  return t;
}

// ---------------------------------------------------------------------------
// Generic modal form
// ---------------------------------------------------------------------------
const modal = $('modal'), modalBody = $('modal-body'), modalTitle = $('modal-title');
function closeModal() { modal.classList.remove('open'); modalBody.replaceChildren(); document.body.style.overflow = ''; }
$('modal-close').onclick = closeModal;
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

function refOptions(ref, current) {
  const list = { programs: S.programs, purposes: S.purposes, campaigns: S.campaigns, links: S.links, channels: S.channels }[ref] || [];
  const label = (r) => ref === 'links' ? `${r.label} — ${r.url}` : r.name;
  return list.filter((r) => !['Archived', 'Retired'].includes(r.status) || String(r.id) === String(current))
    .map((r) => ({ value: String(r.id), label: label(r) + (r.status && r.status !== 'Active' ? ` (${r.status})` : '') }));
}

function fieldHtml(f, v) {
  const id = `f-${f.key}`; const req = f.required ? ' required' : '';
  const help = f.help ? `<small class="help">${esc(f.help)}</small>` : '';
  const wide = f.wide || f.type === 'textarea' || f.type === 'multi' ? ' wide' : '';
  let input = '';
  if (f.type === 'textarea') input = `<textarea id="${id}" rows="${f.rows || 5}"${req}>${esc(v ?? '')}</textarea>`;
  else if (f.type === 'select' || f.type === 'ref') {
    const opts = f.type === 'ref' ? refOptions(f.ref, v) : f.options.map((o) => ({ value: o, label: o }));
    input = `<select id="${id}"${req}>${f.required ? '' : '<option value="">— none —</option>'}${opts.map((o) => `<option value="${esc(o.value)}"${String(v ?? '') === o.value ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
  } else if (f.type === 'multi') {
    const cur = (v || []).map(String); const opts = refOptions(f.ref, null);
    input = `<div class="multi" id="${id}">${opts.map((o) => `<label class="check"><input type="checkbox" value="${esc(o.value)}"${cur.includes(o.value) ? ' checked' : ''}> ${esc(o.label)}</label>`).join('')}</div>`;
  } else if (f.type === 'bool') input = `<label class="check"><input id="${id}" type="checkbox"${v ? ' checked' : ''}> ${esc(f.checkLabel || 'Yes')}</label>`;
  else if (f.type === 'datetime') input = `<input id="${id}" type="datetime-local" value="${esc(toLocalInput(v))}">`;
  else if (f.type === 'date') input = `<input id="${id}" type="date" value="${esc(v || '')}">`;
  else if (f.type === 'number') input = `<input id="${id}" type="number" value="${esc(v ?? '')}"${f.min != null ? ` min="${f.min}"` : ''}${f.max != null ? ` max="${f.max}"` : ''}>`;
  else input = `<input id="${id}" type="${f.type === 'url' ? 'url' : 'text'}" value="${esc(v ?? '')}"${req}${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''}>`;
  return `<div class="form-field${wide}"><label for="${id}">${esc(f.label)}${f.required ? ' *' : ''}</label>${input}${help}</div>`;
}

function readField(f) {
  const el = $(`f-${f.key}`); if (!el) return undefined;
  if (f.type === 'multi') return [...el.querySelectorAll('input:checked')].map((c) => Number(c.value));
  if (f.type === 'bool') return el.checked;
  if (f.type === 'datetime') return fromLocalInput(el.value);
  if (f.type === 'number') return el.value === '' ? null : Number(el.value);
  if (f.type === 'ref') return el.value === '' ? null : Number(el.value);
  const t = el.value.trim(); return t === '' ? null : t;
}

function openForm({ title, fields, values = {}, onSave, onDelete, extra, saveLabel = 'Save' }) {
  modalTitle.textContent = title;
  modalBody.innerHTML = `<form id="modal-form" class="form-grid" novalidate>${fields.map((f) => fieldHtml(f, values[f.key])).join('')}</form><div id="modal-extra"></div><div class="modal-actions"><button type="button" class="button primary" id="modal-save">${esc(saveLabel)}</button><button type="button" class="button" id="modal-cancel">Cancel</button>${onDelete ? '<button type="button" class="button danger" id="modal-delete">Delete</button>' : ''}</div>`;
  if (extra) extra($('modal-extra'));
  $('modal-cancel').onclick = closeModal;
  $('modal-save').onclick = async () => {
    const out = {}; for (const f of fields) { const v = readField(f); if (v !== undefined) out[f.key] = v; }
    const missing = fields.find((f) => f.required && (out[f.key] == null || out[f.key] === ''));
    if (missing) { msg(`${missing.label} is required.`, 'error'); return; }
    const btn = $('modal-save'); btn.disabled = true;
    try { if (await onSave(out) !== false) closeModal(); } catch (e) { msg(friendlyError(e), 'error'); } finally { btn.disabled = false; }
  };
  if (onDelete) $('modal-delete').onclick = async () => { if (!confirm('Delete this permanently? This cannot be undone.')) return; try { await onDelete(); closeModal(); } catch (e) { msg(friendlyError(e), 'error'); } };
  modal.classList.add('open'); document.body.style.overflow = 'hidden';
  modalBody.querySelector('input,textarea,select')?.focus();
}

// Save helpers
async function saveRow(table, list, id, patch, label) {
  if (id != null) {
    const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single(); if (error) throw error;
    S[list] = S[list].map((r) => (String(r.id) === String(id) ? data : r)); await log(table, id, 'updated', label); return data;
  }
  const { data, error } = await supabase.from(table).insert(patch).select().single(); if (error) throw error;
  S[list].unshift(data); await log(table, data.id, 'created', label); return data;
}
async function deleteRow(table, list, id, label) {
  const { error } = await supabase.from(table).delete().eq('id', id); if (error) throw error;
  S[list] = S[list].filter((r) => String(r.id) !== String(id)); await log(table, id, 'deleted', label);
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
document.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => setTab(b.dataset.tab); });
function setTab(tab) {
  S.tab = tab;
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('hidden', p.id !== `tab-${tab}`));
  try { history.replaceState(null, '', `#${tab}`); } catch { /* ignore */ }
  renderTab();
}
function renderTab() {
  ({ content: renderContent, schedule: renderSchedule, outreach: renderOutreach, results: renderResults, setup: renderSetup, activity: renderActivity })[S.tab]?.();
}
function renderAll() { fillFilters(); renderTab(); renderCounts(); }
function renderCounts() {
  const ready = S.items.filter(readyToPost).length;
  const needImg = S.items.filter((i) => !i.is_paused && ['Prompt Needed', 'Ready for Image', 'Revision Needed'].includes(i.image_status) && !['Posted', 'Archived', 'Rejected'].includes(i.status)).length;
  const review = S.items.filter((i) => !i.is_paused && (['Idea', 'Draft', 'Needs Review', 'Needs Edit'].includes(i.status) || i.image_status === 'Needs Review') && !['Posted', 'Archived', 'Rejected'].includes(i.status)).length;
  const oCount = (k) => S.outreach.filter((o) => !o.is_paused && OUTREACH_PRESETS[k](o)).length;
  $('overview').innerHTML = [
    ['Posts ready to post', ready, 'content', 'ready'], ['Posts needing an image', needImg, 'content', 'image'], ['Posts to review', review, 'content', 'review'],
    ['Prospects to review', oCount('prospects'), 'outreach', 'prospects'], ['Messages to review', oCount('review'), 'outreach', 'review'],
    ['Ready to send', oCount('send'), 'outreach', 'send'], ['Replies', oCount('replies'), 'outreach', 'replies'], ['Follow-ups due', oCount('followup'), 'outreach', 'followup'],
  ].map(([l, n, tab, p]) => `<button type="button" class="metric metric-button${n ? ' has' : ''}" data-go="${tab}" data-p="${p}"><span>${l}</span><strong>${n}</strong></button>`).join('');
  $('overview').querySelectorAll('[data-go]').forEach((b) => { b.onclick = () => {
    if (b.dataset.go === 'content') S.preset = b.dataset.p;
    else { S.oPreset = b.dataset.p; $('o-status').value = 'all'; }
    setTab(b.dataset.go);
  }; });
}

// ---------------------------------------------------------------------------
// Content tab
// ---------------------------------------------------------------------------
const F = { program: $('c-program'), purpose: $('c-purpose'), campaign: $('c-campaign'), status: $('c-status'), image: $('c-image'), channel: $('c-channel'), search: $('c-search'), paused: $('c-paused') };
function fillSelect(sel, opts, allLabel) { const cur = sel.value; sel.innerHTML = `<option value="all">${allLabel}</option>` + opts.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join(''); if ([...sel.options].some((o) => o.value === cur)) sel.value = cur; }
function fillFilters() {
  const lst = (arr) => arr.map((r) => ({ value: String(r.id), label: r.name + (r.status && r.status !== 'Active' ? ` (${r.status})` : '') }));
  fillSelect(F.program, lst(S.programs), 'All programs'); fillSelect(F.purpose, lst(S.purposes), 'All purposes');
  fillSelect(F.campaign, lst(S.campaigns), 'All campaigns'); fillSelect(F.channel, lst(S.channels.filter((c) => c.status !== 'Archived')), 'All channels');
  fillSelect(F.status, ITEM_STATUSES.map((s) => ({ value: s, label: s })), 'All statuses'); fillSelect(F.image, IMAGE_STATUSES.map((s) => ({ value: s, label: s })), 'All image states');
  fillSelect($('o-program'), lst(S.programs), 'All programs'); fillSelect($('o-status'), OUTREACH_STATUSES.map((s) => ({ value: s, label: s })), 'All statuses');
  fillSelect($('o-category'), OUTREACH_CATEGORIES.map((s) => ({ value: s, label: s })), 'All categories');
}
Object.values(F).forEach((el) => el.addEventListener(el.tagName === 'INPUT' && el.type !== 'checkbox' ? 'input' : 'change', () => { S.preset = 'all'; renderContent(); }));
document.querySelectorAll('[data-preset]').forEach((b) => { b.onclick = () => { S.preset = b.dataset.preset; renderContent(); }; });

function presetMatch(i) {
  switch (S.preset) {
    case 'ready': return readyToPost(i);
    case 'image': return ['Prompt Needed', 'Ready for Image', 'Revision Needed', 'Generating'].includes(i.image_status) && !['Posted', 'Archived', 'Rejected'].includes(i.status);
    case 'review': return (['Idea', 'Draft', 'Needs Review', 'Needs Edit'].includes(i.status) || i.image_status === 'Needs Review') && !['Posted', 'Archived', 'Rejected'].includes(i.status);
    case 'scheduled': return i.status === 'Scheduled' || (!!i.scheduled_for && i.status !== 'Posted');
    case 'posted': return i.status === 'Posted';
    default: return true;
  }
}
function filteredItems() {
  const q = F.search.value.trim().toLowerCase(); const v = (el) => el.value;
  return S.items.filter((i) => (F.paused.checked || !i.is_paused)
    && (S.preset !== 'all' || !['Archived'].includes(i.status) || v(F.status) === 'Archived')
    && (v(F.program) === 'all' || String(i.program_id) === v(F.program))
    && (v(F.purpose) === 'all' || String(i.purpose_id) === v(F.purpose))
    && (v(F.campaign) === 'all' || String(i.campaign_id) === v(F.campaign))
    && (v(F.status) === 'all' || i.status === v(F.status))
    && (v(F.image) === 'all' || i.image_status === v(F.image))
    && (v(F.channel) === 'all' || (i.channel_ids || []).map(String).includes(v(F.channel)))
    && presetMatch(i)
    && (!q || [i.id, i.title, i.goal, i.purpose, i.primary_message, i.caption, i.cta, i.notes, i.audience].some((x) => String(x || '').toLowerCase().includes(q))))
    .sort((a, b) => (a.scheduled_for || '9999').localeCompare(b.scheduled_for || '9999') || (a.priority - b.priority) || String(b.updated_at).localeCompare(String(a.updated_at)));
}

function renderContent() {
  document.querySelectorAll('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === S.preset)));
  const list = filteredItems(); const cards = $('cards'); cards.replaceChildren();
  $('c-count').textContent = `${list.length} of ${S.items.length} posts`;
  if (!list.length) { cards.innerHTML = '<div class="empty">Nothing matches. Change the filters or add new content.</div>'; renderReels(); return; }
  for (const i of list) cards.append(itemCard(i));
  renderReels();
}

function chip(text, cls = '') { return text ? `<span class="chip ${cls}">${esc(text)}</span>` : ''; }
function itemCard(i) {
  const a = mainAsset(i.id); const url = assetUrl(a); const n = itemAssets(i.id).length;
  const chans = (i.channel_ids || []).map((id) => nameOf(S.channels, id)).filter(Boolean);
  const card = document.createElement('article'); card.className = `card${i.is_paused ? ' paused' : ''}`;
  card.innerHTML = `<div class="visual">${url ? `<img src="${esc(url)}" alt="${esc(a.alt_text || i.title)}" loading="lazy">` : `<div class="visual-empty"><strong>${i.image_needed ? 'No image yet' : 'Text-only post'}</strong>${i.image_needed ? esc(i.image_status) : ''}</div>`}<span class="status-tag">${esc(i.is_paused ? 'Paused' : i.status)}</span>${n > 1 ? `<span class="count-tag">${n} images</span>` : ''}</div>
  <div class="card-body"><h2>${esc(i.title)}</h2><div class="asset-id">${esc(i.id)}${i.scheduled_for ? ` • 📅 ${esc(fmtDate(i.scheduled_for))}` : ''}</div>
  <div class="chips">${chip(i.program)}${chip(nameOf(S.purposes, i.purpose_id), 'alt')}${chip(i.campaign !== 'General' ? i.campaign : '', 'soft')}${chip(`Image: ${i.image_status}`, i.image_status === 'Approved' || i.image_status === 'Not Needed' ? 'ok' : 'warn')}${i.assigned_to !== 'Unassigned' ? chip(`Assigned: ${i.assigned_to}`, 'soft') : ''}${readyToPost(i) ? chip('Ready to post', 'ok') : ''}</div>
  <div class="copy"><h3>Post text</h3><p class="caption">${esc(postText(i) || '—')}</p></div>
  ${i.image_needed && i.image_prompt && i.image_status !== 'Approved' ? `<div class="copy"><h3>Image prompt for ChatGPT</h3><p class="caption prompt">${esc(i.image_prompt)}</p></div>` : ''}
  <div class="meta"><div><strong>Channels</strong><span>${esc(chans.join(', ') || 'None picked yet')}</span></div><div><strong>Call to action</strong><span>${esc(i.cta || '—')}</span></div></div>
  <div class="actions">
    <button class="button small primary" data-a="copy">Copy post</button>
    ${url ? `<a class="button small" href="${esc(url)}" download target="_blank" rel="noopener">Open image</a>` : ''}
    ${i.image_prompt ? '<button class="button small" data-a="prompt">Copy image prompt</button>' : ''}
    <button class="button small" data-a="upload">Upload image</button>
    <button class="button small" data-a="edit">Edit</button>
    ${i.status !== 'Approved' && i.status !== 'Posted' ? '<button class="button small" data-a="approve">Approve</button>' : ''}
    <button class="button small" data-a="schedule">Schedule</button>
    <button class="button small" data-a="posted">Mark posted</button>
    <button class="button small" data-a="pause">${i.is_paused ? 'Resume' : 'Pause'}</button>
    <button class="button small" data-a="dup">Duplicate</button>
    <button class="button small" data-a="reel">Add to reel</button>
  </div></div>`;
  const on = (a, fn) => { const b = card.querySelector(`[data-a="${a}"]`); if (b) b.onclick = fn; };
  on('copy', async () => { await navigator.clipboard.writeText(postText(i)); msg(`${i.id} post text copied.`, 'success'); });
  on('prompt', async () => { await navigator.clipboard.writeText(i.image_prompt); msg('Image prompt copied — paste it into ChatGPT.', 'success'); });
  on('upload', () => pickUpload(i));
  on('edit', () => openItemForm(i));
  on('approve', () => patchItem(i, { status: 'Approved' }, 'approved'));
  on('schedule', () => openScheduleForm(i));
  on('posted', () => openPostedForm(i));
  on('pause', () => patchItem(i, { is_paused: !i.is_paused }, i.is_paused ? 'resumed' : 'paused'));
  on('dup', () => duplicateItem(i));
  on('reel', () => addToReel(i.id));
  return card;
}

async function patchItem(i, patch, label) {
  try { await saveRow('social_content_items', 'items', i.id, patch, label); renderContent(); renderCounts(); if (S.tab === 'schedule') renderSchedule(); msg(`${i.id} ${label}.`, 'success'); }
  catch (e) { msg(friendlyError(e), 'error'); }
}

const ITEM_FIELDS = [
  { key: 'title', label: 'Title', required: true, wide: true },
  { key: 'program_id', label: 'Program', type: 'ref', ref: 'programs', required: true },
  { key: 'purpose_id', label: 'Purpose', type: 'ref', ref: 'purposes' },
  { key: 'campaign_id', label: 'Campaign', type: 'ref', ref: 'campaigns' },
  { key: 'audience', label: 'Audience', placeholder: 'Everyone, parents, sellers…' },
  { key: 'status', label: 'Status', type: 'select', options: ITEM_STATUSES, required: true },
  { key: 'format', label: 'Format', type: 'select', options: FORMATS, required: true },
  { key: 'caption', label: 'Post text (caption)', type: 'textarea', rows: 9 },
  { key: 'cta', label: 'Call to action' },
  { key: 'hashtags', label: 'Hashtags', placeholder: '#GilchristCounty #BuyLocal' },
  { key: 'link_id', label: 'Link (from your link library)', type: 'ref', ref: 'links', help: 'Add or change links in Setup → Links.' },
  { key: 'link_url', label: 'Or a one-off link', type: 'url', placeholder: 'https://…' },
  { key: 'channel_ids', label: 'Where it goes (channels)', type: 'multi', ref: 'channels' },
  { key: 'scheduled_for', label: 'Scheduled for', type: 'datetime' },
  { key: 'priority', label: 'Priority (1 = highest)', type: 'number', min: 1, max: 5 },
  { key: 'assigned_to', label: 'Who is working on it', type: 'select', options: WORKERS, required: true },
  { key: 'image_needed', label: 'Image', type: 'bool', checkLabel: 'This post needs an image' },
  { key: 'image_status', label: 'Image status', type: 'select', options: IMAGE_STATUSES, required: true },
  { key: 'image_prompt', label: 'Image prompt for ChatGPT', type: 'textarea', rows: 4 },
  { key: 'goal', label: 'Goal (short)' },
  { key: 'purpose', label: 'Why this post exists', type: 'textarea', rows: 3 },
  { key: 'primary_message', label: 'Main message', type: 'textarea', rows: 3 },
  { key: 'notes', label: 'Notes', type: 'textarea', rows: 3 },
];

function openItemForm(i = null) {
  const defaults = { status: 'Draft', format: 'Standalone', assigned_to: 'Unassigned', image_needed: true, image_status: 'Prompt Needed', priority: 3, audience: 'Everyone', channel_ids: S.channels.filter((c) => c.name === 'Rebel Ranch Facebook Page').map((c) => c.id) };
  openForm({
    title: i ? `Edit ${i.id}` : 'New content', fields: ITEM_FIELDS, values: i || defaults,
    onSave: async (v) => {
      if (!v.image_needed && v.image_status === 'Prompt Needed') v.image_status = 'Not Needed';
      if (v.scheduled_for && !(await weeklyLimitOk({ ...(i || {}), ...v }))) return false;
      const row = await saveRow('social_content_items', 'items', i?.id ?? null, v, v.title);
      renderContent(); renderCounts(); msg(`${row.id} saved.`, 'success');
    },
    onDelete: i ? async () => {
      const paths = S.assets.filter((a) => a.content_item_id === i.id && a.storage_path).map((a) => a.storage_path);
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      await deleteRow('social_content_items', 'items', i.id, i.title);
      S.assets = S.assets.filter((a) => a.content_item_id !== i.id); renderContent(); renderCounts(); msg(`${i.id} deleted.`, 'success');
    } : null,
    extra: i ? (el) => renderAssetManager(el, i) : null,
  });
}

async function weeklyLimitOk(item) {
  const p = byId(S.purposes, item.purpose_id); if (!p || p.weekly_limit == null || !item.scheduled_for) return true;
  const d = new Date(item.scheduled_for); const start = new Date(d); start.setDate(d.getDate() - ((d.getDay() + 6) % 7)); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(start.getDate() + 7);
  const count = S.items.filter((x) => x.id !== item.id && String(x.purpose_id) === String(p.id) && x.scheduled_for && new Date(x.scheduled_for) >= start && new Date(x.scheduled_for) < end).length;
  if (count >= p.weekly_limit) return confirm(`Heads up: "${p.name}" has a limit of ${p.weekly_limit} per week, and ${count} already scheduled that week. Schedule anyway?`);
  return true;
}

function renderAssetManager(el, i) {
  const list = S.assets.filter((a) => a.content_item_id === i.id);
  el.innerHTML = `<div class="asset-manager"><h3>Images for this post</h3><div class="asset-grid">${list.map((a) => `<div class="asset" data-id="${a.id}">${assetUrl(a) ? `<img src="${esc(assetUrl(a))}" alt="">` : `<div class="visual-empty small">${esc(a.master_filename || 'No preview')}</div>`}<select data-k="status">${ASSET_STATUSES.map((s) => `<option${s === a.asset_status ? ' selected' : ''}>${s}</option>`).join('')}</select><div class="actions">${assetUrl(a) ? `<a class="button small" href="${esc(assetUrl(a))}" target="_blank" rel="noopener" download>Open</a>` : ''}<button type="button" class="button small danger" data-k="del">Remove</button></div>${a.notes ? `<small>${esc(a.notes)}</small>` : ''}</div>`).join('') || '<div class="empty">No images yet.</div>'}</div><button type="button" class="button" id="asset-upload">Upload image or video</button></div>`;
  el.querySelectorAll('.asset').forEach((box) => {
    const a = byId(S.assets, box.dataset.id);
    box.querySelector('[data-k="status"]').onchange = async (e) => {
      try {
        await saveRow('social_content_assets', 'assets', a.id, { asset_status: e.target.value }, `image ${e.target.value}`);
        if (e.target.value === 'Approved' && i.image_status !== 'Approved') { await saveRow('social_content_items', 'items', i.id, { image_status: 'Approved' }, 'image approved'); i.image_status = 'Approved'; }
        renderContent(); msg('Image status saved.', 'success');
      } catch (err) { msg(friendlyError(err), 'error'); }
    };
    box.querySelector('[data-k="del"]').onclick = async () => {
      if (!confirm('Remove this image?')) return;
      try { if (a.storage_path) await supabase.storage.from(BUCKET).remove([a.storage_path]); await deleteRow('social_content_assets', 'assets', a.id, a.master_filename); renderAssetManager(el, i); renderContent(); }
      catch (err) { msg(friendlyError(err), 'error'); }
    };
  });
  $('asset-upload').onclick = () => pickUpload(i, () => renderAssetManager(el, i));
}

function pickUpload(i, after) {
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*,video/mp4,video/quicktime'; input.multiple = true;
  input.onchange = async () => {
    const files = [...input.files]; if (!files.length) return;
    msg(`Uploading ${files.length} file(s)…`);
    try {
      for (const file of files) {
        const safe = file.name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-');
        const path = `items/${i.id}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false }); if (error) throw error;
        const kind = file.type.startsWith('video') ? 'video' : 'image';
        await saveRow('social_content_assets', 'assets', null, { content_item_id: i.id, asset_kind: kind, asset_status: 'Needs Review', master_filename: file.name, storage_path: path }, `uploaded ${file.name}`);
      }
      const next = { image_needed: true }; if (!['Approved'].includes(i.image_status)) next.image_status = 'Needs Review';
      await saveRow('social_content_items', 'items', i.id, next, 'image uploaded');
      await signAssets(); renderContent(); renderCounts(); after?.();
      msg(`Uploaded. Open Edit on ${i.id} to approve the image.`, 'success');
    } catch (e) { msg(friendlyError(e), 'error'); }
  };
  input.click();
}

async function duplicateItem(i) {
  const skip = ['id', 'created_at', 'updated_at', 'program', 'campaign'];
  const copy = Object.fromEntries(Object.entries(i).filter(([k]) => !skip.includes(k)));
  Object.assign(copy, { title: `${i.title} (copy)`, status: 'Draft', scheduled_for: null, source_ref: `copy of ${i.id}` });
  try { const row = await saveRow('social_content_items', 'items', null, copy, `duplicated from ${i.id}`); renderContent(); msg(`Created ${row.id}. Its images were not copied.`, 'success'); }
  catch (e) { msg(friendlyError(e), 'error'); }
}

function openScheduleForm(i) {
  openForm({
    title: `Schedule ${i.id}`, saveLabel: 'Save schedule',
    fields: [{ key: 'scheduled_for', label: 'Post on', type: 'datetime', required: true }, { key: 'channel_ids', label: 'Channels', type: 'multi', ref: 'channels' }, { key: 'assigned_to', label: 'Who will post it', type: 'select', options: WORKERS, required: true }],
    values: i,
    onSave: async (v) => { if (!(await weeklyLimitOk({ ...i, ...v }))) return false; await saveRow('social_content_items', 'items', i.id, v, `scheduled ${fmtDate(v.scheduled_for)}`); renderContent(); renderCounts(); if (S.tab === 'schedule') renderSchedule(); msg(`${i.id} scheduled.`, 'success'); },
  });
}

function openPostedForm(i) {
  const firstCh = (i.channel_ids || [])[0] ?? null;
  openForm({
    title: `Record a post — ${i.id}`, saveLabel: 'Save',
    fields: [
      { key: 'channel_id', label: 'Channel', type: 'ref', ref: 'channels', required: true },
      { key: 'post_status', label: 'What happened', type: 'select', options: POST_STATUSES, required: true, help: '"Scheduled" = queued in Meta Business Suite; "Published" = live now.' },
      { key: 'published_at', label: 'Date/time (live or scheduled)', type: 'datetime', required: true },
      { key: 'post_url', label: 'Post link (optional)', type: 'url' },
      { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 },
    ],
    values: { channel_id: firstCh, post_status: 'Published', published_at: new Date().toISOString() },
    extra: (el) => {
      const show = () => { const c = byId(S.channels, $('f-channel_id')?.value); el.innerHTML = c?.posting_rules ? `<div class="rules"><h3>Posting rules for ${esc(c.name)}</h3><pre>${esc(c.posting_rules)}</pre></div>` : ''; };
      $('f-channel_id').addEventListener('change', show); show();
    },
    onSave: async (v) => {
      const platform = byId(S.channels, v.channel_id)?.platform || 'Other';
      const { data, error } = await supabase.from('social_post_history').insert({ ...v, content_item_id: i.id, platform, posted_by: actor() }).select().single(); if (error) throw error;
      S.history.unshift(data);
      await saveRow('social_content_items', 'items', i.id, { status: v.post_status === 'Published' ? 'Posted' : v.post_status === 'Scheduled' ? 'Scheduled' : i.status, ...(v.post_status === 'Scheduled' && !i.scheduled_for ? { scheduled_for: v.published_at } : {}) }, `${v.post_status.toLowerCase()} on ${nameOf(S.channels, v.channel_id)}`);
      renderContent(); renderCounts(); if (S.tab === 'schedule') renderSchedule(); msg(`${i.id} recorded as ${v.post_status} on ${nameOf(S.channels, v.channel_id)}.`, 'success');
    },
  });
}
$('new-content').onclick = () => openItemForm();

// Reel builder (kept from v1)
const reelSelect = $('reel-select');
reelSelect.onchange = async () => { S.selectedReelId = reelSelect.value || null; await loadFrames(); };
$('create-reel').onclick = async () => {
  const title = $('new-reel-title').value.trim(); if (!title) { msg('Give the reel a title first.', 'error'); return; }
  const prog = F.program.value !== 'all' ? nameOf(S.programs, F.program.value) : 'Rebel Ranch Ministries';
  try { const r = await saveRow('social_reels', 'reels', null, { program: prog, title, objective: $('reel-objective').value.trim() || null, cta: $('reel-cta').value.trim() || null }, title); S.selectedReelId = r.id; ['new-reel-title', 'reel-objective', 'reel-cta'].forEach((k) => { $(k).value = ''; }); renderReels(); await loadFrames(); msg('Reel created. Use "Add to reel" on posts to build it.', 'success'); }
  catch (e) { msg(friendlyError(e), 'error'); }
};
function renderReels() { const cur = S.selectedReelId; reelSelect.innerHTML = '<option value="">Select a reel</option>' + S.reels.map((r) => `<option value="${r.id}">${esc(r.title)} — ${esc(r.status)}</option>`).join(''); if (cur) reelSelect.value = String(cur); }
async function loadFrames() {
  if (!S.selectedReelId) { S.frames = []; renderFrames(); return; }
  const { data, error } = await supabase.from('social_reel_frames').select('*').eq('reel_id', S.selectedReelId).order('frame_order'); if (error) { msg(error.message, 'error'); return; }
  S.frames = data || []; renderFrames();
}
function renderFrames() {
  const el = $('frames'); el.replaceChildren();
  if (!S.selectedReelId) { el.innerHTML = '<div class="empty">Select or create a reel.</div>'; return; }
  if (!S.frames.length) { el.innerHTML = '<div class="empty">No frames yet. Use "Add to reel" on a post.</div>'; return; }
  S.frames.forEach((f, idx) => {
    const item = byId(S.items, f.content_item_id); const row = document.createElement('div'); row.className = 'frame';
    row.innerHTML = `<span class="frame-num">${idx + 1}</span><div><strong>${esc(item?.title || f.content_item_id)}</strong><small>${esc(f.content_item_id)}</small></div><div class="frame-actions"><button class="button small" data-m="-1" title="Move up">↑</button><button class="button small" data-m="1" title="Move down">↓</button><button class="button small danger" data-m="x" title="Remove">×</button></div>`;
    row.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => (b.dataset.m === 'x' ? rewriteFrames(S.frames.filter((x) => x !== f)) : moveFrame(idx, Number(b.dataset.m))); });
    el.append(row);
  });
}
async function addToReel(itemId) {
  if (!S.selectedReelId) { msg('Select or create a reel first (bottom of this page).', 'error'); return; }
  if (S.frames.some((f) => f.content_item_id === itemId)) { msg('Already in this reel.', 'error'); return; }
  const { error } = await supabase.from('social_reel_frames').insert({ reel_id: Number(S.selectedReelId), content_item_id: itemId, frame_order: S.frames.length + 1 }); if (error) { msg(error.message, 'error'); return; }
  await loadFrames(); msg(`${itemId} added to the reel.`, 'success');
}
async function rewriteFrames(next) {
  const { error: d } = await supabase.from('social_reel_frames').delete().eq('reel_id', S.selectedReelId); if (d) { msg(d.message, 'error'); return; }
  if (next.length) { const { error } = await supabase.from('social_reel_frames').insert(next.map((f, i) => ({ reel_id: Number(S.selectedReelId), content_item_id: f.content_item_id, frame_order: i + 1, frame_note: f.frame_note || null }))); if (error) { msg(error.message, 'error'); return; } }
  await loadFrames(); msg('Reel order saved.', 'success');
}
function moveFrame(idx, d) { const to = idx + d; if (to < 0 || to >= S.frames.length) return; const next = [...S.frames]; [next[idx], next[to]] = [next[to], next[idx]]; rewriteFrames(next); }

// ---------------------------------------------------------------------------
// Schedule tab
// ---------------------------------------------------------------------------
function renderSchedule() {
  const el = $('schedule-list'); const now = new Date(); const today = new Date(now); today.setHours(0, 0, 0, 0);
  const upcoming = S.items.filter((i) => i.scheduled_for && i.status !== 'Posted' && !['Archived', 'Rejected'].includes(i.status)).sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for));
  const unscheduled = S.items.filter((i) => readyToPost(i) && !i.scheduled_for);
  const groups = {};
  upcoming.forEach((i) => { const d = new Date(i.scheduled_for); const key = d < today ? 'Overdue — not marked posted yet' : d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }); (groups[key] ||= []).push(i); });
  const row = (i) => {
    const a = mainAsset(i.id); const url = assetUrl(a); const chans = (i.channel_ids || []).map((id) => nameOf(S.channels, id)).filter(Boolean).join(', ');
    const warn = []; if (!readyToPost(i)) warn.push(i.is_paused ? 'Paused' : i.status !== 'Approved' && i.status !== 'Scheduled' ? `Status: ${i.status}` : ''); if (!['Approved', 'Not Needed'].includes(i.image_status)) warn.push(`Image: ${i.image_status}`);
    return `<div class="sched-row" data-id="${esc(i.id)}"><div class="sched-time">${i.scheduled_for ? esc(new Date(i.scheduled_for).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })) : '—'}</div>${url ? `<img src="${esc(url)}" alt="">` : '<div class="thumb-empty">No image</div>'}<div class="sched-main"><strong>${esc(i.title)}</strong><small>${esc(i.id)} • ${esc(i.program)} • ${esc(chans || 'no channel picked')}${i.assigned_to !== 'Unassigned' ? ` • ${esc(i.assigned_to)}` : ''}</small>${warn.filter(Boolean).length ? `<small class="warn-text">⚠ ${esc(warn.filter(Boolean).join(' • '))}</small>` : ''}</div><div class="actions"><button class="button small primary" data-a="copy">Copy post</button>${url ? `<a class="button small" href="${esc(url)}" target="_blank" rel="noopener" download>Image</a>` : ''}<button class="button small" data-a="posted">Mark posted</button><button class="button small" data-a="edit">Edit</button></div></div>`;
  };
  el.innerHTML = (Object.keys(groups).length ? Object.entries(groups).map(([k, list]) => `<section class="panel"><h2 class="day">${esc(k)}</h2>${list.map(row).join('')}</section>`).join('') : '<section class="panel"><div class="empty">Nothing scheduled yet. Use "Schedule" on a post.</div></section>')
    + `<section class="panel"><h2 class="day">Approved and ready, but not scheduled (${unscheduled.length})</h2>${unscheduled.map(row).join('') || '<div class="empty">None.</div>'}</section>`;
  el.querySelectorAll('.sched-row').forEach((r) => {
    const i = byId(S.items, r.dataset.id);
    r.querySelector('[data-a="copy"]').onclick = async () => { await navigator.clipboard.writeText(postText(i)); msg(`${i.id} post text copied.`, 'success'); };
    r.querySelector('[data-a="posted"]').onclick = () => openPostedForm(i);
    r.querySelector('[data-a="edit"]').onclick = () => openItemForm(i);
  });
}

// ---------------------------------------------------------------------------
// Outreach tab — partnership pipeline with per-prospect conversation threads
// ---------------------------------------------------------------------------
const MSG_CHANNELS = ['Email','Facebook message','Phone call','Web form','In person','Text','Other'];
const OUTREACH_PRESETS = {
  all: () => true,
  prospects: (o) => o.status === 'Prospect',
  review: (o) => msgsFor(o.id).some((m) => m.direction === 'Outbound' && ['Suggested', 'Needs Edit'].includes(m.status)) && !['Rejected', 'Declined', 'Archived'].includes(o.status),
  send: (o) => msgsFor(o.id).some((m) => m.direction === 'Outbound' && m.status === 'Approved'),
  waiting: (o) => o.status === 'Sent',
  replies: (o) => ['Replied', 'In Conversation'].includes(o.status),
  followup: (o) => o.follow_up_on && o.follow_up_on <= todayStr() && !['Declined', 'Rejected', 'Archived', 'Partner'].includes(o.status),
  partners: (o) => o.status === 'Partner',
  closed: (o) => ['Declined', 'Rejected', 'Archived'].includes(o.status),
};
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function msgsFor(id) { return S.messages.filter((m) => String(m.outreach_id) === String(id)).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))); }
function setting(key, fallback = '') { const s = S.settings.find((x) => x.key === key); return s?.value ?? fallback; }
function withSignature(body) {
  const sig = setting('outreach_signature'); const text = (body || '').trim();
  if (!sig || !text || text.includes(setting('outreach_from_address', '@@none@@'))) return text;
  return `${text.replace(/\n+Brooke\s*\n+Rebel Ranch Ministries\s*$/i, '')}\n\n${sig}`;
}
S.oPreset = 'all';

document.querySelectorAll('[data-opreset]').forEach((b) => { b.onclick = () => { S.oPreset = b.dataset.opreset; renderOutreach(); }; });
['o-program', 'o-status', 'o-category'].forEach((k) => $(k).addEventListener('change', renderOutreach));
$('o-search').addEventListener('input', renderOutreach); $('o-paused').addEventListener('change', renderOutreach);

const OUTREACH_FIELDS = [
  { key: 'target_name', label: 'Who (organization or person)', required: true, wide: true },
  { key: 'status', label: 'Stage', type: 'select', options: OUTREACH_STATUSES, required: true },
  { key: 'category', label: 'Category', type: 'select', options: OUTREACH_CATEGORIES, required: true },
  { key: 'program_id', label: 'Program', type: 'ref', ref: 'programs' },
  { key: 'purpose_id', label: 'Purpose', type: 'ref', ref: 'purposes' },
  { key: 'campaign_id', label: 'Campaign', type: 'ref', ref: 'campaigns' },
  { key: 'target_type', label: 'Type', placeholder: 'Local business, chamber, church…' },
  { key: 'county', label: 'County / area' },
  { key: 'fit_score', label: 'Fit (1 = weak, 5 = great)', type: 'number', min: 1, max: 5 },
  { key: 'fit_reason', label: 'Why they fit', type: 'textarea', rows: 3 },
  { key: 'offer_ask', label: 'What we offer or ask', type: 'textarea', rows: 3 },
  { key: 'contact_method', label: 'How to reach them', placeholder: 'Email, phone, Facebook message, web form' },
  { key: 'contact_name', label: 'Contact name' },
  { key: 'contact_email', label: 'Email' },
  { key: 'contact_phone', label: 'Phone' },
  { key: 'website', label: 'Website / page', type: 'url' },
  { key: 'contact_details', label: 'Contact details / address', type: 'textarea', rows: 2 },
  { key: 'sources', label: 'Research sources (links)', type: 'textarea', rows: 2 },
  { key: 'assigned_to', label: 'Who is working on it', type: 'select', options: WORKERS, required: true },
  { key: 'follow_up_on', label: 'Follow up on', type: 'date' },
  { key: 'time_sensitivity', label: 'Time sensitivity' },
  { key: 'research_needed', label: 'Research still needed', type: 'textarea', rows: 2 },
  { key: 'notes', label: 'Notes', type: 'textarea', rows: 3 },
];
function openOutreachForm(o = null) {
  openForm({
    title: o ? `Edit ${o.ref}` : 'New prospect', fields: OUTREACH_FIELDS,
    values: o || { status: 'Prospect Approved', category: 'General alignment', assigned_to: 'Unassigned', campaign_id: S.campaigns.find((c) => c.name === 'Local Partner Outreach 2026')?.id },
    onSave: async (v) => { const r = await saveRow('social_outreach', 'outreach', o?.id ?? null, o ? v : { ...v, found_by: actor() }, v.target_name); renderOutreach(); renderCounts(); msg(`${r.ref} saved.`, 'success'); },
    onDelete: o ? async () => { await deleteRow('social_outreach', 'outreach', o.id, o.target_name); S.messages = S.messages.filter((m) => String(m.outreach_id) !== String(o.id)); renderOutreach(); renderCounts(); } : null,
  });
}
$('new-outreach').onclick = () => openOutreachForm();

function openMessageForm(o, m = null, direction = 'Outbound') {
  const inbound = (m?.direction || direction) === 'Inbound';
  const fields = [
    { key: 'channel', label: 'Channel', type: 'select', options: MSG_CHANNELS, required: true },
    ...(inbound ? [{ key: 'received_at', label: 'Received', type: 'datetime', required: true }, { key: 'from_address', label: 'From' }] : [{ key: 'to_address', label: 'To' }]),
    { key: 'subject', label: 'Subject', wide: true },
    { key: 'body', label: inbound ? 'What they said' : 'Message', type: 'textarea', rows: 12, required: true },
    ...(inbound ? [] : [{ key: 'owner_comment', label: 'Your comment (for the agent)', type: 'textarea', rows: 2 }]),
  ];
  const lastSubject = [...msgsFor(o.id)].reverse().find((x) => x.subject)?.subject;
  const values = m || (inbound
    ? { channel: 'Email', received_at: new Date().toISOString(), from_address: o.contact_email, subject: lastSubject ? `Re: ${lastSubject.replace(/^re:\s*/i, '')}` : '' }
    : { channel: o.contact_email ? 'Email' : 'Other', to_address: o.contact_email, subject: lastSubject ? `Re: ${lastSubject.replace(/^re:\s*/i, '')}` : '' });
  openForm({
    title: m ? 'Edit message' : inbound ? `Log a reply from ${o.target_name}` : `Write a message to ${o.target_name}`, fields, values,
    onSave: async (v) => {
      if (m) { await saveRow('social_outreach_messages', 'messages', m.id, v, 'message edited'); }
      else if (inbound) {
        await saveRow('social_outreach_messages', 'messages', null, { ...v, outreach_id: o.id, direction: 'Inbound', status: 'Received' }, 'reply logged');
        await saveRow('social_outreach', 'outreach', o.id, { status: 'Replied', last_inbound_at: v.received_at, follow_up_on: null }, 'reply received');
      } else {
        await saveRow('social_outreach_messages', 'messages', null, { ...v, outreach_id: o.id, direction: 'Outbound', status: 'Suggested', suggested_by: actor() }, 'message drafted');
        if (['Prospect', 'Prospect Approved', 'Researched'].includes(o.status)) await saveRow('social_outreach', 'outreach', o.id, { status: 'Draft' }, 'draft written');
      }
      renderOutreach(); renderCounts(); msg('Saved.', 'success');
    },
    onDelete: m ? async () => { await deleteRow('social_outreach_messages', 'messages', m.id, 'message'); renderOutreach(); renderCounts(); } : null,
    extra: inbound ? null : (el) => {
      const tpls = S.templates.filter((t) => t.status === 'Active');
      if (!tpls.length) return;
      el.innerHTML = `<div class="tpl-pick"><label for="tpl-select">Start from a template</label><div class="row"><select id="tpl-select">${tpls.map((t) => `<option value="${t.id}">${esc(t.name)} (${esc(t.kind)})</option>`).join('')}</select><button type="button" class="button" id="tpl-use">Fill in</button></div><small class="help">Replaces the subject and message with the template, filled in with this prospect's details. Anything in [brackets] still needs you.</small></div>`;
      $('tpl-use').onclick = () => {
        const t = byId(S.templates, $('tpl-select').value); if (!t) return;
        if (($('f-body').value || '').trim() && !confirm('Replace the current message with this template?')) return;
        $('f-subject').value = fillTemplate(t.subject || '', o); $('f-body').value = fillTemplate(t.body || '', o);
      };
    },
  });
}

function fillTemplate(text, o) {
  const topNeed = S.needs.filter((n) => n.status === 'Active' && n.progress !== 'Met' && (!o.program_id || !n.program_id || n.program_id === o.program_id)).sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a.priority] - { High: 0, Medium: 1, Low: 2 }[b.priority]))[0];
  const lower = (x) => (x && /^[A-Z][a-z]/.test(x) ? x.charAt(0).toLowerCase() + x.slice(1) : x);
  const vals = {
    business_name: o.target_name,
    contact_first_name: (o.contact_name || '').split(/[\s(]/)[0] || 'there',
    area: o.county || 'our area',
    why_them: o.fit_reason ? lower(o.fit_reason.replace(/\.$/, '')) : '[why them]',
    specific_need: o.offer_ask ? lower(o.offer_ask.replace(/\.$/, '')) : topNeed ? lower(topNeed.item) : '[specific need]',
    gift_description: '[what they gave]',
  };
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m0, k) => vals[k] ?? `[${k}]`);
}

async function setMessage(o, m, patch, label, outreachPatch = null) {
  try {
    await saveRow('social_outreach_messages', 'messages', m.id, patch, label);
    if (outreachPatch) await saveRow('social_outreach', 'outreach', o.id, outreachPatch, label);
    renderOutreach(); renderCounts(); msg(`${o.ref}: ${label}.`, 'success');
  } catch (e) { msg(friendlyError(e), 'error'); }
}

function messageHtml(m) {
  const who = m.direction === 'Inbound' ? `From them${m.from_address ? ` (${esc(m.from_address)})` : ''}` : `From us${m.suggested_by ? ` • drafted by ${esc(m.suggested_by)}` : ''}`;
  const when = m.direction === 'Inbound' ? m.received_at : (m.sent_at || m.created_at);
  let actions = '';
  if (m.direction === 'Outbound' && ['Suggested', 'Needs Edit'].includes(m.status)) actions = '<button class="button small primary" data-m="approve">Approve to send</button><button class="button small" data-m="edit">Edit</button><button class="button small" data-m="needsedit">Needs changes</button><button class="button small danger" data-m="reject">Reject</button>';
  else if (m.direction === 'Outbound' && m.status === 'Approved') actions = '<button class="button small primary" data-m="copy">Copy email</button><button class="button small" data-m="copysubject">Copy subject</button><button class="button small" data-m="sent">Mark sent</button><button class="button small" data-m="edit">Edit</button>';
  else actions = '<button class="button small" data-m="edit">Edit</button>';
  return `<div class="msg ${m.direction === 'Inbound' ? 'in' : 'out'}" data-mid="${m.id}"><div class="msg-head"><strong>${who}</strong><span class="chip ${m.status === 'Approved' || m.status === 'Sent' ? 'ok' : m.status === 'Rejected' ? 'soft' : m.direction === 'Inbound' ? 'alt' : 'warn'}">${esc(m.status)}</span></div><small class="muted">${esc(m.channel)} • ${esc(fmtDate(when))}${m.to_address && m.direction === 'Outbound' ? ` • to ${esc(m.to_address)}` : ''}</small>${m.subject ? `<p class="msg-subject">${esc(m.subject)}</p>` : ''}<p class="caption">${esc(m.body || '')}</p>${m.owner_comment ? `<p class="muted"><strong>Your note:</strong> ${esc(m.owner_comment)}</p>` : ''}<div class="actions">${actions}</div></div>`;
}

function renderOutreach() {
  document.querySelectorAll('[data-opreset]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.opreset === S.oPreset)));
  const q = $('o-search').value.trim().toLowerCase(); const pre = OUTREACH_PRESETS[S.oPreset] || OUTREACH_PRESETS.all;
  const list = S.outreach.filter((o) => ($('o-paused').checked || !o.is_paused) && pre(o)
    && (S.oPreset !== 'all' || !['Rejected', 'Declined', 'Archived'].includes(o.status) || $('o-status').value !== 'all')
    && ($('o-program').value === 'all' || String(o.program_id) === $('o-program').value)
    && ($('o-status').value === 'all' || o.status === $('o-status').value)
    && ($('o-category').value === 'all' || o.category === $('o-category').value)
    && (!q || [o.ref, o.target_name, o.notes, o.offer_ask, o.fit_reason, o.county].some((x) => String(x || '').toLowerCase().includes(q)) || msgsFor(o.id).some((m) => String(m.body || '').toLowerCase().includes(q))))
    .sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0) || String(a.ref).localeCompare(String(b.ref)));
  const el = $('outreach-list'); el.replaceChildren(); $('o-count').textContent = `${list.length} of ${S.outreach.length} • sending from ${setting('outreach_from_address', '—')}`;
  if (!list.length) { el.innerHTML = '<div class="empty">Nothing here right now.</div>'; return; }
  const today = todayStr();
  for (const o of list) {
    const thread = msgsFor(o.id);
    const card = document.createElement('article'); card.className = `card o-card${o.is_paused ? ' paused' : ''}`;
    const stars = o.fit_score ? `Fit ${o.fit_score}/5` : '';
    card.innerHTML = `<div class="card-body"><div class="o-head"><h2>${esc(o.target_name)}</h2><span class="status-tag static">${esc(o.is_paused ? 'Paused' : o.status)}</span></div><div class="asset-id">${esc(o.ref)} • ${esc(o.category)}${o.county ? ` • ${esc(o.county)}` : ''}</div>
      <div class="chips">${chip(nameOf(S.programs, o.program_id))}${chip(nameOf(S.purposes, o.purpose_id), 'alt')}${chip(stars, o.fit_score >= 4 ? 'ok' : 'soft')}${o.follow_up_on ? chip(`Follow up ${o.follow_up_on}`, o.follow_up_on <= today ? 'warn' : 'soft') : ''}${o.last_contact_at ? chip(`Last sent ${new Date(o.last_contact_at).toLocaleDateString()}`, 'soft') : ''}${o.last_inbound_at ? chip(`Last reply ${new Date(o.last_inbound_at).toLocaleDateString()}`, 'ok') : ''}${o.found_by ? chip(`Found by ${o.found_by}`, 'soft') : ''}</div>
      ${o.fit_reason ? `<div class="copy"><h3>Why they fit</h3><p>${esc(o.fit_reason)}</p></div>` : ''}
      <div class="meta"><div><strong>How to reach</strong><span>${esc([o.contact_method, o.contact_name, o.contact_email, o.contact_phone].filter(Boolean).join(' • ') || 'Needs lookup')}</span></div><div><strong>Ask / offer</strong><span>${esc(o.offer_ask || '—')}</span></div></div>
      ${o.notes ? `<div class="copy"><h3>Notes</h3><p>${esc(o.notes)}</p></div>` : ''}
      ${o.sources ? `<details class="copy"><summary>Research sources</summary><p class="caption">${esc(o.sources)}</p></details>` : ''}
      <div class="actions">${o.status === 'Prospect' ? '<button class="button small primary" data-a="approve-prospect">Approve prospect</button><button class="button small danger" data-a="decline-prospect">Not a fit</button>' : ''}<button class="button small" data-a="write">Write message</button><button class="button small" data-a="reply">Log their reply</button>${o.website ? `<a class="button small" href="${esc(o.website)}" target="_blank" rel="noopener">Their page</a>` : ''}<button class="button small" data-a="edit">Edit</button><button class="button small" data-a="pause">${o.is_paused ? 'Resume' : 'Pause'}</button></div>
      <details class="thread"${thread.some((m) => ['Suggested', 'Needs Edit', 'Approved'].includes(m.status) || m.status === 'Received') ? ' open' : ''}><summary>Conversation (${thread.length})</summary>${thread.map(messageHtml).join('') || '<div class="empty">No messages yet.</div>'}</details></div>`;
    const on = (a, fn) => { const b = card.querySelector(`[data-a="${a}"]`); if (b) b.onclick = fn; };
    const patch = async (p, label) => { try { await saveRow('social_outreach', 'outreach', o.id, p, label); renderOutreach(); renderCounts(); msg(`${o.ref} ${label}.`, 'success'); } catch (e) { msg(friendlyError(e), 'error'); } };
    on('approve-prospect', () => patch({ status: 'Prospect Approved' }, 'prospect approved — the agent will draft a first message'));
    on('decline-prospect', () => openForm({ title: `Not a fit — ${o.target_name}`, saveLabel: 'Save', fields: [{ key: 'reason', label: 'Why not? (helps the agent learn)', type: 'textarea', rows: 3 }], values: {},
      onSave: async (v) => { await saveRow('social_outreach', 'outreach', o.id, { status: 'Rejected', notes: [o.notes, v.reason ? `Owner: not a fit — ${v.reason}` : 'Owner: not a fit'].filter(Boolean).join('\n') }, 'prospect declined'); renderOutreach(); renderCounts(); } }));
    on('write', () => openMessageForm(o, null, 'Outbound'));
    on('reply', () => openMessageForm(o, null, 'Inbound'));
    on('edit', () => openOutreachForm(o));
    on('pause', () => patch({ is_paused: !o.is_paused }, o.is_paused ? 'resumed' : 'paused'));
    card.querySelectorAll('.msg').forEach((box) => {
      const m = byId(S.messages, box.dataset.mid); const b = (k) => box.querySelector(`[data-m="${k}"]`);
      const hasInbound = thread.some((x) => x.direction === 'Inbound');
      if (b('approve')) b('approve').onclick = () => setMessage(o, m, { status: 'Approved', approved_at: new Date().toISOString() }, 'message approved — ready to send', hasInbound ? null : { status: 'Approved' });
      if (b('needsedit')) b('needsedit').onclick = () => openForm({ title: 'What should change?', fields: [{ key: 'owner_comment', label: 'Your note for the agent', type: 'textarea', rows: 4, required: true }], values: { owner_comment: m.owner_comment },
        onSave: async (v) => { await setMessage(o, m, { status: 'Needs Edit', owner_comment: v.owner_comment }, 'sent back for changes', hasInbound ? null : { status: 'Needs Edit' }); } });
      if (b('reject')) b('reject').onclick = () => setMessage(o, m, { status: 'Rejected' }, 'message rejected');
      if (b('edit')) b('edit').onclick = () => openMessageForm(o, m);
      if (b('copy')) b('copy').onclick = async () => { await navigator.clipboard.writeText(withSignature(m.body)); msg(`Email copied (with signature). Send it from ${setting('outreach_from_address')}.`, 'success'); };
      if (b('copysubject')) b('copysubject').onclick = async () => { await navigator.clipboard.writeText(m.subject || ''); msg('Subject copied.', 'success'); };
      if (b('sent')) b('sent').onclick = () => openForm({ title: `Mark sent — ${o.target_name}`, saveLabel: 'Mark sent',
        fields: [{ key: 'sent_at', label: 'Sent on', type: 'datetime', required: true }, { key: 'follow_up_on', label: 'Follow up on', type: 'date' }],
        values: { sent_at: new Date().toISOString(), follow_up_on: new Date(Date.now() + Number(setting('partner_followup_days', '7')) * 864e5).toISOString().slice(0, 10) },
        onSave: async (v) => {
          await setMessage(o, m, { status: 'Sent', sent_at: v.sent_at, from_address: m.from_address || setting('outreach_from_address') }, 'marked sent',
            { status: hasInbound ? 'In Conversation' : 'Sent', last_contact_at: v.sent_at, sent_at: o.sent_at || v.sent_at, sent_by: actor(), follow_up_on: v.follow_up_on });
        } });
    });
    el.append(card);
  }
}

// ---------------------------------------------------------------------------
// Results & learning tab
// ---------------------------------------------------------------------------
function renderResults() {
  const h = $('history-table');
  h.innerHTML = S.history.length ? `<table><thead><tr><th>When</th><th>Post</th><th>Channel</th><th>Status</th><th>Reach</th><th>Reactions</th><th>Comments</th><th>Shares</th><th>Clicks</th><th></th></tr></thead><tbody>${S.history.map((r) => { const it = byId(S.items, r.content_item_id); return `<tr data-id="${r.id}"><td>${esc(fmtDate(r.published_at))}</td><td>${esc(it?.title || r.content_item_id || 'Reel')}${r.post_url ? ` <a href="${esc(r.post_url)}" target="_blank" rel="noopener">↗</a>` : ''}</td><td>${esc(nameOf(S.channels, r.channel_id) || r.platform)}</td><td>${esc(r.post_status)}</td><td>${r.reach ?? '—'}</td><td>${r.reactions ?? '—'}</td><td>${r.comments ?? '—'}</td><td>${r.shares ?? '—'}</td><td>${r.clicks ?? '—'}</td><td><button class="button small" data-a="edit">Edit</button></td></tr>`; }).join('')}</tbody></table>` : '<div class="empty">Nothing recorded yet. Use "Mark posted" on a post.</div>';
  h.querySelectorAll('tr[data-id]').forEach((tr) => { const r = byId(S.history, tr.dataset.id); tr.querySelector('[data-a="edit"]').onclick = () => openForm({
    title: 'Post results', fields: [{ key: 'post_status', label: 'Status', type: 'select', options: POST_STATUSES, required: true }, { key: 'published_at', label: 'Date/time', type: 'datetime', required: true }, { key: 'post_url', label: 'Post link', type: 'url' }, { key: 'reach', label: 'Reach', type: 'number', min: 0 }, { key: 'reactions', label: 'Reactions', type: 'number', min: 0 }, { key: 'comments', label: 'Comments', type: 'number', min: 0 }, { key: 'shares', label: 'Shares', type: 'number', min: 0 }, { key: 'clicks', label: 'Link clicks', type: 'number', min: 0 }, { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 }],
    values: r, onSave: async (v) => { await saveRow('social_post_history', 'history', r.id, { ...v, metrics_updated_at: new Date().toISOString() }, 'results updated'); renderResults(); msg('Results saved.', 'success'); },
    onDelete: async () => { await deleteRow('social_post_history', 'history', r.id, 'post record'); renderResults(); },
  }); });
  const l = $('learning-list');
  l.innerHTML = S.learnings.map((x) => `<article class="learning" data-id="${x.id}"><div class="o-head"><h3>${esc(x.title)}</h3><span class="status-tag static">${esc(x.status)}</span></div><small class="muted">${esc(new Date(x.created_at).toLocaleDateString())}${x.recorded_by ? ` • ${esc(x.recorded_by)}` : ''}${x.program_id ? ` • ${esc(nameOf(S.programs, x.program_id))}` : ''}</small>${x.observation ? `<p><strong>Saw:</strong> ${esc(x.observation)}</p>` : ''}${x.recommendation ? `<p><strong>Try:</strong> ${esc(x.recommendation)}</p>` : ''}<div class="actions"><button class="button small" data-a="edit">Edit</button>${x.status === 'Proposed' ? '<button class="button small" data-a="approve">Approve</button>' : ''}</div></article>`).join('') || '<div class="empty">No learnings yet. Record what works and what doesn\'t — this is how the system gets better.</div>';
  l.querySelectorAll('.learning').forEach((el) => { const x = byId(S.learnings, el.dataset.id); el.querySelector('[data-a="edit"]').onclick = () => openLearningForm(x); const ap = el.querySelector('[data-a="approve"]'); if (ap) ap.onclick = async () => { await saveRow('social_learnings', 'learnings', x.id, { status: 'Approved' }, 'approved'); renderResults(); }; });
}
const LEARNING_FIELDS = [{ key: 'title', label: 'What did we learn?', required: true, wide: true }, { key: 'status', label: 'Status', type: 'select', options: LEARNING_STATUSES, required: true }, { key: 'program_id', label: 'Program', type: 'ref', ref: 'programs' }, { key: 'purpose_id', label: 'Purpose', type: 'ref', ref: 'purposes' }, { key: 'observation', label: 'What we saw', type: 'textarea', rows: 3 }, { key: 'evidence', label: 'Evidence (numbers, posts)', type: 'textarea', rows: 3 }, { key: 'recommendation', label: 'What to change', type: 'textarea', rows: 3 }];
function openLearningForm(x = null) {
  openForm({ title: x ? 'Edit learning' : 'New learning', fields: LEARNING_FIELDS, values: x || { status: 'Proposed' },
    onSave: async (v) => { await saveRow('social_learnings', 'learnings', x?.id ?? null, x ? v : { ...v, recorded_by: actor() }, v.title); renderResults(); msg('Learning saved.', 'success'); },
    onDelete: x ? async () => { await deleteRow('social_learnings', 'learnings', x.id, x.title); renderResults(); } : null });
}
$('new-learning').onclick = () => openLearningForm();

// ---------------------------------------------------------------------------
// Setup tab — programs, purposes, campaigns, links, channels
// ---------------------------------------------------------------------------
const SETUP = {
  programs: { table: 'social_programs', title: 'Programs', one: 'program', statuses: LIST_STATUSES, cols: [['name', 'Name'], ['code', 'Code'], ['description', 'What it is']],
    fields: [{ key: 'name', label: 'Program name', required: true, wide: true }, { key: 'code', label: 'Short code (2–6 capitals, used in post IDs)', required: true, placeholder: 'CS' }, { key: 'status', label: 'Status', type: 'select', options: LIST_STATUSES, required: true }, { key: 'default_link', label: 'Main link', type: 'url' }, { key: 'sort_order', label: 'Sort order', type: 'number' }, { key: 'description', label: 'Description', type: 'textarea', rows: 2 }, { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 }],
    defaults: { status: 'Active', sort_order: 100 } },
  purposes: { table: 'social_purposes', title: 'Purposes', one: 'purpose', statuses: LIST_STATUSES, cols: [['name', 'Name'], ['weekly_limit', 'Max per week'], ['description', 'What it is for']],
    fields: [{ key: 'name', label: 'Purpose name', required: true, wide: true }, { key: 'status', label: 'Status', type: 'select', options: LIST_STATUSES, required: true }, { key: 'weekly_limit', label: 'Max posts per week (blank = no limit)', type: 'number', min: 0 }, { key: 'sort_order', label: 'Sort order', type: 'number' }, { key: 'description', label: 'Description', type: 'textarea', rows: 2 }, { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 }],
    defaults: { status: 'Active', sort_order: 100 } },
  campaigns: { table: 'social_campaigns', title: 'Campaigns', one: 'campaign', statuses: CAMPAIGN_STATUSES, cols: [['name', 'Name'], ['program_id', 'Program'], ['start_date', 'Starts'], ['end_date', 'Ends']],
    fields: [{ key: 'name', label: 'Campaign name', required: true, wide: true }, { key: 'status', label: 'Status', type: 'select', options: CAMPAIGN_STATUSES, required: true }, { key: 'program_id', label: 'Program', type: 'ref', ref: 'programs' }, { key: 'purpose_id', label: 'Purpose', type: 'ref', ref: 'purposes' }, { key: 'link_id', label: 'Main link', type: 'ref', ref: 'links' }, { key: 'start_date', label: 'Start date', type: 'date' }, { key: 'end_date', label: 'End date', type: 'date' }, { key: 'goal', label: 'Goal', type: 'textarea', rows: 2 }, { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 }],
    defaults: { status: 'Planned' } },
  links: { table: 'social_links', title: 'Links', one: 'link', statuses: ['Active', 'Retired'], cols: [['label', 'Label'], ['url', 'Link'], ['program_id', 'Program']],
    fields: [{ key: 'label', label: 'Label', required: true, placeholder: 'GoFundMe — Rebel Ranch Ministries', wide: true }, { key: 'url', label: 'Link', type: 'url', required: true, placeholder: 'https://…', wide: true }, { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Retired'], required: true }, { key: 'program_id', label: 'Program', type: 'ref', ref: 'programs' }, { key: 'purpose_id', label: 'Purpose', type: 'ref', ref: 'purposes' }, { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 }],
    defaults: { status: 'Active' } },
  areas: { table: 'social_service_areas', title: 'Service area', one: 'area', statuses: LIST_STATUSES, cols: [['name', 'Name'], ['kind', 'Type'], ['county', 'County'], ['priority', 'Priority']],
    fields: [{ key: 'name', label: 'County, city or town', required: true, wide: true }, { key: 'kind', label: 'Type', type: 'select', options: ['County', 'City', 'Town', 'Region'], required: true }, { key: 'county', label: 'County' }, { key: 'priority', label: 'Priority', type: 'select', options: PRIORITIES, required: true }, { key: 'status', label: 'Status', type: 'select', options: LIST_STATUSES, required: true }, { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 }],
    defaults: { status: 'Active', kind: 'Town', priority: 'Medium' } },
  ptypes: { table: 'social_prospect_types', title: 'Prospect types (who the agent looks for)', one: 'prospect type', statuses: LIST_STATUSES, cols: [['name', 'Type'], ['examples', 'Examples'], ['priority', 'Priority']],
    fields: [{ key: 'name', label: 'Type of prospect', required: true, wide: true }, { key: 'examples', label: 'Examples', type: 'textarea', rows: 2 }, { key: 'priority', label: 'Priority', type: 'select', options: PRIORITIES, required: true }, { key: 'status', label: 'Status', type: 'select', options: LIST_STATUSES, required: true }, { key: 'notes', label: 'Notes for the agent', type: 'textarea', rows: 2 }],
    defaults: { status: 'Active', priority: 'Medium' } },
  needs: { table: 'social_needs', title: 'Needs list (what we are asking for)', one: 'need', statuses: LIST_STATUSES, cols: [['item', 'Item'], ['category', 'Category'], ['priority', 'Priority'], ['progress', 'Progress']],
    fields: [{ key: 'item', label: 'What we need', required: true, wide: true }, { key: 'category', label: 'Category', placeholder: 'Feed, Fencing, Vehicles…' }, { key: 'program_id', label: 'Program', type: 'ref', ref: 'programs' }, { key: 'priority', label: 'Priority', type: 'select', options: PRIORITIES, required: true }, { key: 'progress', label: 'Progress', type: 'select', options: ['Needed', 'Partly met', 'Met'], required: true }, { key: 'quantity', label: 'How much / how many' }, { key: 'est_value', label: 'Rough value', placeholder: '$250' }, { key: 'likely_sources', label: 'Who might give it', type: 'textarea', rows: 2 }, { key: 'status', label: 'Status', type: 'select', options: LIST_STATUSES, required: true }, { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 }],
    defaults: { status: 'Active', priority: 'Medium', progress: 'Needed' } },
  templates: { table: 'social_templates', title: 'Message templates', one: 'template', statuses: LIST_STATUSES, cols: [['name', 'Name'], ['kind', 'Use for'], ['category', 'Category']],
    fields: [{ key: 'name', label: 'Template name', required: true, wide: true }, { key: 'kind', label: 'Use for', type: 'select', options: ['First outreach', 'Follow-up', 'Reply', 'Thank you', 'Sponsor benefits', 'Other'], required: true }, { key: 'category', label: 'Category', type: 'select', options: ['Any', ...OUTREACH_CATEGORIES], required: true }, { key: 'status', label: 'Status', type: 'select', options: LIST_STATUSES, required: true }, { key: 'subject', label: 'Subject', wide: true }, { key: 'body', label: 'Message', type: 'textarea', rows: 16, required: true, help: 'Fill-ins: {{business_name}} {{contact_first_name}} {{area}} {{why_them}} {{specific_need}} {{gift_description}}. The signature is added automatically.' }, { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 }],
    defaults: { status: 'Active', kind: 'First outreach', category: 'Any' } },
  channels: { table: 'social_channels', title: 'Channels (pages, accounts, groups)', one: 'channel', statuses: LIST_STATUSES, cols: [['name', 'Name'], ['platform', 'Platform'], ['kind', 'Type']],
    fields: [{ key: 'name', label: 'Name', required: true, wide: true }, { key: 'platform', label: 'Platform', type: 'select', options: PLATFORMS, required: true }, { key: 'kind', label: 'Type', type: 'select', options: CHANNEL_KINDS, required: true }, { key: 'status', label: 'Status', type: 'select', options: LIST_STATUSES, required: true }, { key: 'url', label: 'Link', type: 'url', wide: true }, { key: 'sort_order', label: 'Sort order', type: 'number' }, { key: 'posting_rules', label: 'Posting rules', type: 'textarea', rows: 8 }, { key: 'notes', label: 'Notes', type: 'textarea', rows: 2 }],
    defaults: { status: 'Active', platform: 'Facebook', kind: 'Group', sort_order: 100 } },
};
document.querySelectorAll('[data-setup]').forEach((b) => { b.onclick = () => { S.setup = b.dataset.setup; renderSetup(); }; });
$('setup-archived').addEventListener('change', () => renderSetup());
function renderSettings() {
  $('setup-body').innerHTML = `<div class="setup-head"><h2>Outreach &amp; agent settings</h2></div><table><thead><tr><th>Setting</th><th>Value</th><th></th></tr></thead><tbody>${S.settings.map((s) => `<tr data-key="${esc(s.key)}"><td><strong>${esc(s.label || s.key)}</strong><br><small class="muted">${esc(s.description || '')}</small></td><td><span class="pre">${esc(s.value ?? '')}</span></td><td class="row-actions"><button class="button small" data-a="edit">Edit</button></td></tr>`).join('')}</tbody></table>`;
  $('setup-body').querySelectorAll('tr[data-key]').forEach((tr) => {
    const s = S.settings.find((x) => x.key === tr.dataset.key);
    tr.querySelector('[data-a="edit"]').onclick = () => openForm({ title: s.label || s.key, fields: [{ key: 'value', label: s.label || s.key, type: 'textarea', rows: (s.value || '').length > 80 ? 6 : 2, help: s.description }], values: s,
      onSave: async (v) => {
        const { data, error } = await supabase.from('social_settings').update({ value: v.value }).eq('key', s.key).select().single(); if (error) throw error;
        S.settings = S.settings.map((x) => (x.key === s.key ? data : x)); await log('social_settings', s.key, 'updated', `${s.label}: ${String(v.value ?? '').slice(0, 80)}`); renderSettings(); msg('Setting saved.', 'success');
      } });
  });
}
function renderSetup() {
  const key = S.setup || 'programs'; const showArchived = $('setup-archived').checked;
  document.querySelectorAll('[data-setup]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setup === key)));
  if (key === 'settings') { renderSettings(); return; }
  const cfg = SETUP[key];
  const prio = { High: 0, Medium: 1, Low: 2 };
  const rows = S[key].filter((r) => showArchived || !['Archived', 'Retired'].includes(r.status))
    .sort((a, b) => (a.priority ? (prio[a.priority] - prio[b.priority]) : 0) || (a.progress === 'Met') - (b.progress === 'Met') || String(a.category || '').localeCompare(String(b.category || '')));
  const cell = (r, [k]) => { const v = r[k]; if (k === 'program_id') return esc(nameOf(S.programs, v) || '—'); if (k === 'url') return `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a>`; return esc(v ?? '—'); };
  const usage = (r) => !['programs', 'purposes', 'campaigns', 'links', 'channels'].includes(key) ? '—' : key === 'programs' ? S.items.filter((i) => i.program_id === r.id).length : key === 'purposes' ? S.items.filter((i) => i.purpose_id === r.id).length : key === 'campaigns' ? S.items.filter((i) => i.campaign_id === r.id).length : key === 'links' ? S.items.filter((i) => i.link_id === r.id).length : S.items.filter((i) => (i.channel_ids || []).includes(r.id)).length;
  $('setup-body').innerHTML = `<div class="setup-head"><h2>${esc(cfg.title)}</h2><button class="button primary" id="setup-add">Add ${esc(cfg.one)}</button></div><table><thead><tr>${cfg.cols.map(([, l]) => `<th>${esc(l)}</th>`).join('')}<th>Status</th><th>Posts</th><th></th></tr></thead><tbody>${rows.map((r) => `<tr data-id="${r.id}">${cfg.cols.map((c) => `<td>${cell(r, c)}</td>`).join('')}<td><span class="chip ${r.status === 'Active' ? 'ok' : 'soft'}">${esc(r.status)}</span></td><td>${usage(r)}</td><td class="row-actions"><button class="button small" data-a="edit">Edit</button><button class="button small" data-a="toggle">${r.status === 'Active' ? (key === 'links' ? 'Retire' : 'Pause') : 'Activate'}</button></td></tr>`).join('') || `<tr><td colspan="${cfg.cols.length + 3}"><div class="empty">None yet.</div></td></tr>`}</tbody></table>`;
  $('setup-add').onclick = () => openSetupForm(key, null);
  $('setup-body').querySelectorAll('tr[data-id]').forEach((tr) => {
    const r = byId(S[key], tr.dataset.id);
    tr.querySelector('[data-a="edit"]').onclick = () => openSetupForm(key, r);
    tr.querySelector('[data-a="toggle"]').onclick = async () => { const next = r.status === 'Active' ? (key === 'links' ? 'Retired' : 'Paused') : 'Active'; try { await saveRow(cfg.table, key, r.id, { status: next }, next); renderAll(); msg(`${r.name || r.label || r.item} is now ${next}.`, 'success'); } catch (e) { msg(friendlyError(e), 'error'); } };
  });
}
function openSetupForm(key, r) {
  const cfg = SETUP[key];
  openForm({ title: r ? `Edit ${cfg.one}` : `New ${cfg.one}`, fields: cfg.fields, values: r || cfg.defaults,
    onSave: async (v) => { if (key === 'programs' && v.code) v.code = v.code.toUpperCase(); await saveRow(cfg.table, key, r?.id ?? null, v, v.name || v.label || v.item); if (['programs', 'campaigns'].includes(key)) { const { data } = await supabase.from('social_content_items').select('*'); if (data) S.items = data; } renderAll(); msg('Saved.', 'success'); },
    onDelete: r ? async () => { await deleteRow(cfg.table, key, r.id, r.name || r.label || r.item); renderAll(); msg('Deleted.', 'success'); } : null });
}

// ---------------------------------------------------------------------------
// Activity tab
// ---------------------------------------------------------------------------
function renderActivity() {
  $('activity-list').innerHTML = S.activity.length ? `<table><thead><tr><th>When</th><th>Who</th><th>What</th><th>Record</th><th>Detail</th></tr></thead><tbody>${S.activity.map((a) => `<tr><td>${esc(fmtDate(a.created_at))}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td><td>${esc(a.entity_type.replace('social_', ''))} ${esc(a.entity_id || '')}</td><td>${esc(a.detail || '')}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">No activity yet.</div>';
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const actorSel = $('actor');
actorSel.value = actor();
actorSel.onchange = () => { try { localStorage.setItem('sch-actor', actorSel.value); } catch { /* ignore */ } msg(`Working as ${actorSel.value}. Changes are logged under that name.`, 'success'); };
$('refresh').onclick = async () => { try { await loadAll(); msg('Refreshed.', 'success'); } catch (e) { msg(friendlyError(e), 'error'); } };

async function init() {
  try {
    const { data: s, error } = await supabase.auth.getSession(); if (error) throw error;
    const user = s.session?.user; if (!user) { location.href = 'account.html?next=social-content-hub.html'; return; }
    const { data: roles, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', user.id); if (roleError) throw roleError;
    if (!(roles || []).some((r) => r.role === 'admin')) { $('loading').textContent = 'Administrator access is required.'; return; }
    await loadAll();
    $('loading').classList.add('hidden'); $('content').classList.remove('hidden');
    const start = (location.hash || '').slice(1); setTab(['content', 'schedule', 'outreach', 'results', 'setup', 'activity'].includes(start) ? start : 'content');
  } catch (e) {
    $('loading').innerHTML = '<strong>Social Content Hub could not load.</strong><p class="muted">If this keeps happening, the database update may not be applied on this environment.</p>';
    msg(friendlyError(e), 'error');
  }
}
init();
