import { supabase, SUPABASE_URL } from './supabase-client.js';

const $=id=>document.getElementById(id);
const esc=(v='')=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const paymentLabels={paypal:'PayPal',cashapp:'Cash App',zelle:'Zelle',cod:'Cash on delivery',other:'Other'};
const deliveryLabels={shipped:'Shipped',mailed:'Mailed',pickup_customer:'Pickup by customer',dropoff_seller:'Drop off by seller',local_meet:'Local meet'};
const publicUrl=path=>path?`${SUPABASE_URL}/storage/v1/object/public/creation-station-studio-public/${path}`:null;

function showNotFound(){$('loading').classList.add('hidden');$('not-found').classList.remove('hidden')}

function productCardHtml(p){
  const img=publicUrl(p.storage_path);
  return `<article class="product-card">${img?`<picture><img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy"></picture>`:''}<div class="product-card-content"><h4>${esc(p.title)}</h4>${p.description?`<p>${esc(p.description)}</p>`:''}${p.price_label?`<span class="product-price">${esc(p.price_label)}</span>`:''}</div></article>`;
}

async function init(){
  const slug=new URLSearchParams(location.search).get('studio');
  if(!slug)return showNotFound();

  const {data:req,error}=await supabase.from('creator_website_requests')
    .select('id,brand_name,story,products,social_links,payment_methods,payment_other_note,delivery_methods,public_slug')
    .eq('public_slug',slug)
    .maybeSingle();
  if(error||!req)return showNotFound();

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

  const payMethods=(req.payment_methods||[]).map(m=>m==='other'&&req.payment_other_note?`Other (${esc(req.payment_other_note)})`:esc(paymentLabels[m]||m));
  $('studio-payment').innerHTML=`<p><strong>Payment:</strong> ${payMethods.length?payMethods.join(', '):'Contact for payment options.'}</p>`;

  const delivery=(req.delivery_methods||[]).map(m=>esc(deliveryLabels[m]||m));
  $('studio-delivery').innerHTML=`<p><strong>Delivery:</strong> ${delivery.length?delivery.join(', '):'Contact for delivery options.'}</p>`;

  const links=req.social_links?.links||[];
  $('studio-links').innerHTML=links.length?`<p><strong>Find them online:</strong></p><ul>${links.map(l=>`<li><a href="${esc(l)}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join('')}</ul>`:'';

  $('loading').classList.add('hidden');
  $('studio-showcase').classList.remove('hidden');
}

init().catch(showNotFound);
