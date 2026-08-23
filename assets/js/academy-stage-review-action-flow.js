// Focused owner-review flow: after a stage decision is successfully saved,
// return to the lightweight Operations Review action inbox.
const notice=document.getElementById('asr-notice');
let ownerDecisionPending=false;

function addBackLink(){
  const top=document.querySelector('.asr-topbar,.asr-head,.asr-page-head')||document.querySelector('main');
  if(!top||document.getElementById('asr-action-queue-back'))return;
  const a=document.createElement('a');
  a.id='asr-action-queue-back';
  a.href='operations-review.html';
  a.textContent='← My Action Queue';
  a.style.cssText='display:inline-block;margin:8px 0 12px;color:#9bc9ff;font-weight:900;text-decoration:none';
  top.insertAdjacentElement('afterbegin',a);
}

document.addEventListener('click',e=>{
  if(e.target.closest('[data-review]')) ownerDecisionPending=true;
},true);

if(notice){
  const observer=new MutationObserver(()=>{
    if(!ownerDecisionPending)return;
    const text=(notice.textContent||'').trim();
    if(/\bsaved\b/i.test(text)&&!/could not|error|failed/i.test(text)){
      ownerDecisionPending=false;
      observer.disconnect();
      setTimeout(()=>location.assign('operations-review.html'),450);
    }
  });
  observer.observe(notice,{childList:true,characterData:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addBackLink,{once:true});
else addBackLink();
