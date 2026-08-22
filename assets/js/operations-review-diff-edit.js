import { supabase } from './supabase-client.js';

function projectId(){const m=(document.querySelector('.queue-item.active .queue-meta')?.textContent||document.getElementById('detail')?.textContent||'').match(/RRA-\d{4}-\d{4}/);return m?.[0]||''}
async function getProject(id){const{data,error}=await supabase.from('academy_content_projects').select('project_id,github_path,github_branch').eq('project_id',id).maybeSingle();if(error)throw error;return data}
function raw(p,file){const ref=encodeURIComponent(p.github_branch||'main');const path=[p.github_path,file].join('/').split('/').map(encodeURIComponent).join('/');return`https://raw.githubusercontent.com/rebelranchfl/Organization-Website/${ref}/${path}`}
async function read(p,file){const r=await fetch(raw(p,file),{cache:'no-store'});return r.ok?r.text():''}
function occurrence(text,needle,index){let from=0,n=0;while(true){const p=text.indexOf(needle,from);if(p<0)return-1;if(p===index)return n;n++;from=p+Math.max(1,needle.length)}}

function inject(){
 const review=document.getElementById('revision-review-enhancement');if(!review||review.querySelector('#diff-owner-edit'))return;
 const toolbar=review.querySelector('.rr-toolbar');if(!toolbar)return;
 const button=document.createElement('button');button.id='diff-owner-edit';button.type='button';button.className='button secondary';button.textContent='Edit Selected Change';toolbar.append(button);
 const form=document.createElement('div');form.id='diff-owner-edit-form';review.insertBefore(form,review.querySelector('.rr-note'));
 button.onclick=async()=>{
   const sel=window.getSelection(),text=sel?.toString()||'',node=sel?.anchorNode;
   if(!text||!node?.parentElement?.closest?.('#revision-review-enhancement')){alert('Highlight text inside the Changes Review first.');return;}
   const id=projectId(),p=await getProject(id),select=review.querySelector('select'),file=select?.value||'master-content.md';
   const full=await read(p,file),start=full.indexOf(text);
   if(start<0){alert('That selected text is not present in the current file. Select current/green text rather than removed/red text.');return;}
   const before=full.slice(Math.max(0,start-140),start),after=full.slice(start+text.length,start+text.length+140),occ=occurrence(full,text,start);
   form.innerHTML='<div class="oc-edit-box"><label>Selected current text</label><textarea id="diff-original" readonly></textarea><label>Replace with</label><textarea id="diff-replacement"></textarea><label>Optional reason / note</label><input id="diff-note" placeholder="Optional"><div class="oc-actions"><button class="button primary" id="diff-save">Save Owner Edit</button><button class="button secondary" id="diff-cancel">Cancel</button></div></div>';
   form.querySelector('#diff-original').value=text;form.querySelector('#diff-replacement').value=text;form.querySelector('#diff-cancel').onclick=()=>form.replaceChildren();
   form.querySelector('#diff-save').onclick=async()=>{const replacement=form.querySelector('#diff-replacement').value,note=form.querySelector('#diff-note').value.trim()||null;const{error}=await supabase.rpc('submit_academy_owner_edit',{p_project_id:id,p_file_path:file,p_original_text:text,p_replacement_text:replacement,p_context_before:before,p_context_after:after,p_occurrence_index:occ,p_note:note});if(error){alert(error.message);return;}form.innerHTML='<p class="muted">Owner edit saved and moved to Immediate priority. The responsible agent will persist it to GitHub.</p>';};
 };
}

const observer=new MutationObserver(()=>queueMicrotask(inject));observer.observe(document.body,{childList:true,subtree:true});queueMicrotask(inject);
