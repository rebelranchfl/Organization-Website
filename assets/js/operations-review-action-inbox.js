import { supabase } from './supabase-client.js';

const REVIEW_STAGES=new Set(['RESEARCH_REVIEW','PRODUCT_REVIEW','FINAL_PRODUCT_REVIEW']);
const STAGE_LABELS={IDEA:'Idea + Context',RESEARCH_WORKING:'Research',RESEARCH_REVIEW:'Research Review',PRODUCT_OPPORTUNITY_RESEARCH:'Product Opportunity',PRODUCT_WORKING:'Product Design',PRODUCT_REVIEW:'Product Review',VISUAL_PRODUCTION:'Visual Production',FINAL_PRODUCT_REVIEW:'Final Product Review',AWAITING_RELEASE:'Release Prep',PUBLISHING:'Publishing',LIVE:'Live'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stageLabel=v=>STAGE_LABELS[v]||String(v||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const stageUrl=(p,hash='')=>`academy-stage-review.html?project=${encodeURIComponent(p.project_id)}&stage=${encodeURIComponent(p.workflow_stage)}${hash?`#${hash}`:''}`;
const reviewHash=p=>p.workflow_stage==='FINAL_PRODUCT_REVIEW'?'final-acceptance':'review-content';
let running=false;
let actionData=null;

function addStyles(){if(document.getElementById('ops-action-inbox-css'))return;const s=document.createElement('style');s.id='ops-action-inbox-css';s.textContent=`
body.ops-inbox main{width:min(1120px,94vw);padding:34px 0 70px}.ops-inbox .topbar{align-items:center}.ops-inbox .intro{max-width:720px}#ops-action-inbox{margin-top:24px}.ops-inbox-head{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:12px}.ops-inbox-head h2{margin:0;font-size:1.55rem}.ops-inbox-head p{margin:5px 0 0;color:var(--rrm-muted)}.ops-refresh{width:auto;min-height:42px;padding:9px 14px;border:1px solid #5c765e;border-radius:8px;background:#28502f;color:var(--rrm-ink);font-weight:900;cursor:pointer}.ops-action-list{display:grid;gap:10px}.ops-action-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px 20px;padding:17px 18px;border:1px solid #496446;border-left:5px solid var(--rrm-gold);border-radius:10px;background:#102718;color:var(--rrm-ink);text-decoration:none}.ops-action-card:hover{border-color:var(--rrm-gold-bright);background:#17371f}.ops-action-type{display:block;margin-bottom:5px;color:#f2d38b;font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.ops-action-card strong{display:block;font-size:1.03rem}.ops-action-card small{display:block;margin-top:5px;color:var(--rrm-muted);line-height:1.45}.ops-action-go,.ops-project-go{align-self:center;color:#9bc9ff;font-weight:900;white-space:nowrap}.ops-caught-up{padding:18px;border:1px solid #36553c;border-left:5px solid #79a66d;border-radius:10px;background:#0d2213}.ops-caught-up h2{margin:0 0 6px}.ops-caught-up p{margin:0;color:#b9d7bc}.ops-secondary{margin-top:18px;border:1px solid #315239;border-radius:11px;background:#0b1f12;overflow:hidden}.ops-secondary>summary{cursor:pointer;padding:14px 16px;font-weight:900;color:#d7dfd7;list-style:none}.ops-secondary>summary::-webkit-details-marker{display:none}.ops-secondary>summary::before{content:'›';display:inline-block;margin-right:9px;color:#f2d38b;transition:transform .15s ease}.ops-secondary[open]>summary::before{transform:rotate(90deg)}.ops-project-list{display:grid;gap:8px;padding:0 14px 14px;border-top:1px solid #294a34}.ops-project-link{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:12px 13px;margin-top:10px;border:1px solid #31513a;border-radius:8px;background:#0d2213;color:var(--rrm-ink);text-decoration:none}.ops-project-link:hover{border-color:#d7a34a}.ops-project-link small{display:block;margin-top:4px;color:var(--rrm-muted)}.ops-idea{padding:14px}.ops-idea form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end}.ops-idea .wide{grid-column:1/-1}.ops-idea textarea{min-height:72px}.ops-loading-row{padding:14px;color:var(--rrm-muted)}@media(max-width:700px){.ops-inbox-head,.ops-action-card,.ops-project-link{grid-template-columns:1fr}.ops-inbox-head{align-items:start}.ops-action-go,.ops-project-go{justify-self:start}.ops-idea form{grid-template-columns:1fr}.ops-idea .wide{grid-column:auto}}`;
document.head.append(s)}

function ensureShell(){document.body.classList.add('ops-inbox');const main=document.querySelector('main');if(!main)return null;const top=main.querySelector('.topbar');if(top){top.querySelector('h1').textContent='Operations Review';top.querySelector('.intro').textContent='Your owner action inbox. Nothing heavy loads until you choose it.'}let host=document.getElementById('ops-action-inbox');if(!host){host=document.createElement('section');host.id='ops-action-inbox';document.getElementById('loading')?.insertAdjacentElement('afterend',host)}return host}
function actionCard(p,type,sub,hash){return `<a class="ops-action-card" href="${stageUrl(p,hash)}"><div><span class="ops-action-type">${esc(type)}</span><strong>${esc(p.title)}</strong><small>${esc(p.project_id)} · ${esc(sub)}</small></div><span class="ops-action-go">Open exact review →</span></a>`}
function justCompleted(){try{const raw=sessionStorage.getItem('rrmJustCompletedReview');if(!raw)return null;const [project,stage,time]=raw.split('|');if(Date.now()-Number(time)>300000){sessionStorage.removeItem('rrmJustCompletedReview');return null}return{project,stage}}catch{return null}}

async function loadActionData(){
  const [reviewResult,findingResult]=await Promise.all([
    supabase.from('academy_content_projects').select('project_id,title,current_status,workflow_stage,progress_next,owner_hold,updated_at').eq('current_status','READY_FOR_REVIEW').order('updated_at',{ascending:false}),
    supabase.from('academy_late_findings').select('id,project_id,title,status,created_at').eq('status','PENDING_OWNER').order('created_at',{ascending:false})
  ]);
  if(reviewResult.error)throw reviewResult.error;
  const projects=reviewResult.data||[];
  const findings=findingResult.error?[]:(findingResult.data||[]);
  const known=new Set(projects.map(p=>p.project_id));
  const missing=[...new Set(findings.map(f=>f.project_id).filter(Boolean).filter(id=>!known.has(id)))];
  if(missing.length){
    const extra=await supabase.from('academy_content_projects').select('project_id,title,current_status,workflow_stage,progress_next,owner_hold,updated_at').in('project_id',missing);
    if(!extra.error)projects.push(...(extra.data||[]));
  }
  return{projects,findings};
}
function buildActions(projects,findings){const completed=justCompleted(),map=new Map(projects.map(p=>[p.project_id,p])),actions=[];projects.filter(p=>!p.owner_hold&&p.current_status==='READY_FOR_REVIEW'&&REVIEW_STAGES.has(p.workflow_stage)&&!(completed&&completed.project===p.project_id&&completed.stage===p.workflow_stage)).forEach(p=>actions.push(actionCard(p,'Owner approval required',`${stageLabel(p.workflow_stage)} · ${p.progress_next||'Review the completed work and decide.'}`,reviewHash(p))));const grouped=new Map();findings.forEach(f=>{if(!grouped.has(f.project_id))grouped.set(f.project_id,[]);grouped.get(f.project_id).push(f)});grouped.forEach((rows,id)=>{const p=map.get(id);if(p&&!p.owner_hold)actions.push(actionCard(p,'Late finding decision',`${rows.length} finding${rows.length===1?'':'s'} waiting for your direction`,'late-findings'))});return actions}

async function loadProjects(detail){
  const body=detail.querySelector('.ops-project-list');
  if(!body||body.dataset.loaded)return;
  body.innerHTML='<div class="ops-loading-row">Loading projects…</div>';
  const q=await supabase.from('academy_content_projects').select('project_id,title,current_status,workflow_stage,progress_percent,owner_hold,updated_at').order('updated_at',{ascending:false});
  if(q.error){body.innerHTML=`<div class="ops-loading-row">${esc(q.error.message)}</div>`;return}
  const projects=(q.data||[]).filter(p=>!p.owner_hold);
  body.dataset.loaded='1';
  body.innerHTML=projects.map(p=>`<a class="ops-project-link" href="${stageUrl(p)}"><div><strong>${esc(p.title)}</strong><small>${esc(p.project_id)} · ${esc(stageLabel(p.workflow_stage))} · ${Math.max(0,Math.min(100,Number(p.progress_percent)||0))}%</small></div><span class="ops-project-go">Open project →</span></a>`).join('')||'<p class="muted">No projects yet.</p>';
  detail.querySelector('summary').textContent=`All Projects — ${projects.length}`;
}
function unloadProjects(detail){const body=detail.querySelector('.ops-project-list');if(!body)return;delete body.dataset.loaded;body.innerHTML='<div class="ops-loading-row">Project data is not loaded.</div>';detail.querySelector('summary').textContent='All Projects — load when opened'}

function render(host,data){
  const actions=buildActions(data.projects,data.findings);
  host.innerHTML=`${actions.length?`<div class="ops-inbox-head"><div><h2>My Action Queue</h2><p>${actions.length} item${actions.length===1?'':'s'} need your decision.</p></div><button type="button" class="ops-refresh" id="ops-refresh">↻ Refresh</button></div><div class="ops-action-list">${actions.join('')}</div>`:`<section class="ops-caught-up"><h2>Nothing needs your decision right now.</h2><p>You can browse projects, start something new, or leave this page. No project data is loaded unless you ask for it.</p></section>`}<details class="ops-secondary" id="ops-projects"><summary>All Projects — load when opened</summary><div class="ops-project-list"><div class="ops-loading-row">Project data is not loaded.</div></div></details><details class="ops-secondary" id="ops-new"><summary>Start a new Academy idea</summary><div class="ops-idea"><form id="ops-idea-form"><div><label for="ops-idea">Idea</label><input id="ops-idea" required></div><button class="button primary" id="ops-idea-submit">Submit for Development</button><div class="wide"><label for="ops-notes">Optional notes</label><textarea id="ops-notes"></textarea></div></form></div></details>`;
  host.querySelector('#ops-refresh')?.addEventListener('click',()=>boot(true));
  const projects=host.querySelector('#ops-projects');
  projects?.addEventListener('toggle',()=>{if(projects.open)loadProjects(projects);else unloadProjects(projects)});
  const form=host.querySelector('#ops-idea-form');
  form.onsubmit=async e=>{e.preventDefault();const b=host.querySelector('#ops-idea-submit');b.disabled=true;const{error}=await supabase.rpc('create_academy_content_idea',{p_idea:host.querySelector('#ops-idea').value.trim(),p_owner_notes:host.querySelector('#ops-notes').value.trim()||null});if(error){b.disabled=false;alert(error.message);return}host.querySelector('#ops-idea').value='';host.querySelector('#ops-notes').value='';b.disabled=false;await boot(true)};
  applyRequestedView();
  document.dispatchEvent(new CustomEvent('operations-review-ready'));
}

function applyRequestedView(){
  const projects=document.getElementById('ops-projects'),newIdea=document.getElementById('ops-new');
  if(location.hash==='#projects'){if(projects&&!projects.open)projects.open=true;projects?.scrollIntoView({block:'start'})}
  else if(location.hash==='#new'){if(newIdea&&!newIdea.open)newIdea.open=true;newIdea?.scrollIntoView({block:'start'})}
  else document.querySelector('.ops-inbox-head,.ops-caught-up')?.scrollIntoView({block:'start'});
}

async function boot(force=false){
  if(running)return;
  running=true;addStyles();const host=ensureShell(),loading=document.getElementById('loading');
  try{
    const{data:s,error}=await supabase.auth.getSession();if(error)throw error;const user=s.session?.user;if(!user){location.href='account.html?next=operations-review.html';return}
    const{data:roles,error:roleError}=await supabase.from('user_roles').select('role').eq('user_id',user.id);if(roleError)throw roleError;if(!(roles||[]).some(x=>x.role==='admin')){loading.textContent='Administrator access is required.';return}
    loading.classList.add('hidden');if(force||!actionData)actionData=await loadActionData();render(host,actionData)
  }catch(e){console.error('Operations Review action inbox',e);loading.classList.remove('hidden');loading.innerHTML=`<strong>Operations Review could not load.</strong><p class="muted">${esc(e.message||'Unknown error')}</p>`}
  finally{running=false}
}
window.addEventListener('hashchange',applyRequestedView);
window.addEventListener('pagehide',()=>{const d=document.getElementById('ops-projects');if(d)unloadProjects(d)},{once:true});
boot();
