import { supabase } from './supabase-client.js';
import { calculateWorkspaceMetrics, createPortfolio, loadAccountContext, loadWorkspaceData,
  saveProjectProgress, setPortfolioState, setProjectFavorite, startProject, submitWebsiteRevision } from './creation-station-data.js';

const $ = (id) => document.getElementById(id);
const state = { context: null, data: null };
function message(text, error = false) { $('message').textContent = text; $('message').className = `notice${error ? ' error' : ''}`; }
function esc(value = '') { const element = document.createElement('div'); element.textContent = value; return element.innerHTML; }
function renderSimple(id, data, view) { $(id).innerHTML = data.length ? data.map(view).join('') : '<p class="empty">Nothing here yet.</p>'; }

async function initialize() {
  state.context = await loadAccountContext();
  if (!state.context) { $('signed-out').classList.remove('hidden'); return; }
  if (!state.context.allowed) { $('signed-out').classList.remove('hidden'); $('signed-out').querySelector('h2').textContent = 'Active membership required'; return; }
  const { context } = state;
  $('welcome').textContent = `Welcome, ${context.profile.display_name}`;
  $('tier').textContent = context.presentation.tierName;
  $('household').textContent = context.household?.household_name || 'Adult Maker';
  $('creator-count').textContent = context.creators.length;
  $('website-panel').classList.toggle('hidden', context.presentation.tier < 3);
  $('workspace').dataset.availableViews = context.presentation.availableViews.join(' ');
  $('workspace').classList.remove('hidden');
  await refresh();
}

async function refresh() {
  state.data = await loadWorkspaceData(state.context);
  const metrics = calculateWorkspaceMetrics(state.data);
  $('complete-count').textContent = metrics.projectsCompleted;
  $('overall-progress').textContent = `${metrics.overallProgress}%`;
  renderProjects(); renderPortfolios();
  renderSimple('resources', state.data.resources, (resource) => `<div class="card"><h3>${esc(resource.title)}</h3><p>${esc(resource.description)}</p><span class="meta">${esc(resource.resource_type)}</span></div>`);
  renderSimple('classes', state.data.classes, (item) => `<div class="card"><h3>${esc(item.title)}</h3><p class="meta">${new Date(item.starts_at).toLocaleString()}</p></div>`);
  renderSimple('activity', state.data.activity.slice(0, 8), (item) => `<div class="card"><p>${esc(item.summary)}</p><span class="meta">${new Date(item.created_at).toLocaleDateString()}</span></div>`);
}

function renderProjects() {
  const { projects } = state.data;
  renderSimple('projects', projects, (project) => `<article class="card"><h3>${esc(project.title)} ${project.is_favorite ? '★' : ''}</h3><p class="meta">${project.status.replaceAll('_', ' ')} · ${project.completion}%</p><div class="progress"><span style="width:${project.completion}%"></span></div><p>${esc(project.notes)}</p><div class="actions"><button data-edit="${project.id}">Save progress</button><button data-favorite="${project.id}">${project.is_favorite ? 'Unfavorite' : 'Favorite'}</button></div></article>`);
  const next = projects.find(({ status }) => status === 'in_progress');
  $('next-action').innerHTML = next ? `<p>Resume <strong>${esc(next.title)}</strong> and save your next step.</p>` : '<p>Start a project that fits your creator and membership.</p>';
  $('projects').querySelectorAll('[data-edit]').forEach((button) => { button.onclick = () => openEdit(button.dataset.edit); });
  $('projects').querySelectorAll('[data-favorite]').forEach((button) => { button.onclick = () => favorite(button.dataset.favorite); });
}

function renderPortfolios() {
  const byCreator = new Map(state.data.portfolios.map((portfolio) => [portfolio.creator_id, portfolio]));
  $('portfolios').innerHTML = state.context.creators.map((creator) => {
    const portfolio = byCreator.get(creator.id);
    const canSubmit = portfolio && ['private', 'changes_requested', 'rejected'].includes(portfolio.review_status);
    const canUnpublish = portfolio?.review_status === 'published';
    return `<div class="card"><h3>${esc(creator.display_name)}</h3><p>${portfolio ? `${esc(portfolio.title)} · ${portfolio.review_status.replaceAll('_', ' ')}` : 'Portfolio not created yet.'}</p>${portfolio?.moderation_note ? `<p>${esc(portfolio.moderation_note)}</p>` : ''}<div class="actions">${portfolio ? '' : `<button data-portfolio="${creator.id}">Create Portfolio</button>`}${canSubmit ? `<button data-submit-portfolio="${portfolio.id}">Submit for Review</button>` : ''}${canUnpublish ? `<button data-private-portfolio="${portfolio.id}">Return to Private</button>` : ''}</div></div>`;
  }).join('') || '<p class="empty">Add a creator profile first.</p>';
  $('portfolios').querySelectorAll('[data-portfolio]').forEach((button) => { button.onclick = () => handleCreatePortfolio(button.dataset.portfolio); });
  $('portfolios').querySelectorAll('[data-submit-portfolio]').forEach((button) => { button.onclick = () => handlePortfolioState(button.dataset.submitPortfolio, 'submitted'); });
  $('portfolios').querySelectorAll('[data-private-portfolio]').forEach((button) => { button.onclick = () => handlePortfolioState(button.dataset.privatePortfolio, 'private'); });
}

$('new-project').onclick = () => {
  $('creator').innerHTML = state.context.creators.map((creator) => `<option value="${creator.id}">${esc(creator.display_name)}</option>`).join('');
  $('template').innerHTML = state.data.templates.map((template) => `<option value="${template.id}">${esc(template.title)}</option>`).join('');
  $('project-dialog').showModal();
};
$('project-form').onsubmit = async (event) => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); try { const template = state.data.templates.find(({ id }) => id === $('template').value); await startProject(state.context, $('creator').value, template); $('project-dialog').close(); await refresh(); } catch (error) { message(error.message, true); } };
function openEdit(id) { const project = state.data.projects.find((item) => item.id === id); $('edit-id').value = id; $('edit-status').value = project.status; $('edit-completion').value = project.completion; $('edit-notes').value = project.notes; $('edit-dialog').showModal(); }
$('edit-form').onsubmit = async (event) => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); const project = state.data.projects.find(({ id }) => id === $('edit-id').value); const status = $('edit-status').value; try { await saveProjectProgress(state.context, project, { status, completion: Number($('edit-completion').value), notes: $('edit-notes').value, updated_at: new Date().toISOString(), completed_at: status === 'completed' ? new Date().toISOString() : null }, $('edit-file').files[0]); $('edit-dialog').close(); await refresh(); message('Progress saved.'); } catch (error) { message(error.message, true); } };
async function favorite(id) { const project = state.data.projects.find((item) => item.id === id); try { await setProjectFavorite(state.context, project, !project.is_favorite); await refresh(); } catch (error) { message(error.message, true); } }
async function handleCreatePortfolio(creatorId) { try { await createPortfolio(state.context, state.context.creators.find(({ id }) => id === creatorId)); await refresh(); } catch (error) { message(error.message, true); } }
async function handlePortfolioState(id, status) { try { await setPortfolioState(state.context, id, status); await refresh(); message(status === 'submitted' ? 'Portfolio submitted for review. Nothing is published automatically.' : 'Portfolio is private.'); } catch (error) { message(error.message, true); } }
$('website-request').onclick = () => { $('website-creator').innerHTML = state.context.creators.map((creator) => `<option value="${creator.id}">${esc(creator.display_name)}</option>`).join(''); $('website-dialog').showModal(); };
$('website-form').onsubmit = async (event) => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); try { await submitWebsiteRevision(state.context, { creatorId: $('website-creator').value, brandName: $('brand-name').value.trim(), story: $('brand-story').value.trim(), products: $('brand-products').value.trim(), links: $('brand-links').value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean) }); $('website-dialog').close(); $('website-form').reset(); await refresh(); message('Website revision submitted for review. Nothing is published automatically.'); } catch (error) { message(error.message, true); } };
$('signout').onclick = async () => { await supabase.auth.signOut(); location.href = 'account.html'; };
initialize().catch((error) => message(error.message || 'Creation Station could not load.', true));
