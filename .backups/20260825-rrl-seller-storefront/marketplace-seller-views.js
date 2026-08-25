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

const THEME_LABELS={dark:'Current (dark green)',cream:'Cream Canvas',linen:'Linen & Timber',white:'Morning Market White'};
const PAYMENT_LABELS={paypal:'PayPal',venmo:'Venmo',cashapp:'Cash App',zelle:'Zelle',stripe:'Stripe',apple_pay:'Apple Pay',cash:'Cash',check:'Check',other:'Other'};

export function status(state){
  const sp=state.identity.sellerProfile;
  const app=state.data.applications[0];
  const canEdit=!app||['draft','changes_requested'].includes(app.status);
  const assignedIds=new Set(state.data.categoryAssignments.map(a=>a.category_id));
  const available=state.identity.categories.filter(c=>!assignedIds.has(c.id));

  return `${heading('Seller status','Your Marketplace profile','Manage your business details and application status.')}
  <div class="layout">
    <div class="stack">
      <section class="panel">
        <div class="panel-header"><div><p class="eyebrow">Business</p><h2>${esc(sp.business_name)}</h2></div>${badge(sp.profile_status)}</div>
        ${sp.profile_status==='active'&&sp.public_slug?`<p><a href="marketplace-seller-page.html?seller=${esc(sp.public_slug)}" target="_blank" rel="noopener">View my public listing ↗</a></p>`:''}
        <div class="logo-row">
          ${sp.logo_object_path?`<img class="logo-preview" src="${esc(publicUrl(sp.logo_object_path))}" alt="Your business logo">`:'<div class="logo-preview logo-preview-empty">No logo yet</div>'}
          <form id="logo-upload-form" class="dialog-actions">
            <label>Business logo <span>JPEG, PNG, WebP, or an iPhone photo (HEIC); 5 MB max</span><input data-field="logo-file" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" required></label>
            <button class="primary" type="submit">${sp.logo_object_path?'Replace logo':'Upload logo'}</button>
          </form>
        </div>
        <form id="profile-form" class="onboarding-form">
          <label>Business name<input id="pf-business-name" value="${esc(sp.business_name)}" ${canEdit?'':'disabled'} required></label>
          <label>Short description<textarea id="pf-short-description">${esc(sp.short_description||'')}</textarea></label>
          <label>Long description <span>Shown in the About section of your public page</span><textarea id="pf-long-description">${esc(sp.long_description||'')}</textarea></label>
          <label>Page tone <span>How your public page looks — the directory itself always stays the current dark green</span>
            <div class="check-grid">${Object.entries(THEME_LABELS).map(([key,text])=>`<label><input type="radio" name="pf-theme" value="${key}" ${sp.page_theme===key?'checked':''}> ${text}</label>`).join('')}</div>
          </label>
          <label>Why shop with you? <span>Up to 3 reasons buyers should choose you — shown on your public page. Leave blank to use our default copy.</span></label>
          <input id="pf-why-1" placeholder="Reason 1" value="${esc((sp.why_shop_points||[])[0]||'')}">
          <input id="pf-why-2" placeholder="Reason 2" value="${esc((sp.why_shop_points||[])[1]||'')}">
          <input id="pf-why-3" placeholder="Reason 3" value="${esc((sp.why_shop_points||[])[2]||'')}">
          <div class="dialog-actions"><button class="primary" type="submit">Save changes</button></div>
        </form>
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
        <div class="list">${state.data.categoryAssignments.map(a=>`<article class="list-item"><span class="list-icon" aria-hidden="true">✦</span><div><h3>${esc(categoryName(state,a.category_id))}</h3><p>${a.is_primary?'Primary':'Secondary'}</p></div><button class="danger" data-remove-category="${a.id}">Remove</button></article>`).join('')||'<p class="eyebrow">No categories yet</p>'}</div>
        ${available.length?`<form id="add-category-form" class="dialog-actions" style="margin-top:14px"><select id="new-category">${available.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select><button class="primary" type="submit">Add</button></form>`:''}
      </section>
      <section class="panel">
        <div class="panel-header"><div><h2>Payment methods</h2><p>Shown on your public page so buyers know how to pay you directly.</p></div></div>
        <div class="list">${state.data.paymentMethods.map(m=>`<article class="list-item"><span class="list-icon" aria-hidden="true">$</span><div><h3>${esc(PAYMENT_LABELS[m.method_type]||label(m.method_type))}</h3><p>${esc(m.label)}</p></div><button class="danger" data-remove-payment="${m.id}">Remove</button></article>`).join('')||'<p class="eyebrow">No payment methods added yet</p>'}</div>
        <form id="add-payment-form" class="onboarding-form" style="margin-top:14px">
          <label>Type<select id="new-payment-type">${Object.entries(PAYMENT_LABELS).map(([k,t])=>`<option value="${k}">${t}</option>`).join('')}</select></label>
          <label>Label or handle<input id="new-payment-label" placeholder="e.g. @cypresscreek or (352) 555-0142" required></label>
          <label>Link <span>Optional — e.g. a PayPal.me or Cash App link</span><input id="new-payment-link" type="url" placeholder="https://paypal.me/…"></label>
          <div class="dialog-actions"><button class="primary" type="submit">Add payment method</button></div>
        </form>
      </section>
    </aside>
  </div>`;
}

function listingCard(item){
  const images=item.seller_listing_images||[];
  return `<article class="req-card">
    <div class="meta-row"><span class="status-badge ${item.is_active?'':'private'}">${item.is_active?'Visible':'Hidden'}</span><span class="tag">${esc(label(item.listing_type))}</span></div>
    <h3>${esc(item.title)}</h3>
    ${item.price_label?`<p><strong>${esc(item.price_label)}</strong></p>`:''}
    ${item.description?`<p>${esc(item.description)}</p>`:''}
    <div class="listing-photos">${images.map(img=>`<span class="listing-photo"><img src="${esc(publicUrl(img.object_path))}" alt=""><button type="button" data-delete-listing-image="${img.id}" aria-label="Remove photo">×</button></span>`).join('')}</div>
    <form data-listing-image-form="${item.id}" class="dialog-actions" style="margin-top:10px">
      <input data-field="file" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif">
      <button class="primary" type="submit">Add photo</button>
    </form>
    <div class="actions" style="margin-top:10px">
      <button data-toggle-listing-active="${item.id}" data-active="${!item.is_active}">${item.is_active?'Hide from public page':'Make visible'}</button>
      <button class="danger" data-delete-listing="${item.id}">Delete</button>
    </div>
  </article>`;
}

export function listings(state){
  const items=state.data.listings;
  return `${heading('Listings','What you sell','Add products or services with a price and photos — buyers see these on your public page.')}
  <section class="panel">
    <div class="panel-header"><h2>Add a listing</h2></div>
    <form id="add-listing-form" class="onboarding-form">
      <label>Type<select id="new-listing-type"><option value="product">Product</option><option value="service">Service</option></select></label>
      <label>Title<input id="new-listing-title" required></label>
      <label>Description<textarea id="new-listing-description"></textarea></label>
      <label>Price <span>Free text — e.g. "$8 each" or "Call for a quote"</span><input id="new-listing-price" placeholder="$8 each"></label>
      <div class="dialog-actions"><button class="primary" type="submit">Add listing</button></div>
    </form>
  </section>
  ${items.length?`<div class="card-grid" style="margin-top:18px">${items.map(listingCard).join('')}</div>`:empty('No listings yet','Add your first product or service using the form above.')}`;
}

export function requirements(state){
  const items=state.data.requirementAssignments;
  if(!items.length)return `${heading('Compliance','Requirements','Requirements are assigned automatically based on your categories.')}${empty('No requirements yet','Add a category on the Status tab to see what applies to your business.')}`;
  return `${heading('Compliance','Requirements','Submit an attestation or upload a document for each requirement below.')}
  <div class="card-grid">${items.map(r=>{
    const req=r.compliance_requirements||{};
    const attestation=state.data.attestations.find(a=>a.requirement_assignment_id===r.id);
    const creds=state.data.credentials.filter(c=>c.requirement_assignment_id===r.id);
    return `<article class="req-card">
      <div class="meta-row">${badge(r.assignment_status)}<span class="tag">${esc(label(req.requirement_type))}</span></div>
      <h3>${esc(req.title)}</h3>
      <p>${esc(req.description)}</p>
      ${r.waived_reason?`<p><strong>Note:</strong> ${esc(r.waived_reason)}</p>`:''}
      ${attestation?`<p><strong>Your attestation:</strong> ${esc(attestation.attestation_text)}</p>`:''}
      <form data-attestation-form="${r.id}" class="dialog-actions" style="margin-top:10px">
        <textarea placeholder="Attest that you meet this requirement…" required></textarea>
        <button class="primary" type="submit">Submit attestation</button>
      </form>
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
  return `${heading('Programs','Link your creators','Show off work from your own Creation Station Portfolio on your seller profile.')}
  <div class="list">${creators.map(c=>{
    const aff=state.data.creatorAffiliations.find(a=>a.creator_id===c.id);
    const isMinor=['young_6_12','teen_13_17'].includes(c.age_band);
    return `<article class="list-item"><span class="list-icon" aria-hidden="true">${isMinor?'✦':'◇'}</span><div><h3>${esc(c.display_name)}</h3><p>${aff?(aff.is_public?'Public':'Private'):'Not linked'}${aff&&isMinor?(aff.parent_approved_at?' · Parent approved':' · Needs parent approval to go public'):''}</p></div>${aff?`<button data-toggle-affiliation="${aff.id}" data-public="${!aff.is_public}">${aff.is_public?'Make private':'Make public'}</button>`:`<button data-link-creator="${c.id}">Link to profile</button>`}</article>`;
  }).join('')||'<p class="eyebrow">No Creation Station profiles linked to this account yet</p>'}</div>
  ${state.identity.household?`<section class="panel" style="margin-top:18px"><div class="panel-header"><h2>Household</h2></div>${(()=>{const h=state.data.householdAffiliations[0];return h?`<p>${esc(state.identity.household.household_name||'Your household')} — ${h.is_public?'Public':'Private'}</p><button data-toggle-household="${h.id}" data-public="${!h.is_public}">${h.is_public?'Make private':'Make public'}</button>`:`<button data-link-household="${state.identity.household.id}">Link household to profile</button>`})()}</section>`:''}
  <section class="panel" style="margin-top:18px">
    <div class="panel-header"><h2>Rebel Ranch Academy</h2><span class="status-badge private">Coming soon</span></div>
    <p>Once Rebel Ranch Academy programs are live, you'll be able to link your coursework here too.</p>
  </section>`;
}

export function notifications(state){
  const items=state.data.notifications;
  if(!items.length)return `${heading('Notifications','Updates','You will see application and requirement updates here.')}${empty('Nothing yet','Notifications about your application and requirements will appear here.')}`;
  const unreadIds=items.filter(n=>!n.is_read).map(n=>n.id);
  return `${heading('Notifications','Updates',`${unreadIds.length} unread`,unreadIds.length?'<button class="primary" data-action="mark-all-read">Mark all read</button>':'')}
  <div class="list">${items.map(n=>`<article class="list-item"><span class="list-icon" aria-hidden="true">${n.is_read?'✓':'●'}</span><div><h3>${esc(n.title)}</h3><p>${esc(n.body||'')}</p><small>${new Date(n.created_at).toLocaleString()}</small></div>${n.is_read?'':`<button data-mark-read="${n.id}">Mark read</button>`}</article>`).join('')}</div>`;
}

export function messages(state){
  const items=state.data.inquiries;
  if(!items.length)return `${heading('Messages','Buyer inquiries','Direct Messages from buyers who find you through Rebel Ranch Marketplace show up here — no spam, no noise, straight sales.')}${empty('No messages yet','Once your page is public, buyer inquiries will appear here.')}`;
  const unreadIds=items.filter(m=>!m.is_read).map(m=>m.id);
  return `${heading('Messages','Buyer inquiries',`${unreadIds.length} unread`)}
  <div class="list">${items.map(m=>`<article class="list-item"><span class="list-icon" aria-hidden="true">${m.is_read?'✓':'●'}</span><div><h3>${esc(m.sender_name)} <span class="tag" style="margin-left:6px">${m.sender_is_member?'Member':'Non-member'}</span></h3><p>${esc(m.message)}</p>${m.sender_contact?`<p><strong>Contact:</strong> ${esc(m.sender_contact)}</p>`:''}<small>${new Date(m.created_at).toLocaleString()}</small></div>${m.is_read?'':`<button data-mark-inquiry-read="${m.id}">Mark read</button>`}</article>`).join('')}</div>`;
}

export function history(state){
  const items=state.data.reviewEvents;
  if(!items.length)return `${heading('History','Review history','Every status change on your application and profile will be recorded here.')}${empty('No history yet','Once your application moves through review, each step will show up here.')}`;
  return `${heading('History','Review history','A record of every status change on your application and profile.')}
  <div class="list">${items.map(e=>`<article class="list-item"><span class="list-icon" aria-hidden="true">↺</span><div><h3>${e.from_status?`${label(e.from_status)} → ${label(e.to_status)}`:label(e.to_status)}</h3><p>${e.note?esc(e.note):''}</p><small>${new Date(e.recorded_at).toLocaleString()}</small></div></article>`).join('')}</div>`;
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
  </div>`;
}

export const renderers={status,listings,requirements,programs,messages,notifications,history,admin};
