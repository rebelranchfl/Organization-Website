import {loadSellerIdentity,loadSellerWorkspace,loadSellerAdminSummary,loadApplicationDetail,actions,adminActions} from './marketplace-seller-data.js';
import {renderers,banners,statusStrip,orderResponseBody} from './marketplace-seller-views.js';
import {supabase} from './supabase-client.js';

const $=id=>document.getElementById(id);
const state={identity:null,data:null,adminData:null,view:'status',busy:false,orderFilter:{window:'24h'}};
const routes=['today','status','listings','orders','questions','notifications','history','kpis','admin'];
const oneSignalAppId='3d048078-bf37-42ff-a1b7-3c1994cc62af';
let oneSignalClient=null;

function connectOrderAlerts(userId){
  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(async OneSignal=>{
    try{
      await OneSignal.init({appId:oneSignalAppId,allowLocalhostAsSecureOrigin:false});
      await OneSignal.login(userId);
      oneSignalClient=OneSignal;
      const button=$('enable-order-alerts');
      const update=()=>{
        const enabled=OneSignal.Notifications.permission;
        button.textContent=enabled?'Order alerts enabled':'Enable order alerts';
        button.disabled=enabled;
        button.classList.remove('hidden');
      };
      update();
      OneSignal.Notifications.addEventListener('permissionChange',update);
    }catch(error){console.error('OneSignal setup failed',error)}
  });
}

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
function navGroups(){
  const unreadQuestions=(state.data?.inquiries||[]).filter(i=>!i.responded_at).length;
  const unreadNotifications=(state.data?.notifications||[]).filter(n=>!n.is_read).length;
  const groups=[
    {key:'today',label:'Today'},
    {key:'orders',label:'Orders'},
    {key:'questions',label:`Questions${unreadQuestions?` (${unreadQuestions})`:''}`},
    {key:'status',label:'Store Details'},
    {key:'listings',label:'Listings & Services'},
    {group:'insights',label:'Insights',children:[['notifications',`Notifications${unreadNotifications?` (${unreadNotifications})`:''}`],['history','History'],['kpis','KPIs']]}
  ];
  if(state.identity.isAdmin)groups.push({key:'admin',label:'Admin'});
  return groups;
}
function chooseInitial(){const hash=location.hash.slice(1);if(routes.includes(hash)&&isEligible(hash))return hash;return'today'}

function closeNavGroups(){document.querySelectorAll('.nav-group-menu.open').forEach(m=>m.classList.remove('open'))}

function updateSwitcher(){
  const el=$('view-switcher');
  el.innerHTML=navGroups().map(g=>{
    if(g.group){
      const active=g.children.some(([k])=>k===state.view);
      return `<div class="nav-group"><button type="button" class="nav-group-toggle" aria-pressed="${active}" aria-expanded="false" data-nav-group="${g.group}">${g.label} ▾</button><div class="nav-group-menu" id="nav-group-${g.group}">${g.children.map(([k,label])=>`<button type="button" data-view="${k}" aria-pressed="${state.view===k}">${label}</button>`).join('')}</div></div>`;
    }
    return `<button type="button" data-view="${g.key}" aria-pressed="${state.view===g.key}">${g.label}</button>`;
  }).join('');
  el.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{navigate(b.dataset.view);closeNavGroups()});
  el.querySelectorAll('[data-nav-group]').forEach(b=>b.onclick=(event)=>{
    event.stopPropagation();
    const menu=$(`nav-group-${b.dataset.navGroup}`);
    const willOpen=!menu.classList.contains('open');
    closeNavGroups();
    if(willOpen){menu.classList.add('open');b.setAttribute('aria-expanded','true')}
  });
}
document.addEventListener('click',(event)=>{if(!event.target.closest('.nav-group'))closeNavGroups()});
document.addEventListener('keydown',(event)=>{if(event.key==='Escape')closeNavGroups()});

function navigate(view){
  if(!isEligible(view)){message('That view is not available for this account.',true);return}
  state.view=view;
  location.hash=view;
  render();
  $('screen').focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderBanners(){
  const el=$('dashboard-banners');
  if(!el)return;
  el.innerHTML=banners(state);
  el.querySelectorAll('[data-dismiss-banner]').forEach(b=>b.onclick=()=>{
    try{localStorage.setItem(`rrl_seller_banner_${state.identity.sellerProfile.id}_${b.dataset.dismissBanner}`,b.dataset.dismissValue||'1')}catch{}
    renderBanners();
  });
}

function render(){
  const renderer=renderers[state.view]||renderers.status;
  $('screen').innerHTML=renderer(state);
  bindScreen();
  updateSwitcher();
  renderBanners();
  const statusEl=$('status-strip');
  if(statusEl)statusEl.innerHTML=statusStrip(state);
}

async function withBusy(button,work){
  if(state.busy)return;
  state.busy=true;
  const old=button?.textContent;
  if(button){button.disabled=true;button.textContent='Working…'}
  try{await work()}
  catch(e){message(friendlyError(e),true)}
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
  if(e?.message==='requirements_still_pending')
    return 'This seller still has pending compliance requirements. Wait for the seller to submit their attestation, verify any uploaded documents, or waive/mark N/A on the Admin tab before approving.';
  if(e?.message==='application_not_awaiting_review')
    return 'This application is no longer awaiting review — refresh and try again.';
  if(e?.message?.includes('listing_limit_reached'))
    return `You've used all ${state.identity.sellerProfile.listing_limit} of your free listings. Contact Rebel Ranch Ministries to add more.`;
  return e?.message||'That action could not be completed.';
}

function bindScreen(){
  const root=$('screen');

  const profileForm=root.querySelector('#profile-form');
  if(profileForm)profileForm.onsubmit=e=>{
    e.preventDefault();
    withBusy(e.submitter,async()=>{
      const whyShopPoints=[$('pf-why-1').value.trim(),$('pf-why-2').value.trim(),$('pf-why-3').value.trim()].filter(Boolean);
      const updates={
        business_name:$('pf-business-name').value.trim(),
        short_description:$('pf-short-description').value.trim(),
        long_description:$('pf-long-description').value.trim(),
        why_shop_points:whyShopPoints.length?whyShopPoints:null
      };
      const {data,error}=await actions.saveDraftProfile(state.identity,updates);
      if(error)throw error;
      state.identity.sellerProfile=data;
      await refresh();
      message('Saved as a draft — publish when ready to make it live.');
    });
  };

  const logoForm=root.querySelector('#logo-upload-form');
  if(logoForm)logoForm.onsubmit=e=>{
    e.preventDefault();
    withBusy(e.submitter,async()=>{
      const file=logoForm.querySelector('[data-field="logo-file"]').files[0];
      if(!file)throw new Error('Choose an image to upload.');
      if(file.size>5242880)throw new Error('Image is larger than 5 MB.');
      const result=await actions.uploadLogoDraft(state.identity,file);
      if(result.error)throw result.error;
      state.identity.sellerProfile=result.data;
      logoForm.reset();
      await refresh();
      message('Logo saved as a draft — publish when ready to make it live.');
    });
  };

  root.querySelectorAll('[data-action="publish-profile"]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {data,error}=await actions.publishSellerProfile(state.identity);
    if(error)throw error;
    if(data)state.identity.sellerProfile=data;
    await refresh();
    message('Changes are now live on your public page.');
  }));

  root.querySelectorAll('[data-action="discard-profile-draft"]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    if(!confirm('Discard your unpublished changes? This cannot be undone.'))return;
    const {data,error}=await actions.discardDraftProfile(state.identity);
    if(error)throw error;
    if(data)state.identity.sellerProfile=data;
    await refresh();
    message('Draft discarded.');
  }));

  const addListingForm=root.querySelector('#add-listing-form');
  if(addListingForm)addListingForm.onsubmit=e=>{
    e.preventDefault();
    withBusy(e.submitter,async()=>{
      const fields={
        listing_type:$('new-listing-type').value,
        title:$('new-listing-title').value.trim(),
        description:$('new-listing-description').value.trim(),
        price_label:$('new-listing-price').value.trim(),unit_price:$('new-listing-unit-price').value||null,price_type:$('new-listing-price-type').value
      };
      if(!fields.title)throw new Error('Enter a title for this listing.');
      const {error}=await actions.createListing(state.identity,fields);
      if(error)throw error;
      addListingForm.reset();
      await refresh();
      message('Listing added.');
    });
  };

  root.querySelectorAll('[data-toggle-listing-active]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const isActive=b.dataset.active==='true';
    const {error}=await actions.setListingActive(state.identity,b.dataset.toggleListingActive,isActive);
    if(error)throw error;
    await refresh();
    message(isActive?'Listing is now visible on your public page.':'Listing is now hidden from your public page.');
  }));

  root.querySelectorAll('[data-delete-listing]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    if(!confirm('Delete this listing and its photos? This cannot be undone.'))return;
    const {error}=await actions.deleteListing(state.identity,b.dataset.deleteListing);
    if(error)throw error;
    await refresh();
    message('Listing deleted.');
  }));

  root.querySelectorAll('[data-listing-image-form]').forEach(form=>form.onsubmit=e=>{
    e.preventDefault();
    const listingId=form.dataset.listingImageForm;
    withBusy(e.submitter,async()=>{
      const file=form.querySelector('[data-field="file"]').files[0];
      if(!file)throw new Error('Choose a photo to upload.');
      if(file.size>5242880)throw new Error('Photo is larger than 5 MB.');
      const result=await actions.uploadListingImage(state.identity,listingId,file);
      if(result.error)throw result.error;
      form.reset();
      await refresh();
      message('Photo uploaded.');
    });
  });

  root.querySelectorAll('[data-delete-listing-image]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await actions.deleteListingImage(state.identity,b.dataset.deleteListingImage);
    if(error)throw error;
    await refresh();
    message('Photo removed.');
  }));

  root.querySelectorAll('[data-quantity-form]').forEach(form=>form.onsubmit=e=>{
    e.preventDefault();
    const listingId=form.dataset.quantityForm;
    withBusy(e.submitter,async()=>{
      const raw=form.querySelector('[data-field="quantity"]').value;
      const quantity=raw.trim()===''?null:Math.max(0,parseInt(raw,10)||0);
      const {error}=await actions.updateListingQuantity(state.identity,listingId,quantity);
      if(error)throw error;
      await refresh();
      message(quantity===null?'Stock set to unlimited.':`Stock updated to ${quantity}.`);
    });
  });

  root.querySelectorAll('[data-goto-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.gotoView;location.hash=state.view;render();window.scrollTo({top:0,behavior:'smooth'})});

  root.querySelectorAll('[data-edit-listing-form]').forEach(form=>form.onsubmit=e=>{
    e.preventDefault();
    const listingId=form.dataset.editListingForm;
    const listing=state.data.listings.find(l=>l.id===listingId);
    withBusy(e.submitter,async()=>{
      const unitPriceRaw=form.querySelector('[data-field="unit_price"]').value;
      const updates={
        title:form.querySelector('[data-field="title"]').value.trim(),
        description:form.querySelector('[data-field="description"]').value.trim()||null,
        price_label:form.querySelector('[data-field="price_label"]').value.trim()||null,
        price_type:form.querySelector('[data-field="price_type"]').value,
        unit_price:unitPriceRaw===''?null:Number(unitPriceRaw)
      };
      if(!updates.title)throw new Error('Enter a title for this listing.');
      const {error}=await actions.saveDraftListing(state.identity,listingId,listing?.draft_data,updates);
      if(error)throw error;
      await refresh();
      message('Saved as a draft — publish when ready to make it live.');
    });
  });

  root.querySelectorAll('[data-publish-listing]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const listing=state.data.listings.find(l=>l.id===b.dataset.publishListing);
    const {error}=await actions.publishListing(state.identity,b.dataset.publishListing,listing?.draft_data);
    if(error)throw error;
    await refresh();
    message('Listing changes are now live on your public page.');
  }));

  root.querySelectorAll('[data-discard-listing-draft]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    if(!confirm('Discard your unpublished changes to this listing? This cannot be undone.'))return;
    const {error}=await actions.discardDraftListing(state.identity,b.dataset.discardListingDraft);
    if(error)throw error;
    await refresh();
    message('Draft discarded.');
  }));

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

  root.querySelectorAll('[data-move-category]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const list=[...state.data.categoryAssignments];
    const idx=list.findIndex(a=>a.id===b.dataset.moveCategory);
    const to=idx+(b.dataset.direction==='up'?-1:1);
    if(idx<0||to<0||to>=list.length)return;
    [list[idx],list[to]]=[list[to],list[idx]];
    const {error}=await actions.reorderCategories(state.identity,list.map(a=>a.id));
    if(error)throw error;
    await refresh();
    message('Category order saved.');
  }));

  const addCategoryForm=root.querySelector('#add-category-form');
  if(addCategoryForm)addCategoryForm.onsubmit=e=>{
    e.preventDefault();
    withBusy(e.submitter,async()=>{
      const nextOrder=state.data.categoryAssignments.length;
      const {error}=await actions.assignCategory(state.identity,$('new-category').value,false,nextOrder);
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

  root.querySelectorAll('[data-mark-inquiry-responded]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await actions.markInquiryResponded(state.identity,b.dataset.markInquiryResponded);
    if(error)throw error;
    await refresh();
    message('Marked as responded.');
  }));

  const listingFilterSelect=root.querySelector('#listing-filter');
  if(listingFilterSelect)listingFilterSelect.onchange=()=>{state.listingFilter=listingFilterSelect.value;render()};

  const notifFilterSelect=root.querySelector('#notif-filter');
  if(notifFilterSelect)notifFilterSelect.onchange=()=>{state.notifFilter=notifFilterSelect.value;render()};

  const historyWindowSelect=root.querySelector('#history-window');
  if(historyWindowSelect)historyWindowSelect.onchange=()=>{state.historyFilter={window:historyWindowSelect.value};render()};

  const orderWindowSelect=root.querySelector('#order-window');
  if(orderWindowSelect)orderWindowSelect.onchange=()=>{state.orderFilter={window:orderWindowSelect.value};render()};

  const fulfillmentForm=root.querySelector('#fulfillment-form');
  if(fulfillmentForm)fulfillmentForm.onsubmit=e=>{e.preventDefault();withBusy(e.submitter,async()=>{const {error}=await actions.saveFulfillment(state.identity,{offers_pickup:$('fulfill-pickup').checked,offers_delivery:$('fulfill-delivery').checked,offers_meetup:$('fulfill-meetup').checked,offers_shipping:$('fulfill-shipping').checked,public_notes:$('fulfill-notes').value.trim()||null});if(error)throw error;await refresh();message('Fulfillment options updated.');})};
  root.querySelectorAll('[data-order-action]').forEach(b=>b.onclick=()=>{
    const status=b.dataset.orderAction,orderId=b.dataset.orderId;
    if(['accepted','change_proposed'].includes(status)){openOrderResponseDialog(orderId,status);return}
    withBusy(b,async()=>{
      const updates={status,is_read:true};
      if(status==='declined'&&!confirm('Decline this order?'))return;
      const {error}=await actions.updateOrder(state.identity,orderId,updates);
      if(error)throw error;
      await refresh();
      message(`Order marked ${status.replaceAll('_',' ')}.`);
    });
  });
  root.querySelectorAll('[data-order-photo]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{const result=await actions.getOrderPhotoUrl(b.dataset.orderPhoto);if(result.error)throw result.error;window.open(result.data.signedUrl,'_blank','noopener');}));

  root.querySelectorAll('[data-propose-date-form]').forEach(form=>form.onsubmit=e=>{
    e.preventDefault();
    const orderId=form.dataset.proposeDateForm;
    withBusy(e.submitter,async()=>{
      const value=form.querySelector('[data-field="proposed-date"]').value||null;
      const {error}=await actions.updateOrder(state.identity,orderId,{seller_proposed_date:value});
      if(error)throw error;
      await refresh();
      message(value?'Proposed date saved.':'Proposed date cleared.');
    });
  });

  root.querySelectorAll('[data-pack-item]').forEach(cb=>cb.onchange=()=>withBusy(null,async()=>{
    const [orderId,idx]=cb.dataset.packItem.split(':');
    const order=state.data.orders.find(o=>o.id===orderId);
    if(!order)return;
    const items=(order.items||[]).map((x,i)=>i===Number(idx)?{...x,packed:cb.checked}:x);
    const {error}=await actions.updateOrder(state.identity,orderId,{items});
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
  root.querySelectorAll('[data-pause-seller]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await adminActions.pauseSeller(b.dataset.pauseSeller);
    if(error)throw error;
    await refresh();
    message('Seller paused — removed from the public directory.');
  }));
  root.querySelectorAll('[data-archive-seller]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    if(!confirm('Archive this seller? They will be removed from the public directory until reactivated.'))return;
    const {error}=await adminActions.archiveSeller(b.dataset.archiveSeller);
    if(error)throw error;
    await refresh();
    message('Seller archived.');
  }));
  root.querySelectorAll('[data-reactivate-seller]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await adminActions.reactivateSeller(b.dataset.reactivateSeller);
    if(error)throw error;
    await refresh();
    message('Seller reactivated.');
  }));
  root.querySelectorAll('[data-log-traffic]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const views=prompt(`Page views from Google Analytics for ${b.dataset.businessName} (today):`);
    if(views===null||views.trim()==='')return;
    const pageViews=Math.max(0,parseInt(views,10)||0);
    const {error}=await adminActions.logStorefrontViews(b.dataset.logTraffic,pageViews,new Date().toISOString().slice(0,10));
    if(error)throw error;
    await refresh();
    message(`Logged ${pageViews} views for ${b.dataset.businessName}.`);
  }));
  root.querySelectorAll('[data-spotlight-seller]').forEach(b=>b.onclick=()=>withBusy(b,async()=>{
    const {error}=await adminActions.spotlightSeller(b.dataset.spotlightSeller,b.dataset.businessName);
    if(error)throw error;
    await refresh();
    message(`${b.dataset.businessName} added to this week's Shop Spotlight — finish it in the Social Content Hub.`);
  }));
}

function openOrderResponseDialog(orderId,defaultStatus){
  const order=state.data.orders.find(o=>o.id===orderId);
  if(!order)return;
  $('order-response-title').textContent=`Order #${order.order_number} — ${order.buyer_name}`;
  $('order-response-body').innerHTML=orderResponseBody(order);
  $('order-response-body').querySelectorAll('[data-full-qty]').forEach(cb=>cb.onchange=()=>{
    const input=$('order-response-body').querySelector(`[data-confirm-qty="${cb.dataset.fullQty}"]`);
    input.disabled=cb.checked;
    if(cb.checked)input.value=order.items[cb.dataset.fullQty].quantity;
  });
  const submit=(status)=>withBusy(null,async()=>{
    const body=$('order-response-body');
    const items=(order.items||[]).map((x,i)=>({...x,confirmed_quantity:Number(body.querySelector(`[data-confirm-qty="${i}"]`).value)||0}));
    const updates={status,is_read:true,items};
    const total=body.querySelector('#or-total').value;
    if(total)updates.confirmed_total=Number(total);
    const details=body.querySelector('#or-details').value.trim();
    if(details)updates.fulfillment_details=details;
    const payment=body.querySelector('#or-payment').value.trim();
    if(payment)updates.payment_instructions=payment;
    const note=body.querySelector('#or-note').value.trim();
    if(note)updates.seller_note=note;
    const {error}=await actions.updateOrder(state.identity,orderId,updates);
    if(error){message(friendlyError(error),true);return}
    $('order-response-dialog').close();
    await refresh();
    message(`Order marked ${status.replaceAll('_',' ')}.`);
  });
  $('order-response-accept').onclick=()=>submit('accepted');
  $('order-response-propose').onclick=()=>submit('change_proposed');
  $('order-response-decline').onclick=()=>{if(confirm('Decline this order?'))submit('declined')};
  $('order-response-dialog').showModal();
}

async function openReviewDialog(applicationId,sellerProfileId){
  const detail=await loadApplicationDetail(sellerProfileId,applicationId);
  const pendingCount=detail.requirements.filter(r=>r.assignment_status==='pending').length;
  $('review-title').textContent=detail.sellerProfile.business_name;
  $('review-body').innerHTML=`
    <p><strong>Type:</strong> ${detail.application.application_type} · <strong>Producer status:</strong> ${detail.application.producer_status||'—'}</p>
    <p>${detail.application.applicant_notes||''}</p>
    <p><strong>Categories:</strong> ${detail.categories.map(c=>c.marketplace_categories?.name).filter(Boolean).join(', ')||'None'}</p>
    <p><strong>Requirements:</strong></p>
    <ul>${detail.requirements.map(r=>`<li>${r.compliance_requirements?.title||'Requirement'} — ${r.assignment_status}</li>`).join('')||'<li>None</li>'}</ul>
    ${pendingCount?`<p class="status-badge negative">${pendingCount} requirement(s) still pending — resolve them before approving.</p>`:''}
  `;
  $('review-approve').disabled=pendingCount>0;
  $('review-approve').title=pendingCount>0?'Resolve every pending requirement before approving.':'';
  $('review-approve').onclick=()=>withBusy($('review-approve'),async()=>{
    const {error}=await adminActions.approveApplication(applicationId);
    if(error){message(friendlyError(error),true);return}
    $('review-dialog').close();
    await refresh();
    message('Application approved — the seller is now active with a public listing.');
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

function showAccountStep(){$('account-step').classList.remove('hidden');$('business-step').classList.add('hidden')}
function showBusinessStep(){$('account-step').classList.add('hidden');$('business-step').classList.remove('hidden')}

async function afterSignedIn(){
  if(!state.identity.sellerProfile){showBusinessStep();bindOnboardingForm();return}
  state.data=await loadSellerWorkspace(state.identity);
  if(state.identity.isAdmin)state.adminData=await loadSellerAdminSummary();
  $('create-profile').classList.add('hidden');
  $('workspace').classList.remove('hidden');
  state.view=chooseInitial();
  render();
}

function bindAccountStep(){
  const switchEl=$('account-mode-switch');
  const signinForm=$('signin-form');
  const signupForm=$('signup-form');

  switchEl.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
    switchEl.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    signinForm.classList.toggle('hidden',b.dataset.mode!=='signin');
    signupForm.classList.toggle('hidden',b.dataset.mode!=='signup');
  });

  signinForm.onsubmit=e=>{
    e.preventDefault();
    withBusy(e.submitter,async()=>{
      const {error}=await supabase.auth.signInWithPassword({email:$('si-email').value.trim(),password:$('si-password').value});
      if(error)throw error;
      state.identity=await loadSellerIdentity();
      await afterSignedIn();
    });
  };

  $('si-forgot-password').onclick=()=>withBusy($('si-forgot-password'),async()=>{
    const email=$('si-email').value.trim();
    if(!email)throw new Error('Enter your email address above, then choose "Forgot your password?"');
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:'https://rebelranchministries.org/reset-password.html'});
    if(error)throw error;
    message('If an account is associated with that email address, a password-reset message has been sent.');
  });

  signupForm.onsubmit=e=>{
    e.preventDefault();
    withBusy(e.submitter,async()=>{
      const password=$('su-password').value,confirmPassword=$('su-confirm-password').value;
      if(password!==confirmPassword)throw new Error('Passwords do not match.');
      const {error}=await supabase.auth.signUp({
        email:$('su-email').value.trim(),
        password,
        options:{
          emailRedirectTo:'https://rebelranchministries.org/auth-confirm.html?next=marketplace-seller-dashboard.html',
          data:{display_name:$('su-name').value.trim()}
        }
      });
      if(error)throw error;
      signupForm.reset();
      message('Your account request was received. Check your email and use the confirmation link before signing in.');
    });
  };
}

function bindOnboardingForm(){
  const categoryList=$('ob-categories');
  const primarySelect=$('ob-primary-category');

  function renderPrimaryOptions(){
    const checked=[...categoryList.querySelectorAll('input[type=checkbox]:checked')].map(cb=>cb.value);
    primarySelect.innerHTML=checked.map(id=>{
      const c=state.identity.categories.find(x=>x.id===id);
      return `<option value="${id}">${c.name}</option>`;
    }).join('')||'<option value="">Select at least one category first</option>';
  }
  function renderCategoryOptions(){
    categoryList.innerHTML=state.identity.categories.map(c=>`<label><input type="checkbox" name="ob-category" value="${c.id}"> ${c.name}</label>`).join('')||'<p class="eyebrow">No categories available yet</p>';
    categoryList.querySelectorAll('input[type=checkbox]').forEach(cb=>{cb.onchange=renderPrimaryOptions;});
    renderPrimaryOptions();
  }
  renderCategoryOptions();

  const regionSelect=$('ob-region');
  regionSelect.innerHTML=`<option value="">Not sure yet</option>${state.identity.regions.map(r=>`<option value="${r.id}">${r.region_name}</option>`).join('')}`;

  $('create-profile-form').onsubmit=e=>{
    e.preventDefault();
    withBusy(e.submitter,async()=>{
      const categoryIds=[...categoryList.querySelectorAll('input[type=checkbox]:checked')].map(cb=>cb.value);
      if(!categoryIds.length)throw new Error('Select at least one category.');
      const primaryCategoryId=primarySelect.value||categoryIds[0];
      const payload={
        business_name:$('ob-business-name').value.trim(),
        marketplace_path:$('ob-marketplace-path').value,
        short_description:$('ob-short-description').value.trim(),
        region_id:$('ob-region').value||null,
        category_ids:categoryIds,
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

$('enable-order-alerts').onclick=async()=>{
  if(!oneSignalClient){message('Order alerts are still loading. Try again in a moment.',true);return}
  try{await oneSignalClient.Notifications.requestPermission()}
  catch(error){message('Your browser could not enable order alerts. Check its notification settings.',true)}
};
$('signout').onclick=async()=>{if(oneSignalClient)await oneSignalClient.logout();await actions.signOut();location.href='account.html'};
$('header-feedback-btn').onclick=()=>$('feedback-dialog').showModal();
$('feedback-close').onclick=()=>$('feedback-dialog').close();
$('feedback-cancel').onclick=()=>$('feedback-dialog').close();
{
  const menuToggle=$('menu-toggle');
  const accountActions=$('account-actions');
  const closeMenu=()=>{accountActions.classList.remove('open');menuToggle.setAttribute('aria-expanded','false')};
  menuToggle.onclick=(event)=>{
    event.stopPropagation();
    const open=accountActions.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded',String(open));
  };
  document.addEventListener('click',(event)=>{
    if(accountActions.classList.contains('open')&&!accountActions.contains(event.target)&&event.target!==menuToggle){closeMenu()}
  });
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape')closeMenu()});
}
window.addEventListener('hashchange',()=>{
  const v=location.hash.slice(1);
  if(v!==state.view&&isEligible(v)){state.view=v;render()}
});

async function init(){
  try{
    state.identity=await loadSellerIdentity();
    $('loading').classList.add('hidden');
    if(!state.identity){
      $('create-profile').classList.remove('hidden');
      showAccountStep();
      bindAccountStep();
      return;
    }
    if(!state.identity.sellerProfile){
      $('create-profile').classList.remove('hidden');
      showBusinessStep();
      bindOnboardingForm();
      return;
    }
    state.data=await loadSellerWorkspace(state.identity);
    connectOrderAlerts(state.identity.user.id);
    if(state.identity.isAdmin)state.adminData=await loadSellerAdminSummary();
    const sp=state.identity.sellerProfile;
    if(sp.profile_status==='active'&&sp.public_slug){
      const link=$('header-live-link');
      link.href=`marketplace-seller-page.html?seller=${encodeURIComponent(sp.public_slug)}`;
      link.classList.remove('hidden');
    }
    state.view=chooseInitial();
    $('workspace').classList.remove('hidden');
    render();
  }catch(e){
    showAccess('Your dashboard could not load',e.message||'Check your network connection and try again.','Try again',location.href);
  }
}
init();
