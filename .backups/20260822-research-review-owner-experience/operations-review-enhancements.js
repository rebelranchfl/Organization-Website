import { supabase } from './supabase-client.js';

const PROJECT_REPO = 'rebelranchfl/Organization-Website';
const DETAIL_ID = 'detail';
let injecting = false;

const css = `
#revision-review-enhancement,#approval-reversal-enhancement{margin:18px 0;padding:17px;border:1px solid #496446;border-radius:11px;background:#102718}
#revision-review-enhancement .rr-toolbar{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
#revision-review-enhancement .rr-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}
#revision-review-enhancement .rr-stat{padding:10px;border:1px solid #36553c;border-radius:7px;background:#0d2213}
#revision-review-enhancement .rr-stat strong{display:block;font-size:1.2rem}
#revision-review-enhancement .rr-stat span{color:var(--rrm-muted);font-size:.78rem;text-transform:uppercase}
#revision-review-enhancement .rr-diff{max-height:620px;overflow:auto;border:1px solid #36553c;border-radius:8px;background:#09180e}
#revision-review-enhancement .rr-line{display:grid;grid-template-columns:42px 1fr;gap:8px;padding:4px 8px;font:13px/1.45 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
#revision-review-enhancement .rr-line.add{background:rgba(72,139,79,.25);border-left:4px solid #7fbe84}
#revision-review-enhancement .rr-line.remove{background:rgba(169,76,62,.24);border-left:4px solid #c96f5b}
#revision-review-enhancement .rr-line.context{color:#b9c4b8}
#revision-review-enhancement .rr-impact{display:grid;gap:10px}
#revision-review-enhancement .rr-impact-block{padding:12px;border:1px solid #36553c;border-radius:8px;background:#0d2213}
#revision-review-enhancement .rr-impact-block.add{border-left:4px solid #7fbe84}
#revision-review-enhancement .rr-impact-block.strengthen,#revision-review-enhancement .rr-impact-block.correct{border-left:4px solid #e0a449}
#revision-review-enhancement .rr-impact-block.remove{border-left:4px solid #c96f5b}
#revision-review-enhancement .rr-impact-block.keep{border-left:4px solid #7b8d7c}
#revision-review-enhancement .rr-impact-block h5{margin:0 0 7px}
#approval-reversal-enhancement .rr-approval{padding:14px 0;border-top:1px solid #315239}
#approval-reversal-enhancement .rr-approval:first-of-type{border-top:0}
#approval-reversal-enhancement textarea{min-height:76px;margin-top:10px}
#approval-reversal-enhancement .rr-reverse{margin-top:10px}
@media(max-width:560px){#revision-review-enhancement .rr-summary{grid-template-columns:1fr}}
`;

function addStyles(){
  if(document.getElementById('operations-review-enhancement-styles')) return;
  const style=document.createElement('style');
  style.id='operations-review-enhancement-styles';
  style.textContent=css;
  document.head.append(style);
}

function projectIdFromPage(){
  const active=document.querySelector('.queue-item.active .queue-meta');
  const match=(active?.textContent||'').match(/RRA-\d{4}-\d{4}/);
  if(match) return match[0];
  const detail=document.getElementById(DETAIL_ID);
  const match2=(detail?.textContent||'').match(/RRA-\d{4}-\d{4}/);
  return match2?.[0]||'';
}

async function getProject(projectId){
  const {data,error}=await supabase.from('academy_content_projects')
    .select('project_id,github_path,github_branch,revision_number,progress_stage,current_status,workflow_stage')
    .eq('project_id',projectId).maybeSingle();
  if(error) throw error;
  return data;
}

function rawUrl(project,file,ref){
  const branch=encodeURIComponent(ref||project.github_branch||'main');
  const path=[project.github_path,file].filter(Boolean).join('/').split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${PROJECT_REPO}/${branch}/${path}`;
}

async function readFile(project,file,ref){
  if(!project?.github_path) return '';
  const response=await fetch(rawUrl(project,file,ref),{cache:'no-store'});
  return response.ok?response.text():'';
}

function baselineFrom(text){
  const patterns=[/Preserved baseline:[^`]*`([0-9a-f]{7,40})`/i,/Baseline:[^`]*`([0-9a-f]{7,40})`/i,/Git commit `([0-9a-f]{7,40})`/i];
  for(const re of patterns){const m=(text||'').match(re);if(m) return m[1];}
  return '';
}

function diffLines(oldText,newText){
  const a=(oldText||'').split(/\r?\n/),b=(newText||'').split(/\r?\n/);
  if(a.length*b.length>2200000){
    let start=0;while(start<a.length&&start<b.length&&a[start]===b[start])start++;
    let ae=a.length-1,be=b.length-1;while(ae>=start&&be>=start&&a[ae]===b[be]){ae--;be--;}
    return [...a.slice(0,start).map(v=>({t:'context',v})),...a.slice(start,ae+1).map(v=>({t:'remove',v})),...b.slice(start,be+1).map(v=>({t:'add',v})),...a.slice(ae+1).map(v=>({t:'context',v}))];
  }
  const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  let i=0,j=0,res=[];
  while(i<a.length&&j<b.length){
    if(a[i]===b[j]){res.push({t:'context',v:a[i]});i++;j++;}
    else if(dp[i+1][j]>=dp[i][j+1])res.push({t:'remove',v:a[i++]});
    else res.push({t:'add',v:b[j++]});
  }
  while(i<a.length)res.push({t:'remove',v:a[i++]});
  while(j<b.length)res.push({t:'add',v:b[j++]});
  return res;
}

function changesOnly(diff,context=2){
  const keep=new Set();
  diff.forEach((x,i)=>{if(x.t!=='context')for(let k=Math.max(0,i-context);k<=Math.min(diff.length-1,i+context);k++)keep.add(k)});
  return diff.filter((_,i)=>keep.has(i));
}

function renderDiff(el,diff,only=true){
  el.className='rr-diff';el.replaceChildren();
  const rows=only?changesOnly(diff):diff;
  if(!rows.length){el.textContent='No textual differences found.';return;}
  for(const x of rows){
    const row=document.createElement('div');row.className=`rr-line ${x.t}`;
    const sign=document.createElement('span');sign.textContent=x.t==='add'?'+':x.t==='remove'?'−':' ';
    const txt=document.createElement('span');txt.textContent=x.v||' ';
    row.append(sign,txt);el.append(row);
  }
}

function impactSections(text){
  const out={KEEP:[],ADD:[],STRENGTHEN:[],CORRECT:[],REMOVE:[]};let key=null;
  for(const raw of (text||'').split(/\r?\n/)){
    const line=raw.trim();
    const h=line.match(/^##\s+(KEEP|ADD|STRENGTHEN|CORRECT|REMOVE \/ REPLACE)/i);
    if(h){key=h[1].toUpperCase().startsWith('REMOVE')?'REMOVE':h[1].toUpperCase();continue;}
    if(key&&/^[-*]\s+/.test(line)) out[key].push(line.replace(/^[-*]\s+/,''));
  }
  return out;
}

function renderImpact(el,text){
  el.className='rr-impact';el.replaceChildren();
  const groups=impactSections(text);
  for(const [key,items] of Object.entries(groups)){
    if(!items.length) continue;
    const box=document.createElement('section');box.className=`rr-impact-block ${key.toLowerCase()}`;
    const h=document.createElement('h5');h.textContent=key==='REMOVE'?'REMOVE / REPLACE':key;
    const ul=document.createElement('ul');items.forEach(v=>{const li=document.createElement('li');li.textContent=v;ul.append(li)});
    box.append(h,ul);el.append(box);
  }
  if(!el.children.length) el.textContent='No structured preservation entries were found.';
}

async function addRevisionReview(detail,project){
  if(detail.querySelector('#revision-review-enhancement')) return;
  const impact=(await readFile(project,'product-preservation-check.md'))||(await readFile(project,'revision-impact.md'));
  const baseline=baselineFrom(impact);
  if(!baseline) return;
  const candidate=['master-content.md','research.md','concept.md','sources.md','research-uv-addendum.md','sources-uv-addendum.md','uv-gap-qa.md'];
  const current={};
  await Promise.all(candidate.map(async f=>{const t=await readFile(project,f);if(t)current[f]=t;}));
  const files=Object.keys(current);if(!files.length)return;

  const section=document.createElement('section');section.id='revision-review-enhancement';
  section.innerHTML='<h4>What Changed?</h4><p class="muted">Review actual Git differences instead of rereading unchanged material. Green is added. Red is removed. Preservation Check shows why.</p><div class="rr-summary"></div><div class="rr-toolbar"></div><p class="muted rr-note"></p><div class="rr-diff"></div>';
  const summary=section.querySelector('.rr-summary'),toolbar=section.querySelector('.rr-toolbar'),note=section.querySelector('.rr-note'),view=section.querySelector('.rr-diff');
  const select=document.createElement('select');select.style.width='auto';files.forEach(f=>{const o=document.createElement('option');o.value=f;o.textContent=f;select.append(o)});
  if(/uv/i.test(project.progress_stage||'')&&current['research-uv-addendum.md'])select.value='research-uv-addendum.md';else if(current['master-content.md'])select.value='master-content.md';
  toolbar.append(select);
  let mode='changes';const buttons={};
  for(const [k,l] of [['changes','Changes Only'],['full','Full Context'],['sources','Sources Changed'],['impact','Preservation Check']]){
    const b=document.createElement('button');b.type='button';b.className='button secondary';b.textContent=l;b.onclick=()=>{mode=k;refresh()};toolbar.append(b);buttons[k]=b;
  }
  async function refresh(){
    Object.entries(buttons).forEach(([k,b])=>b.className=`button ${k===mode?'primary':'secondary'}`);summary.replaceChildren();
    if(mode==='impact'){renderImpact(view,impact);note.textContent=`Preservation record against Git baseline ${baseline.slice(0,12)}…`;return;}
    const file=mode==='sources'?'sources.md':select.value;
    const now=current[file]||await readFile(project,file),before=await readFile(project,file,baseline),diff=diffLines(before,now);
    const adds=diff.filter(x=>x.t==='add').length,removes=diff.filter(x=>x.t==='remove').length;
    for(const [v,l] of [[`+${adds}`,'Lines added'],[`−${removes}`,'Lines removed'],[String(project.revision_number),'Revision'],[baseline.slice(0,8),'Baseline']]){
      const d=document.createElement('div');d.className='rr-stat';const strong=document.createElement('strong');strong.textContent=v;const span=document.createElement('span');span.textContent=l;d.append(strong,span);summary.append(d);
    }
    note.textContent=before?`${file}: actual comparison against preserved baseline ${baseline.slice(0,12)}…`:`${file}: this file did not exist at the preserved baseline, so the entire file is new.`;
    renderDiff(view,diff,mode!=='full');
  }
  select.onchange=()=>{if(mode==='impact'||mode==='sources')mode='changes';refresh()};
  await refresh();
  const anchor=detail.querySelector('.source-review')||detail.querySelector('.artifact-card')||detail.querySelector('.review-box');
  if(anchor)detail.insertBefore(section,anchor);else detail.append(section);
}

function stageLabel(stage){return stage==='RESEARCH_REVIEW'?'Research Review':stage==='PRODUCT_REVIEW'?'Product Review':stage==='FINAL_PRODUCT_REVIEW'?'Final Product Review':stage;}

async function activeApprovals(projectId){
  const {data,error}=await supabase.from('academy_content_review_events').select('id,review_stage,decision,created_at,reversal_of_event_id').eq('project_id',projectId).order('created_at',{ascending:true});
  if(error) throw error;
  const latest=new Map();for(const e of data||[])latest.set(e.review_stage,e);
  return [...latest.values()].filter(e=>e.decision==='APPROVE');
}

async function addApprovalControls(detail,project){
  if(detail.querySelector('#approval-reversal-enhancement')) return;
  const approvals=await activeApprovals(project.project_id);if(!approvals.length)return;
  const section=document.createElement('section');section.id='approval-reversal-enhancement';
  section.innerHTML='<h4>Active Owner Approvals</h4><p class="muted">Approvals are never erased. Reverse one to reopen that exact review gate. The reason is optional and stays in the audit history.</p>';
  for(const approval of approvals){
    const item=document.createElement('div');item.className='rr-approval';
    const title=document.createElement('strong');title.textContent=`${stageLabel(approval.review_stage)} — Approved`;
    const meta=document.createElement('p');meta.className='muted';meta.textContent=`Approved ${new Date(approval.created_at).toLocaleString()}. Reversing reopens ${stageLabel(approval.review_stage)} without deleting this approval.`;
    const ta=document.createElement('textarea');ta.placeholder='Optional: why are you reversing this approval?';
    const b=document.createElement('button');b.type='button';b.className='button danger rr-reverse';b.textContent=`Reverse ${stageLabel(approval.review_stage)} Approval`;
    b.onclick=async()=>{b.disabled=true;const{error}=await supabase.rpc('reverse_academy_stage_approval',{p_project_id:project.project_id,p_review_stage:approval.review_stage,p_comment:ta.value.trim()||null});if(error){b.disabled=false;alert(`Approval was not reversed: ${error.message}`);return;}location.reload();};
    item.append(title,meta,ta,b);section.append(item);
  }
  detail.append(section);
}

async function inject(){
  if(injecting)return;injecting=true;
  try{
    const detail=document.getElementById(DETAIL_ID),projectId=projectIdFromPage();
    if(!detail||!projectId)return;
    const project=await getProject(projectId);if(!project)return;
    await addRevisionReview(detail,project);
    await addApprovalControls(detail,project);
  }catch(error){console.error('Operations Review enhancement error',error);}finally{injecting=false;}
}

addStyles();
const observer=new MutationObserver(()=>queueMicrotask(inject));
observer.observe(document.body,{childList:true,subtree:true});
queueMicrotask(inject);
