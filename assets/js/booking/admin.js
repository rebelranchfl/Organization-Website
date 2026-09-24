// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Custom booking system build for rebelranchministries.org (2026-09-24)
// Booking admin. Uses the existing login (account.html) and the existing admin role
// (user_roles.role = 'admin'). Database RLS (private.is_admin()) is the real security
// boundary; this page only hides itself from non-admins.

import { supabase } from '../supabase-client.js';
import { el, formatWhen } from './booking-common.js';

const $ = (id) => document.getElementById(id);
const noticeEl = $('notice');
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const KIND_LABELS = { pdf_waiver: 'PDF waiver', checkbox_statement: 'Checkbox statement', form_link: 'Link to outside form' };
const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles'];

const db = {
  settings: null,
  types: [],
  rules: [],
  overrides: [],
  requirements: [],
  versions: [],
  bookings: [],
};

function msg(text, type = '') {
  noticeEl.textContent = text;
  noticeEl.className = `notice ${text ? 'visible' : ''} ${type}`.trim();
  if (text) noticeEl.scrollIntoView({ block: 'nearest' });
}

function fail(error, prefix = 'Could not save') {
  const raw = error?.message || String(error);
  let friendly = raw;
  if (/foreign key|violates.*restrict|still referenced/i.test(raw)) friendly = 'This item is used by existing bookings, so it cannot be deleted. Turn it off instead.';
  else if (/duplicate key.*slug/i.test(raw)) friendly = 'Another booking type already uses that web address name (slug).';
  msg(`${prefix}: ${friendly}`, 'error');
}

const tz = () => db.settings?.timezone || 'America/New_York';
const typeName = (id) => (id ? db.types.find((t) => t.id === id)?.name ?? 'Unknown booking type' : 'All booking types');
const hhmm = (t) => (t ? t.slice(0, 5) : '');
const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' });
};
const fmtStamp = (iso) => (iso ? new Intl.DateTimeFormat('en-US', { timeZone: tz(), dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : '—');

function field(label, input, cls = '') {
  return el('label', { class: `field ${cls}`.trim() }, label, input);
}
function input(attrs) { return el('input', attrs); }
function checkbox(label, checked, attrs = {}) {
  const box = el('input', { type: 'checkbox', ...attrs });
  box.checked = !!checked;
  return { box, label: el('label', { class: 'check' }, box, label) };
}
function typeSelect(value, allowAll = true) {
  const select = el('select', {});
  if (allowAll) select.append(el('option', { value: '' }, 'All booking types'));
  for (const t of db.types) select.append(el('option', { value: t.id }, t.name + (t.active ? '' : ' (off)')));
  select.value = value || '';
  return select;
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------
async function loadAll() {
  const results = await Promise.all([
    supabase.from('booking_settings').select('*').eq('id', true).single(),
    supabase.from('booking_event_types').select('*').order('sort_order').order('name'),
    supabase.from('booking_availability_rules').select('*').order('weekday').order('start_time'),
    supabase.from('booking_date_overrides').select('*').order('date'),
    supabase.from('booking_requirements').select('*, booking_requirement_event_types(event_type_id)').order('sort_order').order('created_at'),
    supabase.from('booking_requirement_versions').select('*').order('version_number', { ascending: false }),
  ]);
  const err = results.find((r) => r.error)?.error;
  if (err) throw err;
  [db.settings, db.types, db.rules, db.overrides, db.requirements, db.versions] = results.map((r) => r.data);
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
const tabs = [...document.querySelectorAll('[role="tab"]')];
const renderers = {};
let activeTab = 'settings';

function selectTab(tab, focus = false) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    $(t.getAttribute('aria-controls')).classList.toggle('hidden', !on);
  }
  activeTab = tab.id.replace('tab-', '');
  if (focus) tab.focus();
  msg('');
  renderers[activeTab]?.();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') selectTab(tabs[(i + 1) % tabs.length], true);
    if (e.key === 'ArrowLeft') selectTab(tabs[(i - 1 + tabs.length) % tabs.length], true);
  });
});

async function refresh() {
  await loadAll();
  renderers[activeTab]?.();
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
renderers.settings = () => {
  const s = db.settings;
  const enabled = checkbox('Online booking is ON (visitors can book)', s.public_booking_enabled);
  const email = input({ type: 'email', value: s.notification_email, required: true });
  const zone = el('select', {});
  for (const z of new Set([...TIMEZONES, s.timezone])) zone.append(el('option', { value: z }, z));
  zone.value = s.timezone;
  const reminder = input({ type: 'number', min: '1', max: '336', value: s.reminder_hours_before });
  const location = el('textarea', {}, s.private_location_text || '');
  const confirmation = el('textarea', {}, s.confirmation_message || '');
  const policy = el('textarea', {}, s.cancellation_policy_text || '');
  const save = el('button', { class: 'btn primary', type: 'button' }, 'Save settings');
  save.addEventListener('click', async () => {
    save.disabled = true;
    const { error } = await supabase.from('booking_settings').update({
      public_booking_enabled: enabled.box.checked,
      notification_email: email.value.trim(),
      timezone: zone.value,
      reminder_hours_before: Number(reminder.value) || 24,
      private_location_text: location.value.trim() || null,
      confirmation_message: confirmation.value.trim() || null,
      cancellation_policy_text: policy.value.trim() || null,
    }).eq('id', true);
    save.disabled = false;
    if (error) return fail(error);
    await refresh();
    msg('Settings saved.', 'success');
  });
  $('panel-settings').replaceChildren(
    el('h2', {}, 'Settings'),
    el('p', { class: 'muted' }, 'Turn online booking on only after you have added at least one booking type and weekly hours. Public page: rebelranchministries.org/book.html'),
    el('div', { class: 'actions' }, enabled.label),
    el('div', { class: 'form-grid' },
      field('Send new-booking notices to', email),
      field('Time zone', zone),
      field('Reminder email, hours before the booking', reminder),
      field('General private location / directions (emailed only to confirmed bookers — never shown on the website). A booking type can override this with its own.', location, 'wide'),
      field('Message included in confirmation emails', confirmation, 'wide'),
      field('Cancellation policy (shown to visitors)', policy, 'wide')),
    el('div', { class: 'actions' }, save));
};

// ---------------------------------------------------------------------------
// Booking types
// ---------------------------------------------------------------------------
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'visit';

function typeForm(t = null) {
  const v = t || { name: '', slug: '', description: '', duration_minutes: 60, slot_interval_minutes: null, buffer_before_minutes: 0, buffer_after_minutes: 0, min_notice_hours: 24, max_days_ahead: 60, max_party_size: 10, capacity_per_slot: 1, active: true, sort_order: (db.types.at(-1)?.sort_order ?? 0) + 10 };
  const f = {
    name: input({ type: 'text', value: v.name, maxlength: '120', required: true }),
    slug: input({ type: 'text', value: v.slug, maxlength: '60', pattern: '[a-z0-9-]+' }),
    description: el('textarea', {}, v.description || ''),
    location_text: el('textarea', {}, v.location_text || ''),
    duration_minutes: input({ type: 'number', min: '5', max: '1440', value: v.duration_minutes }),
    slot_interval_minutes: input({ type: 'number', min: '5', max: '1440', value: v.slot_interval_minutes ?? '', placeholder: 'Same as length' }),
    buffer_before_minutes: input({ type: 'number', min: '0', max: '1440', value: v.buffer_before_minutes }),
    buffer_after_minutes: input({ type: 'number', min: '0', max: '1440', value: v.buffer_after_minutes }),
    min_notice_hours: input({ type: 'number', min: '0', value: v.min_notice_hours }),
    max_days_ahead: input({ type: 'number', min: '1', max: '730', value: v.max_days_ahead }),
    max_party_size: input({ type: 'number', min: '1', max: '500', value: v.max_party_size }),
    capacity_per_slot: input({ type: 'number', min: '1', max: '500', value: v.capacity_per_slot }),
    sort_order: input({ type: 'number', value: v.sort_order }),
  };
  const active = checkbox('Bookable (On)', v.active);
  if (!t) f.name.addEventListener('input', () => { f.slug.value = slugify(f.name.value); });
  const save = el('button', { class: 'btn primary', type: 'button' }, t ? 'Save booking type' : 'Add booking type');
  const cancel = el('button', { class: 'btn', type: 'button', onclick: () => renderers.types() }, 'Cancel');
  save.addEventListener('click', async () => {
    if (!f.name.value.trim()) return msg('Please enter a name.', 'error');
    const num = (x, fallback = null) => (x.value === '' ? fallback : Number(x.value));
    const row = {
      name: f.name.value.trim(),
      slug: slugify(f.slug.value || f.name.value),
      description: f.description.value.trim() || null,
      location_text: f.location_text.value.trim() || null,
      duration_minutes: num(f.duration_minutes, 60),
      slot_interval_minutes: num(f.slot_interval_minutes),
      buffer_before_minutes: num(f.buffer_before_minutes, 0),
      buffer_after_minutes: num(f.buffer_after_minutes, 0),
      min_notice_hours: num(f.min_notice_hours, 24),
      max_days_ahead: num(f.max_days_ahead, 60),
      max_party_size: num(f.max_party_size, 10),
      capacity_per_slot: num(f.capacity_per_slot, 1),
      sort_order: num(f.sort_order, 0),
      active: active.box.checked,
    };
    save.disabled = true;
    const { error } = t
      ? await supabase.from('booking_event_types').update(row).eq('id', t.id)
      : await supabase.from('booking_event_types').insert(row);
    save.disabled = false;
    if (error) return fail(error);
    await refresh();
    msg(t ? 'Booking type saved.' : 'Booking type added.', 'success');
  });
  return el('div', { class: 'detail' },
    el('h3', {}, t ? `Edit: ${t.name}` : 'New booking type'),
    el('div', { class: 'form-grid' },
      field('Name', f.name), field('Web address name (slug)', f.slug),
      field('Description (shown to visitors)', f.description, 'wide'),
      field('Private location or how to join (emailed only after booking; leave empty to use the general location from Settings — e.g. a video-call link for remote bookings)', f.location_text, 'wide'),
      field('Length (minutes)', f.duration_minutes), field('Start times every (minutes)', f.slot_interval_minutes),
      field('Buffer before (minutes)', f.buffer_before_minutes), field('Buffer after (minutes)', f.buffer_after_minutes),
      field('Minimum notice (hours)', f.min_notice_hours), field('Bookable up to (days ahead)', f.max_days_ahead),
      field('Largest party per booking', f.max_party_size), field('Bookings allowed per time slot', f.capacity_per_slot),
      field('Display order (lower first)', f.sort_order)),
    el('div', { class: 'actions' }, active.label, save, cancel));
}

renderers.types = () => {
  const panel = $('panel-types');
  const list = el('div', { class: 'rows' });
  for (const t of db.types) {
    const edit = el('button', { class: 'btn', type: 'button' }, 'Edit');
    const del = el('button', { class: 'btn danger', type: 'button' }, 'Delete');
    const slot = el('div', {});
    edit.addEventListener('click', () => slot.replaceChildren(typeForm(t)));
    del.addEventListener('click', async () => {
      if (!confirm(`Delete "${t.name}"? Its weekly hours and blocked dates are removed too. Booking types with bookings cannot be deleted — turn them off instead.`)) return;
      const { error } = await supabase.from('booking_event_types').delete().eq('id', t.id);
      if (error) return fail(error, 'Could not delete');
      await refresh();
      msg('Booking type deleted.', 'success');
    });
    list.append(el('div', {},
      el('div', { class: 'row' },
        el('div', {},
          el('div', { class: 'row-title' }, `${t.name}${t.active ? '' : ' — Off'}`),
          el('div', { class: 'row-detected' }, `${t.duration_minutes} min · starts every ${t.slot_interval_minutes || t.duration_minutes} min · buffers ${t.buffer_before_minutes}/${t.buffer_after_minutes} min · ${t.min_notice_hours} h notice · ${t.max_days_ahead} days ahead · party up to ${t.max_party_size} · ${t.capacity_per_slot} per slot`)),
        el('div', { class: 'row-controls' }, edit, del)),
      slot));
  }
  const addSlot = el('div', {});
  const add = el('button', { class: 'btn primary', type: 'button', onclick: () => addSlot.replaceChildren(typeForm()) }, 'Add a booking type');
  panel.replaceChildren(
    el('h2', {}, 'Booking Types'),
    el('p', { class: 'muted' }, 'Each booking type is something people can schedule — an in-person visit, a remote call, a class, and so on. Link straight to one with book.html?type=<web address name>. Buffers keep open time before/after each booking. "Bookings allowed per time slot" above 1 lets separate groups share a time.'),
    db.types.length ? list : el('p', { class: 'muted' }, 'No booking types yet.'),
    el('div', { class: 'actions' }, add), addSlot);
};

// ---------------------------------------------------------------------------
// Weekly hours
// ---------------------------------------------------------------------------
renderers.hours = () => {
  const panel = $('panel-hours');
  const table = el('table', {}, el('thead', {}, el('tr', {}, ['Day', 'From', 'To', 'Applies to', ''].map((h) => el('th', {}, h)))));
  const body = el('tbody', {});
  for (const r of db.rules) {
    const del = el('button', { class: 'btn danger', type: 'button' }, 'Remove');
    del.addEventListener('click', async () => {
      const { error } = await supabase.from('booking_availability_rules').delete().eq('id', r.id);
      if (error) return fail(error, 'Could not remove');
      await refresh();
    });
    body.append(el('tr', {}, el('td', {}, WEEKDAYS[r.weekday]), el('td', {}, fmtTime(r.start_time)), el('td', {}, fmtTime(r.end_time)), el('td', {}, typeName(r.event_type_id)), el('td', {}, del)));
  }
  table.append(body);
  const day = el('select', {}, WEEKDAYS.map((d, i) => el('option', { value: String(i) }, d)));
  const from = input({ type: 'time', value: '09:00' });
  const to = input({ type: 'time', value: '17:00' });
  const applies = typeSelect('');
  const add = el('button', { class: 'btn primary', type: 'button' }, 'Add hours');
  add.addEventListener('click', async () => {
    if (!from.value || !to.value || to.value <= from.value) return msg('The end time must be after the start time.', 'error');
    const { error } = await supabase.from('booking_availability_rules').insert({
      weekday: Number(day.value), start_time: from.value, end_time: to.value, event_type_id: applies.value || null,
    });
    if (error) return fail(error);
    await refresh();
    msg('Hours added.', 'success');
  });
  panel.replaceChildren(
    el('h2', {}, 'Weekly Hours'),
    el('p', { class: 'muted' }, `Times are in ${tz()}. You can add more than one window per day (for example 9–12 and 2–5). If a booking type has hours of its own, only its own hours are used for it; otherwise it uses the "All booking types" hours.`),
    db.rules.length ? el('div', { class: 'table-wrap' }, table) : el('p', { class: 'muted' }, 'No weekly hours yet — nothing can be booked until hours are added.'),
    el('h3', {}, 'Add hours'),
    el('div', { class: 'form-grid' }, field('Day', day), field('From', from), field('To', to), field('Applies to', applies)),
    el('div', { class: 'actions' }, add));
};

// ---------------------------------------------------------------------------
// Blocked dates / date overrides
// ---------------------------------------------------------------------------
renderers.blocked = () => {
  const panel = $('panel-blocked');
  const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: tz() }).format(new Date());
  const upcoming = db.overrides.filter((o) => o.date >= todayIso);
  const table = el('table', {}, el('thead', {}, el('tr', {}, ['Date', 'What', 'Applies to', 'Note', ''].map((h) => el('th', {}, h)))));
  const body = el('tbody', {});
  for (const o of upcoming) {
    const del = el('button', { class: 'btn danger', type: 'button' }, 'Remove');
    del.addEventListener('click', async () => {
      const { error } = await supabase.from('booking_date_overrides').delete().eq('id', o.id);
      if (error) return fail(error, 'Could not remove');
      await refresh();
    });
    const what = o.closed ? 'Closed all day' : `Special hours ${fmtTime(o.start_time)} – ${fmtTime(o.end_time)}`;
    body.append(el('tr', {}, el('td', {}, o.date), el('td', {}, what), el('td', {}, typeName(o.event_type_id)), el('td', {}, o.note || ''), el('td', {}, del)));
  }
  table.append(body);
  const date = input({ type: 'date', min: todayIso });
  const mode = el('select', {}, el('option', { value: 'closed' }, 'Closed all day'), el('option', { value: 'custom' }, 'Special hours (replace normal hours)'));
  const from = input({ type: 'time', value: '09:00' });
  const to = input({ type: 'time', value: '12:00' });
  const fromField = field('From', from, 'hidden');
  const toField = field('To', to, 'hidden');
  mode.addEventListener('change', () => { fromField.classList.toggle('hidden', mode.value !== 'custom'); toField.classList.toggle('hidden', mode.value !== 'custom'); });
  const applies = typeSelect('');
  const note = input({ type: 'text', maxlength: '200', placeholder: 'Private note (optional)' });
  const add = el('button', { class: 'btn primary', type: 'button' }, 'Add');
  add.addEventListener('click', async () => {
    if (!date.value) return msg('Please choose a date.', 'error');
    const custom = mode.value === 'custom';
    if (custom && (!from.value || !to.value || to.value <= from.value)) return msg('The end time must be after the start time.', 'error');
    const { error } = await supabase.from('booking_date_overrides').insert({
      date: date.value, closed: !custom, start_time: custom ? from.value : null, end_time: custom ? to.value : null,
      event_type_id: applies.value || null, note: note.value.trim() || null,
    });
    if (error) return fail(error);
    await refresh();
    msg('Date saved.', 'success');
  });
  panel.replaceChildren(
    el('h2', {}, 'Blocked Dates'),
    el('p', { class: 'muted' }, 'Close a day (holidays, weather, events) or give a single date special hours. Existing bookings on a closed day are NOT cancelled automatically — cancel them from the Bookings tab if needed.'),
    upcoming.length ? el('div', { class: 'table-wrap' }, table) : el('p', { class: 'muted' }, 'No upcoming blocked or special dates.'),
    el('h3', {}, 'Add a date'),
    el('div', { class: 'form-grid' }, field('Date', date), field('Type', mode), fromField, toField, field('Applies to', applies), field('Note', note)),
    el('div', { class: 'actions' }, add));
};

// ---------------------------------------------------------------------------
// Waivers & forms
// ---------------------------------------------------------------------------
const versionsFor = (reqId) => db.versions.filter((v) => v.requirement_id === reqId);

async function openStoredFile(path) {
  const win = window.open('', '_blank');
  const { data, error } = await supabase.storage.from('booking-waivers').createSignedUrl(path, 300);
  if (error || !data?.signedUrl) { win?.close(); return fail(error || new Error('File not found'), 'Could not open file'); }
  if (win) win.location.href = data.signedUrl; else location.href = data.signedUrl;
}

async function uploadPdf(reqId, file) {
  if (!file) throw new Error('Choose a PDF file to upload.');
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) throw new Error('Only PDF files can be uploaded.');
  if (file.size > 10 * 1024 * 1024) throw new Error('PDF files must be 10 MB or smaller.');
  const path = `requirements/${reqId}/${Date.now()}-${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from('booking-waivers').upload(path, file, { contentType: 'application/pdf', upsert: false });
  if (error) throw error;
  return path;
}

/** Adds a new version (never edits an old one). Cleans up the upload if the insert fails. */
async function addVersion(req, { body, file, link }, keepFilePath = null) {
  let path = null;
  let uploaded = false;
  if (req.kind === 'pdf_waiver') {
    // Wording-only change to a PDF waiver: the new version points at the same, never-deleted file.
    if (!file && keepFilePath) path = keepFilePath;
    else { path = await uploadPdf(req.id, file); uploaded = true; }
  }
  const { error } = await supabase.from('booking_requirement_versions').insert({
    requirement_id: req.id,
    body_text: body?.trim() || null,
    file_path: path,
    link_url: req.kind === 'form_link' ? (link?.trim() || null) : null,
  });
  if (error) {
    if (uploaded) await supabase.storage.from('booking-waivers').remove([path]);
    throw error;
  }
}

function versionEditor(req, kind, onDone, current = null) {
  const body = el('textarea', {}, current?.body_text || '');
  const file = input({ type: 'file', accept: 'application/pdf,.pdf' });
  const link = input({ type: 'url', placeholder: 'https://', value: current?.link_url || '' });
  const parts = [field(kind === 'checkbox_statement' ? 'Statement wording (visitors check a box to agree)' : 'Short description shown to visitors (optional)', body, 'wide')];
  if (kind === 'pdf_waiver') parts.push(field(current ? 'Upload an updated PDF (leave empty to keep the current file)' : 'Upload the PDF', file, 'wide'));
  if (kind === 'form_link') parts.push(field('Link to the form (must start with https://)', link, 'wide'));
  return { node: el('div', { class: 'form-grid' }, parts), read: () => ({ body: body.value, file: file.files?.[0], link: link.value }), onDone };
}

function requirementRow(req, index) {
  const current = versionsFor(req.id)[0];
  const status = el('span', { class: 'row-status' });
  const patch = async (changes) => {
    status.textContent = 'Saving…'; status.className = 'row-status saving';
    const { error } = await supabase.from('booking_requirements').update(changes).eq('id', req.id);
    if (error) { status.textContent = 'Error'; status.className = 'row-status error'; return fail(error); }
    Object.assign(req, changes);
    status.textContent = 'Saved'; status.className = 'row-status saved';
    setTimeout(() => { if (status.textContent === 'Saved') status.textContent = ''; }, 2000);
  };
  const on = checkbox('On', req.active, { onchange: (e) => patch({ active: e.target.checked }) });
  const required = checkbox('Required', req.required, { onchange: (e) => patch({ required: e.target.checked }) });
  const typed = checkbox('Typed full name', req.requires_typed_name, { onchange: (e) => patch({ requires_typed_name: e.target.checked }) });
  const guardian = checkbox('Guardian name when minors', req.requires_guardian_for_minors, { onchange: (e) => patch({ requires_guardian_for_minors: e.target.checked }) });

  // Applies to
  const assigned = new Set((req.booking_requirement_event_types || []).map((j) => j.event_type_id));
  const allBox = checkbox('All booking types', req.applies_to_all);
  const typeBoxes = db.types.map((t) => ({ t, ...checkbox(t.name, assigned.has(t.id)) }));
  const typeWrap = el('div', { class: `row-controls ${req.applies_to_all ? 'hidden' : ''}`.trim(), style: 'justify-content:flex-start' }, typeBoxes.map((x) => x.label));
  allBox.box.addEventListener('change', async () => {
    typeWrap.classList.toggle('hidden', allBox.box.checked);
    await patch({ applies_to_all: allBox.box.checked });
  });
  for (const x of typeBoxes) {
    x.box.addEventListener('change', async () => {
      const { error } = x.box.checked
        ? await supabase.from('booking_requirement_event_types').insert({ requirement_id: req.id, event_type_id: x.t.id })
        : await supabase.from('booking_requirement_event_types').delete().eq('requirement_id', req.id).eq('event_type_id', x.t.id);
      if (error) return fail(error);
      status.textContent = 'Saved'; status.className = 'row-status saved';
    });
  }

  const move = async (dir) => {
    const list = db.requirements;
    const other = list[index + dir];
    if (!other) return;
    const a = { id: req.id, sort_order: other.sort_order };
    const b = { id: other.id, sort_order: req.sort_order === other.sort_order ? req.sort_order + dir : req.sort_order };
    const r1 = await supabase.from('booking_requirements').update({ sort_order: a.sort_order }).eq('id', a.id);
    const r2 = await supabase.from('booking_requirements').update({ sort_order: b.sort_order }).eq('id', b.id);
    if (r1.error || r2.error) return fail(r1.error || r2.error);
    await refresh();
  };
  const up = el('button', { class: 'btn', type: 'button', 'aria-label': `Move ${req.title} up`, disabled: index === 0, onclick: () => move(-1) }, '↑');
  const down = el('button', { class: 'btn', type: 'button', 'aria-label': `Move ${req.title} down`, disabled: index === db.requirements.length - 1, onclick: () => move(1) }, '↓');

  const slot = el('div', {});
  const editBtn = el('button', { class: 'btn', type: 'button' }, 'Edit (new version)');
  editBtn.addEventListener('click', () => {
    const ed = versionEditor(req, req.kind, null, current);
    const save = el('button', { class: 'btn primary', type: 'button' }, 'Save as new version');
    const title = input({ type: 'text', value: req.title, maxlength: '200' });
    save.addEventListener('click', async () => {
      save.disabled = true;
      try {
        if (title.value.trim() && title.value.trim() !== req.title) {
          const { error } = await supabase.from('booking_requirements').update({ title: title.value.trim() }).eq('id', req.id);
          if (error) throw error;
        }
        await addVersion(req, ed.read(), current?.file_path || null);
        await refresh();
        msg(`Saved as version ${(current?.version_number || 0) + 1}. Earlier versions and past signatures are kept unchanged.`, 'success');
      } catch (e) { fail(e); } finally { save.disabled = false; }
    });
    slot.replaceChildren(el('div', { class: 'detail' },
      el('h3', {}, `New version of: ${req.title}`),
      el('p', { class: 'muted' }, 'Saving creates a new version. Visitors from now on see and sign the new version; everyone who already signed keeps their record of the version they signed.'),
      el('div', { class: 'form-grid' }, field('Title', title, 'wide')),
      ed.node,
      el('div', { class: 'actions' }, save, el('button', { class: 'btn', type: 'button', onclick: () => slot.replaceChildren() }, 'Cancel'))));
  });
  const historyBtn = el('button', { class: 'btn', type: 'button' }, 'Version history');
  historyBtn.addEventListener('click', () => {
    const versions = versionsFor(req.id);
    slot.replaceChildren(el('div', { class: 'detail' },
      el('h3', {}, `Version history: ${req.title}`),
      versions.map((v) => el('div', { class: 'version' },
        el('strong', {}, `Version ${v.version_number}${v === versions[0] ? ' (current)' : ''}`), ` — ${fmtStamp(v.created_at)}`,
        v.body_text ? el('pre', {}, v.body_text) : null,
        v.file_path ? el('div', { class: 'actions' }, el('button', { class: 'btn', type: 'button', onclick: () => openStoredFile(v.file_path) }, 'Open PDF')) : null,
        v.link_url ? el('p', {}, el('a', { href: v.link_url, target: '_blank', rel: 'noopener' }, v.link_url)) : null)),
      el('div', { class: 'actions' }, el('button', { class: 'btn', type: 'button', onclick: () => slot.replaceChildren() }, 'Close'))));
  });

  return el('div', {},
    el('div', { class: 'row' },
      el('div', {},
        el('div', { class: 'row-title' }, req.title),
        el('div', { class: 'row-detected' }, `${KIND_LABELS[req.kind]} · ${current ? `version ${current.version_number}` : 'no version yet — not shown to visitors'}`),
        el('div', { class: 'row-controls', style: 'justify-content:flex-start;margin-top:8px' }, allBox.label),
        typeWrap),
      el('div', { class: 'row-controls' }, on.label, required.label, typed.label, guardian.label, up, down, editBtn, historyBtn, status)),
    slot);
}

function newRequirementForm(mount) {
  const title = input({ type: 'text', maxlength: '200' });
  const kind = el('select', {}, Object.entries(KIND_LABELS).map(([k, v]) => el('option', { value: k }, v)));
  const required = checkbox('Required', true);
  const typed = checkbox('Typed full name', true);
  const guardian = checkbox('Guardian name when minors', false);
  const editorSlot = el('div', {});
  let ed = versionEditor({ kind: kind.value }, kind.value);
  editorSlot.append(ed.node);
  kind.addEventListener('change', () => { ed = versionEditor({ kind: kind.value }, kind.value); editorSlot.replaceChildren(ed.node); });
  const save = el('button', { class: 'btn primary', type: 'button' }, 'Create');
  save.addEventListener('click', async () => {
    if (!title.value.trim()) return msg('Please enter a title.', 'error');
    const content = ed.read();
    if (kind.value === 'pdf_waiver' && !content.file) return msg('Please choose the PDF to upload.', 'error');
    if (kind.value === 'form_link' && !/^https:\/\//i.test(content.link)) return msg('Please enter a link that starts with https://', 'error');
    if (kind.value === 'checkbox_statement' && !content.body.trim()) return msg('Please enter the statement wording.', 'error');
    save.disabled = true;
    // Created switched Off first so a half-finished item can never block bookings.
    const { data: req, error } = await supabase.from('booking_requirements').insert({
      title: title.value.trim(), kind: kind.value, active: false, required: required.box.checked,
      requires_typed_name: typed.box.checked, requires_guardian_for_minors: guardian.box.checked,
      sort_order: (db.requirements.at(-1)?.sort_order ?? 0) + 10,
    }).select().single();
    if (error) { save.disabled = false; return fail(error); }
    try {
      await addVersion(req, content);
      await supabase.from('booking_requirements').update({ active: true }).eq('id', req.id);
      await refresh();
      msg(`"${req.title}" created and switched On.`, 'success');
    } catch (e) {
      await refresh();
      fail(e, `"${req.title}" was created but is Off because its first version could not be saved`);
    } finally { save.disabled = false; }
  });
  mount.replaceChildren(el('div', { class: 'detail' },
    el('h3', {}, 'New waiver or form'),
    el('div', { class: 'form-grid' }, field('Title', title), field('Type', kind)),
    editorSlot,
    el('div', { class: 'actions' }, required.label, typed.label, guardian.label),
    el('div', { class: 'actions' }, save, el('button', { class: 'btn', type: 'button', onclick: () => mount.replaceChildren() }, 'Cancel'))));
}

renderers.waivers = () => {
  const panel = $('panel-waivers');
  const addSlot = el('div', {});
  panel.replaceChildren(
    el('h2', {}, 'Waivers & Forms'),
    el('p', { class: 'legal-note' }, 'Waiver wording is supplied by the owner; have it reviewed by a Florida attorney.'),
    el('p', { class: 'muted' }, 'Visitors see these in order. "On" controls whether it is shown at all; "Required" means booking is blocked until it is completed. Editing always creates a new version — old versions and past signatures are kept permanently.'),
    db.requirements.length
      ? el('div', { class: 'rows' }, db.requirements.map((r, i) => requirementRow(r, i)))
      : el('p', { class: 'muted' }, 'No waivers or forms yet.'),
    el('div', { class: 'actions' }, el('button', { class: 'btn primary', type: 'button', onclick: () => newRequirementForm(addSlot) }, 'Add a waiver or form')),
    addSlot);
};

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------
let bookingFilter = 'upcoming';

async function loadBookings() {
  let q = supabase.from('booking_bookings').select('*').order('start_at', { ascending: bookingFilter !== 'past' }).limit(1000);
  const now = new Date().toISOString();
  if (bookingFilter === 'upcoming') q = q.gte('start_at', now).eq('status', 'confirmed');
  if (bookingFilter === 'past') q = q.lt('start_at', now);
  if (bookingFilter === 'cancelled') q = q.eq('status', 'cancelled');
  const { data, error } = await q;
  if (error) throw error;
  db.bookings = data;
}

async function loadAcks(bookingIds) {
  if (!bookingIds.length) return [];
  const { data, error } = await supabase.from('booking_acknowledgments')
    .select('*, booking_requirement_versions(id, version_number, file_path, link_url, body_text, requirement_id, booking_requirements(title))')
    .in('booking_id', bookingIds)
    .order('agreed_at');
  if (error) throw error;
  return data;
}

async function showBookingDetail(b, mount) {
  const [acks, emails] = await Promise.all([
    loadAcks([b.id]),
    supabase.from('booking_email_log').select('*').eq('booking_id', b.id).order('sent_at'),
  ]);
  const cancelBtn = el('button', { class: 'btn danger', type: 'button' }, 'Cancel this booking');
  const notify = checkbox('Email the visitor a cancellation notice', true);
  cancelBtn.addEventListener('click', async () => {
    if (!confirm(`Cancel ${b.name}'s booking on ${formatWhen(b.start_at, b.end_at, tz())}?`)) return;
    cancelBtn.disabled = true;
    const { data, error } = await supabase.functions.invoke('booking-manage', {
      body: { action: 'admin_cancel', booking_id: b.id, notify_visitor: notify.box.checked },
    });
    cancelBtn.disabled = false;
    if (error) {
      let text = error.message;
      try { text = (await error.context.json()).error || text; } catch { /* keep */ }
      return msg(`Could not cancel: ${text}`, 'error');
    }
    await renderers.bookings();
    msg(notify.box.checked ? (data?.visitor_emailed ? 'Booking cancelled and the visitor was emailed.' : 'Booking cancelled, but the visitor email did not send — please contact them directly.') : 'Booking cancelled (visitor not emailed).', data?.visitor_emailed || !notify.box.checked ? 'success' : 'error');
  });
  const canCancel = b.status === 'confirmed' && new Date(b.start_at) > new Date();
  const dl = el('dl', {});
  const add = (k, v) => dl.append(el('dt', {}, k), el('dd', {}, v ?? '—'));
  add('Booking type', typeName(b.event_type_id));
  add('When', formatWhen(b.start_at, b.end_at, tz()));
  add('Status', b.status === 'cancelled' ? `Cancelled by ${b.cancelled_by || '—'} on ${fmtStamp(b.cancelled_at)}` : 'Confirmed');
  add('Name', b.name); add('Email', b.email); add('Phone', b.phone);
  add('Party size', String(b.party_size)); add('Under 18', String(b.minors_count));
  if (b.minors_count) add('Guardian', b.guardian_name);
  add('Notes', b.notes);
  add('Booked', fmtStamp(b.created_at));
  if (b.rescheduled_at) add('Rescheduled', fmtStamp(b.rescheduled_at));
  add('Reminder sent', fmtStamp(b.reminder_sent_at));
  mount.replaceChildren(el('div', { class: 'detail' },
    el('h3', {}, `${b.name} — ${formatWhen(b.start_at, b.end_at, tz())}`),
    dl,
    el('h3', {}, 'Waivers & forms signed (exact versions)'),
    acks.length ? el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, ['Waiver / form', 'Version', 'Typed name', 'Guardian', 'Agreed at', ''].map((h) => el('th', {}, h)))),
      el('tbody', {}, acks.map((a) => {
        const v = a.booking_requirement_versions;
        return el('tr', {},
          el('td', {}, v?.booking_requirements?.title ?? '—'),
          el('td', {}, String(v?.version_number ?? '—')),
          el('td', {}, a.typed_name || '—'),
          el('td', {}, a.guardian_typed_name || '—'),
          el('td', {}, fmtStamp(a.agreed_at)),
          el('td', {}, v?.file_path ? el('button', { class: 'btn', type: 'button', onclick: () => openStoredFile(v.file_path) }, 'Open signed version') : (v?.link_url ? el('a', { href: v.link_url, target: '_blank', rel: 'noopener' }, 'Form link') : '')));
      })))) : el('p', { class: 'muted' }, 'No waivers or forms were required for this booking.'),
    el('h3', {}, 'Emails'),
    (emails.data || []).length ? el('ul', {}, emails.data.map((e) => el('li', {}, `${fmtStamp(e.sent_at)} — ${e.type} to ${e.recipient}: ${e.status}${e.error ? ` (${e.error.slice(0, 160)})` : ''}`))) : el('p', { class: 'muted' }, 'No emails logged.'),
    canCancel ? el('div', { class: 'actions' }, notify.label, cancelBtn) : null,
    el('div', { class: 'actions' }, el('button', { class: 'btn', type: 'button', onclick: () => mount.replaceChildren() }, 'Close'))));
  mount.scrollIntoView({ block: 'nearest' });
}

function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
}

async function exportCsv() {
  const acks = await loadAcks(db.bookings.map((b) => b.id));
  const byBooking = new Map();
  for (const a of acks) {
    const v = a.booking_requirement_versions;
    const text = `${v?.booking_requirements?.title ?? '?'} v${v?.version_number ?? '?'} signed "${a.typed_name || ''}"${a.guardian_typed_name ? ` guardian "${a.guardian_typed_name}"` : ''} at ${a.agreed_at}`;
    if (!byBooking.has(a.booking_id)) byBooking.set(a.booking_id, []);
    byBooking.get(a.booking_id).push(text);
  }
  const header = ['Booking ID', 'Booking type', 'Start', 'End', 'Status', 'Name', 'Email', 'Phone', 'Party size', 'Under 18', 'Guardian', 'Notes', 'Booked at', 'Cancelled at', 'Cancelled by', 'Waivers signed'];
  const lines = [header.map(csvCell).join(',')];
  for (const b of db.bookings) {
    lines.push([b.id, typeName(b.event_type_id), fmtStamp(b.start_at), fmtStamp(b.end_at), b.status, b.name, b.email, b.phone, b.party_size, b.minors_count, b.guardian_name, b.notes, fmtStamp(b.created_at), b.cancelled_at ? fmtStamp(b.cancelled_at) : '', b.cancelled_by, (byBooking.get(b.id) || []).join(' | ')].map(csvCell).join(','));
  }
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `bookings-${bookingFilter}-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

renderers.bookings = async () => {
  const panel = $('panel-bookings');
  panel.replaceChildren(el('h2', {}, 'Bookings'), el('p', { class: 'muted' }, 'Loading…'));
  try { await loadBookings(); } catch (e) { return fail(e, 'Could not load bookings'); }
  const filter = el('select', {},
    el('option', { value: 'upcoming' }, 'Upcoming (confirmed)'),
    el('option', { value: 'past' }, 'Past'),
    el('option', { value: 'cancelled' }, 'Cancelled'),
    el('option', { value: 'all' }, 'All'));
  filter.value = bookingFilter;
  filter.addEventListener('change', () => { bookingFilter = filter.value; renderers.bookings(); });
  const detail = el('div', {});
  const table = el('table', {},
    el('thead', {}, el('tr', {}, ['When', 'Booking type', 'Name', 'Party', 'Status', ''].map((h) => el('th', {}, h)))),
    el('tbody', {}, db.bookings.map((b) => el('tr', {},
      el('td', {}, formatWhen(b.start_at, b.end_at, tz())),
      el('td', {}, typeName(b.event_type_id)),
      el('td', {}, b.name),
      el('td', {}, `${b.party_size}${b.minors_count ? ` (${b.minors_count} minors)` : ''}`),
      el('td', {}, b.status === 'cancelled' ? 'Cancelled' : 'Confirmed'),
      el('td', {}, el('button', { class: 'btn', type: 'button', onclick: () => showBookingDetail(b, detail).catch((e) => fail(e, 'Could not load details')) }, 'Details'))))));
  panel.replaceChildren(
    el('h2', {}, 'Bookings'),
    el('div', { class: 'actions' },
      field('Show', filter),
      el('button', { class: 'btn', type: 'button', disabled: !db.bookings.length, onclick: () => exportCsv().catch((e) => fail(e, 'Could not export')) }, 'Export CSV')),
    db.bookings.length ? el('div', { class: 'table-wrap' }, table) : el('p', { class: 'muted' }, 'No bookings to show.'),
    detail);
};

// ---------------------------------------------------------------------------
// Start: same admin check as store-manager.html
// ---------------------------------------------------------------------------
async function init() {
  try {
    const { data: s, error } = await supabase.auth.getSession();
    if (error) throw error;
    const user = s.session?.user;
    if (!user) { location.href = 'account.html?next=booking-admin.html'; return; }
    const { data: roles, error: re } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    if (re) throw re;
    if (!(roles || []).some((x) => x.role === 'admin')) {
      $('loading').textContent = 'Administrator access is required. Returning to My Account…';
      setTimeout(() => { location.href = 'account.html'; }, 1500);
      return;
    }
    await loadAll();
    $('loading').classList.add('hidden');
    $('content').classList.remove('hidden');
    selectTab(tabs[0]);
  } catch (e) {
    $('loading').textContent = 'Booking admin could not be loaded.';
    msg(e.message, 'error');
  }
}
init();
