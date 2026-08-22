import { supabase } from './supabase-client.js';

const STAGES=[
  {key:'IDEA',label:'Idea + Context',artifacts:['project.json','concept.md','context-review.md']},
  {key:'RESEARCH_WORKING',label:'Research',artifacts:['research.md','master-content.md','sources.md','qa-review.md','revision-impact.md','research-uv-addendum.md','sources-uv-addendum.md','uv-gap-qa.md']},
  {key:'RESEARCH_REVIEW',label:'Research Review',artifacts:['owner-review.md','revision-impact.md','product-design-handoff.md']},
  {key:'PRODUCT_OPPORTUNITY_RESEARCH',label:'Product Opportunity',artifacts:['product-opportunity-research.md','product-opportunity-research-uv-closeout.md','product-recommendation-scorecard.md','functional-decomposition.md','interactive-scenario-map.md','opportunity-funnel-map.md','market-positioning.md','pricing.md']},
  {key:'PRODUCT_WORKING',label:'Product Design',artifacts:['product-architecture.md','product-manuscript.md','product-evidence-crosswalk.md','product-preservation-check.md','visual-production-brief.md']},
  {key:'PRODUCT_REVIEW',label:'Product Review',artifacts:['product-qa.md','owner-product-review.md','visual-production-brief.md','visual-production-handoff.md']},
  {key:'VISUAL_PRODUCTION',label:'Visual Production',artifacts:['visual-production/production-status.md','visual-production/cycle-01-closeout.md','visual-production-handoff.md','visual-production-brief.md']},
  {key:'FINAL_PRODUCT_REVIEW',label:'Final Product Review',artifacts:['final-product-qa.md','owner-final-product-review.md']},
  {key:'AWAITING_RELEASE',label:'Release Prep',artifacts:['release-record.md']},
  {key:'PUBLISHING',label:'Publishing',artifacts:['release-record.md']},
  {key:'LIVE',label:'Live',artifacts:['release-record.md']}
];
const REVIEW_STAGES=new Set(['RESEARCH_REVIEW','PRODUCT_REVIEW','FINAL_PRODUCT_REVIEW']);
const cache=new Map();
let renderToken=0, activeStageByProject=new Map(), lastProject='';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const fmt=v=>{if(!v)return'Not recorded';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString([], {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});};
const pretty=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const selectedId=()=>((document.querySelector('.queue-item.active .queue-meta')?.textContent||'').match(/RRA-\d{4}-\d{4}/)||[])[0]||'';
const stageIndex=key=>Math.max(0,STAGES.findIndex(s=>s.key===key));
function addCss(){if(document.getElementById('lifecycle-workspace-css'))return;const l=document.createElement('link');l.id='lifecycle-workspace-css';l.rel='stylesheet';l.href='assets/css/operations-review-lifecycle-workspace.css';document.head.append(l);}
function rawUrl(p,file){const branch=encodeURIComponent(p.github_branch||'main');const path=[p.github_path,file].filter(Boolean).join('/').split('/').map(encodeURIComponent).join('/');return `https://raw.githubusercontent.com/rebelranchfl/Organization-Website/${branch}/${path}`;}
async function textFile(p,file){const k=`${p.project_id}:${p.github_branch||'main'}:${file}`;if(cache.has(k))return cache.get(k);try{const r=await fetch(rawUrl(p,file),{cache:'no-store'});const v=r.ok?await r.text():'';cache.set(k,v);return v}catch{return''}}
async function load(projectId){
  const [p,e,f]=await Promise.all([
    supabase.from('academy_content_projects').select('*').eq('project_id',projectId).single(),
    supabase.from('academy_content_review_events').select('id,review_stage,decision,comment,created_at,processed_at,processed_by_agent,reversal_of_event_id').eq('project_id',projectId).order('created_at',{ascending:true}),
    supabase.from('academy_stage_feedback').select('*').eq('project_id',projectId).order('created_at',{ascending:false})
  ]);
  if(p.error)throw p.error;if(e.error)throw e.error;if(f.error)throw f.error;
  return{project:p.data,events:e.data||[],feedback:f.data||[]};
}
function currentKey(p){const k=p.workflow_stage||'';if(STAGES.some(s=>s.key===k))return k;if(k==='REJECTED')return 'IDEA';return 'IDEA'}
function completedStageKeys(data){
  const set=new Set();const ci=stageIndex(currentKey(data.project));for(let i=0;i<ci;i++)set.add(STAGES[i].key);
  data.events.filter(e=>e.decision==='APPROVE'&&!e.reversal_of_event_id).forEach(e=>set.add(e.review_stage));
  if(set.has('RESEARCH_REVIEW')){set.add('RESEARCH_WORKING');set.add('IDEA')}
  if(set.has('PRODUCT_REVIEW')){set.add('PRODUCT_OPPORTUNITY_RESEARCH');set.add('PRODUCT_WORKING')}
  if(set.has('FINAL_PRODUCT_REVIEW'))set.add('VISUAL_PRODUCTION');
  return set;
}
function stateForViewing(data,viewKey){
  const p=data.project,cur=currentKey(p),done=completedStageKeys(data);
  if(viewKey===cur){
    if(p.current_status==='READY_FOR_REVIEW')return{kind:'owner',title:'OWNER ACTION REQUIRED',body:`${STAGES[stageIndex(cur)].label} is complete and waiting for your decision.`,action:p.progress_next||'Review and decide.'};
    if(p.current_status==='AGENT_WORKING')return{kind:'working',title:'AGENT WORKING',body:`${p.last_agent||'Academy agent'} is actively working this stage. You are not blocking the project.`,action:p.progress_next||'No owner action is required yet.'};
    if(p.owner_hold)return{kind:'blocked',title:'ON HOLD',body:'This project is paused by owner control.',action:'Remove the hold when you want work to resume.'};
    return{kind:'working',title:pretty(p.current_status||'Current stage'),body:p.progress_detail||'This is the current lifecycle stage.',action:p.progress_next||''};
  }
  if(done.has(viewKey))return{kind:'done',title:'COMPLETED STAGE',body:'You are viewing an earlier phase of this project. Its records and owner decisions remain available here.',action:'Use Previous / Next below or the lifecycle cards above.'};
  return{kind:'future',title:'NOT REACHED YET',body:'This stage is ahead of the project’s current lifecycle position.',action:'No action is available here yet.'};
}
function relevantEvents(events,key){return events.filter(e=>e.review_stage===key || (key==='RESEARCH_WORKING'&&e.review_stage==='RESEARCH_REVIEW') || (key==='PRODUCT_WORKING'&&e.review_stage==='PRODUCT_REVIEW') || (key==='VISUAL_PRODUCTION'&&e.review_stage==='FINAL_PRODUCT_REVIEW'));}
function eventHistory(events,key){const rows=relevantEvents(events,key);if(!rows.length)return'<p class="lsw-section-note">No owner gate event is recorded for this phase yet.</p>';return `<div class="lsw-history">${rows.map(e=>`<div class="lsw-history-row"><time>${esc(fmt(e.created_at))}</time><div><strong>${esc(pretty(e.decision))}${e.processed_at?' · Processed':''}</strong><p>${esc(e.comment||`Review stage: ${pretty(e.review_stage)}${e.processed_by_agent?` · ${e.processed_by_agent}`:''}`)}</p></div></div>`).join('')}</div>`;}
async function artifactsHtml(data,stage){
  const p=data.project;const pairs=await Promise.all(stage.artifacts.map(async f=>[f,await textFile(p,f)]));
  const found=pairs.filter(([,t])=>t);
  if(!found.length)return'<p class="lsw-section-note">No durable stage documents are available yet.</p>';
  return `<div class="lsw-artifacts">${found.map(([f,t])=>`<details class="lsw-artifact"><summary>${esc(f.split('/').pop())}</summary><pre>${esc(t)}</pre></details>`).join('')}</div>`;
}
async function visualAssets(p){
  let items=[];const manifest=await textFile(p,'visual-production/preview-manifest.json');
  if(manifest){try{const j=JSON.parse(manifest);items=(Array.isArray(j)?j:j.assets)||[]}catch{}}
  if(!items.length){
    const fallback=[
      {label:'Water System Visual Preview',file:'water-system-visual-preview.html',type:'html'},
      {label:'Implementation Visuals',file:'water-system-implementation-visuals.html',type:'html'},
      {label:'Water Profile Planner',file:'water-profile-planner.html',type:'html'}
    ];
    for(const x of fallback){if(await textFile(p,`visual-production/${x.file}`))items.push(x)}
  }
  return items.map(x=>({label:x.label||x.title||x.file,file:x.file,type:x.type||'html',description:x.description||''}));
}
async function visualSection(data,stageKey){
  const p=data.project,assets=await visualAssets(p);const feedback=data.feedback.filter(x=>x.stage===stageKey);
  const assetTabs=assets.length?`<div class="lsw-preview-tabs">${assets.map((a,i)=>`<button type="button" class="lsw-preview-tab${i===0?' active':''}" data-file="${esc(a.file)}">${esc(a.label)}</button>`).join('')}</div><div class="lsw-preview-actions"><button type="button" id="lsw-open-preview">Open Preview in New Window</button></div><iframe class="lsw-preview-frame" id="lsw-preview-frame" title="Learner-facing visual preview"></iframe>`:'<div class="lsw-preview-empty">The Visual Agent has not registered a learner-facing preview yet. Production records are still available below.</div>';
  return `<section class="lsw-section"><h4>Actual Learner-Facing Preview</h4><p class="lsw-section-note">Interact with the same HTML/prototype the learner will use. This is not a description of the visual.</p>${assetTabs}</section>
  <section class="lsw-section"><h4>Owner Visual Feedback</h4><p class="lsw-section-note">Tie a change request or comment to the exact visual/component. The Visual Production Agent will pick up pending requests before Final Product Review.</p><div class="lsw-feedback"><div><label>Type</label><select id="lsw-feedback-type"><option value="CHANGE_REQUEST">Change request</option><option value="COMMENT">Comment</option><option value="APPROVAL_NOTE">Approval note</option></select></div><div><label>Component</label><select id="lsw-feedback-component"><option value="">Whole stage</option>${assets.map(a=>`<option value="visual-production/${esc(a.file)}">${esc(a.label)}</option>`).join('')}</select></div><div><label>What should change / what do you want noted?</label><textarea id="lsw-feedback-note" placeholder="Example: Explain Class A vs Class B in simpler homeowner language."></textarea></div><button type="button" id="lsw-feedback-save">Save Feedback</button></div><div class="lsw-feedback-list">${feedback.length?feedback.map(f=>`<div class="lsw-feedback-row"><strong>${esc(pretty(f.feedback_type))} · ${esc(f.status)}${f.component_key?` · ${esc(f.component_key.split('/').pop())}`:''}</strong><p>${esc(f.note)}</p><small>${esc(fmt(f.created_at))}${f.resolution_note?` · ${esc(f.resolution_note)}`:''}</small></div>`).join(''):'<p class="lsw-section-note">No visual feedback has been submitted yet.</p>'}</div></section>`;
}
function reviewBox(data,viewKey){
  const p=data.project;if(viewKey!==currentKey(p)||p.current_status!=='READY_FOR_REVIEW'||!REVIEW_STAGES.has(viewKey))return'';
  const labels=viewKey==='RESEARCH_REVIEW'?['Approve Research Foundation','Needs More Research','Reject Research Direction']:viewKey==='PRODUCT_REVIEW'?['Approve Product Design','Needs More Product Work','Reject Product Concept']:['Approve for Release','Needs Visual / Delivery Work','Reject Product'];
  return `<div class="lsw-review-box"><h4>Owner Decision</h4><p class="lsw-section-note">This is the gate that moves the project. Add a note when you want the next worker to change or preserve something specific.</p><textarea id="lsw-review-comment" placeholder="Optional owner direction"></textarea><div class="lsw-review-actions"><button class="lsw-approve" data-decision="APPROVE">${labels[0]}</button><button class="lsw-more" data-decision="NEEDS_MORE_WORK">${labels[1]}</button><button class="lsw-reject" data-decision="REJECT">${labels[2]}</button></div></div>`;
}
function stageCards(data,viewKey){const cur=currentKey(data.project),ci=stageIndex(cur),done=completedStageKeys(data);return `<div class="lsw-stage-strip">${STAGES.map((s,i)=>{const cls=[done.has(s.key)?'done':'',s.key===cur?'current':'',s.key===viewKey?'viewing':'',i>ci&&!done.has(s.key)?'future':''].filter(Boolean).join(' ');const state=s.key===cur?(data.project.current_status==='READY_FOR_REVIEW'?'Owner action':data.project.current_status==='AGENT_WORKING'?'Agent working':'Current'):done.has(s.key)?'Complete':'Not reached';return `<button type="button" class="lsw-stage ${cls}" data-stage="${s.key}"><span class="n">${String(i+1).padStart(2,'0')}</span><span class="name">${esc(s.label)}</span><span class="state">${esc(state)}</span></button>`}).join('')}</div>`;}
async function render(force=false){
  const id=selectedId();if(!id)return;
  const existing=document.querySelector('#lifecycle-stage-workspace');if(!force&&id===lastProject&&existing)return;
  if(id!==lastProject){lastProject=id;cache.clear()}
  const token=++renderToken;let data;try{data=await load(id)}catch(e){console.error('Lifecycle workspace',e);return}if(token!==renderToken)return;
  const p=data.project,cur=currentKey(p);let view=activeStageByProject.get(id)||cur;if(!STAGES.some(s=>s.key===view))view=cur;activeStageByProject.set(id,view);const stage=STAGES[stageIndex(view)],state=stateForViewing(data,view),detail=document.getElementById('detail');if(!detail)return;
  let host=detail.querySelector('#lifecycle-stage-workspace');if(!host){host=document.createElement('section');host.id='lifecycle-stage-workspace';detail.append(host)}detail.classList.add('lifecycle-workspace-active');
  const currentLabel=STAGES[stageIndex(cur)].label;
  host.innerHTML=`<header class="lsw-hero"><div><p class="lsw-kicker">${esc(p.project_id)} · Academy Product Lifecycle</p><h2>${esc(p.title)}</h2><p class="lsw-meta">${esc(p.learning_area||'Academy')} · Revision ${esc(p.revision_number||1)} · Last update ${esc(fmt(p.progress_updated_at))}</p></div><div class="lsw-current"><strong>${Math.max(0,Math.min(100,Number(p.progress_percent)||0))}%</strong><span>Current: ${esc(currentLabel)}</span></div></header>${stageCards(data,view)}<div class="lsw-status ${state.kind==='owner'?'owner':state.kind==='blocked'?'blocked':''}"><div class="lsw-status-icon">${state.kind==='owner'?'◆':state.kind==='blocked'?'!':state.kind==='done'?'✓':'●'}</div><div><h3>${esc(state.title)}</h3><p>${esc(state.body)}</p><div class="lsw-actionline">${esc(state.action)}</div></div></div><article class="lsw-page"><div class="lsw-page-head"><div><h3>${esc(stage.label)}</h3><p>${view===cur?esc(p.progress_stage||currentLabel):'Stage record and owner history'}</p></div><div class="lsw-stage-state">${view===cur?'CURRENT STAGE':completedStageKeys(data).has(view)?'PAST STAGE':'FUTURE STAGE'}</div></div><div class="lsw-summary-grid"><div class="lsw-summary"><strong>What happened / is happening</strong><span>${esc(view===cur?(p.progress_detail||'No stage detail recorded.'):'Review the durable records and decisions below.')}</span></div><div class="lsw-summary"><strong>Next action</strong><span>${esc(view===cur?(p.progress_next||'No next action recorded.'):'Use Next Stage to continue through the project history.')}</span></div><div class="lsw-summary"><strong>Owner status</strong><span>${esc(view===cur?(p.owner_review_status||'Not waiting on owner'):'Historical stage')}</span></div></div><section class="lsw-section"><h4>Owner / Gate History</h4>${eventHistory(data.events,view)}</section><section class="lsw-section"><h4>Stage Records</h4><p class="lsw-section-note">Open only the record you want. The page stays focused instead of displaying every document at once.</p><div id="lsw-artifacts-loading">Loading stage records…</div></section><div id="lsw-visual-slot"></div>${reviewBox(data,view)}<nav class="lsw-bottom-nav"><button type="button" id="lsw-prev" ${stageIndex(view)===0?'disabled':''}>← Previous Stage</button><span class="lsw-bottom-current">${esc(stage.label)} · ${stageIndex(view)+1} of ${STAGES.length}</span><button type="button" id="lsw-next" ${stageIndex(view)===STAGES.length-1?'disabled':''}>Next Stage →</button></nav></article>`;
  host.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{activeStageByProject.set(id,b.dataset.stage);render(true)});
  host.querySelector('#lsw-prev')?.addEventListener('click',()=>{activeStageByProject.set(id,STAGES[stageIndex(view)-1].key);render(true);host.scrollIntoView({behavior:'smooth',block:'start'})});
  host.querySelector('#lsw-next')?.addEventListener('click',()=>{activeStageByProject.set(id,STAGES[stageIndex(view)+1].key);render(true);host.scrollIntoView({behavior:'smooth',block:'start'})});
  const art=await artifactsHtml(data,stage);if(token!==renderToken)return;const artHost=host.querySelector('#lsw-artifacts-loading');if(artHost)artHost.outerHTML=art;
  if(view==='VISUAL_PRODUCTION'||view==='FINAL_PRODUCT_REVIEW'){
    const vs=await visualSection(data,'VISUAL_PRODUCTION');if(token!==renderToken)return;const slot=host.querySelector('#lsw-visual-slot');if(slot){slot.innerHTML=vs;wireVisual(host,data,render)}
  }
  wireReview(host,data,view,render);
}
async function loadPreview(host,p,file){const frame=host.querySelector('#lsw-preview-frame');if(!frame)return;frame.srcdoc='<p style="font-family:Arial;padding:20px">Loading preview…</p>';const html=await textFile(p,`visual-production/${file}`);frame.srcdoc=html||'<p style="font-family:Arial;padding:20px">Preview file is not available yet.</p>';host.querySelectorAll('.lsw-preview-tab').forEach(b=>b.classList.toggle('active',b.dataset.file===file));const open=host.querySelector('#lsw-open-preview');if(open)open.onclick=()=>{const w=window.open();if(w){w.document.open();w.document.write(html||'<p>Preview unavailable.</p>');w.document.close()}};}
function wireVisual(host,data,rerender){const first=host.querySelector('.lsw-preview-tab');if(first)loadPreview(host,data.project,first.dataset.file);host.querySelectorAll('.lsw-preview-tab').forEach(b=>b.onclick=()=>loadPreview(host,data.project,b.dataset.file));const save=host.querySelector('#lsw-feedback-save');if(save)save.onclick=async()=>{const note=host.querySelector('#lsw-feedback-note').value.trim();if(!note){alert('Tell the Visual Agent what you want changed or noted.');return}save.disabled=true;const {error}=await supabase.rpc('submit_academy_stage_feedback',{p_project_id:data.project.project_id,p_stage:'VISUAL_PRODUCTION',p_component_key:host.querySelector('#lsw-feedback-component').value||null,p_feedback_type:host.querySelector('#lsw-feedback-type').value,p_note:note});if(error){save.disabled=false;alert(error.message);return}cache.clear();await rerender(true)};}
function wireReview(host,data,view,rerender){host.querySelectorAll('.lsw-review-actions [data-decision]').forEach(b=>b.onclick=async()=>{const decision=b.dataset.decision,comment=host.querySelector('#lsw-review-comment')?.value.trim()||null;if(decision==='REJECT'&&!confirm('Reject this stage direction? The project history will be preserved.'))return;host.querySelectorAll('.lsw-review-actions button').forEach(x=>x.disabled=true);const {error}=await supabase.rpc('submit_academy_stage_review',{p_project_id:data.project.project_id,p_review_stage:view,p_decision:decision,p_comment:comment,p_source_decisions:{}});if(error){host.querySelectorAll('.lsw-review-actions button').forEach(x=>x.disabled=false);alert(error.message);return}setTimeout(()=>rerender(true),500)});}

addCss();
const observer=new MutationObserver(()=>queueMicrotask(()=>render(false)));observer.observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest('.queue-item'))setTimeout(()=>render(false),80)});
queueMicrotask(()=>render(false));
