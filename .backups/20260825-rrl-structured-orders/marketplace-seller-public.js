import {supabase} from './supabase-client.js';

const $=id=>document.getElementById(id);
const esc=(v='')=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const main=$('main-content');

const PATH_LABELS={food_farm:'Food & Farm',goods_services_handmade:'Goods, Services & Handmade',both:'Marketplace'};
const PAYMENT_LABELS={paypal:'PayPal',venmo:'Venmo',cashapp:'Cash App',zelle:'Zelle',stripe:'Stripe',apple_pay:'Apple Pay',cash:'Cash',check:'Check',other:'Other'};

function showMessage(title,copy){
  main.innerHTML=`<section class="state-message"><h1>${esc(title)}</h1><p>${esc(copy)}</p><p><a href="marketplace.html" class="button primary">Back to Rebel Ranch Local</a></p></section>`;
}

function initials(name){
  return (name||'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'?';
}

function publicUrl(path){
  return supabase.storage.from('marketplace-seller-public').getPublicUrl(path).data.publicUrl;
}

function formatPriceLabel(v){
  const trimmed=String(v).trim();
  if(!trimmed)return trimmed;
  return /^\d/.test(trimmed)&&!trimmed.startsWith('$')?`$${trimmed}`:trimmed;
}

function renderListings(listings){
  if(!listings.length)return `<section class="storefront-section"><div class="section-head"><h2>Products & Services</h2></div><div class="panel"><p>This seller has not added individual offerings yet. Message them directly to ask what is currently available.</p></div></section>`;
  return `<section class="storefront-section">
    <div class="section-head"><h2>Products & Services</h2><p>${listings.length} local offering${listings.length===1?'':'s'}</p></div>
    <div class="listing-grid">${listings.map(item=>{const images=item.seller_listing_images||[];return `
      <article class="listing-card">
        ${images[0]?`<div class="listing-photo"><img src="${esc(publicUrl(images[0].object_path))}" alt="${esc(item.title)}"></div>`:'<div class="listing-photo listing-photo-empty">Photo coming soon</div>'}
        <div class="listing-body"><span class="listing-type">${esc((item.listing_type||'offering').replaceAll('_',' '))}</span><h3>${esc(item.title)}</h3>${item.description?`<p>${esc(item.description)}</p>`:''}<p class="listing-price">${esc(item.price_label?formatPriceLabel(item.price_label):'Contact for pricing')}</p><button class="listing-inquire" type="button" data-inquiry-interest="${encodeURIComponent(item.title)}">Ask About This</button></div>
        ${images.length>1?`<div class="listing-thumbs">${images.slice(1,4).map(img=>`<img src="${esc(publicUrl(img.object_path))}" alt="Additional view of ${esc(item.title)}">`).join('')}</div>`:''}
      </article>`}).join('')}</div>
  </section>`;
}

function renderPaymentMethods(methods){
  if(!methods.length)return '<p class="eyebrow">Contact this seller to ask about payment options.</p>';
  return `<div class="pay-methods">${methods.map(m=>{
    const label=PAYMENT_LABELS[m.method_type]||m.method_type;
    if(m.link_url)return `<a class="pay-method" href="${esc(m.link_url)}" target="_blank" rel="noopener"><span class="dot"></span> ${esc(label)}${m.label?` — ${esc(m.label)}`:''}</a>`;
    return `<div class="pay-method"><span class="dot"></span> ${esc(label)}${m.label?` — ${esc(m.label)}`:''}</div>`;
  }).join('')}</div>`;
}

function bindInquiryForm(sellerProfileId){
  const form=$('inquiry-form');
  if(!form)return;
  const confirmEl=$('inquiry-confirm');
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const button=form.querySelector('button');
    const senderName=$('inquiry-name').value.trim();
    const message=$('inquiry-message').value.trim();
    const senderContact=$('inquiry-contact').value.trim();
    if(!senderName||!message)return;
    button.disabled=true;button.textContent='Sending…';
    const {error}=await supabase.from('seller_inquiries').insert({
      seller_profile_id:sellerProfileId,
      sender_name:senderName,
      sender_contact:senderContact||null,
      message
    });
    button.disabled=false;button.textContent='Send message';
    if(error){
      confirmEl.textContent=error.message||'That message could not be sent — try again.';
      confirmEl.classList.remove('hidden');
      return;
    }
    form.reset();
    form.classList.add('hidden');
    confirmEl.textContent='Message sent — the seller will follow up using the contact info you provided.';
    confirmEl.classList.remove('hidden');
  });
}

function render(sp,categories,paymentMethods,region,listings,isOwner){
  const primary=categories.find(c=>c.is_primary)||categories[0];
  const pathLabel=PATH_LABELS[sp.marketplace_path]||'Marketplace';
  const firstListingImage=listings.flatMap(item=>item.seller_listing_images||[])[0];
  const heroImage=firstListingImage?publicUrl(firstListingImage.object_path):'';
  document.title=`${sp.business_name} | Rebel Ranch Local`;

  main.innerHTML=`
    ${isOwner?'<p class="owner-bar"><a href="marketplace-seller-dashboard.html">← Back to my seller dashboard</a></p>':''}
    <p class="crumb"><a href="marketplace.html">Rebel Ranch Local</a><span>/</span>${primary?`${esc(primary.marketplace_categories?.name||pathLabel)}<span>/</span>`:''}${esc(sp.business_name)}</p>
    <section class="seller-hero${heroImage?' has-image':''}"${heroImage?` style="--seller-hero-image:url('${esc(heroImage)}')"`:''}>
      <div class="seller-identity">
        <div class="seller-mark">${sp.logo_object_path?`<img src="${esc(publicUrl(sp.logo_object_path))}" alt="${esc(sp.business_name)} logo">`:esc(initials(sp.business_name))}</div>
        <div><p class="eyebrow">${esc(pathLabel)}${primary?` · ${esc(primary.marketplace_categories?.name||'')}`:''}</p><h1>${esc(sp.business_name)}</h1>${sp.short_description?`<p class="tagline">${esc(sp.short_description)}</p>`:''}<div class="meta-row">
            <span class="verified"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/></svg> Local & Independent</span>
            ${categories.map(c=>`<span class="tag">${esc(c.marketplace_categories?.name||'')}</span>`).join('')}
            ${region?`<span class="tag">${esc(region.region_name)}${region.state_code?`, ${esc(region.state_code)}`:''}</span>`:''}
          </div><button class="hero-message" type="button" data-show-inquiry>Message This Seller</button>
        </div>
      </div>
    </section>
    <p class="trust-banner">Shop directly with real local sellers. Rebel Ranch Local charges buyers and approved sellers no marketplace fees, and payment goes directly to the seller.</p>
    ${renderListings(listings)}
    <section class="panel about-panel"><h2>About ${esc(sp.business_name)}</h2>${sp.long_description?`<p>${esc(sp.long_description)}</p>`:'<p>This seller has not added their full story yet. Message them directly to learn more.</p>'}</section>

    <div class="contact-layout">
      <div class="stack">
        <section class="panel order-panel">
          <h2>How to order</h2>
          <p>Message ${esc(sp.business_name)} directly to ask about availability, pricing, ordering, or scheduling.</p>
          <button class="button primary" id="show-inquiry-form" type="button" data-show-inquiry>Message This Seller</button>
          <form id="inquiry-form" class="inquiry-form hidden">
            <label>Your name<input id="inquiry-name" required></label>
            <label>Phone or email<input id="inquiry-contact" placeholder="So the seller can reply"></label>
            <label>Message<textarea id="inquiry-message" required placeholder="What are you interested in?"></textarea></label>
            <button class="button primary" type="submit">Send message</button>
          </form>
          <p id="inquiry-confirm" class="inquiry-confirm hidden" role="status"></p>
          ${renderPaymentMethods(paymentMethods)}
          <p class="fine-print">Payment and fulfillment happen directly with ${esc(sp.business_name)}. Rebel Ranch Local connects buyers and sellers but does not process the transaction.</p>
        </section>
      </div><div class="stack">
        <section class="panel trust-panel">
          <h2>Why support this seller?</h2>
          <ul class="list-plain">${(sp.why_shop_points?.length?sp.why_shop_points:['A real local independent business.','Your support stays in the local community.','Connect directly with the person providing the goods or service.']).map(point=>`<li>${esc(point)}</li>`).join('')}</ul>
        </section>
      </div>
    </div>`;

  function openInquiry(subject=''){$('show-inquiry-form')?.classList.add('hidden');$('inquiry-form').classList.remove('hidden');if(subject)$('inquiry-message').value=`I'm interested in ${subject}.`;$('inquiry-form').scrollIntoView({behavior:'smooth',block:'center'})}
  document.querySelectorAll('[data-show-inquiry]').forEach(button=>button.addEventListener('click',()=>openInquiry()));
  document.querySelectorAll('[data-inquiry-interest]').forEach(button=>button.addEventListener('click',()=>openInquiry(decodeURIComponent(button.dataset.inquiryInterest))));
  bindInquiryForm(sp.id);
}

async function init(){
  const slug=new URLSearchParams(location.search).get('seller');
  if(!slug)return showMessage('No seller specified','Use a seller link from Rebel Ranch Local to view a storefront.');

  const {data:sp,error}=await supabase.from('seller_profiles')
    .select('id,business_name,public_slug,marketplace_path,short_description,long_description,page_theme,logo_object_path,why_shop_points,region_id')
    .eq('public_slug',slug)
    .maybeSingle();

  if(error)return showMessage('Something went wrong',error.message||'Try again in a moment.');
  if(!sp)return showMessage('Seller not found','This seller is not currently available through Rebel Ranch Local.');

  const {data:{session}}=await supabase.auth.getSession();
  const [categoriesR,paymentR,regionR,listingsR,ownerR]=await Promise.all([
    supabase.from('seller_category_assignments').select('is_primary,marketplace_categories(name,slug)').eq('seller_profile_id',sp.id),
    supabase.from('seller_payment_methods').select('method_type,label,link_url').eq('seller_profile_id',sp.id).order('sort_order'),
    sp.region_id?supabase.from('marketplace_regions').select('region_name,state_code').eq('id',sp.region_id).maybeSingle():Promise.resolve({data:null}),
    supabase.from('seller_listings').select('id,listing_type,title,description,price_label,sort_order,seller_listing_images(id,object_path,sort_order)').eq('seller_profile_id',sp.id).order('sort_order'),
    session?supabase.from('seller_profiles').select('id').eq('id',sp.id).eq('owner_user_id',session.user.id).maybeSingle():Promise.resolve({data:null})
  ]);

  render(sp,categoriesR.data||[],paymentR.data||[],regionR.data,listingsR.data||[],!!ownerR.data);
}

init();
