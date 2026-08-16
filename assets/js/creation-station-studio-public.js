import { supabase, SUPABASE_URL } from './supabase-client.js';

const $=id=>document.getElementById(id);
const esc=(v='')=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const paymentLabels={paypal:'PayPal',cashapp:'Cash App',zelle:'Zelle',cod:'Cash on delivery',other:'Other'};
const deliveryLabels={shipped:'Shipped',mailed:'Mailed',pickup_customer:'Pickup by customer',dropoff_seller:'Drop off by seller',local_meet:'Local meet'};
const publicUrl=path=>path?`${SUPABASE_URL}/storage/v1/object/public/creation-station-studio-public/${path}`:null;

function showNotFound(){$('loading').classList.add('hidden');$('not-found').classList.remove('hidden')}

let requestId=null,cart=[];

function productCardHtml(p){
  const img=publicUrl(p.storage_path);
  return `<article class="product-card">${img?`<picture><img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy"></picture>`:''}<div class="product-card-content"><h4>${esc(p.title)}</h4>${p.description?`<p>${esc(p.description)}</p>`:''}${p.price_label?`<span class="product-price">${esc(p.price_label)}</span>`:''}<div class="product-cart-row"><input type="number" min="1" value="1" class="product-qty" data-qty-for="${esc(p.id)}" aria-label="Quantity for ${esc(p.title)}"><button class="btn preview" type="button" data-add-to-cart="${esc(p.id)}">Add to Cart</button></div></div></article>`;
}

function cartSummaryText(){
  return cart.map(c=>`${c.qty}x ${c.title}${c.price_label?` (${c.price_label})`:''}`).join(', ');
}

function renderCart(){
  const box=$('studio-cart-items'),checkout=$('studio-cart-checkout');
  if(!cart.length){
    box.innerHTML='<p class="studio-fine-print">Add something from the products above to get started.</p>';
    checkout.classList.add('hidden');
    return;
  }
  box.innerHTML=`<ul class="cart-line-list">${cart.map(c=>`<li><span>${c.qty}&times; ${esc(c.title)}${c.price_label?` &mdash; ${esc(c.price_label)}`:''}</span><button type="button" data-remove-from-cart="${esc(c.id)}" aria-label="Remove ${esc(c.title)} from cart">&times;</button></li>`).join('')}</ul>`;
  checkout.classList.remove('hidden');
  document.querySelectorAll('[data-remove-from-cart]').forEach(b=>{
    b.onclick=()=>{cart=cart.filter(c=>c.id!==b.dataset.removeFromCart);renderCart()};
  });
}

function bindAddToCart(products){
  document.querySelectorAll('[data-add-to-cart]').forEach(b=>{
    b.onclick=()=>{
      const product=products.find(p=>p.id===b.dataset.addToCart);
      if(!product)return;
      const qtyInput=document.querySelector(`[data-qty-for="${b.dataset.addToCart}"]`);
      const qty=Math.max(1,parseInt(qtyInput?.value,10)||1);
      const existing=cart.find(c=>c.id===product.id);
      if(existing)existing.qty+=qty;else cart.push({id:product.id,title:product.title,price_label:product.price_label,qty});
      renderCart();
    };
  });
}

async function init(){
  const slug=new URLSearchParams(location.search).get('studio');
  if(!slug)return showNotFound();

  const {data:req,error}=await supabase.from('creator_website_requests')
    .select('id,brand_name,story,products,social_links,payment_methods,payment_other_note,payment_link,delivery_methods,public_slug')
    .eq('public_slug',slug)
    .maybeSingle();
  if(error||!req)return showNotFound();
  requestId=req.id;

  const {data:items}=await supabase.from('creator_studio_products')
    .select('id,title,description,price_label,storage_path,sort_order')
    .eq('website_request_id',req.id)
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

  $('studio-payment-link').innerHTML=req.payment_link?`<a class="btn primary" href="${esc(req.payment_link)}" target="_blank" rel="noopener">Pay via PayPal</a>`:'';

  const payMethods=(req.payment_methods||[]).map(m=>m==='other'&&req.payment_other_note?`Other (${esc(req.payment_other_note)})`:esc(paymentLabels[m]||m));
  $('studio-payment').innerHTML=`<p><strong>Payment:</strong> ${payMethods.length?payMethods.join(', '):'Contact for payment options.'}</p>`;

  const delivery=(req.delivery_methods||[]).map(m=>esc(deliveryLabels[m]||m));
  $('studio-delivery').innerHTML=`<p><strong>Delivery:</strong> ${delivery.length?delivery.join(', '):'Contact for delivery options.'}</p>`;

  const links=req.social_links?.links||[];
  $('studio-links').innerHTML=links.length?`<p><strong>Find them online:</strong></p><ul>${links.map(l=>`<li><a href="${esc(l)}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join('')}</ul>`:'';

  $('loading').classList.add('hidden');
  $('studio-showcase').classList.remove('hidden');
}

$('studio-order-toggle').addEventListener('click',()=>{
  $('studio-order-toggle').classList.add('hidden');
  $('studio-order-form').classList.remove('hidden');
});

$('studio-order-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const senderName=$('studio-order-name').value.trim();
  const senderContact=$('studio-order-contact').value.trim();
  const message=$('studio-order-message').value.trim();
  if(!senderName||!cart.length)return;
  const submitBtn=e.submitter;
  if(submitBtn)submitBtn.disabled=true;
  const {error}=await supabase.from('studio_order_requests').insert({
    website_request_id:requestId,
    sender_name:senderName,
    sender_contact:senderContact||null,
    cart_summary:cartSummaryText(),
    message:message||null
  });
  if(submitBtn)submitBtn.disabled=false;
  if(error){
    $('studio-order-confirm').textContent='Something went wrong sending that — please try again.';
    $('studio-order-confirm').classList.remove('hidden');
    return;
  }
  $('studio-order-form').reset();
  $('studio-order-form').classList.add('hidden');
  $('studio-order-toggle').classList.remove('hidden');
  cart=[];
  renderCart();
  $('studio-order-confirm').textContent='Order request sent! The creator will follow up with you directly.';
  $('studio-order-confirm').classList.remove('hidden');
});

init().catch(showNotFound);
