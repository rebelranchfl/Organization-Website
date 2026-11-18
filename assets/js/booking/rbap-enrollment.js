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

const steps = document.querySelector('#rb-offering-steps');
const subjects = new Map();
for (const option of [...offering.options].slice(1)) {
  const [subject, format] = option.textContent.split(' · ');
  if (!subjects.has(subject)) subjects.set(subject, []);
  subjects.get(subject).push({ format, value: option.value });
}

function subjectDetails(subject) {
  const disclosure = el('details', {}, el('summary', {}, 'View details'));
  const source = [...document.querySelectorAll('#rb-courses details')]
    .find((item) => item.querySelector('summary').textContent === subject);
  if (source) {
    for (const child of [...source.children].slice(1)) disclosure.append(child.cloneNode(true));
  }
  return disclosure;
}

function resetOffering() {
  offering.value = '';
  loadCalendar();
}

function showSubjects(moveFocus = false) {
  resetOffering();
  const heading = el('h3', { tabindex: '-1' }, 'Choose a subject');
  const grid = el('div', { class: 'rb-offering-grid' });
  for (const [subject, formats] of subjects) {
    grid.append(el('article', { class: 'rb-offering-card' },
      el('button', { type: 'button', onclick: () => showFormats(subject, formats) }, subject),
      subjectDetails(subject)));
  }
  steps.replaceChildren(heading, grid);
  if (moveFocus) heading.focus();
}

function showFormats(subject, formats) {
  resetOffering();
  const heading = el('h3', { tabindex: '-1' }, 'Choose a format');
  const prices = formats.map(({ format }) => Number(format.match(/\$(\d+) per student/)?.[1]));
  const difference = prices[0] * 4 - prices[1];
  const cards = formats.map(({ format, value }, index) => el('button', {
    type: 'button',
    onclick: () => {
      offering.value = value;
      loadCalendar();
      const summary = el('h3', { tabindex: '-1', class: 'rb-selected-offering' }, '✓ Selected: ' + value);
      steps.replaceChildren(summary, el('button', {
        type: 'button', onclick: () => showFormats(subject, formats),
      }, 'Change selection'));
      summary.focus();
      summary.scrollIntoView({ block: 'nearest' });
    },
  }, format, index === 1 && difference > 0
    ? el('strong', { style: 'display:block;margin-top:.35rem' }, '$' + difference + ' less per student than four individual workshops')
    : null));
  steps.replaceChildren(el('p', { class: 'rb-selected-offering' }, '✓ Selected subject: ' + subject),
    heading, el('div', { class: 'rb-offering-grid' }, cards),
    el('button', { type: 'button', onclick: () => showSubjects(true) }, 'Change subject'));
  if (prices[0] > 89) {
    steps.append(el('p', {}, 'This compares tuition totals. The four-session course includes one take-home system per student.'));
  }
  heading.focus();
  heading.scrollIntoView({ block: 'nearest' });
}

offering.closest('label').hidden = true;
offering.required = false;
form.addEventListener('submit', (event) => {
  if (!offering.value || !preferred.size) event.preventDefault();
});
for (const button of steps.querySelectorAll('[data-rb-subject]')) {
  const subject = button.textContent;
  button.addEventListener('click', () => showFormats(subject, subjects.get(subject)));
  button.parentElement.append(subjectDetails(subject));
}
loadCalendar();
