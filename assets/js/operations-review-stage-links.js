const LABEL_TO_STAGE={
  'Research Working':'RESEARCH_WORKING',
  'Research':'RESEARCH_WORKING',
  'Research Review':'RESEARCH_REVIEW',
  'Product Opportunity':'PRODUCT_OPPORTUNITY_RESEARCH',
  'Product Design':'PRODUCT_WORKING',
  'Product Review':'PRODUCT_REVIEW',
  'Visual Production':'VISUAL_PRODUCTION',
  'Final Product Review':'FINAL_PRODUCT_REVIEW',
  'Awaiting Release':'AWAITING_RELEASE',
  'Release Prep':'AWAITING_RELEASE',
  'Publishing':'PUBLISHING',
  'Live':'LIVE',
  'Idea + Context':'IDEA'
};

function selectedProjectId(){
  const active=document.querySelector('.queue-item.active .queue-meta')?.textContent||'';
  return (active.match(/RRA-\d{4}-\d{4}/)||[])[0]||'';
}
function url(project,stage){return `academy-stage-review.html?project=${encodeURIComponent(project)}&stage=${encodeURIComponent(stage)}`;}
function decorate(){
  const project=selectedProjectId();
  if(!project)return;
  document.querySelectorAll('.life-step').forEach(card=>{
    const label=card.querySelector('span')?.textContent?.trim();
    const stage=LABEL_TO_STAGE[label];
    if(!stage)return;
    card.dataset.stageReview=stage;
    card.tabIndex=0;
    card.setAttribute('role','link');
    card.setAttribute('aria-label',`Open ${label} stage review`);
    card.style.cursor='pointer';
  });
  document.querySelectorAll('.lsw-stage[data-stage]').forEach(card=>{
    card.dataset.stageReview=card.dataset.stage;
    card.setAttribute('aria-label',`Open ${card.querySelector('.name')?.textContent||'stage'} review page`);
  });
}
function go(target){
  const project=selectedProjectId();
  const stage=target?.dataset?.stageReview;
  if(project&&stage)location.href=url(project,stage);
}
document.addEventListener('click',e=>{const target=e.target.closest('[data-stage-review]');if(!target)return;e.preventDefault();e.stopImmediatePropagation();go(target);},true);
document.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key))return;const target=e.target.closest('[data-stage-review]');if(!target)return;e.preventDefault();go(target);});
const observer=new MutationObserver(()=>queueMicrotask(decorate));observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
queueMicrotask(decorate);
