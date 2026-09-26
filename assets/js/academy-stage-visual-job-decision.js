import { supabase } from './supabase-client.js';

const params=new URLSearchParams(location.search);
const projectId=params.get('project')||'';
const requestedStage=params.get('stage')||'';
let mounted=false;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>{if(!v)return'Not recorded';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})};
const pretty=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());

function css(){
  if(document.getElementById('avjd-css'))return;
  const s=document.createElement('style');
  s.id='avjd-css';
  s.textContent=`
  #avjd-section{margin-top:20px;padding:18px;border:1px solid #496446;border-radius:10px;background:#102718}
  #avjd-section h4{margin:0 0 6px}
  #avjd-section .avjd-intro{margin:0 0 14px;color:#c7d2c6;line-height:1.5}
  .avjd-job{border:1px solid #36553c;border-radius:9px;background:#0d2213;padding:14px 16px;margin-top:12px}
  .avjd-job h5{margin:0 0 4px;font-size:1rem;color:#f2d38b}
  .avjd-job .avjd-state{display:inline-block;padding:3px 9px;border-radius:6px;font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;background:#16371f;border:1px solid #4d6d51;color:#edf2e9}
  .avjd-job .avjd-line{margin:8px 0;color:#d6dfd5;font-size:.86rem;line-height:1.5}
  .avjd-compare{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}
  .avjd-compare pre{margin:0;padding:10px;border:1px solid #36553c;border-radius:7px;background:#07150c;color:#e8eee7;font-size:.76rem;white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto}
  .avjd-compare h6{margin:0 0 6px;color:#c4d0c4;font-size:.74rem;text-transform:uppercase;letter-spacing:.05em}
  .avjd-decision{margin-top:12px;padding:12px;border:1px solid #5d754f;border-radius:8px;background:#0b1e12}
  .avjd-decision textarea{width:100%;min-height:60px;padding:8px 10px;border:1px solid #45634a;border-radius:6px;background:#07180d;color:#edf2e9;font:inherit;margin-bottom:8px}
  .avjd-decision .avjd-buttons{display:flex;flex-wrap:wrap;gap:8px}
  .avjd-decision button{padding:9px 12px;border:1px solid #4d6d51;border-radius:7px;background:#16371f;color:#edf2e9;font-weight:900;cursor:pointer}
  .avjd-decision button.avjd-override{border-color:#7fbe84}
  .avjd-decision button.avjd-retry{border-color:#e0a449}
  .avjd-decision button.avjd-checker{border-color:#c96f5b}
  .avjd-recorded{margin-top:10px;padding:10px 12px;border-left:4px solid #7fbe84;background:#0b1e12;border-radius:6px;font-size:.85rem;color:#d6dfd5}
  @media(max-width:700px){.avjd-compare{grid-template-columns:1fr}}
  `;
  document.head.append(s);
}

function stateLine(job){
  if(job.state==='READY_FOR_CHATGPT')return'Waiting on ChatGPT image generation. No agent is currently working on this.';
  if(job.state==='CHATGPT_GENERATING')return'ChatGPT has claimed this job and is generating the image now.';
  if(job.state==='GENERATED_PENDING_INSPECTION')return'Image generated. Waiting on independent verification (a different agent, not the one that generated it).';
  if(job.state==='REVISION_REQUIRED')return job.owner_decision?`Decision recorded: ${pretty(job.owner_decision)}.`:'Verification conflict — see below. Nothing will retry until you decide.';
  if(job.state==='READY_FOR_INTEGRATION')return'Verification passed. Ready to integrate into the product.';
  if(job.state==='INTEGRATING')return'Being integrated into the product now.';
  if(job.state==='DEPLOYED_QA_PENDING')return'Deployed; full page QA not yet complete.';
  if(job.state==='VERIFIED')return`Verified and live${job.deployed_url?`: ${job.deployed_url}`:''}.`;
  if(job.state==='FAILED')return job.last_error||'Failed.';
  return job.state;
}

function renderJob(job){
  const el=document.createElement('div');
  el.className='avjd-job';
  const conflictBlock = (job.state==='REVISION_REQUIRED')?`
    <div class="avjd-compare">
      <div><h6>Generation self-check (by the generating agent)</h6><pre>${esc(job.generation_self_check?JSON.stringify(job.generation_self_check,null,2):'Not recorded.')}</pre></div>
      <div><h6>Independent verification (by a different agent)</h6><pre>${esc(job.verification_report?JSON.stringify(job.verification_report,null,2):'Not recorded.')}</pre></div>
    </div>
    <div class="avjd-line"><strong>Outcome:</strong> ${esc(pretty(job.verification_outcome||'unknown'))}</div>
  `:'';
  const decisionUi = (job.state==='REVISION_REQUIRED' && !job.owner_decision) ? `
    <div class="avjd-decision">
      <label>Optional note</label>
      <textarea class="avjd-note" placeholder="Why are you making this call?"></textarea>
      <div class="avjd-buttons">
        <button type="button" class="avjd-override" data-decision="OVERRIDE_PROCEED">Not a real defect — proceed anyway</button>
        <button type="button" class="avjd-retry" data-decision="AUTHORIZE_RETRY">Real defect — authorize one retry</button>
        <button type="button" class="avjd-checker" data-decision="FIX_CHECKER">The check itself is wrong</button>
      </div>
    </div>
  `:'';
  const recorded = (job.state==='REVISION_REQUIRED' && job.owner_decision) ? `
    <div class="avjd-recorded"><strong>${esc(pretty(job.owner_decision))}</strong>${job.owner_decision_note?` — ${esc(job.owner_decision_note)}`:''}<br><small>${esc(fmt(job.owner_decision_at))}</small></div>
  `:'';
  el.innerHTML=`
    <h5>${esc(job.asset_key)} <span class="avjd-state">${esc(pretty(job.state))}</span></h5>
    <div class="avjd-line">${esc(stateLine(job))}</div>
    ${job.attempt_count?`<div class="avjd-line">Attempt ${esc(job.attempt_count+1)}.</div>`:''}
    ${conflictBlock}
    ${decisionUi}
    ${recorded}
  `;
  const buttons=el.querySelectorAll('[data-decision]');
  buttons.forEach(b=>b.addEventListener('click',async()=>{
    buttons.forEach(x=>x.disabled=true);
    b.textContent='Saving…';
    const note=el.querySelector('.avjd-note')?.value.trim()||null;
    const{error}=await supabase.rpc('submit_academy_visual_job_decision',{p_job_id:job.id,p_decision:b.dataset.decision,p_note:note});
    if(error){buttons.forEach(x=>x.disabled=false);alert(error.message);return;}
    await mount(true);
  }));
  return el;
}

async function mount(force){
  if(mounted&&!force)return;
  if(requestedStage!=='VISUAL_PRODUCTION'||!projectId)return;
  const page=document.querySelector('.asr-page');
  if(!page)return;
  mounted=true;css();
  const{data:jobs,error}=await supabase.from('academy_visual_production_jobs').select('id,asset_key,state,attempt_count,generation_self_check,verification_report,verification_outcome,owner_decision,owner_decision_note,owner_decision_at,last_error,deployed_url,updated_at').eq('project_id',projectId).order('updated_at',{ascending:false});
  if(error)return;
  let section=document.getElementById('avjd-section');
  if(!section){section=document.createElement('section');section.id='avjd-section';const review=page.querySelector('.asr-review');review?review.after(section):page.append(section);}
  section.innerHTML='<h4>Image Assignments</h4><p class="avjd-intro">Generation and verification are done by two different agents; neither trusts the other\'s bare assertion. A conflict never retries automatically — see chatgpt-visual-handoff-contract.md.</p>';
  if(!jobs?.length){section.insertAdjacentHTML('beforeend','<p class="avjd-line">No image assignments recorded for this project.</p>');return;}
  jobs.forEach(j=>section.append(renderJob(j)));
}

document.addEventListener('academy-stage-review-ready',()=>mount(false));
if(document.querySelector('.asr-page'))mount(false);
