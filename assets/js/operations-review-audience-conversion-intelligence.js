import { supabase } from './supabase-client.js';

let busy = false;
const ACTION_LABEL = {
  BUILD_NOW: 'Build Now', TEST: 'Test', RESEARCH: 'Research', HOLD: 'Hold',
  NOT_RECOMMENDED_OWNER_REVIEW: 'Owner Review — Not Recommended', REVISIT: 'Revisit', CLOSED_OWNER: 'Closed by Owner'
};
const STEP_LABEL = {
  HOOK: 'Hook', FREE_CONTENT: 'Free Education', SELF_ASSESSMENT: 'Self-Assessment',
  PERSONALIZED_RESULT: 'Personal Result', FREE_NEXT_STEP: 'Free Next Step', OFFER: 'Deeper Learning', FOLLOW_UP: 'Follow-Up'
};
const css = `
#audience-conversion-intelligence{margin:18px 0;padding:18px;border:1px solid #496446;border-radius:12px;background:#102718}
.aci-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.aci-note{color:var(--rrm-muted);line-height:1.5;max-width:920px}
.aci-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:12px 0}.aci-kpi{padding:11px;border:1px solid #36553c;border-radius:8px;background:#0d2213}.aci-kpi strong{display:block;color:#f2d38b;font-size:1.35rem}.aci-kpi span{font-size:.76rem;color:var(--rrm-muted);text-transform:uppercase}
.aci-layout{display:grid;grid-template-columns:minmax(280px,380px) 1fr;gap:12px}.aci-panel{border:1px solid #36553c;border-radius:9px;background:#0d2213;padding:12px}.aci-panel h4{margin:.1rem 0 .7rem}.aci-signal{display:block;width:100%;margin:0 0 8px;padding:10px;border:1px solid #45634a;border-radius:7px;background:#17371f;color:var(--rrm-ink);text-align:left;cursor:pointer;font:inherit}.aci-signal:hover,.aci-signal.active{border-color:#e0a449}.aci-signal strong,.aci-step strong{display:block}.aci-signal small,.aci-step small{display:block;margin-top:5px;color:var(--rrm-muted);line-height:1.35}.aci-evidence{margin-top:6px;font-size:.73rem;font-weight:800;letter-spacing:.04em}.aci-evidence.VERIFIED{color:#a9d799}.aci-evidence.PARTIALLY_VERIFIED{color:#f2d38b}.aci-evidence.UNVERIFIED,.aci-evidence.STALE{color:#e8a99c}
.aci-path-head{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start}.aci-score{font-size:1.8rem;color:#f2d38b;font-weight:900}.aci-hook{margin:12px 0;padding:12px;border-left:4px solid #e0a449;background:#142b18}.aci-flow{display:grid;grid-template-columns:repeat(6,minmax(170px,1fr));gap:10px;overflow:auto;padding:4px 0 10px}.aci-step{position:relative;min-height:180px;padding:11px;border:1px solid #45634a;border-radius:8px;background:#17371f}.aci-step:not(:last-child)::after{content:'→';position:absolute;right:-9px;top:45%;z-index:2;color:#e0a449;font-weight:900}.aci-step-type{font-size:.72rem;color:#f2d38b;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.aci-step p{font-size:.82rem;line-height:1.42}.aci-guard{margin-top:8px;padding-top:8px;border-top:1px solid #36553c;color:#d9b3aa;font-size:.76rem;line-height:1.35}.aci-format{padding:10px;border:1px solid #36553c;border-radius:7px;margin-top:10px}.aci-format strong{color:#f2d38b}.aci-owner{display:grid;grid-template-columns:220px 1fr;gap:8px;margin-top:12px}.aci-owner textarea{min-height:78px}.aci-actions{margin-top:8px}.aci-empty{color:var(--rrm-muted);font-style:italic}.aci-risk{margin-top:8px;color:#d9b3aa;line-height:1.4}.aci-question{font-size:.9rem;line-height:1.45}
@media(max-width:900px){.aci-layout{grid-template-columns:1fr}.aci-kpis,.aci-owner{grid-template-columns:1fr}.aci-flow{grid-template-columns:repeat(6,220px)}}
`;

function addStyles(){
  if(document.getElementById('audience-conversion-intelligence-styles')) return;
  const s=document.createElement('style'); s.id='audience-conversion-intelligence-styles'; s.textContent=css; document.head.append(s);
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function selectedId(){
  const t=document.querySelector('.queue-item.active .queue-meta')?.textContent||document.getElementById('detail')?.textContent||'';
  return (t.match(/RRA-\d{4}-\d{4}/)||[])[0]||'';
}
async function load(projectId){
  const [signalsRes,pathsRes]=await Promise.all([
    supabase.from('academy_audience_signals').select('*').eq('parent_project_id',projectId).order('signal_score',{ascending:false}),
    supabase.from('academy_conversion_paths').select('*').eq('parent_project_id',projectId).order('pathway_score',{ascending:false})
  ]);
  if(signalsRes.error) throw signalsRes.error;
  if(pathsRes.error) throw pathsRes.error;
  const paths=pathsRes.data||[];
  let steps=[];
  if(paths.length){
    const r=await supabase.from('academy_conversion_steps').select('*').in('path_id',paths.map(p=>p.id)).order('step_order',{ascending:true});
    if(r.error) throw r.error; steps=r.data||[];
  }
  return {signals:signalsRes.data||[],paths,steps};
}
function renderPath(sec,path,data,refresh){
  const panel=sec.querySelector('.aci-path-panel');
  if(!path){panel.innerHTML='<p class="aci-empty">No conversion pathway is recorded for this project yet.</p>';return;}
  const signal=data.signals.find(s=>s.id===path.source_signal_id);
  const steps=data.steps.filter(s=>s.path_id===path.id).sort((a,b)=>a.step_order-b.step_order);
  panel.innerHTML=`
    <div class="aci-path-head"><div><h4>${esc(path.title)}</h4><p class="aci-note">${esc(path.audience_problem)}</p></div><div class="aci-score">${path.pathway_score??'—'}/100</div></div>
    <div class="aci-hook"><strong>ENTRY HOOK</strong><div>${esc(path.entry_hook)}</div></div>
    <p><strong>Desired outcome:</strong> ${esc(path.desired_outcome)}</p>
    <p><strong>Destination:</strong> ${esc(path.destination_label)} <span class="aci-note">(${esc(path.destination_type)})</span></p>
    <p><strong>Agent action:</strong> ${esc(ACTION_LABEL[path.recommended_action]||path.recommended_action)} — ${esc(path.recommendation_reason||'')}</p>
    ${signal?`<p><strong>Signal evidence:</strong> ${esc(signal.evidence_status)} / ${esc(signal.public_use_status)}. ${esc(signal.evidence_summary||'')}</p>`:''}
    <div class="aci-flow"></div>
    <div class="aci-format"><strong>Recommended format:</strong> ${esc(path.recommended_destination_format||'Not set')}<br><span class="aci-note">${esc(path.format_rationale||'')}</span></div>
    <div class="aci-owner"><div><label>Owner disposition</label><select id="aci-disposition"><option value="">No override</option><option value="BUILD_NOW">BUILD NOW</option><option value="TEST">TEST</option><option value="RESEARCH">RESEARCH</option><option value="HOLD">HOLD</option><option value="REVISIT">REVISIT</option><option value="CLOSED_OWNER">CLOSED OWNER</option></select></div><div><label>Owner note</label><textarea id="aci-owner-note" placeholder="What should the system do differently or what are you approving?"></textarea></div></div>
    <div class="aci-actions"><button class="button primary" id="aci-save">Save Owner Decision</button></div>`;
  const flow=panel.querySelector('.aci-flow');
  steps.forEach(step=>{
    const d=document.createElement('div'); d.className='aci-step';
    d.innerHTML=`<div class="aci-step-type">${esc(STEP_LABEL[step.step_type]||step.step_type)}</div><strong>${esc(step.title)}</strong><small>${esc(step.recommended_format||'')}</small><p>${esc(step.value_delivered||step.audience_job||'')}</p>${step.cta?`<p><strong>CTA:</strong> ${esc(step.cta)}</p>`:''}<div class="aci-guard"><strong>Persuasion:</strong> ${esc(step.persuasion_principle||'—')}<br><strong>Guardrail:</strong> ${esc(step.manipulation_guardrail||'—')}</div>`;
    flow.append(d);
  });
  const select=panel.querySelector('#aci-disposition'); select.value=path.owner_disposition||'';
  panel.querySelector('#aci-owner-note').value=path.owner_note||'';
  panel.querySelector('#aci-save').onclick=async()=>{
    if(!select.value){alert('Choose an owner disposition first.');return;}
    const b=panel.querySelector('#aci-save'); b.disabled=true;
    const {error}=await supabase.rpc('set_academy_conversion_path_owner_decision',{p_path_id:path.id,p_disposition:select.value,p_note:panel.querySelector('#aci-owner-note').value.trim()||null});
    if(error){b.disabled=false;alert(error.message);return;}
    await refresh();
  };
}
function renderSignals(sec,data,activeSignalId,onSignal){
  const list=sec.querySelector('.aci-signal-list'); list.replaceChildren();
  data.signals.forEach(s=>{
    const b=document.createElement('button'); b.type='button'; b.className=`aci-signal${s.id===activeSignalId?' active':''}`;
    b.innerHTML=`<strong>${esc(s.title)}</strong><small class="aci-question">${esc(s.audience_question)}</small><div class="aci-evidence ${esc(s.evidence_status)}">${esc(s.evidence_status)} · ${esc(s.public_use_status)} · ${s.signal_score??'—'}/100</div>${s.recommended_hook?`<small><strong>Hook candidate:</strong> ${esc(s.recommended_hook)}</small>`:''}${s.hook_risk_notes?`<div class="aci-risk"><strong>Claim risk:</strong> ${esc(s.hook_risk_notes)}</div>`:''}`;
    b.onclick=()=>onSignal(s.id); list.append(b);
  });
  if(!data.signals.length) list.innerHTML='<p class="aci-empty">No audience signals recorded yet.</p>';
}
async function inject(){
  if(busy) return; busy=true;
  try{
    const detail=document.getElementById('detail'), projectId=selectedId();
    if(!detail||!projectId) return;
    let sec=detail.querySelector('#audience-conversion-intelligence');
    if(sec?.dataset.project===projectId) return;
    const data=await load(projectId);
    if(!data.signals.length&&!data.paths.length){sec?.remove();return;}
    if(sec) sec.remove();
    sec=document.createElement('section'); sec.id='audience-conversion-intelligence'; sec.dataset.project=projectId;
    const verified=data.signals.filter(s=>s.public_use_status==='READY_FOR_PUBLIC_USE').length;
    const researchOnly=data.signals.filter(s=>s.public_use_status==='RESEARCH_ONLY').length;
    const top=Math.max(0,...data.paths.map(p=>Number(p.pathway_score)||0));
    sec.innerHTML=`<div class="aci-head"><div><h3>Audience + Conversion Intelligence</h3><p class="aci-note">Reverse-engineers genuine audience questions into useful free education, self-diagnosis and the best-fit deeper Academy format. Persuasion is intentional; deception and manufactured fear are not.</p></div></div><div class="aci-kpis"><div class="aci-kpi"><strong>${data.signals.length}</strong><span>Audience signals</span></div><div class="aci-kpi"><strong>${verified}</strong><span>Public-use verified</span></div><div class="aci-kpi"><strong>${researchOnly}</strong><span>Research-only signals</span></div><div class="aci-kpi"><strong>${top||'—'}</strong><span>Top pathway score</span></div></div><div class="aci-layout"><div class="aci-panel"><h4>Audience Signals</h4><div class="aci-signal-list"></div></div><div class="aci-panel aci-path-panel"></div></div>`;
    const host=detail.querySelector('#opportunity-intelligence')||detail.querySelector('#owner-quick-visuals')||detail.firstChild;
    host?.after(sec);
    let activeSignalId=data.paths[0]?.source_signal_id||data.signals[0]?.id||null;
    const refresh=async()=>{sec.removeAttribute('data-project');await inject();};
    const draw=()=>{
      renderSignals(sec,data,activeSignalId,id=>{activeSignalId=id;draw();});
      const path=data.paths.find(p=>p.source_signal_id===activeSignalId)||data.paths[0]||null;
      renderPath(sec,path,data,refresh);
    };
    draw();
  }catch(e){console.error('Audience + Conversion Intelligence',e)}finally{busy=false;}
}

addStyles();
const observer=new MutationObserver(()=>queueMicrotask(inject));
observer.observe(document.body,{childList:true,subtree:true});
queueMicrotask(inject);
