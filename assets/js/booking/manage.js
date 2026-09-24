// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Custom booking system build for rebelranchministries.org (2026-09-24)
// Token-based view / cancel / reschedule. The token lives in the URL fragment (#t=...), which
// browsers never send to servers or in Referer headers; only its hash is stored.

import { callBooking, createSlotPicker, formatWhen } from './booking-common.js';

const $ = (id) => document.getElementById(id);
const token = new URLSearchParams(location.hash.slice(1)).get('t') || '';
const pageNotice = $('page-notice');
let view = null;
let picked = null;

function notice(text, isError = false) {
  pageNotice.textContent = text;
  pageNotice.classList.toggle('error', isError);
}

function render() {
  const b = view.booking;
  $('visit-what').textContent = `Visit: ${b.event_name}`;
  $('visit-when').textContent = `When: ${formatWhen(b.start_at, b.end_at, view.timezone)}`;
  $('visit-party').textContent = `Party size: ${b.party_size}${b.minors_count ? ` (${b.minors_count} under 18)` : ''}`;
  $('visit-status').textContent = b.status === 'cancelled' ? 'Status: Cancelled' : 'Status: Confirmed';
  $('reschedule-btn').classList.toggle('booking-hidden', !view.can_reschedule);
  $('cancel-btn').classList.toggle('booking-hidden', !view.can_cancel);
  $('policy').textContent = view.cancellation_policy_text ? `Cancellation policy: ${view.cancellation_policy_text}` : '';
  if (b.status === 'confirmed' && !view.can_cancel) notice('This visit has already started or passed, so it can no longer be changed online.');
  $('visit').classList.remove('booking-hidden');
}

async function load() {
  view = await callBooking('booking-manage', { action: 'view', token });
  render();
}

$('cancel-btn').addEventListener('click', () => {
  $('confirm-cancel').classList.remove('booking-hidden');
  $('confirm-cancel-btn').focus();
});
$('keep-btn').addEventListener('click', () => $('confirm-cancel').classList.add('booking-hidden'));
$('confirm-cancel-btn').addEventListener('click', async (event) => {
  const btn = event.currentTarget;
  btn.disabled = true;
  try {
    await callBooking('booking-manage', { action: 'cancel', token });
    $('confirm-cancel').classList.add('booking-hidden');
    ['picker', 'confirm-move'].forEach((id) => $(id).classList.add('booking-hidden'));
    await load();
    notice('Your visit has been cancelled. A confirmation email is on its way.');
  } catch (e) {
    notice(e.message, true);
  } finally {
    btn.disabled = false;
  }
});

let picker = null;
$('reschedule-btn').addEventListener('click', () => {
  $('picker').classList.remove('booking-hidden');
  picker = createSlotPicker({
    mount: $('picker'),
    tz: view.timezone,
    heading: 'Choose a new date and time',
    loadSlots: async (from, to) => {
      const res = await callBooking('booking-availability', { event_type_id: view.booking.event_type_id, from, to });
      return res.slots.filter((s) => s.start_at !== view.booking.start_at);
    },
    onPick: (slot) => {
      picked = slot;
      $('move-summary').textContent = `New time: ${formatWhen(slot.start_at, slot.end_at, view.timezone)}`;
      $('confirm-move').classList.remove('booking-hidden');
      $('confirm-move-btn').focus();
    },
  });
});

$('confirm-move-btn').addEventListener('click', async (event) => {
  if (!picked) return;
  const btn = event.currentTarget;
  btn.disabled = true;
  try {
    await callBooking('booking-manage', { action: 'reschedule', token, start_at: picked.start_at });
    ['picker', 'confirm-move'].forEach((id) => $(id).classList.add('booking-hidden'));
    picked = null;
    await load();
    notice('Your visit has been moved. An updated confirmation email is on its way.');
  } catch (e) {
    notice(e.message, true);
    if (e.code === 'slot_unavailable') {
      $('confirm-move').classList.add('booking-hidden');
      picker?.refresh();
    }
  } finally {
    btn.disabled = false;
  }
});

(async () => {
  if (!token) {
    notice('This page needs the link from your confirmation email.', true);
    return;
  }
  try {
    await load();
    notice('');
  } catch (e) {
    notice(e.message, true);
  }
})();
