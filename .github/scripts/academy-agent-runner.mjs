import fs from 'node:fs/promises';
import process from 'node:process';

const mode=process.argv[2]||'claim';
const url=process.env.SUPABASE_URL||'https://dfrwxpuojeiykaignyny.supabase.co';
const key=process.env.SUPABASE_BACKEND_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const openai=process.env.OPENAI_API_KEY||'';
const runner='github-codex-v1';
const out=process.env.GITHUB_OUTPUT;

function headers(extra={}){
 const base={apikey:key,'Content-Type':'application/json'};
 // Current sb_secret_ keys authenticate through apikey. Legacy service_role JWTs also need Bearer auth.
 if(key&&!key.startsWith('sb_secret_'))base.Authorization=`Bearer ${key}`;
 return{...base,...extra};
}
async function api(path,opts={}){const r=await fetch(`${url}/rest/v1/${path}`,{...opts,headers:headers(opts.headers||{})});const text=await r.text();if(!r.ok)throw new Error(`${r.status} ${text}`);return text?JSON.parse(text):null}
async function writeOut(name,value){if(out)await fs.appendFile(out,`${name}=${String(value).replace(/\n/g,'%0A')}\n`)}
async function state(ready,error=null){if(!key)return;await api(`academy_agent_runner_state?runner_key=eq.${runner}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({ready,last_heartbeat:new Date().toISOString(),last_checked_at:new Date().toISOString(),last_error:error,updated_at:new Date().toISOString()})})}
function agentFor(stage){if(stage==='PRODUCT_WORKING')return'RRA Product Design Agent';if(stage==='VISUAL_PRODUCTION')return'RRA Visual Production Agent';return null}
function nextReview(stage){return stage==='PRODUCT_WORKING'?'PRODUCT_REVIEW':stage==='VISUAL_PRODUCTION'?'FINAL_PRODUCT_REVIEW':null}

async function claim(){
 if(!key){console.log('Supabase backend secret is not configured.');await writeOut('has_request','false');return}
 if(!openai){await state(false,'OPENAI_API_KEY is not configured in GitHub Actions secrets.');console.log('OPENAI_API_KEY is not configured.');await writeOut('has_request','false');return}
 await state(true,null);
 const rows=await api('academy_agent_run_requests?status=eq.PENDING&order=requested_at.asc&limit=1');
 const req=rows?.[0];if(!req){await writeOut('has_request','false');return}
 const projects=await api(`academy_content_projects?project_id=eq.${encodeURIComponent(req.project_id)}&select=*`);const p=projects?.[0];
 if(!p){await fail(req.id,'Project no longer exists.');await writeOut('has_request','false');return}
 const expected=agentFor(p.workflow_stage);
 if(!expected||p.current_status!=='AGENT_WORKING'||p.owner_hold||p.workflow_stage!==req.requested_stage){await fail(req.id,`Request is stale. Current project state is ${p.current_status}/${p.workflow_stage}${p.owner_hold?' with owner hold':''}.`);await writeOut('has_request','false');return}
 const now=new Date().toISOString();
 await api(`academy_agent_run_requests?id=eq.${req.id}&status=eq.PENDING`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'RUNNING',claimed_at:now,runner,attempt_count:(req.attempt_count||0)+1,updated_at:now})});
 const feedback=await api(`academy_stage_feedback?project_id=eq.${encodeURIComponent(p.project_id)}&status=eq.PENDING&order=created_at.asc&select=*`);
 await fs.mkdir('.agent-run',{recursive:true});
 await fs.writeFile('.agent-run/context.json',JSON.stringify({request:req,project:p,pending_stage_feedback:feedback||[]},null,2));
 const prompt=`You are executing one OWNER-REQUESTED immediate Rebel Ranch Academy work cycle inside the checked-out repository.\n\nMANDATORY GOVERNANCE\n1. Read AGENTS.md, docs/rebel-ranch-ecosystem-charter.md, docs/non-negotiables.md, rebel ranch academy/ACADEMY-REVISION-PRESERVATION-STANDARD.md, rebel ranch academy/ACADEMY-PRODUCT-PHASE-WORKFLOW-EXTENSION.md, rebel ranch academy/ACADEMY-THINK-LIKE-A-REBEL-FRAMEWORK.md, and rebel ranch academy/ACADEMY-LEARNER-EXPERIENCE-LANGUAGE-VISUAL-STANDARD.md before editing.\n2. Read .agent-run/context.json. It contains the authoritative live project state captured immediately before this run.\n3. Work ONLY project ${p.project_id}, current stage ${p.workflow_stage}, as ${expected}.\n4. Project folder: ${p.github_path}. Treat the current main checkout as source of truth. Create required timestamped backups/change description before editing existing files.\n5. Do not publish, deploy, sell, activate pricing, create affiliate links, release, bypass an owner gate, change authentication/RLS, or touch unrelated projects.\n6. Continue through as much actionable CURRENT-STAGE work as practical. Do not stop after one cosmetic micro-task. Preserve evidence, safety, owner feedback, revision history, and existing useful work.\n7. Pending owner stage feedback in .agent-run/context.json is first-class work. Apply safe requests or explain a genuine block. Never erase feedback.\n8. Complexity belongs in research/production, not in the learner's way. Use simplest accurate learner language and the full image-led/progressive-depth standard.\n\nSTAGE-SPECIFIC\n${p.workflow_stage==='VISUAL_PRODUCTION'?`Visual Production: rebuild/advance actual learner-facing assets and integrated preview. Preserve approved technical depth underneath plain language. Use recognizable image/scene/SVG illustration, plain message, simple action, personal result, optional deeper diagram, then technical evidence. Keep preview-manifest.json accurate. Fix broken integrated navigation. This runner cannot replace native raster/photographic image generation; if required approved image assets are still missing, leave that requirement open and do not mark Final Product Review ready. If the full authorized visual/delivery package and Final Product QA are genuinely complete, you may recommend transition to FINAL_PRODUCT_REVIEW; otherwise remain VISUAL_PRODUCTION.`:`Product Design: advance the approved product architecture/manuscript/tools and integrated learner experience under the Academy standards. Do not do new unsupported subject research. If the complete Product Design package and Product QA are genuinely ready for owner review, you may recommend transition to PRODUCT_REVIEW; otherwise remain PRODUCT_WORKING.`}\n\nRESULT CONTRACT\nBefore finishing, create .agent-run/result.json with ONLY valid JSON using this shape:\n{\n  "progress_percent": 0-100 integer,\n  "progress_stage": "plain owner-readable stage label",\n  "progress_detail": "what this run actually completed",\n  "progress_next": "exact next action",\n  "material_summary": "concise current package summary",\n  "current_status": "AGENT_WORKING or READY_FOR_REVIEW",\n  "workflow_stage": "${p.workflow_stage} or ${nextReview(p.workflow_stage)}",\n  "result_summary": "one short owner-facing summary of this immediate run",\n  "feedback_resolutions": [{"id":"uuid from context","status":"APPLIED or BLOCKED","resolution_note":"what happened"}]\n}\nOnly choose READY_FOR_REVIEW with workflow_stage ${nextReview(p.workflow_stage)} if the stage is truly complete and its required QA/review package exists. Otherwise keep AGENT_WORKING/${p.workflow_stage}. Do not invent completion percentages just to show activity.\n`;
 await fs.writeFile('.agent-run/prompt.md',prompt);
 await writeOut('has_request','true');await writeOut('request_id',req.id);await writeOut('project_id',p.project_id);await writeOut('stage',p.workflow_stage);await writeOut('project_path',p.github_path);await writeOut('agent',expected);
 console.log(`Claimed ${req.id} for ${p.project_id} ${p.workflow_stage}`);
}
async function fail(id,message){if(!key)return;const now=new Date().toISOString();await api(`academy_agent_run_requests?id=eq.${id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'FAILED',completed_at:now,error_message:message,updated_at:now})})}
async function finalize(){
 if(!key)throw new Error('Supabase backend secret missing');const id=process.env.REQUEST_ID;if(!id)return;
 const outcome=process.env.CODEX_OUTCOME||'unknown';const commit=process.env.RESULT_COMMIT_SHA||null;let result=null;
 try{result=JSON.parse(await fs.readFile('.agent-run/result.json','utf8'))}catch{}
 if(outcome!=='success'){await fail(id,`Codex runner outcome: ${outcome}.`);return}
 const reqs=await api(`academy_agent_run_requests?id=eq.${id}&select=*`);const req=reqs?.[0];if(!req)return;
 const projects=await api(`academy_content_projects?project_id=eq.${encodeURIComponent(req.project_id)}&select=*`);const p=projects?.[0];if(!p){await fail(id,'Project missing during finalize.');return}
 if(result){
  const stay=req.requested_stage,review=nextReview(stay);const target=result.workflow_stage;
  const valid=(result.current_status==='AGENT_WORKING'&&target===stay)||(result.current_status==='READY_FOR_REVIEW'&&target===review);
  if(!valid){await fail(id,`Runner returned invalid lifecycle transition ${result.current_status}/${target}.`);return}
  const pct=Math.max(0,Math.min(100,Math.round(Number(result.progress_percent)||0)));const patch={current_status:result.current_status,workflow_stage:target,progress_percent:pct,progress_stage:String(result.progress_stage||p.progress_stage||''),progress_detail:String(result.progress_detail||p.progress_detail||''),progress_next:String(result.progress_next||p.progress_next||''),material_summary:String(result.material_summary||p.material_summary||''),last_agent:req.requested_agent,last_synced_at:new Date().toISOString(),progress_updated_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  if(result.current_status==='READY_FOR_REVIEW')patch.owner_review_status='PENDING';
  await api(`academy_content_projects?project_id=eq.${encodeURIComponent(p.project_id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)});
  for(const f of Array.isArray(result.feedback_resolutions)?result.feedback_resolutions:[]){if(!f?.id||!['APPLIED','BLOCKED'].includes(f.status))continue;await api(`academy_stage_feedback?id=eq.${encodeURIComponent(f.id)}&project_id=eq.${encodeURIComponent(p.project_id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:f.status,resolved_at:new Date().toISOString(),resolved_by_agent:req.requested_agent,resolution_note:String(f.resolution_note||'')})})}
 }
 const now=new Date().toISOString();await api(`academy_agent_run_requests?id=eq.${id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'COMPLETED',completed_at:now,result_commit_sha:commit,result_summary:String(result?.result_summary||'Manual agent cycle completed.'),updated_at:now})});
 await state(true,null);
}

if(mode==='claim')await claim();else if(mode==='finalize')await finalize();else throw new Error(`Unknown mode ${mode}`);
