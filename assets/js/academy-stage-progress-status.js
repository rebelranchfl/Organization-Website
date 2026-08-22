import { supabase } from './supabase-client.js';

const STAGES=['IDEA','RESEARCH_WORKING','RESEARCH_REVIEW','PRODUCT_OPPORTUNITY_RESEARCH','PRODUCT_WORKING','PRODUCT_REVIEW','VISUAL_PRODUCTION','FINAL_PRODUCT_REVIEW','AWAITING_RELEASE','PUBLISHING','LIVE'];
const HOURLY_WORKER_STAGES=new Set(['RESEARCH_WORKING','PRODUCT_OPPORTUNITY_RESEARCH','PRODUCT_WORKING','VISUAL_PRODUCTION']);
let lastKey='',busy=false,timer=null;

function addStyles(){
  if(document.getElementById('academy-stage-progress-status-css'))return;
  const s=document.createElement('style');
  s.id='academy-stage-progress-status-css';
  s.textContent=`
  .aps-percent{display:block;margin-top:7px;color:#f2d38b;font-size:.78rem;font-weight:900}
  .aps-track{height:5px;margin-top:5px;border:1px solid #31513a;border-radius:4px;background:#07150c;overflow:hidden}
  .aps-fill{height:100%;background:linear-gradient(90deg,#8a5e22,#97c459)}
  .aps-run-panel{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px;padding:12px;border:1px solid #31513a;border-radius:9px;background:#0b1d12;color:#edf2e9}
  .aps-run-item{min-width:0;padding:9px;border:1px solid #294a34;border-radius:7px;background:#08170e}
  .aps-run-item strong{display:block;color:#f2d38b;font-size:.66rem;text-transform:uppercase;letter-spacing:.04em}
  .aps-run-item span{display:block;margin-top:5px;font-size:.78rem;line-height:1.4;overflow-wrap:anywhere}
  .aps-run-item.owner span{color:#f2d38b;font-weight:900}
  .aps-how{grid-column:1/-1;padding-top:2px}
  .aps-how summary{cursor:pointer;color:#b8c5b9;font-size:.76rem;font-weight:900}
  .aps-how p{margin:7px 0 0;color:#b8c5b9;font-size:.76rem;line-height:1.5}
  @media(max-width:1050px){.aps-run-panel{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:650px){.aps-run-panel{grid-template-columns:1fr}}
  `;
  document.head.append(s);
}

function clamp(v){return Math.max(0,Math.min(100,Number(v)||0))}
function fmt(v){if(!v)return'Not recorded';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
function projectId(){
  const q=new URLSearchParams(location.search).get('project');
  if(q)return q;
  const active=document.querySelector('.queue-item.active .queue-meta')?.textContent||'';
  const detail=document.getElementById('detail')?.textContent||'';
  return ((active||detail).match(/RRA-\d{4}-\d{4}/)||[])[0]||'';
}
function cadence(stage){return HOURLY_WORKER_STAGES.has(stage)?60:null}
function nextPickup(updatedAt,minutes){
  if(!updatedAt||!minutes)return'Not scheduled from this stage';
  let d=new Date(updatedAt);if(Number.isNaN(d.getTime()))return'Next hourly worker cycle';
  const step=minutes*60000;let t=d.getTime()+step;const now=Date.now();
  while(t<=now)t+=step;
  return `Approx. ${new Date(t).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`;
}
function ownerAction(p){
  if(p.owner_hold)return'YES — project is on hold';
  if(p.current_status==='READY_FOR_REVIEW')return'YES — review and decide';
  if(p.current_status==='AGENT_WORKING')return'No — agent is working';
  if(p.current_status==='NEEDS_MORE_WORK')return'No — revision is queued/working';
  return 'No owner action recorded';
}
function currentStageIndex(p){const i=STAGES.indexOf(p.workflow_stage);return i<0?0:i}
function stagePercent(p,key){
  const ci=currentStageIndex(p),i=STAGES.indexOf(key);
  if(i<0)return 0;
  if(key===p.workflow_stage)return clamp(p.progress_percent);
  return i<ci?100:0;
}
function stageKeyFromCard(card){
  if(card.dataset.stage)return card.dataset.stage;
  if(card.dataset.stageReview)return card.dataset.stageReview;
  const name=(card.querySelector('.name')||card.querySelector('span:last-of-type'))?.textContent?.trim()||'';
  const map={'Idea + Context':'IDEA','Research':'RESEARCH_WORKING','Research Review':'RESEARCH_REVIEW','Product Opportunity':'PRODUCT_OPPORTUNITY_RESEARCH','Product Design':'PRODUCT_WORKING','Product Review':'PRODUCT_REVIEW','Visual Production':'VISUAL_PRODUCTION','Final Product Review':'FINAL_PRODUCT_REVIEW','Release Prep':'AWAITING_RELEASE','Awaiting Release':'AWAITING_RELEASE','Publishing':'PUBLISHING','Live':'LIVE'};
  return map[name]||'';
}
function currentStateLabel(p){
  if(p.owner_hold)return'On hold';
  if(p.current_status==='READY_FOR_REVIEW')return'Owner action required';
  if(p.current_status==='AGENT_WORKING')return'Agent working';
  if(p.current_status==='NEEDS_MORE_WORK')return'Revision working';
  return String(p.current_status||'Current').replaceAll('_',' ').toLowerCase();
}
function decorateCards(p){
  const ci=currentStageIndex(p);
  document.querySelectorAll('.lsw-stage,.asr-stage,.life-step').forEach(card=>{
    const key=stageKeyFromCard(card);if(!key)return;
    const i=STAGES.indexOf(key),pct=stagePercent(p,key);
    let el=card.querySelector('.aps-percent');if(!el){el=document.createElement('span');el.className='aps-percent';card.append(el)}
    el.textContent=`${pct}% complete`;
    let track=card.querySelector('.aps-track');if(!track){track=document.createElement('span');track.className='aps-track';track.innerHTML='<span class="aps-fill"></span>';card.append(track)}
    track.querySelector('.aps-fill').style.width=`${pct}%`;
    const state=card.querySelector('.state');if(!state||i<0)return;
    if(key===p.workflow_stage)state.textContent=`${currentStateLabel(p)} · ${pct}%`;
    else if(i<ci)state.textContent='Complete';
    else state.textContent='Not reached';
  });
}
function invalidateStaleWorkspace(id,key){
  if(!lastKey||key===lastKey)return;
  const previousProject=lastKey.split('|',1)[0];
  if(previousProject!==id)return;
  const workspace=document.getElementById('lifecycle-stage-workspace');
  if(workspace)workspace.remove();
}
function runPanel(p){
  const target=document.querySelector('.asr-status')||document.querySelector('.lsw-status');if(!target)return;
  let panel=document.getElementById('academy-agent-run-status');if(!panel){panel=document.createElement('section');panel.id='academy-agent-run-status';panel.className='aps-run-panel';target.insertAdjacentElement('afterend',panel)}
  const mins=cadence(p.workflow_stage);const working=p.current_status==='AGENT_WORKING'&&mins;
  const cadenceText=mins?`Every ${mins===60?'hour':mins+' minutes'}`:(p.current_status==='READY_FOR_REVIEW'?'Owner review gate':'No scheduled worker for this stage');
  const next=working?nextPickup(p.progress_updated_at,mins):(p.current_status==='READY_FOR_REVIEW'?'Waiting on owner decision':p.owner_hold?'Paused by owner':'Not applicable');
  const work=p.progress_detail||p.progress_stage||'No current work detail recorded.';
  panel.innerHTML=`
    <div class="aps-run-item"><strong>Stage progress</strong><span>${clamp(p.progress_percent)}% complete</span></div>
    <div class="aps-run-item"><strong>Current work</strong><span>${escapeHtml(work)}</span></div>
    <div class="aps-run-item"><strong>Last worked</strong><span>${escapeHtml(fmt(p.progress_updated_at))}</span></div>
    <div class="aps-run-item"><strong>Worker cadence</strong><span>${escapeHtml(cadenceText)}</span></div>
    <div class="aps-run-item owner"><strong>Your action</strong><span>${escapeHtml(ownerAction(p))}</span></div>
    <div class="aps-run-item"><strong>Approx. next pickup</strong><span>${escapeHtml(next)}</span></div>
    <div class="aps-run-item"><strong>Worker</strong><span>${escapeHtml(p.last_agent||'Not recorded')}</span></div>
    <div class="aps-run-item" style="grid-column:span 3"><strong>Next step</strong><span>${escapeHtml(p.progress_next||'No next step recorded.')}</span></div>
    ${mins?`<details class="aps-how"><summary>How this worker runs</summary><p>The schedule is the wake-up, not a work timer. When the worker wakes up it continues through as much actionable work as practical. It stops when the stage is complete, it reaches an owner gate, it hits a real blocker, or the run reaches its execution limit. Before stopping it saves completed work, the current percentage, and the exact next step so the next hourly cycle can continue.</p></details>`:''}
  `;
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function refresh(){
  const id=projectId();if(!id||busy)return;busy=true;
  try{
    const {data:p,error}=await supabase.from('academy_content_projects').select('project_id,current_status,workflow_stage,progress_percent,progress_stage,progress_detail,progress_next,progress_updated_at,last_agent,owner_hold,owner_review_status').eq('project_id',id).single();
    if(error)throw error;
    const key=[id,p.workflow_stage,p.current_status,p.progress_percent,p.progress_updated_at,p.progress_detail,p.progress_next].join('|');
    const changed=key!==lastKey;
    if(changed)invalidateStaleWorkspace(id,key);
    lastKey=key;
    decorateCards(p);
    if(changed||!document.getElementById('academy-agent-run-status'))runPanel(p);
  }catch(e){console.warn('Academy stage progress status',e)}finally{busy=false}
}
function schedule(){clearInterval(timer);timer=setInterval(refresh,60000)}
addStyles();
new MutationObserver(()=>queueMicrotask(refresh)).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.addEventListener('popstate',refresh);
setTimeout(refresh,400);
schedule();
