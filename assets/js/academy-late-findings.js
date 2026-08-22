import { supabase } from './supabase-client.js';

const STAGE_LABELS={
  IDEA:'Idea + Context',RESEARCH_WORKING:'Research',RESEARCH_REVIEW:'Research Review',
  PRODUCT_OPPORTUNITY_RESEARCH:'Product Opportunity',PRODUCT_WORKING:'Product Design',PRODUCT_REVIEW:'Product Review',
  VISUAL_PRODUCTION:'Visual Production',FINAL_PRODUCT_REVIEW:'Final Product Review',AWAITING_RELEASE:'Release Prep',
  PUBLISHING:'Publishing',LIVE:'Live'
};
const DECISION_LABELS={
  SEND_BACK_NOW:'Send Back Now',ADD_CURRENT_VERSION:'Add to Current Version',QUEUE_V2:'Finish V1 + Queue V2',SPIN_OFF_NEW_PROJECT:'Spin Off New Project'
};
let currentProjectId='', busy=false, timer=null, renderSeq=0;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const fmt=v=>{if(!v)return'Not recorded';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString([], {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});};

function projectId(){
  const q=new URLSearchParams(location.search).get('project');
  if(q)return q;
  const active=document.querySelector('.queue-item.active .queue-meta')?.textContent||'';
  const workspace=document.querySelector('#lifecycle-stage-workspace .lsw-kicker')?.textContent||'';
  const detail=document.getElementById('detail')?.textContent||'';
  return ((active||workspace||detail).match(/RRA-\d{4}-\d{4}/)||[])[0]||'';
}

function addStyles(){
  if(document.getElementById('academy-late-findings-css'))return;
  const s=document.createElement('style');s.id='academy-late-findings-css';s.textContent=`
  .alf-panel{margin-top:12px;padding:16px;border:1px solid #36553c;border-radius:10px;background:#0c2114;color:#edf2e9}
  .alf-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.alf-head h3{margin:0;font-size:1.15rem}.alf-head p{margin:5px 0 0;color:#b7c4b8;font-size:.8rem;line-height:1.45}
  .alf-btn{border:1px solid #4e704f;border-radius:7px;background:#17371f;color:#f4f7f1;padding:9px 12px;font-weight:900;cursor:pointer}.alf-btn:disabled{opacity:.5;cursor:not-allowed}.alf-btn.primary{border-color:#b78836;background:#5b4118}.alf-btn.warn{border-color:#bf7957;background:#542d1e}.alf-btn.alt{background:#18314a;border-color:#4d7798}.alf-btn.quiet{background:#12291a}
  .alf-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;padding:14px;border:1px solid #294a34;border-radius:8px;background:#08170e}.alf-field{min-width:0}.alf-field.wide{grid-column:1/-1}.alf-field label{display:block;margin-bottom:5px;color:#f2d38b;font-size:.7rem;font-weight:900;text-transform:uppercase;letter-spacing:.03em}.alf-field input,.alf-field textarea,.alf-field select,.alf-note{width:100%;padding:9px 10px;border:1px solid #45634a;border-radius:6px;background:#06130a;color:#edf2e9;font:inherit}.alf-field textarea{min-height:82px}.alf-form-actions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}
  .alf-notice{display:none;margin-top:10px;padding:10px 12px;border-left:4px solid #d5a14a;background:#241e10;color:#f5e7c6}.alf-notice.show{display:block}.alf-notice.error{border-left-color:#c56757;background:#2b1512;color:#ffdcd5}
  .alf-list{display:grid;gap:10px;margin-top:14px}.alf-card{padding:14px;border:1px solid #31513a;border-radius:8px;background:#08170e}.alf-card.pending{border-left:4px solid #d5a14a}.alf-card.routed{border-left:4px solid #7dab68}.alf-card.v2{border-left:4px solid #6b8cb5}.alf-card.spin{border-left:4px solid #a87aba}.alf-card.resolved{opacity:.88;border-left:4px solid #629c66}
  .alf-card-head{display:flex;justify-content:space-between;gap:12px}.alf-card h4{margin:0;font-size:1rem}.alf-state{font-size:.68rem;font-weight:900;color:#f2d38b;text-transform:uppercase;letter-spacing:.04em}.alf-meta{margin-top:5px;color:#91a493;font-size:.7rem}.alf-copy{margin:10px 0 0;line-height:1.48}.alf-why,.alf-source,.alf-resolution{margin:8px 0 0;padding:9px 10px;border:1px solid #263f2d;border-radius:6px;background:#0d2013;font-size:.78rem;line-height:1.45}.alf-why strong,.alf-source strong,.alf-resolution strong{color:#f2d38b}
  .alf-owner{margin-top:12px;padding-top:11px;border-top:1px solid #294a34}.alf-owner>label{display:block;margin-bottom:5px;color:#b7c4b8;font-size:.72rem;font-weight:900}.alf-route{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:8px}.alf-route select{padding:9px;border:1px solid #45634a;border-radius:6px;background:#06130a;color:#edf2e9}.alf-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.alf-history{margin-top:14px}.alf-history summary{cursor:pointer;color:#c8d4c9;font-weight:900}.alf-empty{margin:12px 0 0;color:#9daf9f;font-size:.8rem}
  @media(max-width:760px){.alf-head,.alf-card-head{flex-direction:column}.alf-form,.alf-route{grid-template-columns:1fr}.alf-field.wide,.alf-form-actions{grid-column:auto}}
  `;document.head.append(s);
}

function host(){
  const existing=document.getElementById('academy-late-findings');if(existing)return existing;
  const after=document.querySelector('#academy-agent-run-status')||document.querySelector('.asr-status')||document.querySelector('#lifecycle-stage-workspace .lsw-status');
  const parent=document.querySelector('.asr-page')||document.querySelector('#lifecycle-stage-workspace')||document.getElementById('detail');
  if(!after&&!parent)return null;
  const el=document.createElement('section');el.id='academy-late-findings';el.className='alf-panel';
  if(after)after.insertAdjacentElement('afterend',el);else parent.prepend(el);
  return el;
}

async function load(id){
  const [p,f]=await Promise.all([
    supabase.from('academy_content_projects').select('project_id,title,workflow_stage,current_status').eq('project_id',id).single(),
    supabase.from('academy_late_findings').select('*').eq('project_id',id).order('created_at',{ascending:false})
  ]);
  if(p.error)throw p.error;if(f.error)throw f.error;return{project:p.data,findings:f.data||[]};
}

function classFor(f){if(f.status==='RESOLVED'||f.status==='CLOSED')return'resolved';if(f.status==='QUEUED_V2')return'v2';if(f.status==='SPIN_OFF_QUEUED')return'spin';if(f.status==='PENDING_OWNER')return'pending';return'routed';}
function decisionText(f){if(!f.owner_decision)return'Awaiting your route';let t=DECISION_LABELS[f.owner_decision]||pretty(f.owner_decision);if(f.target_stage)t+=` → ${STAGE_LABELS[f.target_stage]||pretty(f.target_stage)}`;return t;}

function findingCard(f){
  const pending=f.status==='PENDING_OWNER';
  const owner=`${f.owner_note?`<div class="alf-why"><strong>Owner note:</strong> ${esc(f.owner_note)}</div>`:''}${f.owner_decision?`<div class="alf-resolution"><strong>Owner route:</strong> ${esc(decisionText(f))}${f.routed_to_agent?` · ${esc(f.routed_to_agent)}`:''}${f.owner_decided_at?` · ${esc(fmt(f.owner_decided_at))}`:''}</div>`:''}`;
  const resolution=f.resolution_note?`<div class="alf-resolution"><strong>Resolution:</strong> ${esc(f.resolution_note)}${f.resolved_by_agent?` · ${esc(f.resolved_by_agent)}`:''}${f.resolved_at?` · ${esc(fmt(f.resolved_at))}`:''}</div>`:'';
  const spawned=f.spawned_project_id?`<div class="alf-resolution"><strong>Spawned project:</strong> ${esc(f.spawned_project_id)}</div>`:'';
  const controls=pending?`<div class="alf-owner"><label>Optional direction for the worker</label><textarea class="alf-note" data-note="${f.id}" placeholder="What should the next worker preserve, change, verify, or avoid?"></textarea><div class="alf-route"><select data-target="${f.id}"><option value="RESEARCH_WORKING">Send back to Research</option><option value="PRODUCT_WORKING">Send back to Product Design</option><option value="VISUAL_PRODUCTION">Send back to Visual Production</option></select><button class="alf-btn warn" data-decision="SEND_BACK_NOW" data-id="${f.id}">Send Back Now</button></div><div class="alf-actions"><button class="alf-btn primary" data-decision="ADD_CURRENT_VERSION" data-id="${f.id}">Add to Current Version</button><button class="alf-btn alt" data-decision="QUEUE_V2" data-id="${f.id}">Finish V1 + Queue V2</button><button class="alf-btn quiet" data-decision="SPIN_OFF_NEW_PROJECT" data-id="${f.id}">Spin Off New Project</button></div></div>`:'';
  return `<article class="alf-card ${classFor(f)}"><div class="alf-card-head"><div><h4>${esc(f.title)}</h4><div class="alf-meta">Found during ${esc(STAGE_LABELS[f.discovered_stage]||pretty(f.discovered_stage))} · ${esc(fmt(f.created_at))} · ${esc(f.discovered_by||'Unknown')}</div></div><div class="alf-state">${esc(pretty(f.status))}</div></div><p class="alf-copy">${esc(f.finding_text)}</p>${f.why_it_matters?`<div class="alf-why"><strong>Why it matters:</strong> ${esc(f.why_it_matters)}</div>`:''}${f.source_reference?`<div class="alf-source"><strong>Source / reference:</strong> ${esc(f.source_reference)}</div>`:''}${owner}${spawned}${resolution}${controls}</article>`;
}

function render(data){
  const el=host();if(!el)return;
  const pending=data.findings.filter(f=>f.status==='PENDING_OWNER');
  const active=data.findings.filter(f=>!['PENDING_OWNER','RESOLVED','CLOSED'].includes(f.status));
  const history=data.findings.filter(f=>['RESOLVED','CLOSED'].includes(f.status));
  el.innerHTML=`<div class="alf-head"><div><h3>Late Findings</h3><p>New discovery after work started? Record it here so it cannot disappear. You decide whether it changes V1, waits for V2, or becomes its own project.</p></div><button class="alf-btn" id="alf-new">+ Log Finding</button></div><div id="alf-notice" class="alf-notice"></div><form id="alf-form" class="alf-form" hidden><div class="alf-field"><label>Short title</label><input id="alf-title" maxlength="140" placeholder="Example: UV needs a clearer safety boundary"></div><div class="alf-field"><label>Found during</label><select id="alf-stage">${Object.entries(STAGE_LABELS).map(([k,v])=>`<option value="${k}"${k===data.project.workflow_stage?' selected':''}>${esc(v)}</option>`).join('')}</select></div><div class="alf-field wide"><label>What did we discover?</label><textarea id="alf-finding" placeholder="State the finding in plain language."></textarea></div><div class="alf-field wide"><label>Why does it matter? (optional)</label><textarea id="alf-why" placeholder="What could change, break, confuse, improve, or become an opportunity because of this?"></textarea></div><div class="alf-field wide"><label>Source / reference (optional)</label><input id="alf-source" placeholder="File, source, owner observation, test result, URL reference, etc."></div><div class="alf-form-actions"><button type="submit" class="alf-btn primary">Save Finding</button><button type="button" class="alf-btn quiet" id="alf-cancel">Cancel</button></div></form>${pending.length?`<div class="alf-list">${pending.map(findingCard).join('')}</div>`:'<p class="alf-empty">No late findings are waiting on your decision.</p>'}${active.length?`<div class="alf-list">${active.map(findingCard).join('')}</div>`:''}${history.length?`<details class="alf-history"><summary>Resolved / closed findings (${history.length})</summary><div class="alf-list">${history.map(findingCard).join('')}</div></details>`:''}`;
  wire(data);
}

function notice(text,error=false){const n=document.getElementById('alf-notice');if(!n)return;n.textContent=text;n.className=`alf-notice show${error?' error':''}`;}

function wire(data){
  const form=document.getElementById('alf-form');
  document.getElementById('alf-new')?.addEventListener('click',()=>{form.hidden=false;document.getElementById('alf-title')?.focus();});
  document.getElementById('alf-cancel')?.addEventListener('click',()=>{form.hidden=true;form.reset();document.getElementById('alf-stage').value=data.project.workflow_stage;});
  form?.addEventListener('submit',async e=>{e.preventDefault();const title=document.getElementById('alf-title').value.trim(),finding=document.getElementById('alf-finding').value.trim();if(!title||!finding){notice('Add a short title and the finding itself.',true);return}const btn=form.querySelector('[type="submit"]');btn.disabled=true;const{error}=await supabase.rpc('submit_academy_late_finding',{p_project_id:data.project.project_id,p_discovered_stage:document.getElementById('alf-stage').value,p_title:title,p_finding_text:finding,p_why_it_matters:document.getElementById('alf-why').value.trim()||null,p_source_reference:document.getElementById('alf-source').value.trim()||null});if(error){btn.disabled=false;notice(error.message,true);return}notice('Finding saved. Choose how you want it handled.');await refresh(true);});
  document.querySelectorAll('[data-decision]').forEach(btn=>btn.addEventListener('click',async()=>{
    const id=btn.dataset.id,decision=btn.dataset.decision,note=document.querySelector(`[data-note="${id}"]`)?.value.trim()||null;
    const target=decision==='SEND_BACK_NOW'?document.querySelector(`[data-target="${id}"]`)?.value:null;
    const label=DECISION_LABELS[decision]||pretty(decision);
    let extra='';if(decision==='SEND_BACK_NOW')extra=` This will return the project to ${STAGE_LABELS[target]||pretty(target)} now.`;if(decision==='ADD_CURRENT_VERSION')extra=' This will reopen the current lifecycle work area if the project is sitting at review.';if(!confirm(`${label}?${extra}`))return;
    document.querySelectorAll(`[data-id="${id}"]`).forEach(b=>b.disabled=true);
    const{error}=await supabase.rpc('set_academy_late_finding_owner_decision',{p_finding_id:id,p_decision:decision,p_target_stage:target,p_owner_note:note});
    if(error){document.querySelectorAll(`[data-id="${id}"]`).forEach(b=>b.disabled=false);notice(error.message,true);return}
    notice(`${label} recorded. The finding now has a permanent route.`);await refresh(true);
  }));
}

async function refresh(force=false){
  const id=projectId();if(!id||busy)return;if(id!==currentProjectId){currentProjectId=id;document.getElementById('academy-late-findings')?.remove();}
  const seq=++renderSeq;busy=true;try{const data=await load(id);if(seq!==renderSeq)return;render(data);}catch(e){console.warn('Academy late findings',e);if(force)notice(e.message||'Late findings could not be loaded.',true);}finally{busy=false;}
}

addStyles();
new MutationObserver(()=>queueMicrotask(()=>refresh())).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.addEventListener('popstate',()=>refresh(true));
setTimeout(()=>refresh(true),500);
timer=setInterval(()=>refresh(),45000);
