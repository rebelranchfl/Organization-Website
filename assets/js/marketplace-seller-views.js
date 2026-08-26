import {supabase} from './supabase-client.js';

const esc=(v='')=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const publicUrl=path=>supabase.storage.from('marketplace-seller-public').getPublicUrl(path).data.publicUrl;
const label=(v='')=>String(v||'').replaceAll('_',' ');
const heading=(eyebrow,title,copy,action='')=>`<header class="screen-heading"><div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2><p>${copy}</p></div>${action}</header>`;
const empty=(title,copy)=>`<section class="empty-state"><span class="empty-icon" aria-hidden="true">✦</span><h2>${title}</h2><p>${copy}</p></section>`;

const NEGATIVE=new Set(['rejected','withdrawn','suspended']);
const REVIEW=new Set(['pending','pending_review','submitted','changes_requested']);
const PRIVATE=new Set(['draft','not_submitted','paused','archived','not_applicable','waived']);
function badgeClass(status){
  if(NEGATIVE.has(status))return 'negative';
  if(REVIEW.has(status))return 'review';
  if(PRIVATE.has(status))return 'private';
  return '';
}
function badge(status){return `<span class="status-badge ${badgeClass(status)}">${esc(label(status))}</span>`}

function categoryName(state,id){return state.identity.categories.find(c=>c.id===id)?.name||'Category'}
function requirementFor(state,assignmentId){return state.data.requirementAssignments.find(r=>r.id===assignmentId)}

const PAYMENT_LABELS={paypal:'PayPal',venmo:'Venmo',cashapp:'Cash App',zelle:'Zelle',stripe:'Stripe',apple_pay:'Apple Pay',cash:'Cash',check:'Check',other:'Other'};

function contactActions(contact){
  const raw=String(contact||'').trim();
  if(!raw)return '';
  const isEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
  if(isEmail)return ` <a href="mailto:${esc(raw)}">Email</a>`;
  const digits=raw.replace(/\D/g,'');
  const isPhone=digits.length>=7&&digits.length<=15;
  if(isPhone)return ` <a href="tel:${esc(digits)}">Call</a> · <a href="sms:${esc(digits)}">Text</a>`;
  return '';
}

const BANNER_PREFIX='rrl_seller_banner_';
function bannerDismissedValue(sellerId,id){try{return localStorage.getItem(`${BANNER_PREFIX}${sellerId}_${id}`)}catch{return null}}

export function banners(state){
  const sp=state.identity?.sellerProfile;
  const data=state.data;
  if(!sp||!data)return '';
  const ref='ref=marketplace-seller-dashboard';
  const items=[];

  const missingLogo=!sp.logo_object_path,missingListings=!(data.listings||[]).length;
  if(missingLogo||missingListings){
    const what=missingLogo&&missingListings?'a logo and any listings':missingLogo?'a logo':'any listings';
    items.push({id:'storefront',dismissValue:'1',text:`Your public shop is missing ${what} — a complete storefront earns buyer trust faster.`,ctaText:'Get Seen, Get Found — from $199',href:`business-request.html?service=online-presence&${ref}`});
  }

  const openOrders=(data.orders||[]).filter(o=>['new','change_proposed'].includes(o.status)).length;
  const unreadInquiries=(data.inquiries||[]).filter(i=>!i.is_read).length;
  const backlog=openOrders+unreadInquiries;
  const dismissedAt=Number(bannerDismissedValue(sp.id,'overwhelmed')||0);
  if(backlog>=3&&backlog>dismissedAt){
    items.push({id:'overwhelmed',dismissValue:String(backlog),text:`You have ${backlog} order${backlog===1?'':'s'} and question${backlog===1?'':'s'} waiting on a response.`,ctaText:"Stop Losing Customers While You're Busy — from $199",href:`business-request.html?service=lead-capture-follow-up&${ref}`});
  }

  if(!(data.paymentMethods||[]).length&&!bannerDismissedValue(sp.id,'payment')){
    items.push({id:'payment',choice:true,text:'Buyers currently have no way to pay you except cash or check on pickup.',ctaText:'I want to get paid faster',href:`business-request.html?service=get-paid-faster&${ref}`});
  }

  if(!items.length)return '';
  return `<div class="dash-banners">${items.map(b=>`<div class="dash-banner">
    <p>${esc(b.text)}</p>
    <div class="dash-banner-actions">
      ${b.choice?`<button type="button" class="button" data-dismiss-banner="${b.id}" data-dismiss-value="1">I prefer cash / COD</button>`:''}
      <a class="button primary" href="${b.href}">${esc(b.ctaText)}</a>
      ${b.choice?'':`<button type="button" class="button" data-dismiss-banner="${b.id}" data-dismiss-value="${esc(b.dismissValue)}">Not now</button>`}
    </div>
  </div>`).join('')}</div>`;
}

function resolveSellerState(sp,app){
  if(sp.profile_status==='active')return{label:'Active & Live',tone:''};
  if(sp.profile_status==='paused')return{label:'Paused',tone:'private'};
  if(sp.profile_status==='archived')return{label:'Archived',tone:'private'};
  if(app?.status==='changes_requested')return{label:'Needs Your Attention',tone:'negative'};
  if(app&&['submitted','pending','pending_review'].includes(app.status))return{label:'Pending Approval',tone:'review'};
  if(app?.status==='rejected')return{label:'Application Rejected',tone:'negative'};
  if(app?.status==='withdrawn')return{label:'Application Withdrawn',tone:'private'};
  return{label:'Draft — Not Submitted Yet',tone:'private'};
}

export function statusStrip(state){
  const sp=state.identity?.sellerProfile;
  if(!sp)return '';
  const app=state.data?.applications?.[0];
  const {label:stateLabel,tone}=resolveSellerState(sp,app);
  const live=sp.profile_status==='active'&&sp.public_slug;
  return `<div class="status-strip">
    <span class="status-badge ${tone}">${esc(stateLabel)}</span>
    ${live?`<a class="button primary" href="marketplace-seller-page.html?seller=${esc(sp.public_slug)}" target="_blank" rel="noopener">View My Public Listing ↗</a>`:''}
  </div>`;
}

function draftOr(sp,key){return sp.draft_data&&Object.prototype.hasOwnProperty.call(sp.draft_data,key)?sp.draft_data[key]:sp[key]}

export function status(state){
  const sp=state.identity.sellerProfile;
  const app=state.data.applications[0];
  const canEdit=!app||['draft','changes_requested'].includes(app.status);
  const assignedIds=new Set(state.data.categoryAssignments.map(a=>a.category_id));
  const available=state.identity.categories.filter(c=>!assignedIds.has(c.id));
  const {label:stateLabel,tone:stateTone}=resolveSellerState(sp,app);
  const draftLogo=draftOr(sp,'logo_object_path');
  const draftWhy=draftOr(sp,'why_shop_points')||[];

  return `${heading('Seller status','Your Marketplace profile','Manage your business details and application status.')}
  <div class="layout">
    <div class="stack">
      <section class="panel">
        <div class="panel-header"><div><p class="eyebrow">Business</p><h2>${esc(sp.business_name)}</h2></div><span class="status-badge ${stateTone}">${esc(stateLabel)}</span></div>
        ${sp.has_unpublished_changes?`<div class="draft-banner"><span class="status-badge review">Draft changes pending — not visible to buyers yet</span><div class="actions">${sp.public_slug?`<a class="button" href="marketplace-seller-page.html?seller=${esc(sp.public_slug)}&preview=1" target="_blank" rel="noopener">Preview as buyer ↗</a>`:''}<button class="primary" data-action="publish-profile">Publish Changes</button><button class="danger" data-action="discard-profile-draft">Discard Draft</button></div></div>`:''}
        <details class="disclosure">
          <summary>Update store details</summary>
          <div class="logo-row">
            ${draftLogo?`<img class="logo-preview" src="${esc(publicUrl(draftLogo))}" alt="Your business logo">`:'<div class="logo-preview logo-preview-empty">No logo yet</div>'}
            <form id="logo-upload-form" class="dialog-actions">
              <label>Business logo <span>JPEG, PNG, WebP, or an iPhone photo (HEIC); 5 MB max. Saved as a draft — publish to make it live.</span><input data-field="logo-file" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" required></label>
              <button class="primary" type="submit">${draftLogo?'Replace logo':'Upload logo'}</button>
            </form>
          </div>
          <form id="profile-form" class="onboarding-form">
            <label>Business name<input id="pf-business-name" value="${esc(draftOr(sp,'business_name'))}" ${canEdit?'':'disabled'} required></label>
            <label>Short description<textarea id="pf-short-description">${esc(draftOr(sp,'short_description')||'')}</textarea></label>
            <label>Long description <span>Shown in the About section of your public page</span><textarea id="pf-long-description">${esc(draftOr(sp,'long_description')||'')}</textarea></label>
            <p>Your public storefront uses the approved Rebel Ranch Local appearance. Your logo, business story, listings, and photographs make the page your own.</p>
            <label>Why shop with you? <span>Up to 3 reasons buyers should choose you — shown on your public page. Leave blank to use our default copy.</span></label>
            <input id="pf-why-1" placeholder="Reason 1" value="${esc(draftWhy[0]||'')}">
            <input id="pf-why-2" placeholder="Reason 2" value="${esc(draftWhy[1]||'')}">
            <input id="pf-why-3" placeholder="Reason 3" value="${esc(draftWhy[2]||'')}">
            <p class="eyebrow">Changes save as a draft — buyers won't see them until you publish.</p>
            <div class="dialog-actions"><button class="primary" type="submit">Save as Draft</button></div>
          </form>
        </details>
      </section>
      <section class="panel">
        <div class="panel-header"><div><p class="eyebrow">Application</p><h2>${app?label(app.status):'Not started'}</h2></div>${app?badge(app.status):''}</div>
        ${app?`<p>${app.review_notes?esc(app.review_notes):'No reviewer notes yet.'}</p>
        <div class="actions">${['draft','changes_requested'].includes(app.status)?'<button class="primary" data-action="submit-application">Submit for review</button>':''}${app.status==='draft'?'<button class="danger" data-action="withdraw-application">Withdraw</button>':''}</div>`:empty('No application yet','Something went wrong creating your application — contact support.')}
      </section>
    </div>
    <aside class="stack">
      <section class="panel">
        <div class="panel-header"><h2>Categories</h2></div>
        <div class="tag-row">${state.data.categoryAssignments.map(a=>`<span class="tag">${esc(categoryName(state,a.category_id))}${a.is_primary?' · Primary':''}</span>`).join('')||'<p class="eyebrow">No categories yet</p>'}</div>
        <details class="disclosure">
          <summary>Manage categories</summary>
          <p class="eyebrow">Order controls which categories show first on your public page.</p>
          <div class="list">${state.data.categoryAssignments.map((a,i,arr)=>`<article class="list-item"><span class="list-icon" aria-hidden="true">✦</span><div><h3>${esc(categoryName(state,a.category_id))}</h3><p>${a.is_primary?'Primary':`Position ${i+1}`}</p></div><div class="frame-actions"><button type="button" data-move-category="${a.id}" data-direction="up" ${i===0?'disabled':''} aria-label="Move up">↑</button><button type="button" data-move-category="${a.id}" data-direction="down" ${i===arr.length-1?'disabled':''} aria-label="Move down">↓</button><button class="danger" data-remove-category="${a.id}">Remove</button></div></article>`).join('')||'<p class="eyebrow">No categories yet</p>'}</div>
          ${available.length?`<form id="add-category-form" class="dialog-actions" style="margin-top:14px"><select id="new-category">${available.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select><button class="primary" type="submit">Add</button></form>`:''}
        </details>
      </section>
      <section class="panel">
        <div class="panel-header"><div><h2>Payment methods</h2><p>Shown on your public page so buyers know how to pay you directly.</p></div></div>
        <div class="tag-row">${state.data.paymentMethods.map(m=>`<span class="tag">${esc(PAYMENT_LABELS[m.method_type]||label(m.method_type))}</span>`).join('')||'<p class="eyebrow">No payment methods added yet</p>'}</div>
        <details class="disclosure">
          <summary>Manage payment methods</summary>
          <div class="list">${state.data.paymentMethods.map(m=>`<article class="list-item"><span class="list-icon" aria-hidden="true">$</span><div><h3>${esc(PAYMENT_LABELS[m.method_type]||label(m.method_type))}</h3><p>${esc(m.label)}</p></div><button class="danger" data-remove-payment="${m.id}">Remove</button></article>`).join('')||'<p class="eyebrow">No payment methods added yet</p>'}</div>
          <form id="add-payment-form" class="onboarding-form" style="margin-top:14px">
            <label>Type<select id="new-payment-type">${Object.entries(PAYMENT_LABELS).map(([k,t])=>`<option value="${k}">${t}</option>`).join('')}</select></label>
            <label>Label or handle<input id="new-payment-label" placeholder="e.g. @cypresscreek or (352) 555-0142" required></label>
            <label>Link <span>Optional — e.g. a PayPal.me or Cash App link</span><input id="new-payment-link" type="url" placeholder="https://paypal.me/…"></label>
            <div class="dialog-actions"><button class="primary" type="submit">Add payment method</button></div>
          </form>
        </details>
      </section>
    </aside>
  </div>`;
}

function listingCard(item){
  const images=item.seller_listing_images||[];
  const qty=item.quantity_available;
  return `<article class="req-card">
    <div class="meta-row"><span class="status-badge ${item.is_active?'':'private'}">${item.is_active?'Visible':'Hidden'}</span><span class="tag">${esc(label(item.listing_type))}</span><span class="tag">${qty!=null?`${qty} in stock`:'Unlimited'}</span></div>
    <h3>${esc(item.title)}</h3>
    ${item.price_label?`<p><strong>${esc(item.price_label)}</strong></p>`:''}
    ${item.description?`<p>${esc(item.description)}</p>`:''}
    <div class="listing-photos">${images.map(img=>`<span class="listing-photo"><img src="${esc(publicUrl(img.object_path))}" alt=""><button type="button" data-delete-listing-image="${img.id}" aria-label="Remove photo">×</button></span>`).join('')}</div>
    <form data-listing-image-form="${item.id}" class="dialog-actions" style="margin-top:10px">
      <input data-field="file" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif">
      <button class="primary" type="submit">Add photo</button>
    </form>
    <form data-quantity-form="${item.id}" class="dialog-actions" style="margin-top:10px">
      <label>Stock on hand <span>Blank = unlimited (services, made-to-order)</span><input type="number" min="0" data-field="quantity" value="${qty??''}" placeholder="Unlimited"></label>
      <button type="submit">Update Stock</button>
    </form>
    <div class="actions" style="margin-top:10px">
      <button data-toggle-listing-active="${item.id}" data-active="${!item.is_active}">${item.is_active?'Hide from public page':'Make visible'}</button>
      <button class="danger" data-delete-listing="${item.id}">Delete</button>
    </div>
  </article>`;
}

export function listings(state){
  const allItems=state.data.listings;
  const limit=state.identity.sellerProfile.listing_limit??5;
  const atLimit=allItems.length>=limit;
  const listingFilter=state.listingFilter||'all';
  const items=allItems.filter(i=>listingFilter==='all'||(listingFilter==='active'?i.is_active:!i.is_active));
  const addForm=atLimit?`<section class="panel"><div class="panel-header"><h2>Add a listing</h2></div><p>You've used all ${limit} of your free listings (${allItems.length}/${limit}). Contact Rebel Ranch Ministries if you'd like to add more.</p></section>`:`<section class="panel">
    <div class="panel-header"><h2>Add a listing</h2><span class="tag">${allItems.length}/${limit} used</span></div>
    <form id="add-listing-form" class="onboarding-form">
      <label>Type<select id="new-listing-type"><option value="product">Product</option><option value="service">Service</option></select></label>
      <label>Title<input id="new-listing-title" required></label>
      <label>Description<textarea id="new-listing-description"></textarea></label>
      <label>Price <span>Free text — e.g. "$8 each" or "Call for a quote"</span><input id="new-listing-price" placeholder="$8 each"></label>
      <label>Pricing type<select id="new-listing-price-type"><option value="fixed">Fixed price</option><option value="starting_at">Starting at</option><option value="quote">Seller confirms price</option></select></label>
      <label>Numeric unit price <span>Optional; used to estimate fixed-price orders</span><input id="new-listing-unit-price" type="number" min="0" step="0.01" placeholder="8.00"></label>
      <div class="dialog-actions"><button class="primary" type="submit">Add listing</button></div>
    </form>
  </section>`;
  const filterRow=`<div class="view-tools" style="margin:14px 0"><label style="display:flex;align-items:center;gap:8px;font-weight:800;color:var(--ink)">Showing<select id="listing-filter"><option value="all" ${listingFilter==='all'?'selected':''}>All (${allItems.length})</option><option value="active" ${listingFilter==='active'?'selected':''}>Active (${allItems.filter(i=>i.is_active).length})</option><option value="inactive" ${listingFilter==='inactive'?'selected':''}>Hidden (${allItems.filter(i=>!i.is_active).length})</option></select></label></div>`;
  return `${heading('Listings','What you sell','Add products or services with a price and photos — buyers see these on your public page.')}
  ${addForm}
  ${allItems.length?filterRow:''}
  ${items.length?`<div class="card-grid" style="margin-top:18px">${items.map(listingCard).join('')}</div>`:empty(allItems.length?'No listings match this filter':'No listings yet',allItems.length?'Try a different filter above.':'Add your first product or service using the form above.')}`;
}

export function requirements(state){
  const items=state.data.requirementAssignments;
  if(!items.length)return `${heading('Compliance','Requirements','Requirements are assigned automatically based on your categories.')}${empty('No requirements yet','Add a category on the Status tab to see what applies to your business.')}`;
  const pending=items.filter(r=>r.assignment_status==='pending').length;
  const satisfied=items.filter(r=>r.assignment_status==='satisfied').length;
  const waived=items.filter(r=>['waived','not_applicable'].includes(r.assignment_status)).length;
  const statsRow=`<div class="metric-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="metric"><span>Pending</span><strong>${pending}</strong><small>Needs your action</small></div>
    <div class="metric"><span>Satisfied</span><strong>${satisfied}</strong><small>Complete</small></div>
    <div class="metric"><span>Waived / N/A</span><strong>${waived}</strong><small>Resolved by admin</small></div>
  </div>`;
  return `${heading('Compliance','Requirements','Submit an attestation or upload a document for each requirement below.')}${statsRow}
  <div class="card-grid" style="margin-top:18px">${items.map(r=>{
    const req=r.compliance_requirements||{};
    const attestation=state.data.attestations.find(a=>a.requirement_assignment_id===r.id);
    const creds=state.data.credentials.filter(c=>c.requirement_assignment_id===r.id);
    return `<article class="req-card">
      <div class="meta-row">${badge(r.assignment_status)}<span class="tag">${esc(label(req.requirement_type))}</span></div>
      <h3>${esc(req.title)}</h3>
      <p>${esc(req.description)}</p>
      ${r.waived_reason?`<p><strong>Note:</strong> ${esc(r.waived_reason)}</p>`:''}
      ${attestation?`<div class="attestation-done"><span class="status-badge">✓ Attestation submitted</span><p>${esc(attestation.attestation_text)}</p></div>`:`
      <form data-attestation-form="${r.id}" class="dialog-actions" style="margin-top:10px">
        <textarea placeholder="Attest that you meet this requirement…" required></textarea>
        <button class="primary" type="submit">Submit attestation</button>
      </form>`}
      ${req.requires_credential?`
      <form data-credential-form="${r.id}" class="onboarding-form" style="margin-top:10px">
        <label>Credential type<input data-field="credential_type" placeholder="e.g. Cottage Food Permit" required></label>
        <label>Issuing authority<input data-field="issuing_authority"></label>
        <label>Expiration date<input data-field="expires_at" type="date"></label>
        <label>Document <span>JPEG, PNG, or PDF; 10 MB max</span><input data-field="file" type="file" accept="image/jpeg,image/png,application/pdf" required></label>
        <button class="primary" type="submit">Upload document</button>
      </form>
      ${creds.length?`<div class="list" style="margin-top:10px">${creds.map(c=>`<article class="list-item"><span class="list-icon" aria-hidden="true">📄</span><div><h3>${esc(c.credential_type)}</h3><p>${c.expires_at?`Expires ${c.expires_at}`:'No expiration set'}</p></div>${badge(c.verification_status)}</article>`).join('')}</div>`:''}
      `:''}
    </article>`;
  }).join('')}</div>`;
}

export function programs(state){
  const creators=state.identity.creators;
  return `${heading('Programs','Link your Creation Station account','Show off work from your Creation Station family, child, teen, or adult profiles on your seller page.')}
  <section class="panel">
    <div class="panel-header"><div style="display:flex;align-items:center;gap:12px"><img src="assets/creation-station-logo.png" alt="Creation Station" style="width:36px;height:36px;object-fit:contain;border-radius:8px"><h2>Creation Station</h2></div></div>
    <div class="list">${creators.map(c=>{
      const aff=state.data.creatorAffiliations.find(a=>a.creator_id===c.id);
      const isMinor=['young_6_12','teen_13_17'].includes(c.age_band);
      return `<article class="list-item"><span class="list-icon" aria-hidden="true">${isMinor?'✦':'◇'}</span><div><h3>${esc(c.display_name)}</h3><p>${aff?(aff.is_public?'Public':'Private'):'Not linked'}${aff&&isMinor?(aff.parent_approved_at?' · Parent approved':' · Needs parent approval to go public'):''}</p></div>${aff?`<button data-toggle-affiliation="${aff.id}" data-public="${!aff.is_public}">${aff.is_public?'Make private':'Make public'}</button>`:`<button data-link-creator="${c.id}">Link to profile</button>`}</article>`;
    }).join('')||'<p class="eyebrow">No Creation Station profiles linked to this account yet</p>'}</div>
  </section>
  ${state.identity.household?`<section class="panel" style="margin-top:18px"><div class="panel-header"><h2>Household</h2></div>${(()=>{const h=state.data.householdAffiliations[0];return h?`<p>${esc(state.identity.household.household_name||'Your household')} — ${h.is_public?'Public':'Private'}</p><button data-toggle-household="${h.id}" data-public="${!h.is_public}">${h.is_public?'Make private':'Make public'}</button>`:`<button data-link-household="${state.identity.household.id}">Link household to profile</button>`})()}</section>`:''}
  <section class="panel" style="margin-top:18px">
    <div class="panel-header"><div style="display:flex;align-items:center;gap:12px"><img src="assets/rebel_ranch_academy_logo_transparent.png" alt="Rebel Ranch Academy" style="width:36px;height:36px;object-fit:contain"><h2>Rebel Ranch Academy</h2></div></div>
    <p>Rebel Ranch Academy is live at <a href="https://academy.rebelranchministries.org" target="_blank" rel="noopener">academy.rebelranchministries.org</a>. Linking your Academy coursework to this seller profile isn't available yet.</p>
  </section>`;
}

export function notifications(state){
  const allItems=[...state.data.notifications].sort((a,b)=>(a.is_read===b.is_read?0:a.is_read?1:-1));
  if(!allItems.length)return `${heading('Notifications','Updates','You will see application and requirement updates here.')}${empty('Nothing yet','Notifications about your application and requirements will appear here.')}`;
  const notifFilter=state.notifFilter||'all';
  const items=notifFilter==='unread'?allItems.filter(n=>!n.is_read):allItems;
  const unreadIds=allItems.filter(n=>!n.is_read).map(n=>n.id);
  const filterRow=`<div class="view-tools" style="margin:14px 0"><label style="display:flex;align-items:center;gap:8px;font-weight:800;color:var(--ink)">Showing<select id="notif-filter"><option value="all" ${notifFilter==='all'?'selected':''}>All (${allItems.length})</option><option value="unread" ${notifFilter==='unread'?'selected':''}>Unread only (${unreadIds.length})</option></select></label></div>`;
  return `${heading('Notifications','Updates',`${unreadIds.length} unread`,unreadIds.length?'<button class="primary" data-action="mark-all-read">Mark all read</button>':'')}${filterRow}
  ${items.length?`<div class="list">${items.map(n=>`<article class="list-item ${n.is_read?'is-read':'is-unread'}"><span class="list-icon" aria-hidden="true">${n.is_read?'✓':'●'}</span><div><h3>${esc(n.title)}</h3><p>${esc(n.body||'')}</p><small>${new Date(n.created_at).toLocaleString()}</small></div>${n.is_read?'':`<button data-mark-read="${n.id}">Mark read</button>`}</article>`).join('')}</div>`:empty('Nothing unread','Every notification has been marked read.')}`;
}

export function questions(state){
  const items=[...state.data.inquiries].sort((a,b)=>(a.is_read===b.is_read?0:a.is_read?1:-1));
  if(!items.length)return `${heading('Questions','Buyer questions','Questions are kept separate from orders so your order inbox stays clear.')}${empty('No questions yet','Buyer questions will appear here.')}`;
  const unreadIds=items.filter(m=>!m.is_read).map(m=>m.id);
  return `${heading('Questions','Buyer questions',`${unreadIds.length} unread`)}
  <div class="list">${items.map(m=>`<article class="list-item ${m.is_read?'is-read':'is-unread'}"><span class="list-icon" aria-hidden="true">${m.is_read?'✓':'●'}</span><div><h3>${esc(m.sender_name)} <span class="tag" style="margin-left:6px">${m.sender_is_member?'Member':'Non-member'}</span></h3><p>${esc(m.message)}</p>${m.sender_contact?`<p><strong>Contact:</strong> ${esc(m.sender_contact)}${contactActions(m.sender_contact)}</p>`:''}${m.responded_at?`<p><span class="status-badge">✓ Responded ${new Date(m.responded_at).toLocaleDateString()}</span></p>`:''}<small>${new Date(m.created_at).toLocaleString()}</small></div><div class="actions" style="flex-direction:column;align-items:stretch">${m.is_read?'':`<button data-mark-inquiry-read="${m.id}">Mark read</button>`}${m.responded_at?'':`<button class="primary" data-mark-inquiry-responded="${m.id}">Mark Responded</button>`}</div></article>`).join('')}</div>`;
}

const ORDER_ACTIONS={
  new:[['accepted','Accept Order','primary'],['change_proposed','Propose Change',''],['declined','Decline Order','danger']],
  change_proposed:[['accepted','Mark Accepted','primary'],['declined','Decline Order','danger']],
  accepted:[['ready','Mark Ready','primary'],['declined','Decline Order','danger']],
  ready:[['completed','Mark Completed','primary']],
  declined:[],
  completed:[]
};
function orderActionButtons(o){
  const acts=ORDER_ACTIONS[o.status]||[];
  if(!acts.length)return '<p class="eyebrow">No further action needed.</p>';
  return `<div class="actions">${acts.map(([status,text,cls])=>`<button class="${cls}" data-order-action="${status}" data-order-id="${o.id}">${text}</button>`).join('')}</div>`;
}

export function orderResponseBody(o){
  return `
    <p><strong>Buyer:</strong> ${esc(o.buyer_name)} — ${esc(o.buyer_contact)}${contactActions(o.buyer_contact)}</p>
    <p><strong>Requested:</strong> ${esc(label(o.fulfillment_method))}${o.preferred_date?` · ${esc(o.preferred_date)}`:''}</p>
    <div class="order-confirm-items">${(o.items||[]).map((x,i)=>`
      <div class="order-line-confirm">
        <div><strong>${esc(x.title)}</strong><small>Requested: ${x.quantity}</small></div>
        <label><input type="checkbox" data-full-qty="${i}" checked> Full quantity</label>
        <label>Confirmed qty<input type="number" min="0" max="${x.quantity}" value="${x.quantity}" data-confirm-qty="${i}" disabled></label>
      </div>`).join('')}</div>
    <label>Confirmed total <span>Optional</span><input type="number" min="0" step="0.01" id="or-total" value="${o.confirmed_total??o.estimated_total??''}"></label>
    <label>Fulfillment details or proposed change <span>Optional</span><textarea id="or-details"></textarea></label>
    <label>Payment instructions <span>Optional</span><input id="or-payment" value="${esc(o.payment_instructions||'')}"></label>
    <label>Note to buyer <span>Optional</span><textarea id="or-note"></textarea></label>
  `;
}

const ORDER_WINDOWS={'24h':1,'7d':7,'all':null};
const WINDOW_LABELS={'24h':'last 24 hours','7d':'last 7 days','all':'all time'};
function withinWindow(dateStr,days){
  if(days==null)return true;
  return Date.now()-new Date(dateStr).getTime()<=days*86400000;
}

export function orders(state){
  const f=state.data.fulfillment||{},allItems=state.data.orders||[];
  const win=state.orderFilter?.window||'24h';
  const days=ORDER_WINDOWS[win];
  const items=allItems.filter(o=>withinWindow(o.created_at,days));
  const placed=items.length,fulfilled=items.filter(o=>o.status==='completed').length,declined=items.filter(o=>o.status==='declined').length;
  const openOrders=allItems.filter(o=>!['declined','completed'].includes(o.status));
  const owedTotal=openOrders.reduce((sum,o)=>sum+Number(o.confirmed_total??o.estimated_total??0),0);
  const statsRow=`<div class="metric-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="metric"><span>Orders Placed</span><strong>${placed}</strong><small>${WINDOW_LABELS[win]}</small></div>
    <div class="metric"><span>Fulfilled</span><strong>${fulfilled}</strong><small>${WINDOW_LABELS[win]}</small></div>
    <div class="metric"><span>Declined</span><strong>${declined}</strong><small>${WINDOW_LABELS[win]}</small></div>
    <div class="metric"><span>Owed to You</span><strong>$${owedTotal.toFixed(2)}</strong><small>Open orders, estimated</small></div>
  </div>`;
  const filterRow=`<div class="view-tools" style="margin:14px 0"><label style="display:flex;align-items:center;gap:8px;font-weight:800;color:var(--ink)">Showing<select id="order-window"><option value="24h" ${win==='24h'?'selected':''}>Last 24 hours</option><option value="7d" ${win==='7d'?'selected':''}>Last 7 days</option><option value="all" ${win==='all'?'selected':''}>All time</option></select></label></div>`;
  const settings=`<section class="panel"><div class="panel-header"><h2>Fulfillment options</h2></div><form id="fulfillment-form" class="onboarding-form"><div class="check-grid"><label><input id="fulfill-pickup" type="checkbox" ${f.offers_pickup!==false?'checked':''}> Pickup</label><label><input id="fulfill-delivery" type="checkbox" ${f.offers_delivery?'checked':''}> Local delivery</label><label><input id="fulfill-meetup" type="checkbox" ${f.offers_meetup!==false?'checked':''}> Meet-up</label><label><input id="fulfill-shipping" type="checkbox" ${f.offers_shipping?'checked':''}> Shipping</label></div><label>Public fulfillment note<textarea id="fulfill-notes">${esc(f.public_notes||'')}</textarea></label><button class="primary" type="submit">Save fulfillment options</button></form></section>`;
  const cards=items.length?`<div class="order-list">${items.map(o=>`<article class="panel order-card"><div class="panel-header"><div><p class="eyebrow">Order #${o.order_number}</p><h2>${esc(o.buyer_name)}</h2></div>${badge(o.status)}</div><p><strong>${esc(label(o.order_kind))}</strong> · ${esc(label(o.fulfillment_method))}</p><p><strong>Buyer requested:</strong> ${o.preferred_date?esc(o.preferred_date):'No date given'}${o.seller_proposed_date?` · <strong>You proposed:</strong> ${new Date(o.seller_proposed_date+'T00:00:00').toLocaleDateString()}`:''}</p><form data-propose-date-form="${o.id}" class="dialog-actions" style="margin-top:6px"><label>Propose a date<input type="date" data-field="proposed-date" value="${o.seller_proposed_date||''}"></label><button type="submit">Propose This Date</button></form><div class="order-items">${(o.items||[]).map((x,i)=>`<div class="pack-line"><label><input type="checkbox" data-pack-item="${o.id}:${i}" ${x.packed?'checked':''}> ${x.quantity} × ${esc(x.title)}</label>${x.note?`<p>${esc(x.note)}</p>`:''}</div>`).join('')}</div><p><strong>Buyer contact:</strong> ${esc(o.buyer_contact)}${contactActions(o.buyer_contact)}</p>${o.delivery_address?`<p><strong>Delivery:</strong> ${esc(o.delivery_address)}</p>`:''}${o.service_location?`<p><strong>Service location:</strong> ${esc(o.service_location)}</p>`:''}${o.buyer_note?`<p><strong>Order note:</strong> ${esc(o.buyer_note)}</p>`:''}<p><strong>Total:</strong> ${o.confirmed_total!==null?`$${Number(o.confirmed_total).toFixed(2)}`:o.estimated_total!==null?`Estimated $${Number(o.estimated_total).toFixed(2)}`:'Needs confirmation'}</p>${(o.photo_object_paths||[]).map(p=>`<button type="button" data-order-photo="${esc(p)}">View private buyer photo</button>`).join('')}${orderActionButtons(o)}<small>${new Date(o.created_at).toLocaleString()}</small></article>`).join('')}</div>`:empty(allItems.length?'No orders in this window':'No orders yet',allItems.length?'Try "All time" to see older orders.':'New structured orders and service requests will appear here — separate from buyer questions.');
  return `${heading('Orders','Order inbox','Every item, quantity, fulfillment choice, buyer contact, and optional photo in one place.')}${statsRow}${filterRow}<div>${cards}</div><div style="margin-top:18px">${settings}</div>`;
}

const HISTORY_WINDOWS={'7d':7,'30d':30,'90d':90,all:null};
export function history(state){
  const allItems=state.data.reviewEvents;
  if(!allItems.length)return `${heading('History','Review history','Every status change on your application and profile will be recorded here.')}${empty('No history yet','Once your application moves through review, each step will show up here.')}`;
  const win=state.historyFilter?.window||'30d';
  const days=HISTORY_WINDOWS[win];
  const items=allItems.filter(e=>withinWindow(e.recorded_at,days));
  const filterRow=`<div class="view-tools" style="margin:14px 0"><label style="display:flex;align-items:center;gap:8px;font-weight:800;color:var(--ink)">Showing<select id="history-window"><option value="7d" ${win==='7d'?'selected':''}>Last 7 days</option><option value="30d" ${win==='30d'?'selected':''}>Last 30 days</option><option value="90d" ${win==='90d'?'selected':''}>Last 90 days</option><option value="all" ${win==='all'?'selected':''}>All time</option></select></label></div>`;
  return `${heading('History','Review history','A record of every status change on your application and profile.')}${filterRow}
  ${items.length?`<div class="list">${items.map(e=>`<article class="list-item"><span class="list-icon" aria-hidden="true">↺</span><div><h3>${e.from_status?`${label(e.from_status)} → ${label(e.to_status)}`:label(e.to_status)}</h3><p>${e.note?esc(e.note):''}</p><small>${new Date(e.recorded_at).toLocaleString()}</small></div></article>`).join('')}</div>`:empty('No history in this window','Try a wider time range to see older events.')}`;
}

export function admin(state){
  const a=state.adminData||{applicationQueue:[],credentialQueue:[],requirementQueue:[],sellerQueue:[]};
  const sellerQueue=a.sellerQueue||[];
  return `${heading('Admin','Marketplace review queue','Approve applications, verify documents, and manage compliance requirements.')}
  <div class="metric-grid">
    <div class="metric"><span>Applications</span><strong>${a.applicationQueue.length}</strong><small>Awaiting review</small></div>
    <div class="metric"><span>Documents</span><strong>${a.credentialQueue.length}</strong><small>Awaiting verification</small></div>
    <div class="metric"><span>Requirements</span><strong>${a.requirementQueue.length}</strong><small>Awaiting a decision</small></div>
  </div>
  <div class="layout" style="margin-top:18px">
    <div class="stack">
      <section class="panel"><div class="panel-header"><h2>Applications</h2></div><div class="list">${a.applicationQueue.map(x=>`<article class="list-item"><span class="list-icon" aria-hidden="true">✎</span><div><h3>${esc(x.seller_profiles?.business_name||x.legal_business_name||'Application')}</h3><p>${esc(label(x.application_type))} · submitted ${x.submitted_at?new Date(x.submitted_at).toLocaleDateString():'—'}</p></div><button data-review-application="${x.id}" data-seller="${x.seller_profile_id}">Review</button></article>`).join('')||'<p class="eyebrow">Nothing waiting</p>'}</div></section>
      <section class="panel"><div class="panel-header"><h2>Documents</h2></div><div class="list">${a.credentialQueue.map(x=>`<article class="list-item"><span class="list-icon" aria-hidden="true">📄</span><div><h3>${esc(x.seller_profiles?.business_name||'Seller')}</h3><p>${esc(x.credential_type)}</p></div><div class="actions"><button data-verify-credential="${x.id}">Verify</button><button class="danger" data-reject-credential="${x.id}">Reject</button></div></article>`).join('')||'<p class="eyebrow">Nothing waiting</p>'}</div></section>
      <section class="panel"><div class="panel-header"><h2>Active Sellers</h2></div><div class="list">${sellerQueue.map(x=>`<article class="list-item"><span class="list-icon" aria-hidden="true">${x.profile_status==='active'?'✓':'⏸'}</span><div><h3>${esc(x.business_name)}</h3><p>${esc(label(x.profile_status))}</p></div><div class="actions">${x.profile_status==='active'?`<button data-pause-seller="${x.id}">Pause</button><button class="danger" data-archive-seller="${x.id}">Archive</button>`:`<button data-reactivate-seller="${x.id}">Reactivate</button>`}</div></article>`).join('')||'<p class="eyebrow">No sellers yet</p>'}</div></section>
    </div>
    <aside class="panel"><div class="panel-header"><h2>Requirements</h2></div><div class="list">${a.requirementQueue.map(x=>`<article class="list-item"><span class="list-icon" aria-hidden="true">☑</span><div><h3>${esc(x.seller_profiles?.business_name||'Seller')}</h3><p>${esc(x.compliance_requirements?.title||'Requirement')}</p></div><div class="actions"><button data-waive-requirement="${x.id}">Waive</button><button data-na-requirement="${x.id}">N/A</button></div></article>`).join('')||'<p class="eyebrow">Nothing waiting</p>'}</aside>
  </div>
  <section class="panel" style="margin-top:18px">
    <div class="panel-header"><div><h2>Shop Spotlight</h2><p>Free weekly promotion — visibility stays a level playing field, so this is never paid placement.</p></div></div>
    <div class="list">${sellerQueue.filter(x=>x.profile_status==='active'&&!x.is_pro).sort((a,b)=>new Date(a.last_spotlighted_at||0)-new Date(b.last_spotlighted_at||0)).slice(0,5).map(x=>`<article class="list-item"><span class="list-icon" aria-hidden="true">★</span><div><h3>${esc(x.business_name)}</h3><p>${x.last_spotlighted_at?`Last featured ${new Date(x.last_spotlighted_at).toLocaleDateString()}`:'Never featured'}</p></div><button data-spotlight-seller="${x.id}" data-business-name="${esc(x.business_name)}">Feature this week</button></article>`).join('')||'<p class="eyebrow">No eligible sellers yet</p>'}</div>
  </section>`;
}

export function today(state){
  const openOrders=(state.data.orders||[]).filter(o=>['new','change_proposed'].includes(o.status)).map(o=>({...o,kind:'order'}));
  const openQuestions=(state.data.inquiries||[]).filter(i=>!i.is_read||!i.responded_at).map(i=>({...i,kind:'question'}));
  const merged=[...openOrders,...openQuestions].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  if(!merged.length)return `${heading('Today',"You're all caught up",'Nothing needs your attention right now.')}${empty('Nothing waiting','New orders and questions will show up here first, oldest first.')}`;
  return `${heading('Today','What needs you right now',`${merged.length} item${merged.length===1?'':'s'} waiting, oldest first.`)}
  <div class="list">${merged.map(item=>item.kind==='order'?
    `<article class="list-item"><span class="list-icon" aria-hidden="true">🧾</span><div><h3>Order #${item.order_number} — ${esc(item.buyer_name)}</h3><p>${esc(label(item.status))} · ${new Date(item.created_at).toLocaleString()}</p></div><button data-goto-view="orders">Open in Orders</button></article>`
    :`<article class="list-item"><span class="list-icon" aria-hidden="true">💬</span><div><h3>Question from ${esc(item.sender_name)}</h3><p>${item.is_read?'Read':'Unread'}${item.responded_at?' · Responded':' · Needs response'} · ${new Date(item.created_at).toLocaleString()}</p></div><button data-goto-view="questions">Open in Questions</button></article>`
  ).join('')}</div>`;
}

export function kpis(state){
  const sp=state.identity.sellerProfile;
  if(!sp.is_pro){
    return `${heading('KPIs','Seller Pro','See your order trends, fulfillment rate, and a revenue estimate in one place.')}
    <section class="panel">
      <h2>Seller Pro — $9.99/month</h2>
      <p>Unlocks a KPI dashboard: total orders, fulfillment rate, average order value, and a revenue estimate based on your own confirmed orders.</p>
      <p>The Today queue, real scheduling, packing checklist, and running "owed to you" total on your Orders tab are free — this KPI view is the only paid piece.</p>
      <a class="button primary" href="business-request.html?service=general-business-service&ref=marketplace-seller-dashboard-kpi">Interested in Seller Pro</a>
    </section>`;
  }
  const orders=state.data.orders||[];
  const completed=orders.filter(o=>o.status==='completed');
  const declined=orders.filter(o=>o.status==='declined');
  const totalRevenue=completed.reduce((sum,o)=>sum+Number(o.confirmed_total??o.estimated_total??0),0);
  const avgOrder=completed.length?totalRevenue/completed.length:0;
  const fulfillRate=orders.length?Math.round((completed.length/orders.length)*100):0;
  return `${heading('KPIs','Your performance','Based on your own order records — see the accuracy note below.')}
  <div class="metric-grid">
    <div class="metric"><span>Total Orders</span><strong>${orders.length}</strong><small>All time</small></div>
    <div class="metric"><span>Fulfillment Rate</span><strong>${fulfillRate}%</strong><small>Completed vs. total</small></div>
    <div class="metric"><span>Avg Order Value</span><strong>$${avgOrder.toFixed(2)}</strong><small>Completed orders</small></div>
    <div class="metric"><span>Est. Revenue</span><strong>$${totalRevenue.toFixed(2)}</strong><small>Self-reported</small></div>
  </div>
  <section class="panel" style="margin-top:18px">
    <h2>A note on accuracy</h2>
    <p>Order and fulfillment counts come directly from your own dashboard activity and are accurate. Revenue is based on the totals you enter when accepting orders — Rebel Ranch Local doesn't process payment, so this is your own estimate, not a verified figure. Declined orders this period: ${declined.length}.</p>
  </section>
  <section class="panel" style="margin-top:18px">
    <h2>Storefront traffic</h2>
    <p>Page-view data isn't pulled into this dashboard yet — check your Rebel Ranch Local traffic directly in Google Analytics for now.</p>
  </section>`;
}

export const renderers={status,listings,orders,questions,requirements,programs,notifications,history,admin,today,kpis};
