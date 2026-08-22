/* Operations Review project intake access
   AI-Agent: ChatGPT/GPT-5.6 Sol
   Session: RR Website — Academy lifecycle stage workspace */
function mountProjectIntake(){
  const form=document.getElementById('idea-form');
  const panel=form?.closest('.panel');
  if(!form||!panel||document.getElementById('orv-start-project'))return;

  const topActions=document.querySelector('.orv3-top-actions')||document.querySelector('.topbar');
  if(!topActions)return;

  const btn=document.createElement('button');
  btn.type='button';
  btn.id='orv-start-project';
  btn.className='button primary';
  btn.textContent='Start New Academy Project';
  btn.addEventListener('click',()=>{
    const isOpen=panel.style.display==='block';
    panel.style.display=isOpen?'none':'block';
    btn.textContent=isOpen?'Start New Academy Project':'Hide New Project Form';
    if(!isOpen){
      panel.scrollIntoView({behavior:'smooth',block:'start'});
      setTimeout(()=>document.getElementById('idea')?.focus(),250);
    }
  });
  topActions.prepend(btn);

  panel.style.display='none';
  panel.dataset.lifecycleIntake='true';

  form.addEventListener('submit',()=>{
    setTimeout(()=>{
      panel.style.display='none';
      btn.textContent='Start New Academy Project';
    },900);
  });
}

const observer=new MutationObserver(()=>mountProjectIntake());
observer.observe(document.body,{childList:true,subtree:true});
mountProjectIntake();
