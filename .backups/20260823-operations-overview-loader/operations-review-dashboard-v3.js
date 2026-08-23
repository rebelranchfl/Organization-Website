import { supabase } from './supabase-client.js';

let mounted=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtTime=v=>{if(!v)return'No activity yet';const d=new Date(v);if(Number.isNaN(d.getTime()))return v;return d.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});};
const stageLabel=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase()).replace('Product Opportunity Research','Product Opportunity');
const recLabel=v=>({PURSUE_NOW:'Pursue Now',PURSUE_LATER:'Pursue Later',INCORPORATE_BUNDLE:'Bundle / Incorporate',FREE_RESOURCE:'Free Resource',MONITOR:'Monitor',NOT_RECOMMENDED_OWNER_REVIEW:'Owner Review'}[v]||stageLabel(v));

function addCss(){if(document.getElementById('operations-review-dashboard-v3-css'))return;const l=document.createElement('link');l.id='operations-review-dashboard-v3-css';l.rel='stylesheet';l.href='assets/css/operations-review-dashboard-v3.css';document.head.append(l);}
function navButton(label,view){return `<button type="button" data-orv3-view="${view}"><span class="nav-dot"></span>${esc(label)}</button>`;}
function buildSidebar(){
  const aside=document.createElement('aside');aside.className='orv3-shell';aside.innerHTML=`
    <div class="orv3-brand"><img src="assets/brand/Rebel Ranch Ministries/rrm-logo-white.png" alt="Rebel Ranch Ministries"><div><strong>REBEL RANCH</strong><span>Academy</span></div></div>
    <div class="orv3-nav-group"><p class="orv3-nav-title">Operations</p><div class="orv3-nav">${navButton('Overview','overview')}${navButton('Projects','projects')}${navButton('Opportunity Intelligence','opportunity')}${navButton('Audience Intelligence','audience')}${navButton('Product Pipeline','pipeline')}<a href="https://academy.rebelranchministries.org"><span class="nav-dot"></span>Academy Dashboard</a></div></div>
    <div class="orv3-nav-group"><p class="orv3-nav-title">Academy Areas</p><div class="orv3-nav-static">Sustainability & Agriculture</div><div class="orv3-nav-static">Personal Strength & Independence</div><div class="orv3-nav-static">Communication & Emotional Intelligence</div><div class="orv3-nav-static">Business & Operations</div><div class="orv3-nav-static">Money, Finance & Taxes</div><div class="orv3-nav-static">Family, Community & Leadership</div></div>
    <div class="orv3-nav-group"><p class="orv3-nav-title">RRM Programs</p><div class="orv3-nav-static">Marketplace</div><div class="orv3-nav-static">Creation Station</div><div class="orv3-nav-static">Business Freedom</div></div>
    <div class="orv3-sidebar-foot">Faith · Family · Freedom<br>EST 1776</div>`;
  document.body.prepend(aside);
  aside.addEventListener('click',e=>{const b=e.target.closest('[data-orv3-view]');if(!b)return;setView(b.dataset.orv3View);});
}
function setView(view){
  document.body.dataset.view=view==='overview'?'overview':'projects';
  document.querySelectorAll('[data-orv3-view]').forEach(b=>b.classList.toggle('active',b.dataset.orv3View===view));
  if(view==='overview')window.scrollTo({top:0,behavior:'smooth'});
  if(view==='projects')document.querySelector('#content')?.scrollIntoView({behavior:'smooth',block:'start'});
  if(['opportunity','audience','pipeline'].includes(view)){
    document.body.dataset.view='projects';
    const first=document.querySelector('.queue-item');if(first&&!first.classList.contains('active'))first.click();
    setTimeout(()=>{
      const target=view==='opportunity'?document.querySelector('#opportunity-intelligence'):view==='audience'?document.querySelector('#audience-conversion-intelligence'):document.querySelector('.lifecycle-card');
      target?.scrollIntoView({behavior:'smooth',block:'start'});
    },250);
  }
}
function upgradeTopbar(){
  const top=document.querySelector('main>.topbar');if(!top||top.querySelector('.orv3-top-actions'))return;
  const link=top.querySelector('.back-link');if(link)link.remove();
  const actions=document.createElement('div');actions.className='orv3-top-actions';actions.innerHTML=`<span class="orv3-last-updated" id="orv3-updated">Loading live state…</span><button class="button secondary" id="orv3-refresh" type="button">↻ Refresh</button><a class="back-link" href="https://academy.rebelranchministries.org">Academy Dashboard</a><a class="back-link" href="account.html">My Account</a>`;top.append(actions);actions.querySelector('#orv3-refresh').onclick=()=>refreshOverview();
}
async function loadData(){
  const [p,o,r,path,steps]=await Promise.all([
    supabase.from('academy_content_projects').select('project_id,title,learning_area,current_status,workflow_stage,progress_percent,progress_stage,progress_detail,progress_next,progress_updated_at,last_agent,owner_review_status,owner_priority,owner_hold').order('updated_at',{ascending:false}),
    supabase.from('academy_opportunities').select('id,parent_project_id,title,opportunity_key,recommendation,opportunity_score,spin_off_ready,owner_disposition').order('opportunity_score',{ascending:false}),
    supabase.from('academy_opportunity_relationships').select('source_opportunity_id,target_type,target_key,relationship_type'),
    supabase.from('academy_conversion_paths').select('*').order('pathway_score',{ascending:false}),
    supabase.from('academy_conversion_steps').select('*').order('step_order',{ascending:true})
  ]);
  for(const x of [p,o,r,path,steps])if(x.error)throw x.error;
  return{projects:p.data||[],opps:o.data||[],rels:r.data||[],paths:path.data||[],steps:steps.data||[]};
}
function kpi(label,value,sub,cls=''){return `<div class="orv3-kpi ${cls}"><span class="orv3-kpi-label">${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(sub)}</small></div>`;}
function dominantProject(data){
  const counts=new Map();data.opps.forEach(o=>counts.set(o.parent_project_id,(counts.get(o.parent_project_id)||0)+1));
  return [...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||data.projects[0]?.project_id||null;
}
function networkHtml(data,projectId){
  const opps=data.opps.filter(o=>o.parent_project_id===projectId).slice(0,10);const project=data.projects.find(p=>p.project_id===projectId);
  const centerTitle=(project?.title||'Academy Project').replace(/\s*\/.*$/,'');
  const spots=[[50,5],[74,13],[83,36],[78,65],[57,78],[31,79],[8,62],[5,34],[19,12],[50,86]];
  const nodes=opps.map((o,i)=>{const rec=o.owner_disposition||o.recommendation;const cls=rec==='PURSUE_NOW'?'':rec==='PURSUE_LATER'?'later':rec==='NOT_RECOMMENDED_OWNER_REVIEW'?'owner':'monitor';const [x,y]=spots[i]||[50,50];return `<div class="orv3-node ${cls}" style="left:calc(${x}% - 60px);top:${y}%"><strong>${esc(o.title)}</strong><small>${esc(recLabel(rec))} · ${Math.round(Number(o.opportunity_score)||0)}</small></div>`;}).join('');
  const top=opps.slice(0,5).map(o=>`<div class="orv3-top-row"><span>${esc(o.title)}</span><span class="orv3-score">${Math.round(Number(o.opportunity_score)||0)}</span></div>`).join('');
  const counts=['PURSUE_NOW','PURSUE_LATER','INCORPORATE_BUNDLE','MONITOR','NOT_RECOMMENDED_OWNER_REVIEW'].map(k=>[recLabel(k),opps.filter(o=>(o.owner_disposition||o.recommendation)===k).length]);
  return `<div class="orv3-network-wrap"><div class="orv3-network"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${opps.map((_,i)=>{const [x,y]=spots[i]||[50,50];return `<line class="orv3-net-line ${i<4?'strong':''}" x1="50" y1="50" x2="${x}" y2="${Math.min(95,y+8)}"></line>`;}).join('')}</svg><div class="orv3-center">${esc(centerTitle)}</div>${nodes}</div><div><div class="orv3-top-list">${top||'<p class="muted">No structured opportunities yet.</p>'}</div><div class="orv3-summary">${counts.map(([l,v])=>`<div class="orv3-summary-row"><span>${esc(l)}</span><span>${v}</span></div>`).join('')}</div></div></div>`;
}
function pathwayHtml(data,projectId){
  const path=data.paths.find(p=>p.parent_project_id===projectId)||data.paths[0];if(!path)return'<p class="muted">No audience pathway recorded yet.</p>';
  const steps=data.steps.filter(s=>s.path_id===path.id).slice(0,6);
  return `<div class="orv3-path">${steps.map((s,i)=>`<div class="orv3-path-step"><div class="orv3-step-num">${i+1}</div><div class="orv3-step-title">${esc((s.step_type||'Step').replaceAll('_',' '))}<span class="orv3-step-sub">${esc(s.title)}</span></div><div class="orv3-step-copy">${esc(s.value_delivered||s.audience_job||s.cta||'')}</div></div>`).join('')}</div>`;
}
function projectRows(data){return data.projects.slice(0,4).map(p=>`<div class="orv3-project-row"><div><div class="orv3-project-title">${esc(p.project_id)} · ${esc(p.title)}</div><div class="orv3-project-meta">${esc(p.learning_area)} · ${esc(stageLabel(p.workflow_stage||p.progress_stage))}</div></div><div><span class="orv3-stage">${Math.max(0,Math.min(100,Number(p.progress_percent)||0))}%</span><div class="orv3-progress"><span style="width:${Math.max(0,Math.min(100,Number(p.progress_percent)||0))}%"></span></div></div></div>`).join('')||'<p class="muted">No active projects.</p>';}
function activityRows(data){return data.projects.filter(p=>p.progress_updated_at).sort((a,b)=>new Date(b.progress_updated_at)-new Date(a.progress_updated_at)).slice(0,5).map(p=>`<div class="orv3-activity-row"><div><strong>${esc(p.last_agent||'Academy Agent')}</strong><small>${esc(p.project_id)} · ${esc(p.progress_stage||p.workflow_stage||'Working')}</small></div><span class="orv3-state">${esc(fmtTime(p.progress_updated_at))}</span></div>`).join('')||'<p class="muted">No recent activity.</p>';}
function attentionRows(data){
  const rows=[];data.projects.filter(p=>['RESEARCH_REVIEW','PRODUCT_REVIEW','FINAL_PRODUCT_REVIEW'].includes(p.workflow_stage)).slice(0,4).forEach(p=>rows.push({title:`Review ${p.title}`,sub:`${p.project_id} is at ${stageLabel(p.workflow_stage)}.`,id:p.project_id}));
  const weak=data.opps.filter(o=>(o.owner_disposition||o.recommendation)==='NOT_RECOMMENDED_OWNER_REVIEW').length;if(weak)rows.push({title:`${weak} opportunit${weak===1?'y':'ies'} need owner disposition`,sub:'The agent recommends no immediate forward motion; owner review remains authoritative.',id:null});
  return rows.slice(0,5).map(r=>`<div class="orv3-attention-row"><div><strong>${esc(r.title)}</strong><small>${esc(r.sub)}</small></div><button type="button" data-attention-id="${esc(r.id||'')}">Review</button></div>`).join('')||'<p class="muted">Nothing currently needs owner attention.</p>';
}
function overviewHtml(data){
  const active=data.projects.filter(p=>!['LIVE','REJECTED'].includes(p.workflow_stage));const pursue=data.opps.filter(o=>(o.owner_disposition||o.recommendation)==='PURSUE_NOW').length;const queues=active.filter(p=>!p.owner_hold&&['RESEARCH_WORKING','PRODUCT_OPPORTUNITY_RESEARCH','PRODUCT_WORKING','VISUAL_PRODUCTION'].includes(p.workflow_stage)).length;const latest=active.map(p=>p.progress_updated_at).filter(Boolean).sort((a,b)=>new Date(b)-new Date(a))[0];const projectId=dominantProject(data);const project=data.projects.find(p=>p.project_id===projectId);const path=data.paths.find(p=>p.parent_project_id===projectId)||data.paths[0];
  return `<section class="orv3-overview" id="orv3-overview"><div class="orv3-kpis">${kpi('Active Projects',active.length,`${active.filter(p=>['RESEARCH_WORKING','PRODUCT_OPPORTUNITY_RESEARCH','PRODUCT_WORKING','VISUAL_PRODUCTION'].includes(p.workflow_stage)).length} advancing`)}${kpi('Opportunities',data.opps.length,`${pursue} pursue now`)}${kpi('Audience Pathways',data.paths.length,`${data.paths.filter(p=>!['CLOSED_OWNER','HOLD'].includes(p.owner_disposition)).length} active`)}${kpi('Agent Queue',queues,`${queues} actionable`)}${kpi('Last Activity',latest?fmtTime(latest):'—',latest?'Latest project update':'No update yet')}${kpi('System Health','Healthy','Live queries loaded','health')}</div><div class="orv3-intel-grid"><section class="orv3-card"><div class="orv3-card-head"><div><h3>OPPORTUNITY INTELLIGENCE NETWORK</h3><p>${esc(project?.title||projectId||'Academy opportunity map')}</p></div><button class="orv3-link-btn" data-orv3-view="opportunity">View All</button></div>${networkHtml(data,projectId)}</section><section class="orv3-card"><div class="orv3-card-head"><div><h3>AUDIENCE + CONVERSION INTELLIGENCE</h3><p>${esc(path?.title||'Best-fit learner pathway')}</p></div><button class="orv3-link-btn" data-orv3-view="audience">View Details</button></div>${pathwayHtml(data,projectId)}</section></div><div class="orv3-bottom-grid"><section class="orv3-card"><div class="orv3-card-head"><div><h3>ACTIVE PROJECTS</h3></div><button class="orv3-link-btn" data-orv3-view="projects">View All</button></div><div class="orv3-project-list">${projectRows(data)}</div></section><section class="orv3-card"><div class="orv3-card-head"><div><h3>AGENT ACTIVITY</h3><p>Latest project updates</p></div></div><div class="orv3-activity-list">${activityRows(data)}</div></section><section class="orv3-card"><div class="orv3-card-head"><div><h3>WHAT NEEDS YOUR ATTENTION</h3></div></div><div class="orv3-attention-list">${attentionRows(data)}</div></section></div></section>`;
}
function clickProject(id){setView('projects');setTimeout(()=>{const items=[...document.querySelectorAll('.queue-item')];const match=items.find(x=>x.querySelector('.queue-meta')?.textContent.includes(id));match?.click();match?.scrollIntoView({behavior:'smooth',block:'center'});},120);}
async function refreshOverview(){
  const host=document.querySelector('main');if(!host)return;const old=document.querySelector('#orv3-overview');if(old)old.innerHTML='<div class="orv3-card">Refreshing live Academy state…</div>';
  try{const data=await loadData();old?.remove();const top=document.querySelector('main>.topbar');top.insertAdjacentHTML('afterend',overviewHtml(data));document.getElementById('orv3-updated').textContent=`Last updated: ${new Date().toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`;wireOverview();}catch(e){console.error('Operations Review v3',e);if(old)old.innerHTML=`<div class="orv3-card"><strong>Dashboard summary unavailable.</strong><p class="muted">${esc(e.message)}</p></div>`;}
}
function wireOverview(){document.querySelector('#orv3-overview')?.addEventListener('click',e=>{const nav=e.target.closest('[data-orv3-view]');if(nav){setView(nav.dataset.orv3View);return;}const a=e.target.closest('[data-attention-id]');if(a){const id=a.dataset.attentionId;if(id)clickProject(id);else setView('opportunity');}});}
function mount(){
  if(mounted)return;const main=document.querySelector('main'),content=document.querySelector('#content');if(!main||!content)return;
  mounted=true;addCss();document.body.classList.add('orv3');document.body.dataset.view='overview';buildSidebar();upgradeTopbar();refreshOverview();setView('overview');
}
const observer=new MutationObserver(()=>{const content=document.querySelector('#content');if(content&&!content.classList.contains('hidden'))mount();});
observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
if(document.querySelector('#content')&&!document.querySelector('#content').classList.contains('hidden'))mount();
