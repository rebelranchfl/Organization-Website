import { supabase } from './supabase-client.js';

const path=window.location.pathname;
const isOps=path.endsWith('/operations-review.html')||path==='/operations-review.html';
const isStage=path.endsWith('/academy-stage-review.html')||path==='/academy-stage-review.html';
const REVIEW_STAGES=new Set(['RESEARCH_REVIEW','PRODUCT_REVIEW','FINAL_PRODUCT_REVIEW']);
const STAGE_LABELS={RESEARCH_REVIEW:'Research Review',PRODUCT_REVIEW:'Product Review',FINAL_PRODUCT_REVIEW:'Final Product Review',RESEARCH_WORKING:'Research',PRODUCT_OPPORTUNITY_RESEARCH:'Product Opportunity',PRODUCT_WORKING:'Product Design',VISUAL_PRODUCTION:'Visual Production',AWAITING_RELEASE:'Release Prep',PUBLISHING:'Publishing',LIVE:'Live'};
let busy=false,actionBusy=false,actionLastFetch=0,handledHash='';
let lastProjects=[];

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stageLabel=v=>STAGE_LABELS[v]||String(v||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());

function addCss(){if(document.getElementById('academy-owner-usability-css'))return;const l=document.createElement('link');l.id='academy-owner-usability-css';l.rel='stylesheet';l.href='assets/css/academy-owner-usability.css';document.head.append(l)}
function addCorrectionCss(){if(document.getElementById('academy-owner-queue-correction-css'))return;const s=document.createElement('style');s.id='academy-owner-queue-correction-css';s.textContent=`
#aou-action-queue{margin:0 0 14px;padding:17px;border:1px solid #36553c;border-left:5px solid #d7a34a;border-radius:10px;background:linear-gradient(180deg,#11291a,#0a1b10)}
.aou-action-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.aou-action-head h2{margin:0;font-size:1.18rem}.aou-action-head p{margin:4px 0 0;color:#b8c5b9;font-size:.8rem;line-height:1.45}.aou-action-count{flex:0 0 auto;padding:6px 9px;border:1px solid #5f704b;border-radius:5px;color:#f2d38b;font-size:.72rem;font-weight:900}.aou-action-list{display:grid;gap:8px;margin-top:13px}.aou-action-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 14px;padding:12px 13px;border:1px solid #31513a;border-radius:8px;background:#0b2013;color:#edf2e9;text-decoration:none}.aou-action-item:hover{border-color:#d7a34a;background:#102b18}.aou-action-item strong{display:block;font-size:.88rem;line-height:1.3}.aou-action-item small{display:block;margin-top:4px;color:#aebcaf;font-size:.73rem;line-height:1.4}.aou-action-type{display:block;margin-bottom:4px;color:#f2d38b;font-size:.68rem;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.aou-action-go{align-self:center;color:#9bc9ff;font-size:.75rem;font-weight:900}.aou-caught-up{margin:12px 0 0;padding:13px;border:1px solid #2f5137;border-radius:8px;background:#0b2013;color:#b9d7bc;font-weight:800}.aou-all-projects{margin-top:12px;border:1px solid #294a34;border-radius:9px;background:#09190f;overflow:hidden}.aou-all-projects>summary{cursor:pointer;padding:12px 14px;color:#c7d2c8;font-weight:900;list-style:none}.aou-all-projects>summary::-webkit-details-marker{display:none}.aou-all-projects>summary::before{content:'›';display:inline-block;margin-right:8px;color:#8fc2ff;transition:transform .15s ease}.aou-all-projects[open]>summary::before{transform:rotate(90deg)}.aou-all-projects>.queue-grid{padding:14px;border-top:1px solid #294a34}.aou-all-projects .detail-empty{min-height:120px}
#aou-action-queue+.aou-all-projects{margin-top:10px}
body.orv3 .orv3-project-row .orv3-stage{font-weight:900;letter-spacing:.03em}.aou-stage-owner{color:#f2d38b!important}.aou-stage-working{color:#8fc2ff!important}.aou-stage-approved{color:#9bdd8a!important}.aou-stage-revision{color:#e9a978!important}
#academy-final-product-acceptance{padding:16px!important}.fpa-head{align-items:center!important}.fpa-head h3{margin:0}.fpa-head .fpa-note{margin:4px 0 0}.fpa-status{margin:10px 0!important;padding:10px 12px!important}.fpa-list{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}.fpa-item{display:grid!important;grid-template-columns:22px minmax(0,1fr)!important;gap:9px!important;align-items:start!important;padding:10px 11px!important;min-height:0!important}.fpa-item input{width:17px!important;height:17px!important;margin:1px 0 0!important}.fpa-item span{font-size:.82rem!important;line-height:1.42!important}.fpa-notearea{margin-top:10px!important}.fpa-notearea textarea{min-height:68px!important}.fpa-actions{margin-top:9px!important}
@media(max-width:760px){.aou-action-item{grid-template-columns:1fr}.aou-action-go{justify-self:start}.fpa-list{grid-template-columns:1fr!important}}
`;document.head.append(s)}
function scrollToEl(el){if(!el)return;el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('aou-owner-focus');setTimeout(()=>el.classList.remove('aou-owner-focus'),1400)}
function findHeading(root,text){return[...root.querySelectorAll('h3,h4')].find(x=>x.textContent.trim()===text)}

function collapseLateFindings(){
  const panels=[...document.querySelectorAll('#academy-late-findings')];
  if(!panels.length)return;
  panels.slice(1).forEach(p=>{const parent=p.parentElement;p.remove();if(parent?.classList.contains('aou-collapsible')&&!parent.querySelector('#academy-late-findings'))parent.remove()});
  const late=panels[0];
  let wrap=late.parentElement?.classList.contains('aou-collapsible')?late.parentElement:null;
  if(!wrap){wrap=document.createElement('details');wrap.className='aou-collapsible';const summary=document.createElement('summary');wrap.append(summary);late.parentNode.insertBefore(wrap,late);wrap.append(late)}
  const pending=late.querySelectorAll('.alf-card.pending').length;
  const summary=wrap.querySelector(':scope>summary');
  if(summary)summary.textContent=pending?`Late Findings — ${pending} owner decision${pending===1?'':'s'} waiting`:'Late Findings — log or route discoveries';
  if(!wrap.dataset.aouDefaulted){wrap.open=location.hash==='#late-findings';wrap.dataset.aouDefaulted='1'}
}

function makeSidebarGroupsCollapsible(){if(!isOps)return;const shell=document.querySelector('.orv3-shell');if(!shell)return;[...shell.querySelectorAll('.orv3-nav-group')].forEach(group=>{const title=group.querySelector('.orv3-nav-title')?.textContent.trim();if(!['Academy Areas','RRM Programs'].includes(title)||group.parentElement?.classList.contains('aou-sidebar-details'))return;const d=document.createElement('details');d.className='aou-sidebar-details';const s=document.createElement('summary');s.textContent=title;group.parentNode.insertBefore(d,group);d.append(s,group)});const projects=shell.querySelector('[data-orv3-view="projects"]');if(projects&&!projects.dataset.aouRenamed){projects.innerHTML='<span class="nav-dot"></span>My Action Queue';projects.dataset.aouRenamed='1'}}

function stageJumpTarget(kind){const page=document.querySelector('.asr-page');if(!page)return null;if(kind==='review')return document.getElementById('asr-owner-research-review')||page.querySelector('.asr-preview-shell')||page.querySelector('.asr-review');if(kind==='sources'){const review=document.getElementById('asr-owner-research-review');const btn=review?.querySelector('[data-mode="sources"]');btn?.click();return review}if(kind==='changes'){const review=document.getElementById('asr-owner-research-review');const btn=review?.querySelector('[data-mode="changes"]');btn?.click();return review}if(kind==='decision')return page.querySelector('.asr-review');if(kind==='records')return page.querySelector('.asr-advanced-records')||findHeading(page,'Stage Records')?.closest('.asr-section');return null}

function addStageJumpbar(){if(!isStage)return;const page=document.querySelector('.asr-page');if(!page||page.querySelector('.aou-jumpbar'))return;const current=document.querySelector('.asr-stage-state')?.textContent.includes('CURRENT');if(!current)return;const bar=document.createElement('nav');bar.className='aou-jumpbar';bar.setAttribute('aria-label','Stage review quick navigation');bar.innerHTML='<strong>Jump to</strong><button type="button" class="primary-jump" data-aou-jump="review">Review Content</button><button type="button" data-aou-jump="changes">What Changed</button><button type="button" data-aou-jump="sources">Sources</button><button type="button" data-aou-jump="decision">Owner Decision</button><button type="button" data-aou-jump="records">Advanced Records</button>';const head=page.querySelector('.asr-page-head');head?.insertAdjacentElement('afterend',bar);bar.addEventListener('click',e=>{const b=e.target.closest('[data-aou-jump]');if(!b)return;scrollToEl(stageJumpTarget(b.dataset.aouJump))})}

function moveResearchReviewForward(){if(!isStage)return;const page=document.querySelector('.asr-page'),review=document.getElementById('asr-owner-research-review'),summary=page?.querySelector('.asr-summary-grid');if(!page||!review||!summary)return;if(summary.nextElementSibling!==review)summary.insertAdjacentElement('afterend',review)}

function addOwnerActionShortcut(){if(!isStage)return;const status=document.querySelector('.asr-status.owner');if(!status||status.querySelector('.aou-action-shortcut'))return;const b=document.createElement('button');b.type='button';b.className='aou-action-shortcut';b.textContent='Review this stage ↓';b.onclick=()=>scrollToEl(document.getElementById('asr-owner-research-review')||document.querySelector('.asr-preview-shell')||document.querySelector('#academy-final-product-acceptance')||document.querySelector('.asr-review'));status.querySelector('div:last-child')?.append(b)}

function collapseQuietHistory(){if(!isStage)return;const page=document.querySelector('.asr-page');if(!page)return;const h=findHeading(page,'Owner / Gate History'),section=h?.closest('.asr-section');if(!section||section.parentElement?.classList.contains('aou-history-details'))return;const rows=section.querySelectorAll('.asr-history-row').length;if(rows>1)return;const d=document.createElement('details');d.className='aou-collapsible aou-history-details';const s=document.createElement('summary');s.textContent=rows?`Owner / Gate History — ${rows} prior decision`:'Owner / Gate History — no prior decisions';section.parentNode.insertBefore(d,section);d.append(s,section)}

function ensureProjectBrowser(){
  if(!isOps)return null;
  const grid=document.querySelector('#queue')?.closest('.queue-grid');if(!grid)return null;
  if(grid.parentElement?.classList.contains('aou-all-projects'))return grid.parentElement;
  const details=document.createElement('details');details.className='aou-all-projects';details.innerHTML='<summary>All Projects — browse lifecycle history and records</summary>';grid.parentNode.insertBefore(details,grid);details.append(grid);return details;
}

function actionUrl(project,hash='owner-decision'){return `academy-stage-review.html?project=${encodeURIComponent(project.project_id)}&stage=${encodeURIComponent(project.workflow_stage)}#${hash}`}
function actionCard(project,type,sub,hash='owner-decision'){
  return `<a class="aou-action-item" href="${actionUrl(project,hash)}"><div><span class="aou-action-type">${esc(type)}</span><strong>${esc(project.title)}</strong><small>${esc(project.project_id)} · ${esc(sub)}</small></div><span class="aou-action-go">Open exact action →</span></a>`;
}
function clarifyOverviewProjectStates(projects){const map=new Map(projects.map(p=>[p.project_id,p]));document.querySelectorAll('.orv3-project-row').forEach(row=>{const id=(row.querySelector('.orv3-project-title')?.textContent.match(/RRA-\d{4}-\d{4}/)||[])[0];const p=map.get(id),label=row.querySelector('.orv3-stage');if(!p||!label)return;label.classList.remove('aou-stage-owner','aou-stage-working','aou-stage-approved','aou-stage-revision');if(p.current_status==='READY_FOR_REVIEW'){label.textContent='OWNER REVIEW';label.classList.add('aou-stage-owner')}else if(p.current_status==='AGENT_WORKING'){label.textContent=`${Math.max(0,Math.min(100,Number(p.progress_percent)||0))}% STAGE`;label.classList.add('aou-stage-working')}else if(p.current_status==='APPROVED'){label.textContent='APPROVED';label.classList.add('aou-stage-approved')}else if(p.current_status==='NEEDS_MORE_WORK'){label.textContent='REVISION';label.classList.add('aou-stage-revision')}else label.textContent=String(p.current_status||'').replaceAll('_',' ')})}
function wireOverviewProjectBrowse(){const card=[...document.querySelectorAll('.orv3-card')].find(c=>c.querySelector('h3')?.textContent.trim()==='ACTIVE PROJECTS');const b=card?.querySelector('[data-orv3-view="projects"]');if(!b||b.dataset.aouBrowse)return;b.dataset.aouBrowse='1';b.textContent='Browse All Projects';b.addEventListener('click',()=>setTimeout(()=>{const d=ensureProjectBrowser();if(d){d.open=true;scrollToEl(d)}},260))}

async function renderActionQueue(force=false){
  if(!isOps||actionBusy)return;
  const grid=document.querySelector('#queue')?.closest('.queue-grid');if(!grid)return;
  const now=Date.now();if(!force&&now-actionLastFetch<7000){clarifyOverviewProjectStates(lastProjects);wireOverviewProjectBrowse();return}
  actionBusy=true;actionLastFetch=now;
  try{
    const [p,f]=await Promise.all([
      supabase.from('academy_content_projects').select('project_id,title,learning_area,current_status,workflow_stage,progress_percent,progress_stage,progress_next,progress_updated_at,owner_review_status,owner_hold').order('updated_at',{ascending:false}),
      supabase.from('academy_late_findings').select('id,project_id,title,status,discovered_stage,created_at').eq('status','PENDING_OWNER').order('created_at',{ascending:false})
    ]);
    if(p.error)throw p.error;if(f.error)throw f.error;
    const projects=(p.data||[]).filter(x=>!x.owner_hold),findings=f.data||[];lastProjects=projects;
    const projectMap=new Map(projects.map(x=>[x.project_id,x]));
    const reviews=projects.filter(x=>x.current_status==='READY_FOR_REVIEW'&&REVIEW_STAGES.has(x.workflow_stage));
    const actions=[];
    reviews.forEach(x=>actions.push(actionCard(x,'Owner review',`${stageLabel(x.workflow_stage)} · ${x.progress_next||'Review and decide.'}`,x.workflow_stage==='FINAL_PRODUCT_REVIEW'?'final-acceptance':'owner-decision')));
    const findingsByProject=new Map();findings.forEach(x=>{if(!findingsByProject.has(x.project_id))findingsByProject.set(x.project_id,[]);findingsByProject.get(x.project_id).push(x)});
    findingsByProject.forEach((rows,id)=>{const project=projectMap.get(id);if(!project)return;actions.push(actionCard(project,'Late finding decision',`${rows.length} finding${rows.length===1?'':'s'} waiting for your route`,'late-findings'))});
    const browser=ensureProjectBrowser();if(browser){const summary=browser.querySelector(':scope>summary');if(summary)summary.textContent=`All Projects — browse lifecycle history and records (${projects.length})`}
    let host=document.getElementById('aou-action-queue');if(!host){host=document.createElement('section');host.id='aou-action-queue';browser?.parentNode.insertBefore(host,browser)}
    if(host)host.innerHTML=`<div class="aou-action-head"><div><h2>My Action Queue</h2><p>Only work that actually needs your decision appears here. Completed or agent-working projects stay in All Projects.</p></div><span class="aou-action-count">${actions.length} action${actions.length===1?'':'s'}</span></div>${actions.length?`<div class="aou-action-list">${actions.join('')}</div>`:'<div class="aou-caught-up">You are caught up. Nothing currently needs an owner decision.</div>'}`;
    clarifyOverviewProjectStates(projects);wireOverviewProjectBrowse();
  }catch(e){console.warn('Academy owner action queue',e)}finally{actionBusy=false}
}

function handleStageHash(){if(!isStage||!location.hash||handledHash===location.hash)return;const hash=location.hash;if(hash==='#owner-decision'){const target=document.querySelector('.asr-review');if(target){handledHash=hash;setTimeout(()=>scrollToEl(target),80)}}else if(hash==='#final-acceptance'){const target=document.querySelector('#academy-final-product-acceptance');if(target){handledHash=hash;setTimeout(()=>scrollToEl(target),80)}}else if(hash==='#late-findings'){const wrap=document.querySelector('#academy-late-findings')?.closest('.aou-collapsible');if(wrap){wrap.open=true;handledHash=hash;setTimeout(()=>scrollToEl(wrap),80)}}else if(hash==='#review-content'){const target=stageJumpTarget('review');if(target){handledHash=hash;setTimeout(()=>scrollToEl(target),80)}}}

function enhanceOperations(){if(!isOps)return;makeSidebarGroupsCollapsible();collapseLateFindings();ensureProjectBrowser();renderActionQueue();wireOverviewProjectBrowse();clarifyOverviewProjectStates(lastProjects);const detail=document.getElementById('detail');if(!detail)return;const workspace=detail.querySelector('#lifecycle-stage-workspace');if(workspace&&!workspace.querySelector('.aou-ops-help')){const current=workspace.querySelector('.lsw-status.owner,.lsw-status');if(current){const p=document.createElement('p');p.className='aou-ops-help muted';p.textContent='Current owner actions are listed in My Action Queue. Browse All Projects only when you want history, records, or a project that does not currently need you.';current.insertAdjacentElement('afterend',p)}}}

function enhanceStage(){if(!isStage)return;collapseLateFindings();moveResearchReviewForward();addStageJumpbar();addOwnerActionShortcut();collapseQuietHistory();handleStageHash()}

function enhance(){if(busy)return;busy=true;try{addCss();addCorrectionCss();enhanceOperations();enhanceStage()}finally{busy=false}}

addCss();addCorrectionCss();
new MutationObserver(()=>queueMicrotask(enhance)).observe(document.body,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>{handledHash='';enhance()});
if(isOps)document.addEventListener('click',e=>{const b=e.target.closest('[data-orv3-view]');if(!b)return;if(['opportunity','audience','pipeline'].includes(b.dataset.orv3View)){const d=ensureProjectBrowser();if(d)d.open=true}},true);
queueMicrotask(enhance);
setTimeout(enhance,500);
setTimeout(enhance,1400);
if(isOps)setInterval(()=>renderActionQueue(true),45000);
