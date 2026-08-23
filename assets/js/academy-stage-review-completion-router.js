import { supabase } from './supabase-client.js';

const REVIEW_STAGES=new Set(['RESEARCH_REVIEW','PRODUCT_REVIEW','FINAL_PRODUCT_REVIEW']);
const params=new URLSearchParams(location.search);
const projectId=params.get('project')||'';
const stage=params.get('stage')||'';
let saving=false;

async function remainingOwnerActions(){
  const [p,f]=await Promise.all([
    supabase.from('academy_content_projects').select('project_id,current_status,workflow_stage,owner_hold').eq('current_status','READY_FOR_REVIEW'),
    supabase.from('academy_late_findings').select('id,project_id,status').eq('status','PENDING_OWNER')
  ]);
  const projects=(p.data||[]).filter(x=>!x.owner_hold&&REVIEW_STAGES.has(x.workflow_stage)&&x.project_id!==projectId);
  const findings=f.error?[]:(f.data||[]);
  return projects.length+findings.length;
}

function showSaving(button,decision){
  document.querySelectorAll('[data-review]').forEach(b=>b.disabled=true);
  const notice=document.getElementById('asr-notice');
  if(notice){notice.textContent=`Saving ${decision.replaceAll('_',' ').toLowerCase()}…`;notice.className='asr-notice show';}
  if(button)button.textContent='Saving…';
}

async function completeReview(button){
  if(saving||button.disabled)return;
  const decision=button.dataset.review;
  if(!decision||!projectId||!stage)return;
  const comment=document.getElementById('asr-review-comment')?.value.trim()||'';
  if((decision==='NEEDS_MORE_WORK'||decision==='REJECT')&&!comment){
    const notice=document.getElementById('asr-notice');
    if(notice){notice.textContent='Add a note explaining what needs to change.';notice.className='asr-notice show error';}
    return;
  }
  saving=true;
  showSaving(button,decision);
  const {error}=await supabase.rpc('submit_academy_stage_review',{p_project_id:projectId,p_review_stage:stage,p_decision:decision,p_comment:comment||null,p_source_decisions:{}});
  if(error){
    saving=false;
    document.querySelectorAll('[data-review]').forEach(b=>b.disabled=false);
    const notice=document.getElementById('asr-notice');
    if(notice){notice.textContent=error.message;notice.className='asr-notice show error';}
    return;
  }
  try{sessionStorage.setItem('rrmJustCompletedReview',`${projectId}|${stage}|${Date.now()}`)}catch{}
  const count=await remainingOwnerActions();
  location.assign(count>0?'operations-review.html':'operations-review.html#overview');
}

document.addEventListener('click',e=>{
  const button=e.target.closest('[data-review]');
  if(!button)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  completeReview(button);
},true);
