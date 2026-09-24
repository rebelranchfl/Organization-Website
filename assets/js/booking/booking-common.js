// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Custom booking system build for rebelranchministries.org (2026-09-24)
// Shared browser helpers for book.html and book-manage.html. Uses the one shared Supabase
// client (publishable key only). Every read/write goes through the booking-* Edge Functions.

import { supabase } from '../supabase-client.js';

/** Calls a booking Edge Function and returns its JSON, throwing an Error with the
 *  visitor-friendly message (and .code / .status) on a non-2xx response. */
export async function callBooking(name, body = {}) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return data;
  let message = 'Something went wrong. Please try again.';
  let code;
  let status;
  try {
    status = error.context?.status;
    const payload = await error.context?.json?.();
    if (payload?.error) message = payload.error;
    code = payload?.code;
  } catch { /* keep the generic message */ }
  const err = new Error(message);
  err.code = code;
  err.status = status;
  throw err;
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** YYYY-MM-DD for an instant, as seen in the ranch time zone. */
export function localDateKey(iso, tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(iso));
}

export function todayKey(tz) {
  return localDateKey(new Date().toISOString(), tz);
}

export function formatTime(iso, tz) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

export function formatLongDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatWhen(startIso, endIso, tz) {
  const day = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .format(new Date(startIso));
  const zone = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(new Date(startIso)).find((p) => p.type === 'timeZoneName')?.value ?? '';
  return `${day}, ${formatTime(startIso, tz)} – ${formatTime(endIso, tz)} ${zone}`.trim();
}

function monthKeyParts(key) {
  const [y, m] = key.split('-').map(Number);
  return { y, m };
}

const pad = (n) => String(n).padStart(2, '0');

/**
 * Month calendar + time list. `loadSlots(fromKey, toKey)` must resolve to an array of
 * {start_at, end_at}. `onPick(slot)` fires when a time is chosen.
 */
export function createSlotPicker({ mount, tz, loadSlots, onPick, heading = 'Choose a date' }) {
  const today = todayKey(tz);
  let { y, m } = monthKeyParts(today);
  const minMonth = y * 12 + m;
  let slotsByDay = new Map();
  let selectedDay = null;
  let selectedSlot = null;
  let loadToken = 0;

  const status = el('p', { class: 'booking-status', role: 'status', 'aria-live': 'polite' });
  const title = el('h3', { class: 'cal-title', id: `cal-title-${Math.random().toString(36).slice(2)}` });
  const prev = el('button', { type: 'button', class: 'btn supporting cal-nav', 'aria-label': 'Previous month' }, '‹');
  const next = el('button', { type: 'button', class: 'btn supporting cal-nav', 'aria-label': 'Next month' }, '›');
  const grid = el('div', { class: 'cal-grid', role: 'group', 'aria-labelledby': title.id });
  const times = el('div', { class: 'time-list', role: 'group', 'aria-label': 'Open times' });
  const timesHeading = el('h3', { class: 'times-heading' });

  mount.replaceChildren(
    el('h2', { class: 'step-heading' }, heading),
    el('div', { class: 'cal-head' }, prev, title, next),
    el('div', { class: 'cal-weekdays', 'aria-hidden': 'true' },
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => el('span', {}, d))),
    grid,
    status,
    timesHeading,
    times,
  );

  prev.addEventListener('click', () => { if (y * 12 + m > minMonth) { m -= 1; if (m < 1) { m = 12; y -= 1; } render(); } });
  next.addEventListener('click', () => { m += 1; if (m > 12) { m = 1; y += 1; } render(); });

  function renderTimes() {
    times.replaceChildren();
    timesHeading.textContent = '';
    if (!selectedDay) return;
    const list = slotsByDay.get(selectedDay) ?? [];
    timesHeading.textContent = `Open times on ${formatLongDate(selectedDay)}`;
    for (const slot of list) {
      const pressed = selectedSlot?.start_at === slot.start_at;
      times.append(el('button', {
        type: 'button',
        class: 'btn supporting time-btn',
        'aria-pressed': String(pressed),
        onclick: () => { selectedSlot = slot; renderTimes(); onPick(slot); },
      }, formatTime(slot.start_at, tz)));
    }
  }

  async function render() {
    const token = ++loadToken;
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    title.textContent = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' })
      .format(new Date(Date.UTC(y, m - 1, 1)));
    prev.disabled = y * 12 + m <= minMonth;
    grid.replaceChildren();
    for (let i = 0; i < firstDow; i++) grid.append(el('span', { class: 'cal-pad', 'aria-hidden': 'true' }));
    const dayButtons = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${pad(m)}-${pad(d)}`;
      const btn = el('button', {
        type: 'button', class: 'cal-day', disabled: true,
        'aria-label': `${formatLongDate(key)}, checking…`,
      }, String(d));
      btn.dataset.key = key;
      dayButtons.push(btn);
      grid.append(btn);
    }
    status.textContent = 'Checking open times…';
    const from = `${y}-${pad(m)}-01`;
    const to = `${y}-${pad(m)}-${pad(daysInMonth)}`;
    try {
      const slots = await loadSlots(from < today ? today : from, to);
      if (token !== loadToken) return;
      slotsByDay = new Map();
      for (const s of slots) {
        const key = localDateKey(s.start_at, tz);
        if (!slotsByDay.has(key)) slotsByDay.set(key, []);
        slotsByDay.get(key).push(s);
      }
      let openDays = 0;
      for (const btn of dayButtons) {
        const key = btn.dataset.key;
        const count = slotsByDay.get(key)?.length ?? 0;
        btn.disabled = count === 0;
        if (count) openDays++;
        btn.setAttribute('aria-label', `${formatLongDate(key)}, ${count ? `${count} open time${count === 1 ? '' : 's'}` : 'no open times'}`);
        btn.setAttribute('aria-pressed', String(key === selectedDay));
        btn.onclick = () => {
          selectedDay = key;
          selectedSlot = null;
          dayButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.key === key)));
          renderTimes();
          times.querySelector('button')?.focus();
        };
      }
      status.textContent = openDays
        ? 'Dates with open times can be selected.'
        : 'No open times this month. Try the next month.';
      if (selectedDay && !slotsByDay.has(selectedDay)) { selectedDay = null; selectedSlot = null; }
      renderTimes();
    } catch (e) {
      if (token !== loadToken) return;
      status.textContent = e.message;
    }
  }

  render();
  return {
    refresh() { selectedSlot = null; render(); },
  };
}
