import {supabase} from './supabase-client.js';

const esc=(v='')=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const grid=document.getElementById('seller-directory-grid');

async function init(){
  const {data,error}=await supabase.from('seller_profiles')
    .select('business_name,public_slug,marketplace_path,short_description,seller_category_assignments(is_primary,marketplace_categories(name))')
    .order('business_name');

  const sellers=(data||[]).filter(sp=>sp.public_slug);

  if(error||!sellers.length){
    grid.innerHTML=`<div class="card goldline" style="grid-column:1/-1;text-align:center">
      <h3>The first listing could be yours</h3>
      <p>We're opening the directory to our first vetted sellers now. Check back soon to browse — or if you sell locally, apply today and be one of the first ones buyers see.</p>
      <a class="btn gold" href="marketplace-seller-dashboard.html" style="margin-top:14px;display:inline-block">Apply as a Seller</a>
    </div>`;
    return;
  }

  grid.innerHTML=sellers.map(sp=>{
    const assignments=sp.seller_category_assignments||[];
    const primary=assignments.find(c=>c.is_primary)||assignments[0];
    const categoryName=primary?.marketplace_categories?.name||'';
    return `<a class="card" href="marketplace-seller-page.html?seller=${encodeURIComponent(sp.public_slug)}" style="text-decoration:none;display:block">
      <h3>${esc(sp.business_name)}</h3>
      ${categoryName?`<p>${esc(categoryName)}</p>`:''}
      ${sp.short_description?`<p>${esc(sp.short_description)}</p>`:''}
    </a>`;
  }).join('');
}

if(grid)init();
