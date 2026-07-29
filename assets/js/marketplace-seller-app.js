import {loadSellerIdentity,loadSellerWorkspace,loadSellerAdminSummary,loadApplicationDetail,actions,adminActions} from './marketplace-seller-data.js';
import {renderers} from './marketplace-seller-views.js';

const $=id=>document.getElementById(id);
const state={identity:null,data:null,adminData:null,view:'status',busy:false};
const routes=['status','requirements','affiliations','messages','notifications','history','admin'];

function message(text,error=false){
  const el=$('app-status');
  el.textContent=text;
  el.className=`notice${error?' error':''}`;
  el.classList.remove('hidden');
  clearTimeout(message.timer);
  message.timer=setTimeout(()=>el.classList.add('hidden'),7000);
}

function showAccess(title,copy,label='Go to My Account',href='account.html'){
  $('loading').classList.add('hidden');
  $('create-profile').classList.add('hidden');
  $('workspace').classList.add('hidden');
  $('access-title').textContent=title;
  $('access-copy').textContent=copy;
  $('access-link').textContent=label;
  $('access-link').href=href;
  $('access-state').classList.remove('hidden');
}

function isEligible(view){if(view==='admin')return state.identity.isAdmin;return routes.includes(view)}
function eligibleViews(){
  const views=[['status','Status'],['requirements','Requirements'],['affiliations','Affiliations'],['messages','Messages'],['notifications','Notifications'],['history','History']];
  if(state.identity.isAdmin)views.push(['admin','Admin']);
  return views;
}
function chooseInitial(){const hash=location.hash.slice(1);if(routes.includes(hash)&&isEligible(hash))return hash;return'status'}

function updateSwitcher(){
  const el=$('view-switcher');
  el.innerHTML=eligibleViews().map(([key,label])=>`<button type="button" data-view="${key}" aria-pressed="${state.view===key}">${label}</button>`).join('');
  el.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>navigate(b.dataset.view));
}

function navigate(view){
  if(!isEligible(view)){message('That view is not available for this account.',true);return}
  state.view=view;
  location.hash=view;
  render();
  $('screen').focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'smooth'});
}

function render(){
  const renderer=renderers[state.view]||renderers.status;
  $('screen').innerHTML=renderer(state);
  bindScreen();
  updateSwitcher();
}

async function withBusy(button,work){
  if(state.busy)return;
  state.busy=true;
  const old=button?.textContent;
  if(button){button.disabled=true;button.textContent='Working…'}
  try{await work()}
  catch(e){message(e.message||'That action could not be completed.',true)}
  finally{state.busy=false;if(button){button.disabled=false;button.textContent=old}}
}

async function refresh(){
  state.data=await loadSellerWorkspace(state.identity);
  if(state.identity.isAdmin)state.adminData=await loadSellerAdminSummary();
  render();
}

function friendlyError(e){
  if(e?.message==='seller_creator_affiliation_requires_parent_approval')
    return 'This creator is a minor — only their parent/guardian account can make this affiliation public.';
  return e?.message||'That action could not be completed.';
}

function bindScreen(){
  const root=$('screen');

  const profileForm=root.querySelector('#profile-form');
  if(profileForm)profileForm.onsubmit=e=>{
    e.preventDefault();
    withBusy(e.submitter,async()=>{
      const updates={
        business_name:$('pf-business-name').value.trim(),
        short_description:$('pf-short-description').value.trim(),
        long_description:$('pf-long-description').value.trim(),
        page_theme:profileForm.querySelector('input[name="pf-theme"]:checked')?.value||state.identity.sellerProfile.page_theme
      };
      const {error}=await actions.updateSellerProfile(state.identity,updates);
      if(error)throw error;
      state.identity.sellerProfile={...state.identity.sellerProfile,...updates};
      await refresh();
      message('Profile updated.');
    });
  };

  root.querySelectorAll('[data-action="submit-application"]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const app=state.data.applications[0];
    const {error}=await actions.submitApplication(state.identity,app.id);
    if(error)throw error;
    await refresh();
    message('Application submitted for review.');
  }));

  root.querySelectorAll('[data-action="withdraw-application"]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const app=state.data.applications[0];
    const {error}=await actions.withdrawApplication(state.identity,app.id);
    if(error)throw error;
    await refresh();
    message('Application withdrawn.');
  }));

  root.querySelectorAll('[data-remove-category]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await actions.removeCategory(state.identity,b.dataset.removeCategory);
    if(error)throw error;
    await refresh();
    message('Category removed.');
  }));

  const addCategoryForm=root.querySelector('#add-category-form');
  if(addCategoryForm)addCategoryForm.onsubmit=e=>{
    e.preventDefault();
    withBusy(e.submitter,async()=>{
      const {error}=await actions.assignCategory(state.identity,$('new-category').value);
      if(error)throw error;
      await refresh();
      message('Category added.');
    });
  };

  const addPaymentForm=root.querySelector('#add-payment-form');
  if(addPaymentForm)addPaymentForm.onsubmit=e=>{
    e.preventDefault();
    withBusy(e.submitter,async()=>{
      const fields={
        method_type:$('new-payment-type').value,
        label:$('new-payment-label').value.trim(),
        link_url:$('new-payment-link').value.trim()
      };
      if(!fields.label)throw new Error('Enter a label or handle for this payment method.');
      const {error}=await actions.addPaymentMethod(state.identity,fields);
      if(error)throw error;
      await refresh();
      message('Payment method added.');
    });
  };

  root.querySelectorAll('[data-remove-payment]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await actions.removePaymentMethod(state.identity,b.dataset.removePayment);
    if(error)throw error;
    await refresh();
    message('Payment method removed.');
  }));

  root.querySelectorAll('[data-mark-inquiry-read]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await actions.markInquiryRead(state.identity,b.dataset.markInquiryRead);
    if(error)throw error;
    await refresh();
  }));

  root.querySelectorAll('[data-attestation-form]').forEach(form=>form.onsubmit=e=>{
    e.preventDefault();
    const assignmentId=form.dataset.attestationForm;
    withBusy(e.submitter,async()=>{
      const text=form.querySelector('textarea').value.trim();
      if(!text)throw new Error('Enter an attestation before submitting.');
      const {error}=await actions.submitAttestation(state.identity,assignmentId,text);
      if(error)throw error;
      await refresh();
      message('Attestation submitted.');
    });
  });

  root.querySelectorAll('[data-credential-form]').forEach(form=>form.onsubmit=e=>{
    e.preventDefault();
    const assignmentId=form.dataset.credentialForm;
    withBusy(e.submitter,async()=>{
      const file=form.querySelector('[data-field="file"]').files[0];
      if(!file)throw new Error('Choose a document to upload.');
      if(file.size>10485760)throw new Error('File is larger than 10 MB.');
      const fields={
        requirement_assignment_id:assignmentId,
        credential_type:form.querySelector('[data-field="credential_type"]').value.trim(),
        issuing_authority:form.querySelector('[data-field="issuing_authority"]').value.trim(),
        expires_at:form.querySelector('[data-field="expires_at"]').value||null
      };
      const result=await actions.uploadCredential(state.identity,file,fields);
      if(result.error)throw result.error;
      form.reset();
      await refresh();
      message('Document uploaded — pending verification.');
    });
  });

  root.querySelectorAll('[data-link-creator]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await actions.linkCreatorAffiliation(state.identity,b.dataset.linkCreator);
    if(error)throw error;
    await refresh();
    message('Creator linked to your seller profile.');
  }));

  root.querySelectorAll('[data-toggle-affiliation]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const isPublic=b.dataset.public==='true';
    const {error}=await actions.setCreatorAffiliationPublic(state.identity,b.dataset.toggleAffiliation,isPublic);
    if(error){message(friendlyError(error),true);return}
    await refresh();
    message(isPublic?'Affiliation is now public.':'Affiliation is now private.');
  }));

  root.querySelectorAll('[data-link-household]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await actions.linkHouseholdAffiliation(state.identity,b.dataset.linkHousehold);
    if(error)throw error;
    await refresh();
    message('Household linked to your seller profile.');
  }));

  root.querySelectorAll('[data-toggle-household]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const isPublic=b.dataset.public==='true';
    const {error}=await actions.setHouseholdAffiliationPublic(state.identity,b.dataset.toggleHousehold,isPublic);
    if(error){message(friendlyError(error),true);return}
    await refresh();
    message(isPublic?'Household is now public.':'Household is now private.');
  }));

  root.querySelectorAll('[data-mark-read]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await actions.markNotificationRead(state.identity,b.dataset.markRead);
    if(error)throw error;
    await refresh();
  }));

  root.querySelectorAll('[data-action="mark-all-read"]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const ids=state.data.notifications.filter(n=>!n.is_read).map(n=>n.id);
    const {error}=await actions.markAllNotificationsRead(state.identity,ids);
    if(error)throw error;
    await refresh();
    message('All notifications marked read.');
  }));

  root.querySelectorAll('[data-review-application]').forEach(b=>b.onclick=()=>openReviewDialog(b.dataset.reviewApplication,b.dataset.seller));
  root.querySelectorAll('[data-verify-credential]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await adminActions.verifyCredential(b.dataset.verifyCredential);
    if(error)throw error;
    await refresh();
    message('Document verified.');
  }));
  root.querySelectorAll('[data-reject-credential]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await adminActions.rejectCredential(b.dataset.rejectCredential);
    if(error)throw error;
    await refresh();
    message('Document rejected.');
  }));
  root.querySelectorAll('[data-waive-requirement]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const reason=prompt('Reason for waiving this requirement:');
    if(!reason)return;
    const {error}=await adminActions.waiveRequirement(b.dataset.waiveRequirement,reason);
    if(error)throw error;
    await refresh();
    message('Requirement waived.');
  }));
  root.querySelectorAll('[data-na-requirement]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const reason=prompt('Why is this requirement not applicable?');
    if(!reason)return;
    const {error}=await adminActions.markNotApplicable(b.dataset.naRequirement,reason);
    if(error)throw error;
    await refresh();
    message('Requirement marked not applicable.');
  }));
}

async function openReviewDialog(applicationId,sellerProfileId){
  const detail=await loadApplicationDetail(sellerProfileId,applicationId);
  $('review-title').textContent=detail.sellerProfile.business_name;
  $('review-body').innerHTML=`
    <p><strong>Type:</strong> ${detail.application.application_type} · <strong>Producer status:</strong> ${detail.application.producer_status||'—'}</p>
    <p>${detail.application.applicant_notes||''}</p>
    <p><strong>Categories:</strong> ${detail.categories.map(c=>c.marketplace_categories?.name).filter(Boolean).join(', ')||'None'}</p>
    <p><strong>Requirements:</strong></p>
    <ul>${detail.requirements.map(r=>`<li>${r.compliance_requirements?.title||'Requirement'} — ${r.assignment_status}</li>`).join('')||'<li>None</li>'}</ul>
  `;
  $('review-approve').onclick=()=>withBusy($('review-approve'),async()=>{
    const {error}=await adminActions.decideApplication(applicationId,'approved',null);
    if(error)throw error;
    $('review-dialog').close();
    await refresh();
    message('Application approved.');
  });
  $('review-reject').onclick=()=>withBusy($('review-reject'),async()=>{
    const note=prompt('Reason for rejecting:');
    if(!note)return;
    const {error}=await adminActions.decideApplication(applicationId,'rejected',note);
    if(error)throw error;
    $('review-dialog').close();
    await refresh();
    message('Application rejected.');
  });
  $('review-changes').onclick=()=>withBusy($('review-changes'),async()=>{
    const note=prompt('What changes are needed?');
    if(!note)return;
    const {error}=await adminActions.decideApplication(applicationId,'changes_requested',note);
    if(error)throw error;
    $('review-dialog').close();
    await refresh();
    message('Changes requested.');
  });
  $('review-dialog').showModal();
}

function bindOnboardingForm(){
  const pathSelect=$('ob-marketplace-path');
  const categoryList=$('ob-categories');
  function renderCategoryOptions(){
    const path=pathSelect.value;
    const options=state.identity.categories.filter(c=>c.path_group===path||c.path_group==='both');
    categoryList.innerHTML=options.map((c,i)=>`<label><input type="radio" name="ob-primary-category" value="${c.id}" ${i===0?'checked':''}> ${c.name}</label>`).join('')||'<p class="eyebrow">No categories available for this path yet</p>';
  }
  pathSelect.onchange=renderCategoryOptions;
  renderCategoryOptions();

  const regionSelect=$('ob-region');
  regionSelect.innerHTML=`<option value="">Not sure yet</option>${state.identity.regions.map(r=>`<option value="${r.id}">${r.region_name}</option>`).join('')}`;

  $('create-profile-form').onsubmit=e=>{
    e.preventDefault();
    withBusy(e.submitter,async()=>{
      const primaryCategoryId=$('create-profile-form').querySelector('input[name="ob-primary-category"]:checked')?.value;
      const payload={
        business_name:$('ob-business-name').value.trim(),
        marketplace_path:$('ob-marketplace-path').value,
        short_description:$('ob-short-description').value.trim(),
        region_id:$('ob-region').value||null,
        category_ids:primaryCategoryId?[primaryCategoryId]:[],
        primary_category_id:primaryCategoryId,
        legal_business_name:$('ob-legal-business-name').value.trim(),
        entity_type:$('ob-entity-type').value||null,
        contact_phone:$('ob-contact-phone').value.trim(),
        producer_status:$('ob-producer-status').value||null,
        applicant_notes:$('ob-applicant-notes').value.trim()
      };
      const {error}=await actions.createSellerProfile(state.identity,payload);
      if(error)throw error;
      state.identity=await loadSellerIdentity();
      state.data=await loadSellerWorkspace(state.identity);
      if(state.identity.isAdmin)state.adminData=await loadSellerAdminSummary();
      $('create-profile').classList.add('hidden');
      $('workspace').classList.remove('hidden');
      state.view='status';
      render();
      message('Seller profile created. Review your application before submitting.');
    });
  };
}

$('signout').onclick=async()=>{await actions.signOut();location.href='account.html'};
window.addEventListener('hashchange',()=>{
  const v=location.hash.slice(1);
  if(v!==state.view&&isEligible(v)){state.view=v;render()}
});

async function init(){
  try{
    state.identity=await loadSellerIdentity();
    if(!state.identity)return showAccess('Sign in to continue','Your seller dashboard is protected by your Rebel Ranch Ministries account.');
    $('loading').classList.add('hidden');
    if(!state.identity.sellerProfile){
      $('create-profile').classList.remove('hidden');
      bindOnboardingForm();
      return;
    }
    state.data=await loadSellerWorkspace(state.identity);
    if(state.identity.isAdmin)state.adminData=await loadSellerAdminSummary();
    state.view=chooseInitial();
    $('workspace').classList.remove('hidden');
    render();
  }catch(e){
    showAccess('Your dashboard could not load',e.message||'Check your network connection and try again.','Try again',location.href);
  }
}
init();
