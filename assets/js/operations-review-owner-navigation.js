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

addNavigation();
document.addEventListener('operations-review-ready',addNavigation);
