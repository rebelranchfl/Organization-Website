import {supabase} from './supabase-client.js';

const $=id=>document.getElementById(id);
const esc=(v='')=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const main=$('main-content');

const PATH_LABELS={food_farm:'Food & Farm',goods_services_handmade:'Goods, Services & Handmade',both:'Marketplace'};
const PAYMENT_LABELS={paypal:'PayPal',venmo:'Venmo',cashapp:'Cash App',zelle:'Zelle',stripe:'Stripe',apple_pay:'Apple Pay',cash:'Cash',check:'Check',other:'Other'};

function showMessage(title,copy){
  main.innerHTML=`<section class="state-message"><h1>${esc(title)}</h1><p>${esc(copy)}</p><p><a href="marketplace.html" class="button primary">Back to the directory</a></p></section>`;
}

function initials(name){
  return (name||'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'?';
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

function render(sp,categories,paymentMethods,region){
  const primary=categories.find(c=>c.is_primary)||categories[0];
  const pathLabel=PATH_LABELS[sp.marketplace_path]||'Marketplace';
  document.body.dataset.marketTheme=sp.page_theme||'dark';
  document.title=`${sp.business_name} | Rebel Ranch Marketplace`;

  main.innerHTML=`
    <p class="crumb"><a href="marketplace.html">Marketplace Directory</a>${primary?` / ${esc(pathLabel)} / ${esc(primary.marketplace_categories?.name||'')}`:` / ${esc(pathLabel)}`}</p>

    <section class="seller-hero">
      <div class="seller-mark" aria-hidden="true">${esc(initials(sp.business_name))}</div>
      <div>
        <p class="eyebrow">${esc(pathLabel)}${primary?` · ${esc(primary.marketplace_categories?.name||'')}`:''}</p>
        <h1>${esc(sp.business_name)}</h1>
        ${sp.short_description?`<p class="tagline">${esc(sp.short_description)}</p>`:''}
        <div class="meta-row">
          <span class="verified"><svg viewBox="0 0 24 24"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/></svg> Local & Independent</span>
          ${categories.map(c=>`<span class="tag">${esc(c.marketplace_categories?.name||'')}</span>`).join('')}
          ${region?`<span class="tag">${esc(region.region_name)}${region.state_code?`, ${esc(region.state_code)}`:''}</span>`:''}
        </div>
      </div>
    </section>

    <div class="layout">
      <div class="stack">
        <section class="panel">
          <h2>About</h2>
          ${sp.long_description?`<p>${esc(sp.long_description)}</p>`:'<p class="eyebrow">This seller has not added a description yet.</p>'}
        </section>
      </div>

      <div class="stack">
        <section class="panel order-panel">
          <h2>How to order</h2>
          <p>Contact ${esc(sp.business_name)} directly to place an order or ask about availability.</p>
          <button class="button primary" id="show-inquiry-form" type="button">Message This Seller</button>
          <form id="inquiry-form" class="inquiry-form hidden">
            <label>Your name<input id="inquiry-name" required></label>
            <label>Phone or email <span style="font-weight:400">so they can reply to you</span><input id="inquiry-contact"></label>
            <label>Message<textarea id="inquiry-message" required placeholder="What are you interested in?"></textarea></label>
            <button class="button primary" type="submit">Send message</button>
          </form>
          <p id="inquiry-confirm" class="inquiry-confirm hidden" role="status"></p>
          ${renderPaymentMethods(paymentMethods)}
          <p class="fine-print">Rebel Ranch Ministries connects buyers and sellers as a community directory. Payment and fulfillment happen directly between you and ${esc(sp.business_name)} — Rebel Ranch does not process or hold payment for this transaction.</p>
        </section>

        <section class="panel trust-panel">
          <h2>Why shop here?</h2>
          <ul class="list-plain">
            <li>A real local business, not a chain, franchise, or reseller — every seller attests to that when they apply</li>
            <li>Business info reviewed and approved by Rebel Ranch Ministries before listing</li>
            <li>Required permits and compliance are self-attested by the seller, not independently verified by Rebel Ranch</li>
          </ul>
        </section>
      </div>
    </div>`;

  $('show-inquiry-form').addEventListener('click',()=>{
    $('show-inquiry-form').classList.add('hidden');
    $('inquiry-form').classList.remove('hidden');
  });
  bindInquiryForm(sp.id);
}

async function init(){
  const slug=new URLSearchParams(location.search).get('seller');
  if(!slug)return showMessage('No seller specified','Use a link from the Marketplace directory to view a seller page.');

  const {data:sp,error}=await supabase.from('seller_profiles')
    .select('id,business_name,public_slug,marketplace_path,short_description,long_description,page_theme,region_id')
    .eq('public_slug',slug)
    .maybeSingle();

  if(error)return showMessage('Something went wrong',error.message||'Try again in a moment.');
  if(!sp)return showMessage('Seller not found','This seller is not currently listed in the Marketplace directory.');

  const [categoriesR,paymentR,regionR]=await Promise.all([
    supabase.from('seller_category_assignments').select('is_primary,marketplace_categories(name,slug)').eq('seller_profile_id',sp.id),
    supabase.from('seller_payment_methods').select('method_type,label,link_url').eq('seller_profile_id',sp.id).order('sort_order'),
    sp.region_id?supabase.from('marketplace_regions').select('region_name,state_code').eq('id',sp.region_id).maybeSingle():Promise.resolve({data:null})
  ]);

  render(sp,categoriesR.data||[],paymentR.data||[],regionR.data);
}

init();
