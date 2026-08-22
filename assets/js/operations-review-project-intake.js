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
    if(isOpen){
      panel.style.display='none';
      btn.textContent='Start New Academy Project';
      return;
    }

    const projectsNav=document.querySelector('[data-orv3-view="projects"]');
    if(document.body.dataset.view==='overview'){
      if(projectsNav) projectsNav.click();
      else document.body.dataset.view='projects';
    }

    panel.style.display='block';
    btn.textContent='Hide New Project Form';
    requestAnimationFrame(()=>{
      panel.scrollIntoView({behavior:'smooth',block:'start'});
      setTimeout(()=>document.getElementById('idea')?.focus(),250);
    });
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
