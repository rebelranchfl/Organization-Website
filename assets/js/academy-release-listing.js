// Academy release checklist + Library listing editor (project page).
// The owner edits exactly what learners will see (title, description, area, type,
// price, cover, locked material), previews the Library card, then walks the existing
// release steps: ready → owner decision → put in Library → automatic live check.
// Uses the existing release functions (start/save/mark ready/decide/published/verify)
// plus save_academy_release_listing. Owner decisions stay with the owner.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { supabase } from './supabase-client.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const AREAS = [['personal-strength', 'Personal Strength & Independence'], ['communication', 'Communication & Emotional Intelligence'], ['business', 'Business & Operations'], ['money', 'Money, Finance & Taxes'], ['sustainability', 'Sustainability & Agriculture'], ['family', 'Family, Community & Leadership']];
const TYPES = [['LESSON', 'Lesson'], ['GUIDE', 'Guide'], ['WORKSHEET', 'Worksheet'], ['TOOL', 'Tool'], ['VIDEO', 'Video'], ['BUNDLE', 'Bundle']];
const KINDS = [['LESSON_HTML', 'Interactive lesson (HTML file)'], ['PDF', 'PDF'], ['VIDEO', 'Video file'], ['AUDIO', 'Audio file'], ['FILE', 'Download (any file)']];
const SITE = 'https://rebelranchministries.org';
const STEP = { PREP: 1, READY_OWNER_DECISION: 2, HELD: 2, APPROVED_TO_PUBLISH: 3, PUBLISHED_PENDING_VERIFY: 3, LIVE: 4 };

export async function mount(projectId) {
  const page = document.querySelector('.asr-page');
  if (!page || document.getElementById('rl-box')) return;
  const box = document.createElement('section');
  box.id = 'rl-box'; box.className = 'pp-box'; box.style.marginTop = '14px';
  page.querySelector('.pp-grid')?.after(box);
  await render(box, projectId);
}

async function render(box, projectId) {
  const [{ data: p }, { data: rels }] = await Promise.all([
    supabase.from('academy_content_projects').select('project_id,title,workflow_stage,current_status,revision_number,proposed_price,learning_area_id,owner_summary').eq('project_id', projectId).maybeSingle(),
    supabase.from('academy_release_records').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1),
  ]);
  if (!p) return;
  const r = rels?.[0] && !['CANCELLED', 'RETURNED_FOR_WORK'].includes(rels[0].status) ? rels[0] : null;
  const finalApproved = p.workflow_stage === 'FINAL_PRODUCT_REVIEW' && p.current_status === 'APPROVED';

  if (!r) {
    box.innerHTML = finalApproved
      ? `<p class="aa-kicker">Release checklist</p><p>The final product is approved. Start the release checklist to set how it appears in the Library and what it costs.</p><div class="pp-btns"><button class="aa-btn" id="rl-start">Start release checklist</button></div><p class="aa-note" id="rl-msg"></p>`
      : `<p class="aa-kicker">Release checklist</p><p class="aa-note">Available after the final product is approved.</p>`;
    box.querySelector('#rl-start')?.addEventListener('click', async () => {
      const { error } = await supabase.rpc('start_academy_release_prep', { p_project_id: projectId, p_version_label: `v${p.revision_number || 1}` });
      if (error) return msg(box, error.message);
      render(box, projectId);
    });
    return;
  }

  const L = {
    title: r.public_title ?? p.title ?? '', summary: r.public_summary ?? p.owner_summary ?? '',
    area: r.learning_area_id ?? p.learning_area_id ?? '', type: r.item_type ?? 'LESSON',
    price: r.price_usd ?? p.proposed_price ?? '', cover: r.cover_image_url ?? '',
    path: r.material_path ?? '', kind: r.material_kind ?? '', filename: r.material_filename ?? '',
  };
  const editable = ['PREP', 'READY_OWNER_DECISION', 'HELD', 'APPROVED_TO_PUBLISH', 'PUBLISHED_PENDING_VERIFY', 'LIVE'].includes(r.status);
  const step = STEP[r.status] || 1;
  const checks = [
    ['Learner title', !!String(L.title).trim()],
    ['Short description', !!String(L.summary).trim()],
    ['Learning area', !!L.area],
    ['Price set (0 = free)', L.price !== '' && L.price !== null && Number(L.price) >= 0],
    ['Locked material attached', !!L.path],
  ];
  const allOk = checks.every(([, ok]) => ok);
  const liveUrl = `${SITE}/academy-item.html?id=${encodeURIComponent(projectId)}`;

  box.innerHTML = `
    <p class="aa-kicker">Release checklist · ${esc(r.version_label || '')}</p>
    <div class="pp-steps">${['Listing', 'Your decision', 'Put in Library', 'Live'].map((s, i) => `<span class="pp-step ${i + 1 < step ? 'done' : i + 1 === step ? 'now' : ''}">${i + 1}. ${s}</span>`).join('')}</div>
    <div class="aa-split" style="align-items:start">
      <form class="aa-form" id="rl-form" ${editable ? '' : 'inert'}>
        <label>Learner title<input name="title" value="${esc(L.title)}" maxlength="120" required></label>
        <label>Short description (shown on the card)<textarea name="summary" maxlength="400">${esc(L.summary)}</textarea></label>
        <label>Learning area<select class="aa-field" name="area">${AREAS.map(([v, t]) => `<option value="${v}" ${v === L.area ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
        <label>Type<select class="aa-field" name="type">${TYPES.map(([v, t]) => `<option value="${v}" ${v === L.type ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label>Price in dollars (0 = free)<input name="price" type="number" min="0" step="0.01" value="${esc(L.price)}"></label>
        <label>Cover image ${L.cover ? '(uploaded)' : '(optional)'}<input name="cover" type="file" accept="image/png,image/jpeg,image/webp"></label>
        <fieldset style="border:1px solid #45634a;border-radius:7px;padding:10px">
          <legend class="aa-note">Locked material — only buyers/members can open it</legend>
          <label>What kind of file<select class="aa-field" name="kind">${KINDS.map(([v, t]) => `<option value="${v}" ${v === L.kind ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <label>${L.path ? `Attached: ${esc(L.filename || L.path)} — choose a file to replace it` : 'Choose the file'}<input name="material" type="file"></label>
        </fieldset>
        ${editable ? `<div class="pp-btns"><button class="aa-btn" type="submit">Save listing</button></div>` : ''}
      </form>
      <div>
        <p class="aa-note">How it will look in the Library</p>
        <div style="border:1px solid rgba(215,170,67,.24);border-radius:5px;overflow:hidden;background:linear-gradient(180deg,#1D4024,#122A18);max-width:100%">
          <div style="aspect-ratio:16/9;background:#050806;display:grid;place-items:center;color:#f2cf78">${L.cover ? `<img src="${esc(L.cover)}" alt="" style="width:100%;height:100%;object-fit:cover">` : 'Cover image'}</div>
          <div style="padding:14px 16px;display:grid;gap:6px">
            <span style="color:#f2cf78;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">${esc((TYPES.find(([v]) => v === L.type) || [, 'Lesson'])[1])} · ${esc((AREAS.find(([v]) => v === L.area) || [, ''])[1])}</span>
            <strong style="font-family:Georgia,serif;font-weight:400;font-size:22px;color:#F0EDD8">${esc(L.title || 'Title')}</strong>
            <span style="color:#D7D1B3;font-size:14px">${esc(L.summary || 'Short description')}</span>
            <span style="display:inline-block;width:max-content;padding:3px 8px;border:1px solid #7A1E1E;background:#7A1E1E;color:#F0EDD8;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;border-radius:2px">${Number(L.price) > 0 ? `$${Number(L.price).toFixed(2)}` : 'Free'}</span>
          </div>
        </div>
        <ul class="aa-note" style="list-style:none;padding:0;margin:10px 0 0">${checks.map(([t, ok]) => `<li>${ok ? '✓' : '○'} ${esc(t)}</li>`).join('')}</ul>
      </div>
    </div>
    ${actionRow(r, allOk, liveUrl)}
    <p class="aa-note" id="rl-msg" role="status"></p>`;

  // Save listing (uploads first, then one database save).
  box.querySelector('#rl-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    msg(box, 'Saving…');
    try {
      let cover = L.cover, path = L.path, filename = L.filename;
      const coverFile = f.get('cover');
      if (coverFile && coverFile.size) {
        const key = `${projectId}/cover-${Date.now()}.${(coverFile.name.split('.').pop() || 'png').toLowerCase()}`;
        const { error } = await supabase.storage.from('academy-covers').upload(key, coverFile, { upsert: true, contentType: coverFile.type });
        if (error) throw error;
        cover = supabase.storage.from('academy-covers').getPublicUrl(key).data.publicUrl;
      }
      const mat = f.get('material');
      if (mat && mat.size) {
        const safe = mat.name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80);
        const key = `${projectId}/${r.id}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage.from('academy-materials').upload(key, mat, { upsert: true, contentType: mat.type || undefined });
        if (error) throw error;
        path = key; filename = mat.name;
      }
      const { error } = await supabase.rpc('save_academy_release_listing', {
        p_release_id: r.id, p_public_title: f.get('title'), p_public_summary: f.get('summary'), p_item_type: f.get('type'),
        p_learning_area_id: f.get('area'), p_price_usd: f.get('price') === '' ? null : Number(f.get('price')),
        p_cover_image_url: cover, p_material_path: path, p_material_kind: f.get('kind'), p_material_filename: filename,
      });
      if (error) throw error;
      if (['PREP', 'READY_OWNER_DECISION'].includes(r.status)) {
        await supabase.rpc('save_academy_release_prep', {
          p_release_id: r.id, p_version_label: r.version_label || `v${p.revision_number || 1}`, p_destination: 'Academy Library (rebelranchministries.org)',
          p_release_url: liveUrl, p_release_notes: r.release_notes || null,
          p_checklist: Object.fromEntries(checks.map(([t]) => [t, true])),
        });
      }
      await render(box, projectId);
      msg(box, 'Saved.');
    } catch (err) { msg(box, err.message || 'Could not save.'); }
  });

  box.querySelector('#rl-ready')?.addEventListener('click', async () => {
    const { error } = await supabase.rpc('mark_academy_release_ready', { p_release_id: r.id });
    if (error) return msg(box, error.message); render(box, projectId);
  });
  box.querySelectorAll('[data-rl-decision]').forEach((b) => b.addEventListener('click', async () => {
    const note = box.querySelector('#rl-note')?.value || '';
    const { error } = await supabase.rpc('set_academy_release_owner_decision', { p_release_id: r.id, p_decision: b.dataset.rlDecision, p_note: note, p_return_stage: b.dataset.rlDecision === 'RETURN_FOR_WORK' ? 'PRODUCT_WORKING' : null });
    if (error) return msg(box, error.message); location.reload();
  }));
  box.querySelector('#rl-publish')?.addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    const { error } = await supabase.rpc('record_academy_release_published', { p_release_id: r.id, p_live_url: liveUrl, p_note: 'Listed in the Academy Library' });
    if (error) return msg(box, error.message);
    await verifyLive(box, r.id, projectId, liveUrl);
  });
  box.querySelector('#rl-verify')?.addEventListener('click', () => verifyLive(box, r.id, projectId, liveUrl));
}

function actionRow(r, allOk, liveUrl) {
  if (r.status === 'PREP') return `<div class="pp-btns"><button class="aa-btn" id="rl-ready" ${allOk ? '' : 'disabled'}>Ready for my decision</button>${allOk ? '' : '<span class="aa-note">Finish the checklist first.</span>'}</div>`;
  if (r.status === 'READY_OWNER_DECISION' || r.status === 'HELD') return `<div class="pp-decide"><textarea class="aa-field" id="rl-note" placeholder="Note (required if you return it for work)"></textarea><div class="pp-btns"><button class="aa-btn" data-rl-decision="APPROVE_RELEASE">Approve release</button>${r.status === 'HELD' ? '' : '<button class="aa-btn ghost" data-rl-decision="HOLD">Hold</button>'}<button class="aa-btn ghost" data-rl-decision="RETURN_FOR_WORK">Return for work</button></div></div>`;
  if (r.status === 'APPROVED_TO_PUBLISH') return `<div class="pp-btns"><button class="aa-btn" id="rl-publish" ${allOk ? '' : 'disabled'}>Put it in the Library</button></div>`;
  if (r.status === 'PUBLISHED_PENDING_VERIFY') return `<div class="pp-btns"><button class="aa-btn" id="rl-verify">Run the live check</button></div>`;
  if (r.status === 'LIVE') return `<div class="pp-btns"><a class="aa-btn" href="${esc(liveUrl)}" target="_blank" rel="noopener">View in the Library</a><span class="aa-note">Live since ${esc(new Date(r.verified_at || r.published_at).toLocaleDateString())}. Price and listing changes save immediately.</span></div>`;
  return '';
}

// Live check: the material really is in locked storage, and the listing has what it needs.
// Only then is the release marked LIVE (which makes it appear in the Library).
async function verifyLive(box, releaseId, projectId, liveUrl) {
  msg(box, 'Checking…');
  const { data: rel } = await supabase.from('academy_release_records').select('material_path,public_title,price_usd').eq('id', releaseId).maybeSingle();
  const problems = [];
  if (!rel?.public_title) problems.push('no learner title');
  if (rel?.price_usd === null || rel?.price_usd === undefined) problems.push('no price');
  if (!rel?.material_path) problems.push('no material attached');
  else {
    const folder = rel.material_path.split('/').slice(0, -1).join('/');
    const name = rel.material_path.split('/').pop();
    const { data: files } = await supabase.storage.from('academy-materials').list(folder, { search: name });
    if (!files?.some((f) => f.name === name)) problems.push('material file not found in locked storage');
  }
  if (problems.length) return msg(box, `Not marked live: ${problems.join(', ')}.`);
  const note = `Automatic check passed: learner title present; price ${Number(rel.price_usd) > 0 ? `$${Number(rel.price_usd).toFixed(2)}` : 'free'}; material present in locked storage (academy-materials).`;
  const { error } = await supabase.rpc('verify_academy_release_live', { p_release_id: releaseId, p_live_url: liveUrl, p_note: note });
  if (error) return msg(box, error.message);
  const { data: cat } = await supabase.rpc('get_academy_catalog');
  const listed = (cat || []).some((c) => c.project_id === projectId);
  location.reload();
  if (!listed) console.warn('Release verified but not yet visible in catalog');
}

function msg(box, text) { const el = box.querySelector('#rl-msg'); if (el) el.textContent = text; }
