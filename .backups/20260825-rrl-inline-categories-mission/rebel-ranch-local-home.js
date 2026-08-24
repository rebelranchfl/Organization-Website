import {supabase} from './supabase-client.js';

const state={sellers:[],categories:[],regions:[],filter:'all',term:'',categoryId:''};
const $=id=>document.getElementById(id);
const esc=(v='')=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const initials=name=>(name||'').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'?';
const publicUrl=path=>supabase.storage.from('marketplace-seller-public').getPublicUrl(path).data.publicUrl;
const categoryImages={
  'handmade-goods':'handmade-goods.webp','produce':'produce.webp','herbal-natural-remedies':'herbal-natural-remedies.webp',
  'meat-poultry':'meat-poultry.webp','classes-workshops':'classes-workshops.webp','trades-services':'trades-services.webp',
  'baked-goods':'baked-goods.webp','art-photography':'art-photography.webp','eggs-dairy':'eggs-dairy.webp'
};
const categoryImage=slug=>`assets/brand/Rebel%20Ranch%20Local/interface/categories/${categoryImages[slug]||'handmade-goods.webp'}`;

function categoryNames(sp){return (sp.seller_category_assignments||[]).map(a=>a.marketplace_categories?.name).filter(Boolean)}
function regionLabel(sp){const r=state.regions.find(x=>x.id===sp.region_id);return r?(r.state_code?`${r.region_name}, ${r.state_code}`:r.region_name):''}
function isService(sp){return categoryNames(sp).some(n=>/(service|repair|hvac|electric|plumb|lawn|clean|fenc|carp|mechan|auto|barn|trade)/i.test(n))}
function isGoods(sp){return categoryNames(sp).some(n=>/(hand|craft|candle|soap|tinct|art|jewel|home|beauty|goods|maker)/i.test(n))}
function matchDoor(sp,filter){if(filter==='all')return true;if(filter==='marketplace')return ['food_farm','both'].includes(sp.marketplace_path);if(filter==='goods')return ['goods_services_handmade','both'].includes(sp.marketplace_path)&&isGoods(sp);if(filter==='services')return ['goods_services_handmade','both'].includes(sp.marketplace_path)&&isService(sp);return true}
function matchesSearch(sp){if(!state.term)return true;const hay=[sp.business_name,sp.short_description,sp.long_description,regionLabel(sp),categoryNames(sp).join(' ')].filter(Boolean).join(' ').toLowerCase();return hay.includes(state.term)}
function matchesCategory(sp){if(!state.categoryId)return true;return (sp.seller_category_assignments||[]).some(a=>String(a.category_id)===String(state.categoryId)||String(a.marketplace_categories?.id)===String(state.categoryId))}

function sellerCard(sp){const cats=categoryNames(sp);const meta=[cats[0],regionLabel(sp)].filter(Boolean).join(' · ');return `<a class="rrl-seller-card" href="marketplace-seller-page.html?seller=${encodeURIComponent(sp.public_slug)}"><div class="rrl-seller-mark">${sp.logo_object_path?`<img src="${esc(publicUrl(sp.logo_object_path))}" alt="">`:esc(initials(sp.business_name))}</div><div class="rrl-card-body"><span class="rrl-card-label">${esc(cats[0]||'Local')}</span><h3>${esc(sp.business_name)}</h3>${sp.short_description?`<p>${esc(sp.short_description)}</p>`:''}${meta?`<p class="rrl-meta">${esc(meta)}</p>`:''}</div></a>`}

function renderSellers(){const grid=$('rrl-featured-grid');if(!grid)return;const rows=state.sellers.filter(sp=>matchDoor(sp,state.filter)&&matchesSearch(sp)&&matchesCategory(sp));if(!rows.length){grid.innerHTML=`<div class="rrl-empty"><strong>No matching local listings yet.</strong><p>Try another search or category. If you provide this locally, you can be one of the first listed.</p></div>`;return}grid.innerHTML=rows.slice(0,10).map(sellerCard).join('')}

function renderCategories(){const row=$('rrl-category-row');if(!row)return;const top=state.categories.slice(0,9);row.innerHTML=top.map(c=>`<button class="rrl-category" type="button" data-category-id="${esc(c.id)}"><span class="rrl-category-photo" style="background-image:url('${categoryImage(c.slug)}')" aria-hidden="true"></span>${esc(c.name)}</button>`).join('')+`<a class="rrl-category rrl-category-all" href="marketplace-directory.html"><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg></span>All Categories</a>`;row.querySelectorAll('[data-category-id]').forEach(btn=>btn.addEventListener('click',()=>{state.categoryId=btn.dataset.categoryId;state.term='';$('rrl-search').value='';row.querySelectorAll('.rrl-category').forEach(x=>x.classList.remove('active'));btn.classList.add('active');renderSellers();$('rrl-featured').scrollIntoView({behavior:'smooth'})}))}

function wire(){document.querySelectorAll('[data-rrl-door]').forEach(btn=>btn.addEventListener('click',()=>{state.filter=btn.dataset.rrlDoor;state.categoryId='';document.querySelectorAll('.rrl-category').forEach(x=>x.classList.remove('active'));renderSellers();$('rrl-featured').scrollIntoView({behavior:'smooth'})}));const form=$('rrl-search-form');form?.addEventListener('submit',e=>{e.preventDefault();state.term=$('rrl-search').value.trim().toLowerCase();state.categoryId='';renderSellers();$('rrl-featured').scrollIntoView({behavior:'smooth'})});$('rrl-search')?.addEventListener('input',e=>{if(!e.target.value){state.term='';renderSellers()}})}

async function init(){wire();const [{data:categories},{data:regions},{data:sellerRows,error}]=await Promise.all([supabase.from('marketplace_categories').select('id,name,slug').eq('is_active',true).order('sort_order'),supabase.from('marketplace_regions').select('id,region_name,state_code').eq('is_active',true).order('region_name'),supabase.from('seller_profiles').select('id,business_name,public_slug,marketplace_path,short_description,long_description,logo_object_path,region_id,seller_category_assignments(is_primary,category_id,marketplace_categories(id,name,slug))').order('business_name')]);state.categories=categories||[];state.regions=regions||[];state.sellers=(sellerRows||[]).filter(x=>x.public_slug);renderCategories();renderSellers();const status=$('rrl-live-status');if(status){status.textContent=error?'Marketplace listings are temporarily unavailable.':state.sellers.length?`${state.sellers.length} local listing${state.sellers.length===1?'':'s'} currently available.`:'Founding sellers are being added now.'}}
init();
