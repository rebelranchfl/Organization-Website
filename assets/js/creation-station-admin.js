import { loadAccountContext, loadModerationQueue, moderateSubmission } from './creation-station-data.js';

const $ = (id) => document.getElementById(id);
function esc(value = '') { const element = document.createElement('div'); element.textContent = value; return element.innerHTML; }
function message(text, error = false) { $('message').textContent = text; $('message').className = `notice${error ? ' error' : ''}`; }

async function initialize() {
  const context = await loadAccountContext();
  if (!context) { location.href = 'account.html'; return; }
  if (!context.presentation.isAdmin) throw new Error('Administrator access required.');
  await renderQueue();
}

async function renderQueue() {
  const queue = await loadModerationQueue();
  $('portfolio-reviews').innerHTML = queue.portfolios.map((item) => reviewCard('portfolio', item.id, item.title,
    item.review_status, item.creator_profiles?.display_name, item.moderation_note)).join('') || '<p class="empty">No portfolio reviews.</p>';
  $('website-reviews').innerHTML = queue.websites.map((item) => reviewCard('website', item.id,
    `${item.brand_name} · revision ${item.revision_number}`, item.status, item.creator_profiles?.display_name,
    item.moderation_note)).join('') || '<p class="empty">No website reviews.</p>';
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.onclick = () => handleModeration(button.dataset.kind, button.dataset.id, button.dataset.action);
  });
}

function reviewCard(kind, id, title, status, creator, note) {
  const actions = status === 'submitted' ? ['changes_requested', 'approved', 'rejected']
    : status === 'approved' ? ['published', 'changes_requested']
      : status === 'published' ? [kind === 'portfolio' ? 'private' : 'archived'] : ['approved', 'rejected'];
  return `<article class="card"><h3>${esc(title)}</h3><p>${esc(creator)} · ${status.replaceAll('_', ' ')}</p>${note ? `<p>${esc(note)}</p>` : ''}<div class="actions">${actions.map((action) => `<button data-kind="${kind}" data-id="${id}" data-action="${action}">${action.replaceAll('_', ' ')}</button>`).join('')}</div></article>`;
}

async function handleModeration(kind, id, status) {
  const needsNote = ['changes_requested', 'rejected'].includes(status);
  const note = prompt(needsNote ? 'Moderation note required:' : 'Optional moderation note:') || '';
  if (needsNote && !note) return;
  try {
    await moderateSubmission(kind, id, status, note);
    message(`${kind} moved to ${status.replaceAll('_', ' ')}.`);
    await renderQueue();
  } catch (error) { message(error.message, true); }
}

initialize().catch((error) => message(error.message, true));
