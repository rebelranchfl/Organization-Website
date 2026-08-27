import { supabase } from './supabase-client.js';

const params=new URLSearchParams(location.search);
const projectId=params.get('project')||'RRA-2026-0001';
const STALE_MS=15*60*1000;
let busy=false;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>{if(!v)return'Not recorded';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'});};
const ageMs=v=>v?Math.max(0,Date.now()-new Date(v).getTime()):0;
const ageText=v=>{const m=Math.floor(ageMs(v)/60000);if(m<1)return'less than a minute';if(m<60)return`${m} minute${m===1?'':'s'}`;const h=Math.floor(m/60),r=m%60;return`${h}h ${r}m`;};

async function getState(){
 const [p,q]=await Promise.all([
  supabase.from('academy_content_projects').select('project_id,title,workflow_stage,current_status,progress_detail,progress_next,progress_stage,owner_review_status,owner_hold,last_agent').eq('project_id',projectId).single(),
  supabase.from('academy_agent_run_requests').select('id,status,requested_at,claimed_at,completed_at,runner,attempt_count,result_summary,error_message,result_commit_sha').eq('project_id',projectId).order('requested_at',{ascending:false}).limit(1).maybeSingle()
 ]);
 if(p.error)throw p.error;if(q.error)throw q.error;
 return{project:p.data,run:q.data};
}

function workerTruth(run){
 if(!run)return{kind:'IDLE',label:'NO ACTIVE RUN',detail:'No agent run is currently queued or executing.'};
 if(run.status==='RUNNING')return{kind:'RUNNING',label:'AGENT RUNNING',detail:`Claimed ${fmt(run.claimed_at)} by ${run.runner||'runner'}.`};
 if(run.status==='PENDING'){
  const stale=ageMs(run.requested_at)>STALE_MS;
  return stale
   ?{kind:'STALLED',label:'RUN REQUEST STALLED',detail:`Requested ${fmt(run.requested_at)} (${ageText(run.requested_at)} ago) and never claimed. No agent is executing this run.`}
   :{kind:'QUEUED',label:'RUN REQUESTED',detail:`Requested ${fmt(run.requested_at)} and not yet claimed. No agent is executing this run.`};
 }
 if(run.status==='FAILED')return{kind:'FAILED',label:'LAST RUN FAILED',detail:`Finished ${fmt(run.completed_at)}. ${run.error_message||'The run failed.'}`};
 if(run.status==='COMPLETED')return{kind:'COMPLETED',label:'LAST RUN COMPLETED',detail:`Finished ${fmt(run.completed_at)}${run.result_commit_sha?` · commit ${run.result_commit_sha.slice(0,10)}`:''}. No agent is executing now.`};
 return{kind:run.status||'UNKNOWN',label:String(run.status||'UNKNOWN').replaceAll('_',' '),detail:'No execution claim is recorded.'};
}

function setText(el,text){if(el)el.textContent=text;}
function applyTruth({project:p,run}){
 const w=workerTruth(run);
 const hero=document.querySelector('.asr-current');
 if(hero){
  const strong=hero.querySelector('strong');
  const span=hero.querySelector('span');
  if(strong)strong.textContent='Stage 7 of 11';
  if(span)span.textContent='Current: Visual Production';
 }
 const current=[...document.querySelectorAll('.asr-stage.current')][0];
 if(current)setText(current.querySelector('.state'),w.kind==='RUNNING'?'Agent running':w.kind==='QUEUED'?'Run requested':w.kind==='STALLED'?'Run stalled':'In progress');
 const status=document.querySelector('.asr-status');
 if(status){
  const h=status.querySelector('h3');
  const body=status.querySelector('p');
  const next=status.querySelector('.next');
  setText(h,w.label);
  setText(body,w.detail);
  let action=p.progress_next||'Continue Visual Production until all required visuals and deployed QA pass.';
  if(w.kind==='STALLED')action='The request failed to reach a runner. Do not call this dispatching or agent work. Clear the stale request before requesting another run.';
  if(w.kind==='RUNNING')action='Wait for this claimed run to finish, then verify its exact deployed output before accepting the result.';
  setText(next,action);
  status.classList.toggle('blocked',['FAILED','STALLED'].includes(w.kind));
 }
 const summaries=document.querySelectorAll('.asr-summary-grid .asr-summary span');
 if(summaries[0])summaries[0].textContent=p.progress_detail||'Visual Production is active.';
 if(summaries[1])summaries[1].textContent=p.progress_next||'Continue Visual Production and deployed QA.';
 if(summaries[2])summaries[2].textContent='Current Visual Production output: not yet submitted for owner approval.';
 document.body.dataset.academyWorkerState=w.kind;
 renderExecutionPanel({project:p,run,truth:w});
}

function ensureCss(){if(document.getElementById('academy-controller-css'))return;const s=document.createElement('style');s.id='academy-controller-css';s.textContent=`
.acx{margin-top:10px;padding:14px;border:1px solid #31513a;border-radius:9px;background:#0a1c11;color:#edf2e9}.acx h4{margin:0 0 6px;color:#f2d38b;font-size:.78rem;text-transform:uppercase;letter-spacing:.04em}.acx p{margin:4px 0;color:#c3cec4;font-size:.8rem;line-height:1.45}.acx strong{color:#fff}.acx button{margin-top:10px;padding:10px 14px;border:1px solid #e0a449;border-radius:7px;background:#644619;color:#fff7de;font-weight:900;cursor:pointer}.acx button:disabled{opacity:.48;cursor:not-allowed}.acx .bad{color:#f0a89a}.acx .good{color:#a9dc94}.asr-preview-direct{display:grid;gap:12px}.asr-preview-direct iframe{width:100%;min-height:72vh;border:1px solid #345345;border-radius:10px;background:#fff}.asr-preview-direct .links{display:flex;gap:10px;flex-wrap:wrap}.asr-preview-direct .links a{display:inline-block;padding:10px 12px;border-radius:7px;background:#173522;color:#fff;text-decoration:none;font-weight:800}`;document.head.append(s)}

async function dispatchConfigured(){
 try{const r=await fetch('https://dfrwxpuojeiykaignyny.supabase.co/functions/v1/academy-agent-dispatch',{cache:'no-store'});if(!r.ok)return false;const j=await r.json();return j.configured===true;}catch{return false;}
}

async function renderExecutionPanel({project:p,run,truth:w}){
 ensureCss();
 const anchor=document.querySelector('.asr-status');if(!anchor)return;
 let box=document.getElementById('academy-execution-truth');if(!box){box=document.createElement('section');box.id='academy-execution-truth';box.className='acx';anchor.insertAdjacentElement('afterend',box);}
 const configured=await dispatchConfigured();
 const active=run&&['PENDING','RUNNING'].includes(run.status);
 let button='';
 if(configured&&!active&&p.project_id==='RRA-2026-0001'&&p.workflow_stage==='VISUAL_PRODUCTION'&&!p.owner_hold){button='<button type="button" id="acx-run">Run Agent Now</button>';}
 const dispatchLine=configured?'<span class="good">Direct GitHub dispatch backend: configured.</span>':'<span class="bad">Direct GitHub dispatch backend: not configured. No fake “Dispatching…” state will be shown.</span>';
 box.innerHTML=`<h4>Agent execution — source of truth</h4><p><strong>${esc(w.label)}</strong> — ${esc(w.detail)}</p><p>${dispatchLine}</p>${button}`;
 box.querySelector('#acx-run')?.addEventListener('click',runNow);
}

async function runNow(e){
 const b=e.currentTarget;b.disabled=true;b.textContent='Requesting…';
 const req=await supabase.rpc('request_academy_agent_run',{p_project_id:projectId});
 if(req.error){b.disabled=false;b.textContent='Run Agent Now';alert(req.error.message);return;}
 const id=req.data?.id||req.data?.[0]?.id||null;
 try{
  const {data:{session}}=await supabase.auth.getSession();
  const r=await fetch('https://dfrwxpuojeiykaignyny.supabase.co/functions/v1/academy-agent-dispatch',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session?.access_token||''}`},body:JSON.stringify({project_id:projectId,request_id:id})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){await supabase.rpc('fail_academy_agent_run_request',{p_request_id:id,p_error:j.error||`Dispatch failed (${r.status})`});alert(j.error||'Dispatch failed. The request was marked failed.');}
 }catch(err){if(id)await supabase.rpc('fail_academy_agent_run_request',{p_request_id:id,p_error:String(err?.message||err)});alert('Dispatch failed. The request was marked failed.');}
 await refresh();
}

function installPreviewOverride(){
 const details=document.getElementById('asr-preview-lazy');if(!details||details.dataset.directPreview)return;details.dataset.directPreview='1';
 details.addEventListener('toggle',e=>{
  if(!details.open)return;
  e.stopImmediatePropagation();
  const host=document.getElementById('asr-preview-host');if(!host)return;
  host.dataset.loaded='1';
  host.innerHTML=`<div class="asr-preview-direct"><div class="links"><a href="/water-learning-experience-final.html" target="_blank" rel="noopener">Open exact live learner page</a><a href="/water-system-visual-preview.html" target="_blank" rel="noopener">Decision visuals</a><a href="/water-system-implementation-visuals.html" target="_blank" rel="noopener">Implementation visuals</a></div><iframe src="/water-learning-experience-final.html" title="Live deployed Water learner product"></iframe><p class="asr-note">This preview loads the deployed root learner route. It is not repository HTML injected with srcdoc.</p></div>`;
 },true);
}

async function refresh(){if(busy)return;busy=true;try{const state=await getState();applyTruth(state);installPreviewOverride();}catch(e){console.warn('Academy controller',e);}finally{busy=false;}}

document.addEventListener('academy-stage-review-ready',()=>setTimeout(refresh,0));
document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,500));
setInterval(refresh,10000);
