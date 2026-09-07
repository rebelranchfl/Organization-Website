import fs from 'node:fs/promises';
import process from 'node:process';

const mode=process.argv[2]||'prepare';
const dispatchUrl=process.env.ACADEMY_DISPATCH_URL||'https://dfrwxpuojeiykaignyny.supabase.co/functions/v1/academy-agent-dispatch';
const runner='github-codex-v1';
const out=process.env.GITHUB_OUTPUT;

async function writeOut(name,value){if(out)await fs.appendFile(out,`${name}=${String(value).replace(/\n/g,'%0A')}\n`)}
function agentFor(stage){
  if(stage==='PRODUCT_WORKING')return 'RRA Product Design Agent';
  if(stage==='VISUAL_PRODUCTION')return 'RRA Visual Production Agent';
  return null;
}
function requiredControls(stage){
  const common=[
    'AGENTS.md',
    'docs/rebel-ranch-ecosystem-charter.md',
    'rebel ranch academy/AGENTS.md',
    'rebel ranch academy/docs/workflow/ACADEMY-REVISION-PRESERVATION-STANDARD.md',
    'rebel ranch academy/docs/workflow/ACADEMY-PRODUCT-PHASE-WORKFLOW-EXTENSION.md',
    'rebel ranch academy/docs/intelligence/ACADEMY-CONTINUOUS-IMPROVEMENT-LOOP.md',
    'rebel ranch academy/docs/intelligence/ACADEMY-SOURCE-REVIEW-POLICY.md',
    'rebel ranch academy/docs/intelligence/ACADEMY-RESPONSIBLE-REBELLION-EVIDENCE-FIRST-STANDARD.md',
    'rebel ranch academy/docs/intelligence/ACADEMY-THINK-LIKE-A-REBEL-FRAMEWORK.md',
    'rebel ranch academy/docs/production/ACADEMY-LEARNER-EXPERIENCE-LANGUAGE-VISUAL-STANDARD.md'
  ];
  if(stage==='PRODUCT_WORKING')common.push('rebel ranch academy/docs/production/ACADEMY-PRODUCT-DESIGN-AGENT-STANDARD.md');
  if(stage==='VISUAL_PRODUCTION')common.push(
    'rebel ranch academy/docs/production/ACADEMY-VISUAL-PRODUCTION-AGENT-STANDARD.md',
    'rebel ranch academy/docs/production/ACADEMY-CHATGPT-IMAGE-PRODUCTION-STANDARD.md',
    'rebel ranch academy/docs/qa/ACADEMY-RENDERED-PRODUCT-QA-STANDARD.md'
  );
  return common;
}
async function ensureFile(path){
  const s=await fs.stat(path).catch(()=>null);
  if(!s||!s.isFile())throw new Error(`Required control is missing from checkout: ${path}`);
}
async function ensureDirectory(path){
  const s=await fs.stat(path).catch(()=>null);
  if(!s||!s.isDirectory())throw new Error(`Project directory is missing from checkout: ${path}`);
}
function validateResult(result){
  if(!result||typeof result!=='object'||Array.isArray(result))throw new Error('result.json must contain one JSON object.');
  const pct=Number(result.progress_percent);
  if(!Number.isInteger(pct)||pct<0||pct>100)throw new Error('result.json progress_percent must be an integer from 0 to 100.');
  for(const field of ['progress_stage','progress_detail','progress_next','material_summary','result_summary']){
    if(typeof result[field]!=='string'||!result[field].trim())throw new Error(`result.json ${field} is required.`);
  }
  if(!['STAY_CURRENT_STAGE','REQUEST_INDEPENDENT_VERIFICATION'].includes(result.stage_recommendation))throw new Error('result.json stage_recommendation is invalid.');
  if(!Array.isArray(result.changed_files))throw new Error('result.json changed_files must be an array.');
  if(!Array.isArray(result.blockers))throw new Error('result.json blockers must be an array.');
  if(!Array.isArray(result.feedback_resolutions))throw new Error('result.json feedback_resolutions must be an array.');
  if(!Array.isArray(result.improvement_signals))throw new Error('result.json improvement_signals must be an array.');
  if(result.stage_recommendation==='REQUEST_INDEPENDENT_VERIFICATION'&&result.blockers.length)throw new Error('A result with blockers cannot request independent stage verification.');
  return result;
}
async function fetchRunContext(id,token){
  const r=await fetch(`${dispatchUrl}/context`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request_id:id,callback_token:token})});
  const text=await r.text();
  let body=null;
  try{body=text?JSON.parse(text):null}catch{}
  if(!r.ok)throw new Error(`Dispatcher context request failed (${r.status}): ${body?.error||'unknown error'}`);
  if(!body?.request||!body?.project)throw new Error('Dispatcher context response is incomplete.');
  return body;
}
async function readContext(){
  let context;
  try{context=JSON.parse(await fs.readFile('.agent-run/context.json','utf8'))}catch{throw new Error('Prepared .agent-run/context.json is missing or invalid.');}
  if(!context?.request||!context?.project||!context?.runner_contract)throw new Error('Prepared context is incomplete.');
  return context;
}

async function prepare(){
  const id=String(process.env.REQUEST_ID||'').trim();
  const token=String(process.env.CALLBACK_TOKEN||'').trim();
  if(!id)throw new Error('REQUEST_ID is required. The dispatcher must claim one exact request before this workflow starts.');
  if(!token)throw new Error('CALLBACK_TOKEN is required as the one-run context/completion credential.');

  const context=await fetchRunContext(id,token);
  const req=context.request;
  const p=context.project;
  if(req.id!==id)throw new Error('Dispatcher returned a different run request.');
  if(req.status!=='RUNNING')throw new Error(`Run request ${id} is ${req.status}; expected RUNNING from the dispatcher.`);
  if(req.runner!==runner)throw new Error(`Run request ${id} is assigned to ${req.runner||'no runner'}, not ${runner}.`);
  const expected=agentFor(req.requested_stage);
  if(!expected)throw new Error(`Stage ${req.requested_stage} is not executable by ${runner}.`);
  if(p.owner_hold)throw new Error(`Project ${p.project_id} is on owner hold.`);
  if(p.current_status!=='AGENT_WORKING')throw new Error(`Project ${p.project_id} is ${p.current_status}; expected AGENT_WORKING after verified dispatch.`);
  if(p.workflow_stage!==req.requested_stage)throw new Error(`Request stage ${req.requested_stage} no longer matches project stage ${p.workflow_stage}.`);
  if(!p.github_branch||p.github_branch==='main')throw new Error('Automated Academy production requires a non-published project work branch.');
  if(!p.github_path)throw new Error(`Project ${p.project_id} has no durable GitHub project path.`);

  const ref=String(process.env.GITHUB_REF_NAME||'').trim();
  const sha=String(process.env.GITHUB_SHA||'').trim();
  if(ref!==p.github_branch)throw new Error(`Workflow branch ${ref||'UNKNOWN'} does not match project work branch ${p.github_branch}.`);
  if(!req.base_commit_sha||sha!==req.base_commit_sha)throw new Error(`Workflow commit ${sha||'UNKNOWN'} does not match dispatcher-recorded base commit ${req.base_commit_sha||'UNKNOWN'}.`);

  for(const control of requiredControls(req.requested_stage))await ensureFile(control);
  await ensureDirectory(p.github_path);

  await fs.mkdir('.agent-run',{recursive:true});
  const safeContext={request:req,project:p,pending_stage_feedback:Array.isArray(context.pending_stage_feedback)?context.pending_stage_feedback:[],runner_contract:{runner,work_branch:p.github_branch,base_commit_sha:req.base_commit_sha,stage:req.requested_stage,worker_may_advance_stage:false,independent_verification_required:true}};
  await fs.writeFile('.agent-run/context.json',JSON.stringify(safeContext,null,2));

  const stageInstruction=req.requested_stage==='VISUAL_PRODUCTION'
    ? `VISUAL PRODUCTION\nAdvance the actual learner-facing package only within the approved Product Design and current owner feedback. Preserve technical truth underneath simple learner language. Verify every factual visual claim against the approved source record. Use only verified Academy/RRM brand assets and approved wording. Keep integrated navigation and preview-manifest data accurate. If an approved raster/photographic asset cannot be produced by the available worker, record that as a blocker; do not substitute an invented logo, fake image, or decorative approximation. Rendered Product QA is an independent gate: you may prepare the candidate and evidence needed for QA, but you may not mark Final Product Review ready yourself.`
    : `PRODUCT DESIGN\nAdvance the approved product architecture, manuscript, tools, activities, audience fit and learner experience within the verified research foundation and current owner feedback. Do not add unsupported factual claims. When a new consequential claim is actually necessary, verify and record it under the Source Review / Evidence First controls rather than guessing. Product QA and owner Product Review remain separate gates: you may prepare the candidate and evidence needed for verification, but you may not mark Product Review ready yourself.`;

  const prompt=`You are executing one OWNER-AUTHORIZED Rebel Ranch Academy work cycle on a NON-PUBLISHED work branch.\n\nHARD BOUNDARIES\n1. Read .agent-run/context.json first, then every control listed by rebel ranch academy/AGENTS.md that applies to this exact stage.\n2. Work ONLY project ${p.project_id}, revision ${p.revision_number}, stage ${req.requested_stage}, as ${expected}.\n3. Project folder: ${p.github_path}. Work branch: ${p.github_branch}. Base commit: ${req.base_commit_sha}. This work branch—not main—is the current production/review source for this run.\n4. Do not edit or merge main. Do not publish, deploy, sell, activate pricing, create affiliate links, bypass owner gates, change authentication/RLS, or touch unrelated projects/programs.\n5. Verify before every consequential action. If a required fact, source, logo, wording, state, dependency or owner direction cannot be verified, STOP that action and record the blocker.\n6. Preserve owner feedback, approved research, useful prior work and revision history. Do not create in-repository backup trees; Git history is recovery.\n7. A generated file, commit, retry, visual, passing local check, or your own opinion is NOT proof that the stage passed. You are a worker, not the verification authority.\n8. When a meaningful failure/correction/success pattern occurs, record an improvement signal with evidence and next verification. Blind retry is not improvement.\n\n${stageInstruction}\n\nRESULT CONTRACT\nBefore finishing, write .agent-run/result.json as valid JSON with exactly the worker report needed for the independent verifier:\n{\n  "progress_percent": 0,\n  "progress_stage": "plain owner-readable stage label",\n  "progress_detail": "what this run actually completed",\n  "progress_next": "exact next action",\n  "material_summary": "concise current package summary",\n  "result_summary": "one short owner-facing summary",\n  "stage_recommendation": "STAY_CURRENT_STAGE or REQUEST_INDEPENDENT_VERIFICATION",\n  "changed_files": ["repository/path"],\n  "blockers": [{"code":"SHORT_CODE","detail":"verified blocker and effect"}],\n  "feedback_resolutions": [{"id":"uuid from context","proposed_status":"APPLIED or BLOCKED","resolution_note":"what happened and what still requires verification"}],\n  "improvement_signals": [{"type":"FAILURE|CORRECTION|SUCCESS_PATTERN|LEARNER_SIGNAL|MARKETING_SIGNAL","observation":"what happened","evidence":"where the evidence lives","root_cause":"verified cause or UNKNOWN_PENDING_RESEARCH","correction":"what changed, if anything","next_verification":"what must prove the lesson"}]\n}\n\nREQUEST_INDEPENDENT_VERIFICATION is only a recommendation that the candidate should enter the separate verifier. It is NEVER permission to change workflow_stage, current_status to READY_FOR_REVIEW, owner review state, release state, or publication state. If any blocker remains, use STAY_CURRENT_STAGE.`;
  await fs.writeFile('.agent-run/prompt.md',prompt);

  await writeOut('prepared','true');
  await writeOut('request_id',req.id);
  await writeOut('project_id',p.project_id);
  await writeOut('stage',req.requested_stage);
  await writeOut('project_path',p.github_path);
  await writeOut('work_branch',p.github_branch);
  await writeOut('base_commit_sha',req.base_commit_sha);
  await writeOut('agent',expected);
  console.log(`Prepared ${req.id} for ${p.project_id} ${req.requested_stage} on ${p.github_branch}@${req.base_commit_sha}`);
}

async function finalize(){
  const id=String(process.env.REQUEST_ID||'').trim();
  if(!id)throw new Error('REQUEST_ID is required.');
  if(String(process.env.CODEX_OUTCOME||'')!=='success')throw new Error(`Worker outcome is ${process.env.CODEX_OUTCOME||'unknown'}, not success.`);
  const commit=String(process.env.RESULT_COMMIT_SHA||'').trim();
  if(!commit)throw new Error('RESULT_COMMIT_SHA is required before callback completion.');

  const context=await readContext();
  const req=context.request,p=context.project;
  if(req.id!==id||req.status!=='RUNNING')throw new Error(`Prepared context does not describe running request ${id}.`);
  if(req.runner!==runner)throw new Error('Prepared context runner no longer matches this runner contract.');
  if(p.workflow_stage!==req.requested_stage)throw new Error(`Prepared project stage ${p.workflow_stage} does not match request stage ${req.requested_stage}.`);
  if(p.github_branch==='main'||!p.github_branch)throw new Error('Automated Academy production may not finalize against main.');
  if(String(process.env.GITHUB_REF_NAME||'')!==p.github_branch)throw new Error('Finalize branch does not match the project work branch.');
  if(commit===req.base_commit_sha)throw new Error('Successful worker cycle produced no new commit.');

  let result;
  try{result=validateResult(JSON.parse(await fs.readFile('.agent-run/result.json','utf8')))}catch(error){throw new Error(`Worker result contract failed: ${error.message}`)}

  await writeOut('result_valid','true');
  await writeOut('result_commit_sha',commit);
  await writeOut('result_summary',result.result_summary);
  await writeOut('stage_recommendation',result.stage_recommendation);
  await writeOut('verification_requested',result.stage_recommendation==='REQUEST_INDEPENDENT_VERIFICATION'?'true':'false');
  console.log(`Validated worker report for ${p.project_id}. Stage remains ${p.workflow_stage}; independent verification is required before advancement.`);
}

function selfTest(){
  const good={progress_percent:50,progress_stage:'Product Design',progress_detail:'Built candidate',progress_next:'Independent QA',material_summary:'Candidate',result_summary:'Worker cycle complete',stage_recommendation:'REQUEST_INDEPENDENT_VERIFICATION',changed_files:['x'],blockers:[],feedback_resolutions:[],improvement_signals:[]};
  validateResult(good);
  let blocked=false;
  try{validateResult({...good,blockers:[{code:'X',detail:'blocked'}]})}catch{blocked=true}
  if(!blocked)throw new Error('Self-test failed: blocked candidate was allowed to request verification.');
  if(agentFor('PRODUCT_WORKING')!=='RRA Product Design Agent'||agentFor('VISUAL_PRODUCTION')!=='RRA Visual Production Agent'||agentFor('RESEARCH_WORKING')!==null)throw new Error('Self-test failed: stage ownership map is invalid.');
  if(dispatchUrl.includes('service_role'))throw new Error('Self-test failed: dispatcher URL is invalid.');
  console.log('ACADEMY_RUNNER_CONTRACT_SELF_TEST_PASS');
}

if(mode==='prepare'||mode==='claim')await prepare();
else if(mode==='finalize')await finalize();
else if(mode==='self-test')selfTest();
else throw new Error(`Unknown mode ${mode}`);
