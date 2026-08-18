import {supabase} from './supabase-client.js';

const esc=(v='')=>{const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML};
const grid=document.getElementById('seller-directory-grid');
const eyebrowEl=document.getElementById('seller-directory-eyebrow');
const headingEl=document.getElementById('seller-directory-heading');
const descriptionEl=document.getElementById('seller-directory-description');
const prevBtn=document.getElementById('seller-directory-prev');
const nextBtn=document.getElementById('seller-directory-next');

function updateCarouselNav(){
  if(!prevBtn||!nextBtn)return;
  const canScroll=grid.scrollWidth>grid.clientWidth+4;
  prevBtn.hidden=!canScroll;
  nextBtn.hidden=!canScroll;
}
if(prevBtn)prevBtn.onclick=()=>grid.scrollBy({left:-grid.clientWidth,behavior:'smooth'});
if(nextBtn)nextBtn.onclick=()=>grid.scrollBy({left:grid.clientWidth,behavior:'smooth'});
if(grid){grid.addEventListener('scroll',updateCarouselNav);window.addEventListener('resize',updateCarouselNav)}

async function init(){
  const {data,error}=await supabase.from('seller_profiles')
    .select('business_name,public_slug,marketplace_path,short_description,seller_category_assignments(is_primary,marketplace_categories(name))')
    .order('business_name');

  const sellers=(data||[]).filter(sp=>sp.public_slug);

  if(error||!sellers.length){
    if(eyebrowEl)eyebrowEl.textContent='Now Accepting Applications';
    if(headingEl)headingEl.textContent='Accepting Marketplace Applications Now';
    if(descriptionEl)descriptionEl.textContent="We're reviewing applications for our very first sellers right now. Check back soon — or apply today and be one of the first ones buyers see.";
    grid.innerHTML=`<div class="card founding-card">
      <h3>The First Listing Could Be Yours</h3>
      <p>Apply today and be one of the first sellers buyers see when the directory opens.</p>
      <a class="btn gold" href="marketplace-seller-dashboard.html">Apply as a Seller</a>
    </div>`;
    return;
  }

  if(eyebrowEl)eyebrowEl.textContent='Browse The Marketplace';
  if(headingEl)headingEl.textContent='Real Local Sellers';
  if(descriptionEl)descriptionEl.textContent="Farms, makers, homesteaders, tradespeople, side hustles, and small local businesses — not chains, not resellers. Every seller here is a real neighbor, reviewed by Rebel Ranch Ministries before they're listed. Contact sellers directly — payment and pickup happen between you and them, never through Rebel Ranch Ministries.";

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
  grid.dataset.count=String(sellers.length);
  updateCarouselNav();
}

if(grid)init();
