/* Operations Review → dedicated Academy stage review navigation
   Lightweight/event-driven: no whole-page MutationObserver. */
const MAP={
  'Idea + Context':'IDEA','Research Working':'RESEARCH_WORKING','Research':'RESEARCH_WORKING',
  'Research Review':'RESEARCH_REVIEW','Product Opportunity':'PRODUCT_OPPORTUNITY_RESEARCH',
  'Product Design':'PRODUCT_WORKING','Product Review':'PRODUCT_REVIEW','Visual Production':'VISUAL_PRODUCTION',
  'Final Product Review':'FINAL_PRODUCT_REVIEW','Awaiting Release':'AWAITING_RELEASE','Release Prep':'AWAITING_RELEASE',
  'Publishing':'PUBLISHING','Live':'LIVE'
};
const WORKFLOW_TO_STAGE={
  IDEA:'IDEA',RESEARCH_WORKING:'RESEARCH_WORKING',RESEARCH_REVIEW:'RESEARCH_REVIEW',
  PRODUCT_OPPORTUNITY_RESEARCH:'PRODUCT_OPPORTUNITY_RESEARCH',PRODUCT_WORKING:'PRODUCT_WORKING',PRODUCT_REVIEW:'PRODUCT_REVIEW',
  VISUAL_PRODUCTION:'VISUAL_PRODUCTION',FINAL_PRODUCT_REVIEW:'FINAL_PRODUCT_REVIEW',AWAITING_RELEASE:'AWAITING_RELEASE',PUBLISHING:'PUBLISHING',LIVE:'LIVE'
};
function project(){
  const candidates=[
    document.querySelector('.queue-item.active .queue-meta')?.textContent,
    document.querySelector('#lifecycle-stage-workspace .lsw-kicker')?.textContent,
    document.querySelector('#detail')?.textContent
  ].filter(Boolean).join(' ');
  return (candidates.match(/RRA-\d{4}-\d{4}/)||[])[0]||'';
}
function currentStage(){
  const current=document.querySelector('.life-step.current span')?.textContent?.trim();
  if(current&&MAP[current])return MAP[current];
  const lsw=document.querySelector('.lsw-stage.current[data-stage]')?.dataset.stage;
  if(lsw)return lsw;
  const status=(document.querySelector('.queue-item.active .status')?.textContent||'').trim();
  if(MAP[status])return MAP[status];
  const normalized=status.toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
  return WORKFLOW_TO_STAGE[normalized]||'';
}
function stageUrl(stage){const p=project();return p&&stage?`academy-stage-review.html?project=${encodeURIComponent(p)}&stage=${encodeURIComponent(stage)}`:''}
function go(stage){const url=stageUrl(stage);if(url)window.location.assign(url)}
function addShortcut(){
  const p=project(),stage=currentStage();
  if(!p||!stage)return;
  const anchor=document.querySelector('.lifecycle-card')||document.querySelector('#lifecycle-stage-workspace .lsw-hero');
  if(!anchor)return;
  let box=document.getElementById('open-current-stage-review-box');
  if(!box){
    box=document.createElement('div');box.id='open-current-stage-review-box';
    box.style.cssText='display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin:12px 0;padding:14px;border:2px solid #e0a449;border-radius:9px;background:#251f11';
    box.innerHTML='<div><strong style="display:block;color:#f2d38b">Focused Stage Review</strong><span style="color:#c8d2c9;font-size:.84rem">Open the current phase on its own page for detailed review and testing.</span></div><button type="button" class="button primary" id="open-current-stage-review">Open Current Stage Review →</button>';
    anchor.insertAdjacentElement('afterend',box);
  }
  const button=box.querySelector('#open-current-stage-review');
  button.onclick=()=>go(stage);
}
function decorate(){
  if(!project())return;
  document.querySelectorAll('.life-step').forEach(x=>{
    const stage=MAP[x.querySelector('span')?.textContent?.trim()];if(!stage)return;
    x.dataset.stageReview=stage;x.tabIndex=0;x.setAttribute('role','link');x.setAttribute('aria-label',`Open ${x.querySelector('span')?.textContent?.trim()} stage review`);x.style.cursor='pointer';
  });
  addShortcut();
}
function scheduleDecorate(){
  queueMicrotask(decorate);
  setTimeout(decorate,80);
  setTimeout(decorate,220);
}
document.addEventListener('click',e=>{
  const stageTarget=e.target.closest('[data-stage-review]');
  if(stageTarget){e.preventDefault();e.stopImmediatePropagation();go(stageTarget.dataset.stageReview);return;}
  if(e.target.closest('.queue-item'))scheduleDecorate();
},true);
document.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key))return;const x=e.target.closest('[data-stage-review]');if(x){e.preventDefault();go(x.dataset.stageReview)}},true);
window.addEventListener('popstate',scheduleDecorate);
setTimeout(scheduleDecorate,250);
