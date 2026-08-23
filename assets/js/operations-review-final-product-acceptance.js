import { supabase } from './supabase-client.js';

const ITEMS=[
 ['complete_journey','Complete learner journey works from real beginning to intended finish.'],
 ['customer_value','Customer payoff is tangible and the product does more than reorganize information into more words.'],
 ['personalization_integrity','Personalization materially reflects learner input, including legitimate multi-use / multi-branch needs.'],
 ['visual_teaching','Visuals actually teach: scenes, diagrams, cutaways, comparisons, process or branch visuals are present where useful.'],
 ['practical_implementation','The learner can do something useful with the knowledge: build, decide, compare, practice, verify or act.'],
 ['navigation_state','All links/depth controls work, no 404s exist, and learner answers/state survive normal navigation.'],
 ['plain_language','Plain language is the default and technical/evidence depth is optional rather than required to understand the lesson.'],
 ['evidence_integrity','Evidence-backed solution space is taught without overclaiming or under-teaching; learner-specific unknowns do not suppress general education.'],
 ['testing_verification','Testing is used to verify/refine/compare rather than as permission to educate; experiments distinguish observation from proof.'],
 ['safety_proportionality','Safety language is proportional: targeted warnings for real hazards, no repetitive generic disclaimer clutter.'],
 ['technical_delivery','Interactive controls, forms, media, downloads, mobile/print behavior and release-candidate assets work as intended.'],
 ['owner_value_test','If paid: I would feel RRA did meaningful work for me and delivered what the offer promised at the proposed price.']
];

let busy=false;
const projectId=new URLSearchParams(location.search).get('project')||'';

function styles(){
 if(document.getElementById('fpa-css'))return;
 const s=document.createElement('style');s.id='fpa-css';s.textContent=`#academy-final-product-acceptance{margin:18px 0;padding:18px;border:1px solid #496446;border-radius:12px;background:#102718}.fpa-head{display:flex;justify-content:space-between;gap:16px;align-items:start}.fpa-head h3{margin:.1rem 0 .4rem}.fpa-note{color:#aebcaf;line-height:1.5}.fpa-status{padding:10px 12px;border-left:4px solid #e0a449;background:#142b18;margin:12px 0}.fpa-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fpa-item{display:flex;gap:9px;align-items:flex-start;padding:10px;border:1px solid #36553c;border-radius:7px;background:#0d2213}.fpa-item input{margin-top:3px}.fpa-notearea{margin-top:12px}.fpa-notearea label{display:block;margin-bottom:6px;font-weight:900}.fpa-notearea textarea{width:100%;min-height:80px;box-sizing:border-box;padding:10px 12px;border:1px solid #45634a;border-radius:7px;background:#07180d;color:#edf2e9;font:inherit}.fpa-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}.fpa-save-button{padding:10px 14px;border:1px solid #b98432;border-radius:7px;background:#7e5418;color:#fff6df;font:inherit;font-weight:900;cursor:pointer}.fpa-save-button:disabled{opacity:.55}.fpa-pass{color:#a9d799;font-weight:800}.fpa-fail{color:#f2d38b;font-weight:800}@media(max-width:760px){.fpa-list{grid-template-columns:1fr}}`;document.head.append(s);
}

function checklist(sec){const out={};ITEMS.forEach(([k])=>out[k]=!!sec.querySelector(`[data-fpa="${k}"]`)?.checked);return out}
async function load(){const[p,a]=await Promise.all([supabase.from('academy_content_projects').select('project_id,revision_number,workflow_stage,current_status').eq('project_id',projectId).single(),supabase.from('academy_final_product_acceptance').select('*').eq('project_id',projectId).order('revision_number',{ascending:false}).limit(1)]);if(p.error)throw p.error;if(a.error)throw a.error;return{project:p.data,row:a.data?.[0]||null}}
function approvalButton(){return document.querySelector('.asr-review-actions .asr-approve')}
function gateApprove(row,p){const b=approvalButton();if(!b)return;const passed=!!row&&row.revision_number===p.revision_number&&row.passed===true;b.textContent='Approve Final Product';b.disabled=!passed;b.title=passed?'Final Product Acceptance passed.':'Complete and save the Final Product Acceptance checklist first.'}

async function render(){
 if(busy||!projectId)return;
 const root=document.querySelector('.asr-page');if(!root)return;
 busy=true;
 try{
  const {project:p,row}=await load();
  if(p.workflow_stage!=='FINAL_PRODUCT_REVIEW'||p.current_status!=='READY_FOR_REVIEW')return;
  const saved=row?.revision_number===p.revision_number?row:null,c=saved?.checklist||{};
  let sec=root.querySelector('#academy-final-product-acceptance');if(!sec){sec=document.createElement('section');sec.id='academy-final-product-acceptance';const review=root.querySelector('.asr-review');review?.before(sec)}
  if(!sec)return;
  sec.innerHTML=`<div class="fpa-head"><div><h3>Final Product Acceptance</h3><p class="fpa-note">Check the actual customer experience you just reviewed. A worker reaching 100% or a QA file saying PASS is not enough.</p></div><div class="${saved?.passed?'fpa-pass':'fpa-fail'}">${saved?.passed?'PASSED':'NOT PASSED'}</div></div><div class="fpa-status"><strong>Owner test:</strong> Can a real learner use this from beginning to end, get the promised value, and feel the product did meaningful work for them?</div><div class="fpa-list">${ITEMS.map(([k,l])=>`<label class="fpa-item"><input type="checkbox" data-fpa="${k}" ${c[k]?'checked':''}><span>${l}</span></label>`).join('')}</div><div class="fpa-notearea"><label>Owner note</label><textarea id="fpa-owner-note" placeholder="Record anything you want preserved or corrected before approval.">${saved?.owner_note||''}</textarea></div><div class="fpa-actions"><button type="button" class="fpa-save-button" id="fpa-save">Save Acceptance Check</button><span class="fpa-note">All 12 checks must pass before Approve Final Product is enabled.</span></div>`;
  sec.querySelector('#fpa-save').onclick=async()=>{const b=sec.querySelector('#fpa-save');b.disabled=true;const{error}=await supabase.rpc('submit_academy_final_product_acceptance',{p_project_id:projectId,p_checklist:checklist(sec),p_owner_note:sec.querySelector('#fpa-owner-note').value.trim()||null});if(error){b.disabled=false;alert(error.message);return}await render()};
  gateApprove(saved,p);
 }catch(e){console.error('Final Product Acceptance',e)}finally{busy=false}
}

styles();
let tries=0;
const start=()=>{if(document.querySelector('.asr-page')){render();return}if(++tries<50)setTimeout(start,100)};
start();
