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

function allDecisionButtons(){return document.querySelectorAll('[data-review],[data-return-stage]')}
function setDecisionButtonsDisabled(value){allDecisionButtons().forEach(b=>b.disabled=value)}

function showSaving(button,decision){
  setDecisionButtonsDisabled(true);
  const notice=document.getElementById('asr-notice');
  if(notice){notice.textContent=`Saving ${decision.replaceAll('_',' ').toLowerCase()}…`;notice.className='asr-notice show';}
  if(button)button.textContent='Saving…';
}

async function finishOwnerAction(){
  try{sessionStorage.setItem('rrmJustCompletedReview',`${projectId}|${stage}|${Date.now()}`)}catch{}
  const count=await remainingOwnerActions();
  location.assign(count>0?'operations-review.html':'operations-review.html#overview');
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
    setDecisionButtonsDisabled(false);
    const notice=document.getElementById('asr-notice');
    if(notice){notice.textContent=error.message;notice.className='asr-notice show error';}
    return;
  }
  await finishOwnerAction();
}

async function completeFinalReturn(button){
  if(saving||button.disabled||stage!=='FINAL_PRODUCT_REVIEW')return;
  const target=button.dataset.returnStage;
  if(!['PRODUCT_WORKING','RESEARCH_WORKING'].includes(target)||!projectId)return;
  const comment=document.getElementById('asr-review-comment')?.value.trim()||'';
  if(!comment){
    const notice=document.getElementById('asr-notice');
    if(notice){notice.textContent='Add a note explaining what needs to change before returning the product to an earlier stage.';notice.className='asr-notice show error';}
    return;
  }
  saving=true;
  showSaving(button,target==='PRODUCT_WORKING'?'return to product design':'return to research');
  const {error}=await supabase.rpc('return_academy_final_product_for_work',{p_project_id:projectId,p_target_stage:target,p_comment:comment});
  if(error){
    saving=false;
    setDecisionButtonsDisabled(false);
    const notice=document.getElementById('asr-notice');
    if(notice){notice.textContent=error.message;notice.className='asr-notice show error';}
    return;
  }
  await finishOwnerAction();
}

function installFinalReturnButtons(){
  if(stage!=='FINAL_PRODUCT_REVIEW')return;
  const actions=document.querySelector('.asr-review-actions');
  if(!actions||actions.querySelector('[data-return-stage]'))return;
  const reject=actions.querySelector('[data-review="REJECT"]');
  const product=document.createElement('button');
  product.type='button';
  product.className='asr-more';
  product.dataset.returnStage='PRODUCT_WORKING';
  product.textContent='Return to Product Design';
  const research=document.createElement('button');
  research.type='button';
  research.className='asr-more';
  research.dataset.returnStage='RESEARCH_WORKING';
  research.textContent='Return to Research';
  if(reject){actions.insertBefore(product,reject);actions.insertBefore(research,reject)}
  else{actions.append(product,research)}
}

document.addEventListener('click',e=>{
  const returnButton=e.target.closest('[data-return-stage]');
  if(returnButton){
    e.preventDefault();
    e.stopImmediatePropagation();
    completeFinalReturn(returnButton);
    return;
  }
  const button=e.target.closest('[data-review]');
  if(!button)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  completeReview(button);
},true);

document.addEventListener('academy-stage-review-ready',installFinalReturnButtons);
new MutationObserver(installFinalReturnButtons).observe(document.body,{childList:true,subtree:true});
setTimeout(installFinalReturnButtons,250);
