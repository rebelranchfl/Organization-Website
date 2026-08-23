const navItems=[
  ['My Action Queue','operations-review.html'],
  ['All Projects','operations-review.html#projects'],
  ['New Idea','operations-review.html#new'],
  ['Academy','https://academy.rebelranchministries.org']
];

function addNavigation(){
  const top=document.querySelector('.topbar');
  if(!top||top.querySelector('[data-ops-owner-nav]'))return;
  const existing=top.querySelector('.back-link');
  const nav=document.createElement('nav');
  nav.dataset.opsOwnerNav='1';
  nav.style.cssText='display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end';
  for(const [label,href] of navItems){
    const a=document.createElement('a');
    a.className='back-link';
    a.href=href;
    a.textContent=label;
    nav.append(a);
  }
  if(existing){existing.remove();existing.textContent='My Account';nav.append(existing)}
  top.append(nav);
}

function applyRequestedView(){
  const host=document.getElementById('ops-action-inbox');
  if(!host||!host.children.length)return false;
  if(location.hash==='#projects'){
    const section=[...host.querySelectorAll('details.ops-secondary')].find(d=>/All Projects/i.test(d.querySelector('summary')?.textContent||''));
    if(section){section.open=true;section.scrollIntoView({block:'start'});}
  }else if(location.hash==='#new'){
    const section=[...host.querySelectorAll('details.ops-secondary')].find(d=>/Start a new Academy idea/i.test(d.querySelector('summary')?.textContent||''));
    if(section){section.open=true;section.scrollIntoView({block:'start'});}
  }else{
    document.querySelector('.ops-inbox-head,.ops-overview')?.scrollIntoView({block:'start'});
  }
  return true;
}

addNavigation();
let attempts=0;
const timer=setInterval(()=>{
  addNavigation();
  if(applyRequestedView()||++attempts>=20)clearInterval(timer);
},100);
window.addEventListener('hashchange',()=>location.reload());
