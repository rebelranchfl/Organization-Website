const links=[
  ['Overview','operations-review.html#overview'],
  ['My Action Queue','operations-review.html'],
  ['All Projects','operations-review.html#projects']
];

function mount(){
  const top=document.querySelector('.asr-top-actions');
  if(!top||top.querySelector('[data-owner-nav]'))return;
  top.querySelectorAll('a').forEach(a=>a.remove());
  for(const [label,href] of links){
    const a=document.createElement('a');
    a.className='asr-button';
    a.href=href;
    a.dataset.ownerNav='1';
    a.textContent=label;
    top.append(a);
  }
  const account=document.createElement('a');
  account.className='asr-button';
  account.href='account.html';
  account.dataset.ownerNav='1';
  account.textContent='My Account';
  top.append(account);
}

mount();
