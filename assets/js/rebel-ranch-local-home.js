import {supabase} from './supabase-client.js';

const state={sellers:[],categories:[],regions:[],filter:'all',term:'',categoryId:'',categoriesExpanded:false};
const $=id=>document.getElementById(id);
const esc=(v='')=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const initials=name=>(name||'').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'?';
const publicUrl=path=>supabase.storage.from('marketplace-seller-public').getPublicUrl(path).data.publicUrl;
const categoryImages={
  'handmade-goods':'handmade-goods.webp','produce':'produce.webp','herbal-natural-remedies':'herbal-natural-remedies.webp',
  'meat-poultry':'meat-poultry.webp','classes-workshops':'classes-workshops.webp','trades-services':'trades-services.webp',
  'baked-goods':'baked-goods.webp','art-photography':'art-photography.webp','eggs-dairy':'eggs-dairy.webp',
  'honey':'honey.webp','plants-nursery':'plants-nursery.webp','value-added-foods':'value-added-foods.webp',
  'pet-care-grooming':'pet-care-grooming.webp','automotive-services':'automotive-services.webp',
  'cleaning-lawn-care':'cleaning-lawn-care.webp','childcare-tutoring':'childcare-tutoring.webp','other':'other.webp'
};
const categoryImage=slug=>`assets/brand/Rebel%20Ranch%20Local/interface/categories/${categoryImages[slug]||'other.webp'}`;

function categoryNames(sp){return (sp.seller_category_assignments||[]).map(a=>a.marketplace_categories?.name).filter(Boolean)}
function regionLabel(sp){const r=state.regions.find(x=>x.id===sp.region_id);return r?(r.state_code?`${r.region_name}, ${r.state_code}`:r.region_name):''}
function isService(sp){return categoryNames(sp).some(n=>/(service|repair|hvac|electric|plumb|lawn|clean|fenc|carp|mechan|auto|barn|trade)/i.test(n))}
function isGoods(sp){return categoryNames(sp).some(n=>/(hand|craft|candle|soap|tinct|art|jewel|home|beauty|goods|maker)/i.test(n))}
function matchDoor(sp,filter){if(filter==='all')return true;if(filter==='marketplace')return ['food_farm','both'].includes(sp.marketplace_path);if(filter==='goods')return ['goods_services_handmade','both'].includes(sp.marketplace_path)&&isGoods(sp);if(filter==='services')return ['goods_services_handmade','both'].includes(sp.marketplace_path)&&isService(sp);return true}
function matchesSearch(sp){if(!state.term)return true;const hay=[sp.business_name,sp.short_description,sp.long_description,regionLabel(sp),categoryNames(sp).join(' ')].filter(Boolean).join(' ').toLowerCase();return hay.includes(state.term)}
function matchesCategory(sp){if(!state.categoryId)return true;return (sp.seller_category_assignments||[]).some(a=>String(a.category_id)===String(state.categoryId)||String(a.marketplace_categories?.id)===String(state.categoryId))}

function activeFilterLabel(){
  if(state.categoryId){const c=state.categories.find(x=>String(x.id)===String(state.categoryId));return c?c.name:''}
  if(state.filter==='marketplace')return 'the marketplace';
  if(state.filter==='goods')return 'goods';
  if(state.filter==='services')return 'services';
  return ''
}
function inviteAskPhrase(){
  if(state.categoryId){const c=state.categories.find(x=>String(x.id)===String(state.categoryId));return c?`sells ${c.name.toLowerCase()}`:'sells or offers a service locally'}
  if(state.filter==='marketplace')return 'sells local food, farm products, or pantry staples';
  if(state.filter==='goods')return 'makes handmade goods';
  if(state.filter==='services')return 'offers local services';
  return 'sells or offers a service locally'
}

async function shareLink(text){
  const url=location.href.split('#')[0].split('?')[0];
  if(navigator.share){
    try{await navigator.share({title:'Rebel Ranch Local',text,url});return false}
    catch(e){return false}
  }
  try{await navigator.clipboard.writeText(`${text} ${url}`);return true}
  catch(e){return false}
}
function bindShareButtons(){
  document.querySelectorAll('.rrl-invite-link[data-share-text]').forEach(btn=>{
    if(btn.dataset.bound)return;
    btn.dataset.bound='1';
    btn.addEventListener('click',async()=>{
      const original=btn.textContent;
      const copied=await shareLink(btn.dataset.shareText);
      if(copied){btn.textContent='Link copied!';setTimeout(()=>{btn.textContent=original},2200)}
    });
  });
}

function showFeatured(){const section=$('rrl-featured');if(!section)return;section.hidden=false;section.scrollIntoView({behavior:'smooth'})}

function sellerCard(sp){const cats=categoryNames(sp);const meta=[cats[0],regionLabel(sp)].filter(Boolean).join(' · ');return `<a class="rrl-seller-card" href="marketplace-seller-page.html?seller=${encodeURIComponent(sp.public_slug)}"><div class="rrl-seller-mark">${sp.logo_object_path?`<img src="${esc(publicUrl(sp.logo_object_path))}" alt="">`:esc(initials(sp.business_name))}</div><div class="rrl-card-body"><span class="rrl-card-label">${esc(cats[0]||'Local')}</span><h3>${esc(sp.business_name)}</h3>${sp.short_description?`<p>${esc(sp.short_description)}</p>`:''}${meta?`<p class="rrl-meta">${esc(meta)}</p>`:''}</div></a>`}

function renderSellers(){
  const grid=$('rrl-featured-grid');if(!grid)return;
  const rows=state.sellers.filter(sp=>matchDoor(sp,state.filter)&&matchesSearch(sp)&&matchesCategory(sp));
  if(!rows.length){
    const label=activeFilterLabel();
    const shareText=`I'd love to see this on Rebel Ranch Local — know anyone who ${inviteAskPhrase()}?`;
    grid.innerHTML=`<div class="rrl-empty"><strong>No sellers yet${label?` for ${esc(label)}`:''}.</strong><p>Know someone who sells this? Send them an invite.</p><button type="button" class="rrl-invite-link" data-share-text="${esc(shareText)}">Send an invite →</button></div>`;
    bindShareButtons();
    return;
  }
  grid.innerHTML=rows.slice(0,10).map(sellerCard).join('');
}

function categoryCard(c){return `<button class="rrl-category" type="button" data-category-id="${esc(c.id)}"><span class="rrl-category-photo" style="background-image:url('${categoryImage(c.slug)}')" aria-hidden="true"></span><span class="rrl-category-label">${esc(c.name)}</span></button>`}
function bindCategoryButtons(){document.querySelectorAll('[data-category-id]').forEach(btn=>btn.addEventListener('click',()=>{state.categoryId=btn.dataset.categoryId;state.filter='all';state.term='';$('rrl-search').value='';document.querySelectorAll('.rrl-category').forEach(x=>x.classList.remove('active'));btn.classList.add('active');showFeatured();renderSellers()}))}
function renderCategories(){
  const row=$('rrl-category-row');const expanded=$('rrl-category-expanded');
  if(!row||!expanded)return;
  const count=state.categories.length+1;
  row.innerHTML=`<button class="rrl-category rrl-category-all" type="button" aria-expanded="${state.categoriesExpanded}" aria-controls="rrl-category-expanded"><span class="rrl-category-all-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg></span><span class="rrl-category-label">${state.categoriesExpanded?'Show fewer categories':`Browse all categories (${count})`}</span></button>`;
  expanded.innerHTML=state.categories.map(categoryCard).join('')+`<button class="rrl-category" type="button" data-category-door="services"><span class="rrl-category-photo" style="background-image:url('${categoryImage('trades-services')}')" aria-hidden="true"></span><span class="rrl-category-label">Services</span></button>`;
  expanded.hidden=!state.categoriesExpanded;
  bindCategoryButtons();
  expanded.querySelector('[data-category-door="services"]')?.addEventListener('click',e=>{state.filter='services';state.categoryId='';state.term='';$('rrl-search').value='';document.querySelectorAll('.rrl-category').forEach(x=>x.classList.remove('active'));e.currentTarget.classList.add('active');showFeatured();renderSellers()});
  row.querySelector('.rrl-category-all')?.addEventListener('click',()=>{state.categoriesExpanded=!state.categoriesExpanded;renderCategories();if(state.categoriesExpanded)expanded.scrollIntoView({behavior:'smooth',block:'nearest'})});
}

function wire(){
  const menu=document.querySelector('.rrl-menu-toggle');
  const nav=document.querySelector('.rrl-nav');
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav?.classList.toggle('is-open',open)});
  nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Open navigation');nav.classList.remove('is-open')}));
  const mobileDoors=matchMedia('(max-width:560px)');
  const syncDoors=()=>document.querySelectorAll('.rrl-door').forEach(door=>{if(mobileDoors.matches)door.removeAttribute('open');else door.setAttribute('open','')});
  syncDoors();
  mobileDoors.addEventListener?.('change',syncDoors);
  document.querySelectorAll('.rrl-door').forEach(door=>door.addEventListener('toggle',()=>{if(!mobileDoors.matches||!door.open)return;document.querySelectorAll('.rrl-door').forEach(other=>{if(other!==door)other.removeAttribute('open')})}));
  document.querySelectorAll('[data-rrl-door]').forEach(btn=>btn.addEventListener('click',()=>{state.filter=btn.dataset.rrlDoor;state.categoryId='';document.querySelectorAll('.rrl-category').forEach(x=>x.classList.remove('active'));showFeatured();renderSellers()}));
  const form=$('rrl-search-form');
  form?.addEventListener('submit',e=>{e.preventDefault();state.term=$('rrl-search').value.trim().toLowerCase();state.categoryId='';showFeatured();renderSellers()});
  $('rrl-search')?.addEventListener('input',e=>{if(!e.target.value){state.term='';renderSellers()}});
  document.querySelectorAll('a[href="#rrl-featured"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showFeatured()}));
  bindShareButtons();
}

async function init(){
  wire();
  const [{data:categories},{data:regions},{data:sellerRows,error}]=await Promise.all([supabase.from('marketplace_categories').select('id,name,slug').eq('is_active',true).order('sort_order'),supabase.from('marketplace_regions').select('id,region_name,state_code').eq('is_active',true).order('region_name'),supabase.from('seller_profiles').select('id,business_name,public_slug,marketplace_path,short_description,long_description,logo_object_path,region_id,seller_category_assignments(is_primary,category_id,marketplace_categories(id,name,slug))').order('business_name')]);
  state.categories=categories||[];
  state.regions=regions||[];
  state.sellers=(sellerRows||[]).filter(x=>x.public_slug);
  renderCategories();
  renderSellers();
  const status=$('rrl-live-status');
  if(status){status.textContent=error?'Marketplace listings are temporarily unavailable.':state.sellers.length?`${state.sellers.length} local listing${state.sellers.length===1?'':'s'} currently available.`:'Founding sellers are being added now.'}
}
init();
