// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Custom booking system build for rebelranchministries.org (2026-09-24)
// Public booking flow: booking type → date → time → details + waivers → confirmation.
// book.html?type=<slug> opens straight to one booking type (for linking from other pages).
// The page only guides the visitor; booking-create re-checks every rule on the server.

import { callBooking, el, createSlotPicker, formatWhen } from './booking-common.js';

const $ = (id) => document.getElementById(id);
const pageNotice = $('page-notice');
const form = $('booking-form');
const submitBtn = $('submit-btn');
const formNotice = $('form-notice');

const state = {
  config: null,
  type: null,
  slot: null,
  picker: null,
  reqState: new Map(), // requirement id -> { opened, checkbox, typed, guardian, req }
};

function show(id) {
  for (const s of ['step-type', 'step-when', 'step-details', 'step-done']) $(s).classList.toggle('booking-hidden', s !== id);
}

function notice(text, isError = false) {
  pageNotice.textContent = text;
  pageNotice.classList.toggle('error', isError);
}

function tz() { return state.config?.timezone || 'America/New_York'; }

async function loadConfig() {
  state.config = await callBooking('booking-public-config');
  return state.config;
}

function renderTypes() {
  const list = $('type-list');
  list.replaceChildren(...state.config.event_types.map((t) => el('button', {
    type: 'button', class: 'choice-card', 'aria-pressed': 'false',
    onclick: () => chooseType(t),
  },
  el('h3', {}, t.name),
  t.description ? el('p', {}, t.description) : null,
  el('p', { class: 'choice-meta' }, `${t.duration_minutes} minutes · up to ${t.max_party_size} ${t.max_party_size === 1 ? 'person' : 'people'}`))));
}

function chooseType(t) {
  state.type = t;
  state.slot = null;
  $('type-summary').replaceChildren(el('strong', {}, 'Booking: '), t.name);
  show('step-when');
  state.picker = createSlotPicker({
    mount: $('picker'),
    tz: tz(),
    heading: 'Choose a date and time',
    loadSlots: async (from, to) => {
      const res = await callBooking('booking-availability', { event_type_id: t.id, from, to });
      if (res.enabled === false) throw new Error('Online booking is currently closed.');
      return res.slots;
    },
    onPick: chooseSlot,
  });
  $('picker').querySelector('button:not([disabled])')?.focus();
}

function chooseSlot(slot) {
  state.slot = slot;
  notice('');
  $('slot-summary').replaceChildren(
    el('strong', {}, `${state.type.name}: `), formatWhen(slot.start_at, slot.end_at, tz()),
  );
  form.party_size.max = String(state.type.max_party_size);
  renderRequirements();
  show('step-details');
  formNotice.textContent = '';
  form.name.focus();
  updateSubmit();
}

function applicableRequirements() {
  return (state.config.requirements || []).filter((r) => r.applies_to_all || r.event_type_ids.includes(state.type.id));
}

function minors() { return Math.max(0, Number.parseInt(form.minors_count.value, 10) || 0); }

function renderRequirements() {
  const reqs = applicableRequirements();
  const wrap = $('requirements');
  state.reqState = new Map();
  $('requirements-wrap').classList.toggle('booking-hidden', reqs.length === 0);
  wrap.replaceChildren(...reqs.map((r) => {
    const v = r.version;
    const needsOpen = (r.kind === 'pdf_waiver' && v.file_url) || (r.kind === 'form_link' && v.link_url);
    const rs = { req: r, opened: !needsOpen };
    const checkbox = el('input', { type: 'checkbox', disabled: needsOpen ? true : false, 'aria-describedby': `req-${r.id}-help` });
    rs.checkbox = checkbox;
    const openLabel = r.kind === 'pdf_waiver' ? `Open ${r.title} (PDF)` : `Open ${r.title}`;
    const openLink = needsOpen
      ? el('a', {
        class: 'btn supporting', href: v.file_url || v.link_url, target: '_blank', rel: 'noopener',
        onclick: () => { rs.opened = true; checkbox.disabled = false; help.textContent = ''; updateSubmit(); },
      }, openLabel)
      : null;
    const help = el('span', { class: 'field-hint', id: `req-${r.id}-help` },
      needsOpen ? (r.kind === 'pdf_waiver' ? 'Open and read the waiver to unlock this checkbox.' : 'Open the form to unlock this checkbox.') : '');
    const agreeText = r.kind === 'form_link'
      ? `I have completed ${r.title}.`
      : `I have read and agree to ${r.title}.`;
    const typed = r.requires_typed_name
      ? el('input', { type: 'text', autocomplete: 'off', maxlength: '160', 'aria-label': `Type your full name for ${r.title}` })
      : null;
    const guardian = r.requires_guardian_for_minors
      ? el('input', { type: 'text', autocomplete: 'off', maxlength: '160', 'aria-label': `Parent or guardian full name for ${r.title}` })
      : null;
    rs.typed = typed;
    rs.guardian = guardian;
    const guardianLabel = guardian ? el('label', { class: 'guardian-sign booking-hidden' }, 'Parent or guardian full name', guardian) : null;
    rs.guardianLabel = guardianLabel;
    state.reqState.set(r.id, rs);
    return el('div', { class: 'requirement' },
      el('p', { class: 'req-tag' }, r.required ? 'Required' : 'Optional'),
      el('h3', {}, r.title),
      v.body_text ? el('p', { class: 'req-body' }, v.body_text) : null,
      openLink ? el('div', { class: 'btn-row' }, openLink) : null,
      el('label', { class: 'check-line' }, checkbox, el('span', {}, agreeText)),
      help,
      typed ? el('label', {}, 'Type your full name', typed) : null,
      guardianLabel);
  }));
  syncMinors();
}

function guardianRequired() {
  return minors() > 0 && applicableRequirements().some((r) => r.requires_guardian_for_minors);
}

function syncMinors() {
  const hasMinors = minors() > 0;
  $('guardian-wrap').classList.toggle('booking-hidden', !hasMinors);
  form.guardian_name.required = guardianRequired();
  for (const rs of state.reqState.values()) rs.guardianLabel?.classList.toggle('booking-hidden', !hasMinors);
}

/** Returns a list of what is still missing (empty when the form can be submitted). */
function missingItems() {
  const missing = [];
  const party = Number.parseInt(form.party_size.value, 10) || 0;
  if (!form.name.value.trim()) missing.push('your name');
  if (!form.email.value.trim() || !form.email.checkValidity()) missing.push('a valid email');
  if (party < 1 || party > state.type.max_party_size) missing.push(`a party size from 1 to ${state.type.max_party_size}`);
  if (minors() > party) missing.push('an under-18 count no larger than the party size');
  if (guardianRequired() && !form.guardian_name.value.trim()) missing.push('a parent or guardian name');
  for (const rs of state.reqState.values()) {
    const r = rs.req;
    const checked = rs.checkbox.checked;
    if (r.required && !checked) missing.push(r.title);
    if (checked && rs.typed && rs.typed.value.trim().length < 2) missing.push(`your typed name for ${r.title}`);
    if (checked && rs.guardian && minors() > 0 && rs.guardian.value.trim().length < 2) missing.push(`the guardian's name for ${r.title}`);
  }
  return missing;
}

function updateSubmit() {
  if (!state.type) return;
  syncMinors();
  const missing = missingItems();
  submitBtn.disabled = missing.length > 0;
  $('submit-hint').textContent = missing.length
    ? `Still needed: ${missing.join(', ')}.`
    : 'Everything is ready.';
}

form.addEventListener('input', updateSubmit);
form.addEventListener('change', updateSubmit);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (missingItems().length) { updateSubmit(); return; }
  submitBtn.disabled = true;
  submitBtn.textContent = 'Confirming…';
  formNotice.textContent = '';
  const acknowledgments = [];
  for (const rs of state.reqState.values()) {
    if (!rs.checkbox.checked) continue;
    acknowledgments.push({
      requirement_version_id: rs.req.version.id,
      typed_name: rs.typed?.value.trim() || '',
      guardian_typed_name: minors() > 0 ? (rs.guardian?.value.trim() || '') : '',
    });
  }
  try {
    const res = await callBooking('booking-create', {
      event_type_id: state.type.id,
      start_at: state.slot.start_at,
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      party_size: form.party_size.value,
      minors_count: form.minors_count.value,
      guardian_name: minors() > 0 ? form.guardian_name.value : '',
      notes: form.notes.value,
      website: form.website.value,
      acknowledgments,
    });
    const b = res.booking;
    if (!b) throw new Error('The booking could not be completed. Please try again.');
    $('done-summary').replaceChildren(el('strong', {}, `${b.event_name}: `), formatWhen(b.start_at, b.end_at, b.timezone));
    $('done-message').textContent = b.confirmation_message || '';
    $('done-email').textContent = b.email_sent
      ? `A confirmation email is on its way to ${form.email.value.trim()}. It includes the details you need, a calendar file, and a link to change or cancel your booking.`
      : 'Your booking is confirmed, but the confirmation email could not be sent. Please contact us so we can send your details.';
    show('step-done');
    $('step-done').focus();
  } catch (e) {
    formNotice.textContent = e.message;
    if (e.code === 'slot_unavailable') {
      show('step-when');
      state.picker?.refresh();
      notice(e.message, true);
    } else if (e.code === 'requirement_outdated') {
      await loadConfig();
      renderRequirements();
    }
  } finally {
    submitBtn.textContent = 'Confirm booking';
    updateSubmit();
  }
});

$('change-type').addEventListener('click', () => { state.type = null; show('step-type'); notice(''); });
$('change-time').addEventListener('click', () => { show('step-when'); state.picker?.refresh(); });

async function init() {
  try {
    await loadConfig();
  } catch (e) {
    notice(e.message || 'Booking is temporarily unavailable. Please try again later.', true);
    return;
  }
  if (!state.config.enabled) {
    notice('Online booking is not open right now. Please check back soon or use the Contact page to reach us.');
    return;
  }
  if (!state.config.event_types.length) {
    notice('Nothing is available to book right now. Please check back soon.');
    return;
  }
  notice('');
  renderTypes();
  const wanted = new URLSearchParams(location.search).get('type');
  const direct = wanted && state.config.event_types.find((t) => t.slug === wanted);
  if (direct) chooseType(direct);
  else show('step-type');
}

init();
