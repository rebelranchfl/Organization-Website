import { supabase } from './supabase-client.js';

const SUPPORTED=new Set(['PRODUCT_WORKING','VISUAL_PRODUCTION']);
const AUTHORIZED_STATUS=new Set(['APPROVED','NEEDS_MORE_WORK','AGENT_WORKING']);
const EXCLUSIVE_PROJECT='RRA-2026-0001';
let timer=null,busy=false,lastProject='';

function css(){if(document.getElementById('academy-run-agent-now-css'))return;const s=document.createElement('style');s.id='academy-run-agent-now-css';s.textContent=`
.aran-panel{margin-top:10px;padding:12px;border:1px solid #31513a;border-radius:9px;background:#0a1c11;color:#edf2e9}
.aran-row{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}.aran-copy{min-width:240px;flex:1}.aran-copy strong{display:block;color:#f2d38b;font-size:.76rem;text-transform:uppercase;letter-spacing:.04em}.aran-copy span{display:block;margin-top:5px;color:#bcc9bd;font-size:.78rem;line-height:1.45}.aran-button{padding:10px 14px;border:1px solid #e0a449;border-radius:7px;background:#644619;color:#fff7de;font-weight:900;cursor:pointer}.aran-button:disabled{opacity:.48;cursor:not-allowed}.aran-state{margin-top:9px;padding-top:9px;border-top:1px solid #294a34;color:#aebcaf;font-size:.76rem;line-height:1.45}.aran-state b{color:#edf2e9}.aran-state.error{color:#e6a493}.aran-live{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:#7dbd69}.aran-live.off{background:#8e7566}.aran-live.wait{background:#e0a449}
`;
document.head.append(s)}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function projectId(){const q=new URLSearchParams(location.search).get('project');if(q)return q;const a=document.querySelector('.queue-item.active .queue-meta')?.textContent||'';const d=document.getElementById('detail')?.textContent||'';return ((a||d).match(/RRA-\d{4}-\d{4}/)||[])[0]||''}
function mount(){const anchor=document.getElementById('academy-agent-run-status')||document.querySelector('.asr-status')||document.querySelector('.lsw-status');if(!anchor)return null;let p=document.getElementById('academy-run-agent-now');if(!p){p=document.createElement('section');p.id='academy-run-agent-now';p.className='aran-panel';anchor.insertAdjacentElement('afterend',p)}return p}
function fmt(v){if(!v)return'Not recorded';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'})}
function runnerReady(r){if(!r?.ready||!r.last_heartbeat)return false;const t=new Date(r.last_heartbeat).getTime();return Number.isFinite(t)&&Date.now()-t<12*60*1000}
async function fetchData(id){const [p,r,q]=await Promise.all([
 supabase.from('academy_content_projects').select('project_id,current_status,workflow_stage,owner_hold,last_agent').eq('project_id',id).single(),
 supabase.from('academy_agent_runner_state').select('*').eq('runner_key','github-codex-v1').maybeSingle(),
 supabase.from('academy_agent_run_requests').select('*').eq('project_id',id).order('requested_at',{ascending:false}).limit(1).maybeSingle()
]);if(p.error)throw p.error;if(r.error)throw r.error;if(q.error)throw q.error;return{project:p.data,runner:r.data,run:q.data}}
function render(host,{project:p,runner:r,run}){
 const exclusive=p.project_id===EXCLUSIVE_PROJECT;
 const authorized=AUTHORIZED_STATUS.has(p.current_status);
 const supported=exclusive&&SUPPORTED.has(p.workflow_stage)&&authorized&&!p.owner_hold;
 const ready=runnerReady(r);
 const active=run&&['PENDING','RUNNING'].includes(run.status);
 let why='';
 if(!exclusive)why='Academy stop-work is active. Water Through the Layers is the only project currently eligible for direct execution.';
 else if(p.owner_hold)why='Project is on owner hold.';
 else if(!SUPPORTED.has(p.workflow_stage))why='Run Agent Now currently supports Product Design and Visual Production stages.';
 else if(!authorized)why='This stage is not currently authorized for agent execution.';
 else if(active)why=run.status==='PENDING'?'Run request created; verified dispatch has not completed yet.':'The verified runner has claimed this execution.';
 else if(!ready)why='Academy automated production is disabled or the verified Codex runner is not ready. No run can start.';
 else why='A verified runner is available. This will queue the current authorized stage and immediately request dispatch.';
 const enabled=supported&&ready&&!active;
 const dot=active&&run.status==='RUNNING'?'':ready?' wait':' off';
 host.innerHTML=`<div class="aran-row"><div class="aran-copy"><strong><span class="aran-live${dot}"></span>Run Agent Now</strong><span>${esc(why)}</span></div><button type="button" id="aran-run" class="aran-button" ${enabled?'':'disabled'}>${active?(run.status==='RUNNING'?'Agent Running…':'Dispatching…'):'Run Current Stage Now'}</button></div><div class="aran-state${run?.status==='FAILED'?' error':''}">${run?`Latest immediate run: <b>${esc(run.status)}</b> · requested ${esc(fmt(run.requested_at))}${run.claimed_at?` · claimed ${esc(fmt(run.claimed_at))}`:''}${run.dispatch_completed_at?` · dispatched ${esc(fmt(run.dispatch_completed_at))}`:''}${run.completed_at?` · finished ${esc(fmt(run.completed_at))}`:''}${run.result_summary?`<br>${esc(run.result_summary)}`:''}${run.error_message?`<br>${esc(run.error_message)}`:''}`:`Verified dispatcher runner: <b>${ready?'READY':'OFFLINE'}</b>${r?.last_heartbeat?` · heartbeat ${esc(fmt(r.last_heartbeat))}`:''}`}</div>`;
 const b=host.querySelector('#aran-run');if(enabled&&b)b.onclick=()=>requestRun(p.project_id,b);
}
async function failQueuedRequest(requestId,message){
 if(!requestId)return;
 try{await supabase.rpc('fail_academy_agent_run_request',{p_request_id:requestId,p_error:String(message||'Dispatch failed before the runner could claim the request.')})}catch{}
}
async function requestRun(id,button){
 button.disabled=true;button.textContent='Dispatching…';
 const {data:request,error}=await supabase.rpc('request_academy_agent_run',{p_project_id:id});
 if(error){button.textContent='Run Current Stage Now';button.disabled=false;alert(error.message);return}
 const requestId=request?.id;
 if(!requestId){button.textContent='Run Current Stage Now';button.disabled=false;alert('Run request was created without a usable request ID. Nothing was dispatched.');return}
 const {error:dispatchError}=await supabase.functions.invoke('academy-agent-dispatch',{body:{project_id:id,request_id:requestId}});
 if(dispatchError){await failQueuedRequest(requestId,dispatchError.message);button.textContent='Run Current Stage Now';button.disabled=false;alert(dispatchError.message);await refresh(true);return}
 await refresh(true);
}
async function refresh(force=false){const id=projectId();if(!id||busy)return;if(id!==lastProject){lastProject=id}busy=true;try{const d=await fetchData(id);const h=mount();if(h)render(h,d)}catch(e){console.warn('Run Agent Now',e)}finally{busy=false}}
css();new MutationObserver(()=>queueMicrotask(refresh)).observe(document.body,{childList:true,subtree:true});setTimeout(refresh,700);timer=setInterval(refresh,10000);
