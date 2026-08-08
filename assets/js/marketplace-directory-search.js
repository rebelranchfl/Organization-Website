import {supabase} from './supabase-client.js';

const esc=(v='')=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const grid=document.getElementById('directory-grid');
const searchInput=document.getElementById('directory-search');
const categorySelect=document.getElementById('directory-category');
const regionSelect=document.getElementById('directory-region');
const resultCount=document.getElementById('directory-result-count');

function initials(name){
  return (name||'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'?';
}
function publicUrl(path){
  return supabase.storage.from('marketplace-seller-public').getPublicUrl(path).data.publicUrl;
}

let sellers=[];

function sellerCard(sp){
  const categoryNames=(sp.seller_category_assignments||[]).map(a=>a.marketplace_categories?.name).filter(Boolean);
  const primaryCategory=categoryNames[0]||'';
  const regionLabel=sp._regionLabel||'';
  return `<a class="card seller-directory-card" href="marketplace-seller-page.html?seller=${encodeURIComponent(sp.public_slug)}">
    <span class="seller-directory-mark" aria-hidden="true">${sp.logo_object_path?`<img src="${esc(publicUrl(sp.logo_object_path))}" alt="">`:esc(initials(sp.business_name))}</span>
    <span class="seller-directory-info">
      <h3>${esc(sp.business_name)}</h3>
      ${primaryCategory||regionLabel?`<p class="seller-directory-meta">${[primaryCategory,regionLabel].filter(Boolean).map(esc).join(' · ')}</p>`:''}
      ${sp.short_description?`<p>${esc(sp.short_description)}</p>`:''}
    </span>
  </a>`;
}

function founderEmptyState(){
  grid.innerHTML=`<div class="card founding-card">
    <h3>The First Listing Could Be Yours</h3>
    <p>We're reviewing applications for our very first sellers right now. Apply today and be one of the first ones buyers see.</p>
    <a class="button primary" href="marketplace-seller-dashboard.html">Apply as a Seller</a>
  </div>`;
  resultCount.textContent='';
}

function filteredEmptyState(){
  grid.innerHTML=`<div class="card founding-card">
    <h3>No sellers match your search</h3>
    <p>Try clearing your search or filters.</p>
  </div>`;
}

function applyFilters(){
  const term=searchInput.value.trim().toLowerCase();
  const categoryId=categorySelect.value;
  const regionId=regionSelect.value;

  const filtered=sellers.filter(sp=>{
    if(categoryId&&!(sp.seller_category_assignments||[]).some(a=>a.marketplace_categories?.id===categoryId||a.category_id===categoryId))return false;
    if(regionId&&sp.region_id!==regionId)return false;
    if(!term)return true;
    const categoryNames=(sp.seller_category_assignments||[]).map(a=>a.marketplace_categories?.name).filter(Boolean).join(' ');
    const haystack=[sp.business_name,sp.short_description,sp.long_description,categoryNames,sp._regionLabel].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(term);
  });

  if(!filtered.length){filteredEmptyState();return}
  grid.innerHTML=filtered.map(sellerCard).join('');
  resultCount.textContent=`${filtered.length} seller${filtered.length===1?'':'s'}`;
}

function populateFilters(){
  const categoryMap=new Map();
  const regionMap=new Map();
  sellers.forEach(sp=>{
    (sp.seller_category_assignments||[]).forEach(a=>{
      const c=a.marketplace_categories;
      if(c?.id&&!categoryMap.has(c.id))categoryMap.set(c.id,c.name);
    });
    if(sp.region_id&&sp._regionLabel&&!regionMap.has(sp.region_id))regionMap.set(sp.region_id,sp._regionLabel);
  });
  categorySelect.innerHTML='<option value="">All categories</option>'+[...categoryMap.entries()].sort((a,b)=>a[1].localeCompare(b[1])).map(([id,name])=>`<option value="${id}">${esc(name)}</option>`).join('');
  regionSelect.innerHTML='<option value="">All locations</option>'+[...regionMap.entries()].sort((a,b)=>a[1].localeCompare(b[1])).map(([id,label])=>`<option value="${id}">${esc(label)}</option>`).join('');
}

async function init(){
  const [{data:regions},{data:sellerRows,error}]=await Promise.all([
    supabase.from('marketplace_regions').select('id,region_name,state_code').eq('is_active',true).order('region_name'),
    supabase.from('seller_profiles').select('id,business_name,public_slug,marketplace_path,short_description,long_description,logo_object_path,region_id,seller_category_assignments(is_primary,category_id,marketplace_categories(id,name,slug))').order('business_name')
  ]);

  const regionMap=new Map((regions||[]).map(r=>[r.id,r.state_code?`${r.region_name}, ${r.state_code}`:r.region_name]));

  sellers=(sellerRows||[]).filter(sp=>sp.public_slug).map(sp=>({...sp,_regionLabel:regionMap.get(sp.region_id)||''}));

  if(error||!sellers.length){founderEmptyState();return}

  populateFilters();
  applyFilters();

  searchInput.addEventListener('input',applyFilters);
  categorySelect.addEventListener('change',applyFilters);
  regionSelect.addEventListener('change',applyFilters);
}

init();
