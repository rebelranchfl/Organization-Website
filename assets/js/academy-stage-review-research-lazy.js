import { supabase } from './supabase-client.js';

const params=new URLSearchParams(location.search);
const projectId=params.get('project')||'';
const requestedStage=params.get('stage')||'';
let mounted=false;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function css(){if(document.getElementById('asr-research-lazy-css'))return;const s=document.createElement('style');s.id='asr-research-lazy-css';s.textContent=`#asr-owner-research-review{margin-top:18px;padding:18px;border:1px solid #496446;border-radius:10px;background:#102718}#asr-owner-research-review h4{margin:0 0 6px}.orr-tabs,.orr-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.orr-tabs button,.orr-toolbar button{padding:9px 12px;border:1px solid #4d6d51;border-radius:7px;background:#16371f;color:#edf2e9;font-weight:900;cursor:pointer}.orr-tabs button.active{border-color:#e0a449;background:#315f39}.orr-reader{max-height:760px;overflow:auto;padding:18px;border:1px solid #36553c;border-radius:8px;background:#07150c;color:#e8eee7;line-height:1.62}.orr-reader h1,.orr-reader h2,.orr-reader h3{color:#f2d38b}.orr-diff{max-height:720px;overflow:auto;border:1px solid #36553c;border-radius:8px;background:#07150c}.orr-line{display:grid;grid-template-columns:34px 1fr;gap:8px;padding:5px 8px;font:13px/1.5 Consolas,monospace;white-space:pre-wrap}.orr-line.add{background:rgba(72,139,79,.29);border-left:4px solid #7fbe84}.orr-line.remove{background:rgba(169,76,62,.27);border-left:4px solid #c96f5b}.orr-line.context{color:#b9c4b8}.orr-note{color:#b8c5b9;font-size:.82rem}.orr-impact{display:grid;gap:10px}.orr-impact section{padding:12px;border:1px solid #36553c;border-radius:8px;background:#0d2213}.orr-edit{display:grid;gap:8px;margin:12px 0;padding:14px;border:1px solid #5d754f;border-radius:8px;background:#0b1e12}.orr-edit textarea,.orr-edit input{width:100%;padding:10px 12px;border:1px solid #45634a;border-radius:7px;background:#07180d;color:#edf2e9}.orr-edit textarea{min-height:90px}`;document.head.append(s);}
function raw(p,file,ref){const branch=encodeURIComponent(ref||p.github_branch||'main');const path=[p.github_path,file].filter(Boolean).join('/').split('/').map(encodeURIComponent).join('/');return`https://raw.githubusercontent.com/rebelranchfl/Organization-Website/${branch}/${path}`;}
async function read(p,file,ref){const r=await fetch(raw(p,file,ref),{cache:'no-cache'});return r.ok?r.text():'';}
function markdown(text){const out=[];for(const rawLine of String(text||'').split(/\r?\n/)){const line=rawLine.trimEnd();if(!line.trim()){out.push('');continue;}let m=line.match(/^(#{1,3})\s+(.*)$/);if(m){out.push(`<h${m[1].length}>${esc(m[2])}</h${m[1].length}>`);continue;}m=line.match(/^[-*]\s+(.*)$/);if(m){out.push(`<p>• ${esc(m[1])}</p>`);continue;}out.push(`<p>${esc(line)}</p>`);}return out.join('');}
function baselineFrom(text){for(const re of[/Preserved baseline:[^`]*`([0-9a-f]{7,40})`/i,/Baseline:[^`]*`([0-9a-f]{7,40})`/i,/Git commit `([0-9a-f]{7,40})`/i]){const m=String(text||'').match(re);if(m)return m[1];}return'';}
function diffLines(oldText,newText){const a=String(oldText||'').split(/\r?\n/),b=String(newText||'').split(/\r?\n/);if(a.length*b.length>1200000){return[{t:'context',v:'Large comparison: showing current changed material without retaining a full matrix.'},...b.slice(0,1200).map(v=>({t:'add',v}))];}const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);let i=0,j=0,res=[];while(i<a.length&&j<b.length){if(a[i]===b[j]){res.push({t:'context',v:a[i]});i++;j++;}else if(dp[i+1][j]>=dp[i][j+1])res.push({t:'remove',v:a[i++]});else res.push({t:'add',v:b[j++]});}while(i<a.length)res.push({t:'remove',v:a[i++]});while(j<b.length)res.push({t:'add',v:b[j++]});return res;}
function changedOnly(diff){const keep=new Set();diff.forEach((x,i)=>{if(x.t!=='context')for(let k=Math.max(0,i-2);k<=Math.min(diff.length-1,i+2);k++)keep.add(k);});return diff.filter((_,i)=>keep.has(i));}
function renderDiff(el,diff){el.className='orr-view orr-diff';el.replaceChildren();const rows=changedOnly(diff);if(!rows.length){el.textContent='No textual differences found.';return;}for(const x of rows){const r=document.createElement('div');r.className=`orr-line ${x.t}`;r.innerHTML=`<span>${x.t==='add'?'+':x.t==='remove'?'−':' '}</span><span></span>`;r.lastElementChild.textContent=x.v||' ';el.append(r);}}
function renderImpact(el,text){el.className='orr-view orr-impact';const groups={KEEP:[],ADD:[],STRENGTHEN:[],CORRECT:[],REMOVE:[]};let key='';for(const rawLine of String(text||'').split(/\r?\n/)){const line=rawLine.trim(),h=line.match(/^##\s+(KEEP|ADD|STRENGTHEN|CORRECT|REMOVE \/ REPLACE)/i);if(h){key=h[1].toUpperCase().startsWith('REMOVE')?'REMOVE':h[1].toUpperCase();continue;}if(key&&/^[-*]\s+/.test(line))groups[key].push(line.replace(/^[-*]\s+/,''));}el.innerHTML=Object.entries(groups).filter(([,v])=>v.length).map(([k,v])=>`<section><strong>${esc(k)}</strong><ul>${v.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`).join('')||'<p>No structured preservation notes found.</p>';}
function occurrence(text,needle,index){let from=0,n=0;while(true){const p=text.indexOf(needle,from);if(p<0)return-1;if(p===index)return n;n++;from=p+Math.max(1,needle.length);}}
async function edit(section,p,file,currentText){const sel=window.getSelection(),selected=sel?.toString()||'',node=sel?.anchorNode;if(!selected||!node?.parentElement?.closest?.('#asr-owner-research-review')){alert('Highlight current research text first.');return;}const start=currentText.indexOf(selected);if(start<0){alert('Select current wording, not removed wording.');return;}const form=section.querySelector('.orr-edit-form'),before=currentText.slice(Math.max(0,start-160),start),after=currentText.slice(start+selected.length,start+selected.length+160),occ=occurrence(currentText,selected,start);form.innerHTML='<div class="orr-edit"><label>Selected text</label><textarea id="orr-original" readonly></textarea><label>Replace with</label><textarea id="orr-replacement"></textarea><label>Optional note</label><input id="orr-note"><div class="orr-toolbar"><button id="orr-save" type="button">Save Owner Edit</button><button id="orr-cancel" type="button">Cancel</button></div></div>';form.querySelector('#orr-original').value=selected;form.querySelector('#orr-replacement').value=selected;form.querySelector('#orr-cancel').onclick=()=>form.replaceChildren();form.querySelector('#orr-save').onclick=async()=>{const replacement=form.querySelector('#orr-replacement').value,note=form.querySelector('#orr-note').value.trim()||null;const{error}=await supabase.rpc('submit_academy_owner_edit',{p_project_id:p.project_id,p_file_path:file,p_original_text:selected,p_replacement_text:replacement,p_context_before:before,p_context_after:after,p_occurrence_index:occ,p_note:note});if(error){alert(error.message);return;}form.innerHTML='<p class="orr-note">Owner edit saved.</p>';};}

async function mount(){
  if(mounted||requestedStage!=='RESEARCH_REVIEW'||!projectId)return;
  const page=document.querySelector('.asr-page');if(!page)return;
  mounted=true;css();
  const{data:p,error}=await supabase.from('academy_content_projects').select('project_id,github_path,github_branch,revision_number').eq('project_id',projectId).single();
  if(error||!p?.github_path)return;
  let researchFile='';
  for(const f of['master-content.md','research.md']){const t=await read(p,f);if(t){researchFile=f;break;}}
  if(!researchFile)return;
  const section=document.createElement('section');
  section.id='asr-owner-research-review';
  section.innerHTML='<h4>Review the Research</h4><p class="orr-note">Only one heavy research view is kept in memory at a time. Switching tabs destroys the previous view.</p><div class="orr-tabs"><button class="active" data-mode="research">Read Research</button><button data-mode="changes">What Changed</button><button data-mode="sources">Sources / Evidence</button><button data-mode="impact">Agent Notes / Preservation</button></div><div class="orr-toolbar"><button id="orr-edit-button" type="button">Edit Highlighted Text</button></div><div class="orr-edit-form"></div><p class="orr-status"></p><div class="orr-view orr-reader"></div>';
  const review=page.querySelector('.asr-review');review?.before(section);
  const view=section.querySelector('.orr-view'),status=section.querySelector('.orr-status'),form=section.querySelector('.orr-edit-form');
  let activeFile='',activeText='';

  async function show(mode){
    section.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode===mode));
    form.replaceChildren();
    view.replaceChildren();
    activeFile='';activeText='';
    status.textContent='Loading…';
    if(mode==='research'){
      const text=await read(p,researchFile);activeFile=researchFile;activeText=text;view.className='orr-view orr-reader';view.innerHTML=markdown(text);status.textContent='';return;
    }
    if(mode==='sources'){
      const text=await read(p,'sources.md');activeFile='sources.md';activeText=text;view.className='orr-view orr-reader';view.innerHTML=markdown(text||'No sources file available.');status.textContent='';return;
    }
    if(mode==='impact'){
      const text=await read(p,'revision-impact.md');activeFile='revision-impact.md';activeText=text;renderImpact(view,text);status.textContent='';return;
    }
    const impact=await read(p,'revision-impact.md');
    const baseline=baselineFrom(impact);
    const currentText=await read(p,researchFile);
    const before=baseline?await read(p,researchFile,baseline):'';
    activeFile=researchFile;activeText=currentText;
    renderDiff(view,diffLines(before,currentText));
    status.textContent=baseline?`Compared with preserved baseline ${baseline.slice(0,12)}…`:'No preserved baseline found; current research is shown as new work.';
  }

  section.querySelector('#orr-edit-button').onclick=()=>edit(section,p,activeFile,activeText);
  section.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>show(b.dataset.mode));
  await show('research');
  window.addEventListener('pagehide',()=>{activeText='';activeFile='';view.replaceChildren();form.replaceChildren();},{once:true});
}

document.addEventListener('academy-stage-review-ready',mount,{once:true});
if(document.querySelector('.asr-page'))mount();
