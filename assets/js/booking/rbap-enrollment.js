import { callBooking, createSlotPicker, el, formatWhen } from './booking-common.js';

const form = document.querySelector('.rb-enrollment-form');
const calendar = document.querySelector('#rb-enrollment-calendar');
const selections = document.querySelector('#rb-enrollment-selections');
const offering = form.elements.offering;
const message = form.elements.message;
const submit = form.querySelector('button[type="submit"]');
const timezone = 'America/New_York';
const preferred = new Map();

function renderSelections() {
  message.value = [...preferred.keys()].sort().map((start) => preferred.get(start)).join('\n');
  submit.disabled = preferred.size === 0;
  selections.replaceChildren();
  if (!preferred.size) return;

  const list = el('ul');
  for (const [start, label] of preferred) {
    list.append(el('li', {}, label, ' ', el('button', {
      type: 'button',
      'aria-label': 'Remove ' + label,
      onclick: () => { preferred.delete(start); renderSelections(); },
    }, 'Remove')));
  }
  selections.append(el('strong', {}, 'Your preferred times'), list);
}

function loadCalendar() {
  preferred.clear();
  renderSelections();
  calendar.replaceChildren();
  const event_type_id = offering.selectedOptions[0]?.dataset.event;
  if (!event_type_id) return;

  const month = el('div');
  calendar.append(month);
  createSlotPicker({
    mount: month,
    tz: timezone,
    heading: 'Choose preferred dates and times',
    async loadSlots(from, to) {
      const result = await callBooking('booking-availability', { event_type_id, from, to });
      if (!result.enabled) throw new Error('The availability calendar is currently closed.');
      return result.slots;
    },
    onPick(slot) {
      preferred.set(slot.start_at, formatWhen(slot.start_at, slot.end_at, timezone));
      renderSelections();
    },
  });
}

offering.addEventListener('change', loadCalendar);
form.addEventListener('submit', (event) => {
  if (!preferred.size) event.preventDefault();
});
loadCalendar();
