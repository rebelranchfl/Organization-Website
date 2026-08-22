const path=window.location.pathname;
const isOps=path.endsWith('/operations-review.html')||path==='/operations-review.html';
const isStage=path.endsWith('/academy-stage-review.html')||path==='/academy-stage-review.html';
let busy=false;

function addCss(){if(document.getElementById('academy-owner-usability-css'))return;const l=document.createElement('link');l.id='academy-owner-usability-css';l.rel='stylesheet';l.href='assets/css/academy-owner-usability.css';document.head.append(l)}
function scrollToEl(el){if(!el)return;el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('aou-owner-focus');setTimeout(()=>el.classList.remove('aou-owner-focus'),1400)}
function findHeading(root,text){return[...root.querySelectorAll('h3,h4')].find(x=>x.textContent.trim()===text)}

function collapseLateFindings(){const late=document.getElementById('academy-late-findings');if(!late||late.parentElement?.classList.contains('aou-collapsible'))return;const wrap=document.createElement('details');wrap.className='aou-collapsible';const pending=/pending owner|waiting on your decision/i.test(late.textContent||'');wrap.open=pending;const summary=document.createElement('summary');summary.textContent=pending?'Late Findings — owner decision needed':'Late Findings — log or route discoveries';late.parentNode.insertBefore(wrap,late);wrap.append(summary,late)}

function makeSidebarGroupsCollapsible(){if(!isOps)return;const shell=document.querySelector('.orv3-shell');if(!shell)return;[...shell.querySelectorAll('.orv3-nav-group')].forEach(group=>{const title=group.querySelector('.orv3-nav-title')?.textContent.trim();if(!['Academy Areas','RRM Programs'].includes(title)||group.parentElement?.classList.contains('aou-sidebar-details'))return;const d=document.createElement('details');d.className='aou-sidebar-details';const s=document.createElement('summary');s.textContent=title;group.parentNode.insertBefore(d,group);d.append(s,group)})}

function stageJumpTarget(kind){const page=document.querySelector('.asr-page');if(!page)return null;if(kind==='review')return document.getElementById('asr-owner-research-review')||page.querySelector('.asr-review');if(kind==='sources'){const review=document.getElementById('asr-owner-research-review');const btn=review?.querySelector('[data-mode="sources"]');btn?.click();return review}if(kind==='changes'){const review=document.getElementById('asr-owner-research-review');const btn=review?.querySelector('[data-mode="changes"]');btn?.click();return review}if(kind==='decision')return page.querySelector('.asr-review');if(kind==='records')return page.querySelector('.asr-advanced-records')||findHeading(page,'Stage Records')?.closest('.asr-section');return null}

function addStageJumpbar(){if(!isStage)return;const page=document.querySelector('.asr-page');if(!page||page.querySelector('.aou-jumpbar'))return;const current=document.querySelector('.asr-stage-state')?.textContent.includes('CURRENT');if(!current)return;const bar=document.createElement('nav');bar.className='aou-jumpbar';bar.setAttribute('aria-label','Stage review quick navigation');bar.innerHTML='<strong>Jump to</strong><button type="button" class="primary-jump" data-aou-jump="review">Review Content</button><button type="button" data-aou-jump="changes">What Changed</button><button type="button" data-aou-jump="sources">Sources</button><button type="button" data-aou-jump="decision">Owner Decision</button><button type="button" data-aou-jump="records">Advanced Records</button>';const head=page.querySelector('.asr-page-head');head?.insertAdjacentElement('afterend',bar);bar.addEventListener('click',e=>{const b=e.target.closest('[data-aou-jump]');if(!b)return;scrollToEl(stageJumpTarget(b.dataset.aouJump))})}

function moveResearchReviewForward(){if(!isStage)return;const page=document.querySelector('.asr-page'),review=document.getElementById('asr-owner-research-review'),summary=page?.querySelector('.asr-summary-grid');if(!page||!review||!summary)return;if(summary.nextElementSibling!==review)summary.insertAdjacentElement('afterend',review)}

function addOwnerActionShortcut(){if(!isStage)return;const status=document.querySelector('.asr-status.owner');if(!status||status.querySelector('.aou-action-shortcut'))return;const b=document.createElement('button');b.type='button';b.className='aou-action-shortcut';b.textContent='Review this stage ↓';b.onclick=()=>scrollToEl(document.getElementById('asr-owner-research-review')||document.querySelector('.asr-review'));status.querySelector('div:last-child')?.append(b)}

function collapseQuietHistory(){if(!isStage)return;const page=document.querySelector('.asr-page');if(!page)return;const h=findHeading(page,'Owner / Gate History'),section=h?.closest('.asr-section');if(!section||section.parentElement?.classList.contains('aou-history-details'))return;const rows=section.querySelectorAll('.asr-history-row').length;if(rows>1)return;const d=document.createElement('details');d.className='aou-collapsible aou-history-details';const s=document.createElement('summary');s.textContent=rows?`Owner / Gate History — ${rows} prior decision`:'Owner / Gate History — no prior decisions';section.parentNode.insertBefore(d,section);d.append(s,section)}

function enhanceOperations(){if(!isOps)return;makeSidebarGroupsCollapsible();collapseLateFindings();const detail=document.getElementById('detail');if(!detail)return;const workspace=detail.querySelector('#lifecycle-stage-workspace');if(workspace&&!workspace.querySelector('.aou-ops-help')){const current=workspace.querySelector('.lsw-status.owner,.lsw-status');if(current){const p=document.createElement('p');p.className='aou-ops-help muted';p.textContent='Focus on the current stage first. Open Advanced / Stage Records only when you need the underlying files or audit trail.';current.insertAdjacentElement('afterend',p)}}}

function enhanceStage(){if(!isStage)return;collapseLateFindings();moveResearchReviewForward();addStageJumpbar();addOwnerActionShortcut();collapseQuietHistory()}

function enhance(){if(busy)return;busy=true;try{addCss();enhanceOperations();enhanceStage()}finally{busy=false}}

addCss();
new MutationObserver(()=>queueMicrotask(enhance)).observe(document.body,{childList:true,subtree:true});
queueMicrotask(enhance);
setTimeout(enhance,500);
setTimeout(enhance,1400);
