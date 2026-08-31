import { supabase } from './supabase-client.js';

const params=new URLSearchParams(location.search);
const projectId=params.get('project')||'RRA-2026-0001';
let busy=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>{if(!v)return'Not recorded';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'});};

function workerState(run,p){
 if(run?.status==='RUNNING')return{label:'AGENT RUNNING',stage:'Agent running',body:`${p.last_agent||'Academy agent'} claimed the current run at ${fmt(run.claimed_at)} and is executing it now.`,next:p.progress_next||'Wait for this execution cycle to finish.'};
 if(run?.status==='PENDING')return{label:'QUEUED',stage:'Queued',body:`Immediate Visual Production was requested ${fmt(run.requested_at)} and is waiting to be claimed. No agent is executing this run yet.`,next:p.progress_next||'Dispatcher must claim the queued run.'};
 if(run?.status==='FAILED')return{label:'RUN FAILED',stage:'Failed',body:`The latest immediate run failed${run.completed_at?` at ${fmt(run.completed_at)}`:''}.`,next:run.error_message||p.progress_next||'Correct the failure before running again.'};
 if(run?.status==='COMPLETED')return{label:'CYCLE COMPLETED',stage:'Cycle completed',body:`The latest immediate run completed${run.completed_at?` at ${fmt(run.completed_at)}`:''}.`,next:p.progress_next||'Continue the current stage until its deliverables and QA are complete.'};
 if(p.owner_hold)return{label:'ON HOLD',stage:'On hold',body:'This project is paused by owner control.',next:'Remove the hold when work should resume.'};
 return{label:String(p.current_status||'CURRENT').replaceAll('_',' '),stage:'Current',body:p.progress_detail||'Current stage.',next:p.progress_next||''};
}

async function refresh(){
 if(busy)return;busy=true;
 try{
  const [pq,rq]=await Promise.all([
   supabase.from('academy_content_projects').select('project_id,workflow_stage,current_status,progress_percent,progress_detail,progress_next,last_agent,owner_hold').eq('project_id',projectId).single(),
   supabase.from('academy_agent_run_requests').select('status,requested_at,claimed_at,completed_at,result_summary,error_message').eq('project_id',projectId).order('requested_at',{ascending:false}).limit(1).maybeSingle()
  ]);
  if(pq.error||rq.error)return;
  const p=pq.data,run=rq.data,s=workerState(run,p);
  const hero=document.querySelector('.asr-current strong');if(hero)hero.textContent=`${Math.max(0,Math.min(100,Number(p.progress_percent)||0))}%`;
  const currentStage=[...document.querySelectorAll('.asr-stage')].find(a=>a.classList.contains('current'));if(currentStage){const state=currentStage.querySelector('.state');if(state)state.textContent=s.stage;}
  const status=document.querySelector('.asr-status');if(status){const h=status.querySelector('h3');const ps=status.querySelectorAll('p');const next=status.querySelector('.next');if(h)h.textContent=s.label;if(ps[0])ps[0].textContent=s.body;if(next)next.textContent=s.next;status.classList.toggle('blocked',run?.status==='FAILED'||p.owner_hold);}
  const summaries=document.querySelectorAll('.asr-summary-grid .asr-summary span');
  if(summaries[0])summaries[0].textContent=p.progress_detail||s.body;
  if(summaries[1])summaries[1].textContent=s.next;
  document.body.dataset.academyWorkerState=run?.status||p.current_status||'';
 }finally{busy=false;}
}

document.addEventListener('academy-stage-review-ready',refresh);
document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,400));
setInterval(refresh,10000);
