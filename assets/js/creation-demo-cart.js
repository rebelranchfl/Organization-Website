(function(){
  const countEl=document.querySelector('[data-demo-cart-count]');
  const totalEl=document.querySelector('[data-demo-cart-total]');
  const msgEl=document.querySelector('[data-demo-cart-message]');
  const addButtons=document.querySelectorAll('[data-demo-add]');
  const resetButton=document.querySelector('[data-demo-cart-reset]');
  if(!countEl||!totalEl||!addButtons.length)return;

  let count=0,total=0;

  function update(){
    countEl.textContent=count;
    totalEl.textContent=`$${total.toFixed(2)}`;
    if(msgEl)msgEl.textContent=count?`${count} item${count===1?'':'s'} added — this is what a real Studio cart feels like.`:'Add a creation to see how the sample cart responds.';
  }

  addButtons.forEach(btn=>{
    btn.addEventListener('click',()=>{
      count+=1;
      total+=parseFloat(btn.dataset.price||'0');
      update();
    });
  });

  if(resetButton)resetButton.addEventListener('click',()=>{
    count=0;
    total=0;
    update();
  });
})();
