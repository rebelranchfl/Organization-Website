// Creation Station order privacy boundary.
// Kid Mode shares the adult Supabase session, so buyer PII must be excluded client-side as well as hidden in navigation.
const kidModeActive=()=>Object.keys(localStorage).some(key=>key.startsWith('rrm-kid-mode-')&&Boolean(localStorage.getItem(key)));
const kidModeAtLoad=kidModeActive();

// Prevent the existing dashboard workspace loader from receiving Studio order rows while Kid Mode is active.
if(kidModeAtLoad){
  const nativeFetch=window.fetch.bind(window);
  window.fetch=(input,init)=>{
    const url=typeof input==='string'?input:input?.url||'';
    if(url.includes('/rest/v1/studio_order_requests')){
      return Promise.resolve(new Response('[]',{status:200,headers:{'Content-Type':'application/json'}}));
    }
    return nativeFetch(input,init);
  };
}

function syncOrderPrivacy(){
  const link=document.getElementById('studio-orders-link');
  const active=kidModeActive();
  if(link){
    link.classList.toggle('hidden',active);
    link.setAttribute('aria-hidden',String(active));
  }
  // Entering or exiting Kid Mode changes the data boundary. Reload once so the workspace is refetched under the correct boundary.
  if(active!==kidModeAtLoad)location.reload();
}

document.addEventListener('DOMContentLoaded',()=>{
  const link=document.getElementById('studio-orders-link');
  if(link)link.addEventListener('click',event=>{if(kidModeActive()){event.preventDefault();syncOrderPrivacy()}});
  const toggle=document.getElementById('kid-mode-toggle');
  if(toggle)new MutationObserver(syncOrderPrivacy).observe(toggle,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
  syncOrderPrivacy();
});
