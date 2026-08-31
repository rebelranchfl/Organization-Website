import { supabase, SUPABASE_URL } from './supabase-client.js';

const $=id=>document.getElementById(id);
const esc=(v='')=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const paymentLabels={paypal:'PayPal',cashapp:'Cash App',zelle:'Zelle',cod:'Cash on delivery',other:'Other'};
const deliveryLabels={shipped:'Shipping',mailed:'Mail',pickup_customer:'Pickup',dropoff_seller:'Local delivery',local_meet:'Local meet'};
const fulfillmentMap={shipped:'shipping',mailed:'shipping',pickup_customer:'pickup',dropoff_seller:'delivery',local_meet:'meetup'};
const fulfillmentLabels={shipping:'Shipping',pickup:'Pickup',delivery:'Local delivery',meetup:'Local meet',seller_coordination:'Coordinate with creator'};
const publicUrl=path=>path?`${SUPABASE_URL}/storage/v1/object/public/creation-station-studio-public/${path}`:null;
const formatPrice=v=>{const t=(v||'').trim();return t&&/^\d+([.,]\d+)?$/.test(t)?`$${t}`:t};

const socialIcons={
  facebook:'<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7H7.9V12h2.6V9.8c0-2.6 1.5-4 3.9-4 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>',
  instagram:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
  tiktok:'<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.6 3c.4 2.2 1.9 3.9 4.1 4.2v2.9c-1.5 0-2.9-.5-4.1-1.3v6.4a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3a3 3 0 1 0 2.1 2.8V3h2.9z"/></svg>',
  youtube:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9.5l6 2.5-6 2.5z" fill="currentColor" stroke="none"/></svg>',
  x:'<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 4l7 8.5L4.4 20H7l5.4-5.9L16.5 20H20l-7.4-9L19.9 4h-2.6l-5 5.5L8 4z"/></svg>',
  link:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 14a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7L11 7"/><path d="M14 10a4 4 0 0 0-5.7 0L5.7 12.6a4 4 0 0 0 5.7 5.7L13 17"/></svg>'
};
function detectPlatform(url){
  const u=url.toLowerCase();
  if(u.includes('facebook.com')||u.includes('fb.com')||u.includes('fb.me'))return{key:'facebook',label:'Facebook',color:'#1877F2'};
  if(u.includes('instagram.com'))return{key:'instagram',label:'Instagram',color:'#E1306C'};
  if(u.includes('tiktok.com'))return{key:'tiktok',label:'TikTok',color:'#111111'};
  if(u.includes('youtube.com')||u.includes('youtu.be'))return{key:'youtube',label:'YouTube',color:'#FF0000'};
  if(u.includes('twitter.com')||u.includes('x.com'))return{key:'x',label:'X',color:'#111111'};
  return{key:'link',label:'Website',color:'#574b5d'};
}

function showNotFound(){$('loading').classList.add('hidden');$('not-found').classList.remove('hidden')}

let requestId=null,cart=[],studioDelivery=[];

function productCardHtml(p){
  const img=publicUrl(p.storage_path);
  return `<article class="product-card">${img?`<picture><img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy"></picture>`:''}<div class="product-card-content"><h4>${esc(p.title)}</h4>${p.description?`<p>${esc(p.description)}</p>`:''}${p.price_label?`<span class="product-price">${esc(formatPrice(p.price_label))}</span>`:''}<div class="product-cart-row"><input type="number" min="1" max="99" value="1" class="product-qty" data-qty-for="${esc(p.id)}" aria-label="Quantity for ${esc(p.title)}"><button class="btn preview" type="button" data-add-to-cart="${esc(p.id)}">Add to Order</button></div></div></article>`;
}

function renderFulfillment(){
  const values=[...new Set(studioDelivery.map(x=>fulfillmentMap[x]).filter(Boolean))];
  if(!values.length)values.push('seller_coordination');
  $('studio-fulfillment-options').innerHTML=values.map((value,i)=>`<label class="order-choice"><input type="radio" name="studio_fulfillment" value="${esc(value)}" ${i?'':'checked'}> ${esc(fulfillmentLabels[value]||value)}</label>`).join('');
  document.querySelectorAll('input[name="studio_fulfillment"]').forEach(input=>input.addEventListener('change',toggleDeliveryAddress));
  toggleDeliveryAddress();
}
function toggleDeliveryAddress(){
  const method=document.querySelector('input[name="studio_fulfillment"]:checked')?.value;
  $('studio-order-address-wrap').classList.toggle('hidden',method!=='delivery');
}

function renderCart(){
  const box=$('studio-cart-items'),checkout=$('studio-cart-checkout');
  if(!cart.length){
    box.innerHTML='<p class="studio-fine-print">Add something from the products above to get started.</p>';
    checkout.classList.add('hidden');
    $('studio-order-form').classList.add('hidden');
    $('studio-order-toggle').classList.remove('hidden');
    return;
  }
  box.innerHTML=`<ul class="cart-line-list">${cart.map(c=>`<li style="display:block"><div style="display:flex;justify-content:space-between;gap:.5rem"><span>${c.qty}&times; ${esc(c.title)}${c.price_label?` &mdash; ${esc(formatPrice(c.price_label))}`:''}</span><button type="button" data-remove-from-cart="${esc(c.id)}" aria-label="Remove ${esc(c.title)} from order">&times;</button></div><input class="studio-order-note" data-item-note="${esc(c.id)}" maxlength="500" value="${esc(c.note||'')}" placeholder="Item note — optional"></li>`).join('')}</ul>`;
  checkout.classList.remove('hidden');
  document.querySelectorAll('[data-remove-from-cart]').forEach(b=>{b.onclick=()=>{cart=cart.filter(c=>c.id!==b.dataset.removeFromCart);renderCart()}});
  document.querySelectorAll('[data-item-note]').forEach(input=>{input.oninput=()=>{const item=cart.find(c=>c.id===input.dataset.itemNote);if(item)item.note=input.value}});
}

function bindAddToCart(products){
  document.querySelectorAll('[data-add-to-cart]').forEach(b=>{
    b.onclick=()=>{
      const product=products.find(p=>p.id===b.dataset.addToCart);
      if(!product)return;
      const qtyInput=document.querySelector(`[data-qty-for="${b.dataset.addToCart}"]`);
      const qty=Math.max(1,Math.min(99,parseInt(qtyInput?.value,10)||1));
      const existing=cart.find(c=>c.id===product.id);
      if(existing)existing.qty=Math.min(99,existing.qty+qty);else cart.push({id:product.id,title:product.title,price_label:product.price_label,qty,note:''});
      renderCart();
      $('studio-contact').scrollIntoView({behavior:'smooth',block:'start'});
    };
  });
}

async function init(){
  const slug=new URLSearchParams(location.search).get('studio');
  if(!slug)return showNotFound();

  const {data:req,error}=await supabase.from('creator_website_requests')
    .select('id,brand_name,story,products,social_links,payment_methods,payment_other_note,payment_link,payment_handles,delivery_methods,public_slug')
    .eq('public_slug',slug)
    .maybeSingle();
  if(error||!req)return showNotFound();
  requestId=req.id;
  studioDelivery=req.delivery_methods||[];

  const {data:items}=await supabase.from('creator_studio_products')
    .select('id,title,description,price_label,storage_path,sort_order')
    .eq('website_request_id',req.id)
    .eq('is_active',true)
    .order('sort_order');
  const products=items||[];

  document.title=`${req.brand_name} | Creation Station Studio`;
  $('studio-title').textContent=req.brand_name;
  $('studio-copy').textContent=req.story||'A Creation Station Studio page.';
  $('studio-about-text').textContent=req.story||'This creator has not added a story yet.';

  const featured=products.slice(0,2).map(p=>{const img=publicUrl(p.storage_path);return img?`<picture><img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy"></picture>`:''}).filter(Boolean).join('');
  $('studio-featured').innerHTML=featured;
  $('studio-products').innerHTML=products.length?products.map(productCardHtml).join(''):'<p>No products listed yet — check back soon.</p>';
  bindAddToCart(products);
  renderCart();
  renderFulfillment();

  const payMethods=(req.payment_methods||[]).map(m=>{
    if(m==='other'&&req.payment_other_note)return `Other (${esc(req.payment_other_note)})`;
    const handle=req.payment_handles?.[m];
    return handle?`${esc(paymentLabels[m]||m)}: ${esc(handle)}`:esc(paymentLabels[m]||m);
  });
  $('studio-payment').innerHTML=payMethods.length?payMethods.map(m=>`<p>${m}</p>`).join(''):'<p>The creator will provide payment instructions after confirming the order.</p>';

  const delivery=studioDelivery.map(m=>esc(deliveryLabels[m]||m));
  $('studio-delivery').innerHTML=`<p>${delivery.length?delivery.join(', '):'Coordinate directly with the creator.'}</p>`;

  const links=req.social_links?.links||[];
  $('studio-social-card').classList.toggle('hidden',!links.length);
  $('studio-links').innerHTML=links.length?`<div class="social-icon-row">${links.map(l=>{const p=detectPlatform(l);return `<a class="social-icon-link" href="${esc(l)}" target="_blank" rel="noopener" aria-label="${esc(p.label)}" style="--social-color:${p.color}">${socialIcons[p.key]}</a>`}).join('')}</div>`:'';

  $('loading').classList.add('hidden');
  $('studio-showcase').classList.remove('hidden');
}

$('studio-order-toggle').addEventListener('click',()=>{
  $('studio-order-toggle').classList.add('hidden');
  $('studio-order-form').classList.remove('hidden');
  $('studio-order-form').scrollIntoView({behavior:'smooth',block:'center'});
});

$('studio-order-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const senderName=$('studio-order-name').value.trim();
  const senderContact=$('studio-order-contact').value.trim();
  const fulfillment=document.querySelector('input[name="studio_fulfillment"]:checked')?.value||'seller_coordination';
  if(!senderName||!senderContact||!cart.length)return;
  const submitBtn=e.submitter;
  if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='Sending order…'}
  $('studio-order-error').classList.add('hidden');
  $('studio-order-confirm').classList.add('hidden');
  try{
    const payload={
      website_request_id:requestId,
      buyer_name:senderName,
      buyer_contact:senderContact,
      items:cart.map(c=>({product_id:c.id,quantity:c.qty,note:c.note||''})),
      fulfillment_method:fulfillment,
      preferred_date:$('studio-order-date').value.trim(),
      delivery_address:$('studio-order-address').value.trim(),
      buyer_note:$('studio-order-message').value.trim()
    };
    const {data:result,error}=await supabase.functions.invoke('submit-creation-studio-order',{body:payload});
    if(error){
      let detail='';
      try{detail=(await error.context?.json())?.error||''}catch{}
      throw new Error(detail||'The order could not be sent. Please try again.');
    }
    cart=[];
    $('studio-order-form').reset();
    renderFulfillment();
    renderCart();
    $('studio-order-confirm').textContent=`Order #${result.order_number} was sent. The creator or parent will contact you to confirm the total, fulfillment, and payment.`;
    $('studio-order-confirm').classList.remove('hidden');
    $('studio-order-confirm').scrollIntoView({behavior:'smooth',block:'center'});
  }catch(error){
    $('studio-order-error').textContent=error.message||'The order could not be sent.';
    $('studio-order-error').classList.remove('hidden');
  }finally{
    if(submitBtn){submitBtn.disabled=false;submitBtn.textContent='Send Order'}
  }
});

init().catch(showNotFound);
