import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const mode=process.argv[2]||'verify';

function runGit(args,opts={}){
  return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],...opts}).trim();
}
function fail(message){throw new Error(message)}
function getAt(ref,path){return runGit(['show',`${ref}:${path}`])}
function jsonAt(ref,path){try{return JSON.parse(getAt(ref,path))}catch(error){fail(`Could not parse ${path} at ${ref}: ${error.message}`)}}
function stable(value){return JSON.stringify(value??null)}
function assertSame(label,a,b){if(stable(a)!==stable(b))fail(`Protected project state changed: ${label}`)}
function normalizePath(v){return String(v||'').replaceAll('\\','/').replace(/^\.\//,'').replace(/\/+$/,'')}
function isBackupPath(path){return path.split('/').some(part=>['.backups','_backups','backups','backup'].includes(part.toLowerCase()))}
function relativeToProject(projectPath,path){const prefix=`${projectPath}/`;return path.startsWith(prefix)?path.slice(prefix.length):null}

const protectedLifecycleFields=[
  'project_id',
  'created_at',
  'created_by',
  'revision_number',
  'github_branch',
  'current_status',
  'workflow_stage',
  'owner_review',
  'release'
];

const protectedWorkflowControlFields=[
  'authorized_stage',
  'automation_state',
  'automation_may_run',
  'final_product_review_ready',
  'release_authorized',
  'published',
  'live_verified'
];

const researchProtectedExact=new Set([
  'context-review.md','research.md','sources.md','master-content.md'
]);
const visualProtectedExact=new Set([
  'context-review.md','research.md','sources.md','master-content.md','pricing.md',
  'product-opportunity-research.md','product-recommendation-scorecard.md',
  'product-architecture.md','product-manuscript.md','product-qa.md','owner-product-review.md'
]);

function isResearchFoundation(rel){
  if(researchProtectedExact.has(rel))return true;
  const name=rel.split('/').pop()||'';
  return /^research(?:-|\.)/i.test(name)||/^sources(?:-|\.)/i.test(name)||/^source-review/i.test(name)||/^research-review/i.test(name);
}
function stageProtected(stage,rel){
  if(rel==='project.json')return false;
  if(stage==='PRODUCT_WORKING')return isResearchFoundation(rel);
  if(stage==='VISUAL_PRODUCTION'){
    if(visualProtectedExact.has(rel))return true;
    if(isResearchFoundation(rel))return true;
    const name=rel.split('/').pop()||'';
    if(/^owner-.*review/i.test(name))return true;
    if(/^product-(?:architecture|manuscript|qa|opportunity-research|recommendation-scorecard)/i.test(name))return true;
  }
  return false;
}

function verifyProjectJson(base,result,projectPath,projectId,expectedBranch,stage){
  const path=`${projectPath}/project.json`;
  const before=jsonAt(base,path),after=jsonAt(result,path);
  if(before.project_id!==projectId||after.project_id!==projectId)fail(`project.json project_id does not match ${projectId}`);
  if(after.github_branch==='main'||!after.github_branch)fail('project.json points at published main instead of a work branch');
  if(expectedBranch&&after.github_branch!==expectedBranch)fail(`project.json work branch ${after.github_branch} does not match ${expectedBranch}`);
  for(const field of protectedLifecycleFields)assertSame(field,before[field],after[field]);
  for(const field of protectedWorkflowControlFields)assertSame(`workflow_control.${field}`,before.workflow_control?.[field],after.workflow_control?.[field]);
  if(before.workflow_stage!==stage)fail(`Base project.json stage ${before.workflow_stage} does not match requested stage ${stage}`);
  return {before,after};
}

function verify(){
  const projectId=String(process.env.PROJECT_ID||'').trim();
  const projectPath=normalizePath(process.env.PROJECT_PATH);
  const stage=String(process.env.STAGE||'').trim();
  const base=String(process.env.BASE_COMMIT_SHA||'').trim();
  const result=String(process.env.RESULT_COMMIT_SHA||'').trim();
  const workBranch=String(process.env.WORK_BRANCH||process.env.GITHUB_REF_NAME||'').trim();
  if(!projectId||!projectPath||!stage||!base||!result)fail('PROJECT_ID, PROJECT_PATH, STAGE, BASE_COMMIT_SHA, and RESULT_COMMIT_SHA are required');
  if(!['PRODUCT_WORKING','VISUAL_PRODUCTION'].includes(stage))fail(`Stage ${stage} is not supported by this verifier`);
  if(workBranch==='main')fail('Independent verifier may not certify automated work on main');
  if(base===result)fail('Result commit is identical to base commit');

  try{runGit(['merge-base','--is-ancestor',base,result])}catch{fail('Result commit is not descended from the dispatcher-recorded base commit')}

  const changed=runGit(['diff','--name-only',base,result]).split('\n').filter(Boolean).map(normalizePath);
  if(!changed.length)fail('Result commit has no durable changes');
  for(const path of changed){
    if(isBackupPath(path))fail(`Backup path is prohibited: ${path}`);
    const rel=relativeToProject(projectPath,path);
    if(rel===null)fail(`Result commit changed a file outside the verified Academy project: ${path}`);
    if(stageProtected(stage,rel))fail(`Stage ${stage} changed approved/protected input: ${rel}`);
  }

  verifyProjectJson(base,result,projectPath,projectId,workBranch,stage);

  const verdict={
    verdict:'PASS',
    verifier:'academy-stage-verifier-v1',
    project_id:projectId,
    stage,
    work_branch:workBranch,
    base_commit_sha:base,
    result_commit_sha:result,
    changed_files:changed,
    checks:[
      'result descends from recorded base commit',
      'all durable changes remain inside exact project path',
      'no backup tree/path introduced',
      'protected project lifecycle/owner/release state unchanged',
      stage==='PRODUCT_WORKING'?'approved research/source foundation unchanged':'approved research/product/pricing/owner-review foundation unchanged'
    ]
  };
  return verdict;
}

function selfTest(){
  const sample='rebel ranch academy/content-library/x/y';
  if(relativeToProject(sample,`${sample}/file.md`)!=='file.md')fail('self-test: project-relative path failed');
  if(relativeToProject(sample,'business-freedom/file.md')!==null)fail('self-test: outside path was accepted');
  if(!isBackupPath(`${sample}/_backups/old.md`))fail('self-test: backup path was not detected');
  if(!stageProtected('PRODUCT_WORKING','research.md'))fail('self-test: Product stage did not protect research');
  if(!stageProtected('VISUAL_PRODUCTION','product-architecture.md'))fail('self-test: Visual stage did not protect Product Design');
  if(stageProtected('VISUAL_PRODUCTION','visual-production/index.html'))fail('self-test: Visual output was incorrectly protected');
  console.log('ACADEMY_STAGE_VERIFIER_SELF_TEST_PASS');
}

try{
  if(mode==='self-test')selfTest();
  else if(mode==='verify'){
    const verdict=verify();
    await fs.mkdir('.stage-verifier',{recursive:true});
    await fs.writeFile('.stage-verifier/verdict.json',JSON.stringify(verdict,null,2)+'\n');
    console.log(JSON.stringify(verdict));
  }else fail(`Unknown mode ${mode}`);
}catch(error){
  console.error(`ACADEMY_STAGE_VERIFIER_FAIL: ${error.message}`);
  process.exit(1);
}
