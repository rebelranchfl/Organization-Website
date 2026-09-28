// Shared definitions for the Academy owner back office (Overview, Project page, Library).
// Owner decisions 2026-09-27: value-first stage order, 5 display phases, Parked list.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27

// Stages in the value-first order. `key` matches academy_content_projects.workflow_stage.
export const STAGES = [
  { key: 'IDEA', label: 'Idea + Context', phase: 'research' },
  { key: 'PRODUCT_OPPORTUNITY_RESEARCH', label: 'Product Opportunity', phase: 'research' },
  { key: 'VALUE_SCREEN_REVIEW', label: 'Value Screen', phase: 'research' },
  { key: 'RESEARCH_WORKING', label: 'Research', phase: 'research' },
  { key: 'RESEARCH_REVIEW', label: 'Research Review', phase: 'research', gate: true },
  { key: 'PRODUCT_WORKING', label: 'Product Design', phase: 'design' },
  { key: 'PRODUCT_REVIEW', label: 'Product Review', phase: 'design', gate: true },
  { key: 'VISUAL_PRODUCTION', label: 'Visual Production', phase: 'build' },
  { key: 'FINAL_PRODUCT_REVIEW', label: 'Final Product Review', phase: 'quality', gate: true },
  { key: 'AWAITING_RELEASE', label: 'Release Prep', phase: 'release' },
  { key: 'PUBLISHING', label: 'Publishing', phase: 'release' },
  { key: 'LIVE', label: 'Live', phase: 'release' }
];
const ALIASES = { APPROVED_AWAITING_RELEASE: 'AWAITING_RELEASE' };

export const PHASES = [
  { key: 'research', label: 'Research & Value', gates: 'Idea · Opportunity · Value screen · Research · Gate 1' },
  { key: 'design', label: 'Design', gates: 'Structure · Interactions · Gate 2' },
  { key: 'build', label: 'Build', gates: 'Images · Rendered product' },
  { key: 'quality', label: 'Quality Check', gates: 'You verify images & materials · Gate 3' },
  { key: 'release', label: 'Release', gates: 'Release Prep · Publishing · Live' }
];

// Stages where the owner makes a decision.
export const OWNER_GATES = new Set(['VALUE_SCREEN_REVIEW', 'RESEARCH_REVIEW', 'PRODUCT_REVIEW', 'FINAL_PRODUCT_REVIEW']);

export const stageKey = k => ALIASES[k] || k;
export const stageIndex = k => STAGES.findIndex(s => s.key === stageKey(k));
export const stageOf = k => STAGES[stageIndex(k)] || null;
export const stageLabel = k => stageOf(k)?.label || (k === 'REJECTED' ? 'Rejected' : String(k || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, m => m.toUpperCase()));
export const phaseOf = k => PHASES.find(p => p.key === stageOf(k)?.phase) || null;

export const isParked = p => !!(p.owner_hold || p.archived);
export const isWaitingOnOwner = p => !isParked(p) && p.current_status === 'READY_FOR_REVIEW' && OWNER_GATES.has(stageKey(p.workflow_stage));

export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function price(p) {
  const v = p?.proposed_price;
  if (v === null || v === undefined || v === '') return { text: 'Not set', set: false };
  const n = Number(v);
  if (n === 0) return { text: 'Free', set: true };
  return { text: `$${n % 1 ? n.toFixed(2) : n}`, set: true };
}
export function money(v) {
  if (v === null || v === undefined || v === '') return 'Not set';
  return `$${Number(v).toLocaleString()}`;
}
export function daysSince(ts) {
  if (!ts) return null;
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  return Number.isFinite(d) ? Math.max(0, d) : null;
}
export function fmtDate(ts) {
  if (!ts) return 'Not recorded';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? String(ts) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
export const PRIORITY_ORDER = { IMMEDIATE: 0, HIGH: 1, NORMAL: 2 };

// One state label per project, derived from data (never free text).
export function stateOf(p, runnerReady) {
  if (isParked(p)) return { cls: 'parked', text: 'Parked' };
  const k = stageKey(p.workflow_stage);
  if (k === 'REJECTED') return { cls: 'stopped', text: 'Rejected' };
  if (k === 'LIVE') return { cls: 'done', text: 'Live' };
  if (isWaitingOnOwner(p)) return { cls: 'you', text: k === 'VALUE_SCREEN_REVIEW' ? 'Your call' : 'Your review' };
  if (p.current_status === 'NEW_IDEA') return { cls: 'queued', text: 'New idea' };
  if (['AGENT_WORKING', 'APPROVED', 'NEEDS_MORE_WORK'].includes(p.current_status)) {
    return runnerReady ? { cls: 'agent', text: p.current_status === 'AGENT_WORKING' ? 'Agent working' : 'Queued for agent' }
                       : { cls: 'stuck', text: 'Waiting · runner off' };
  }
  return { cls: 'queued', text: stageLabel(k) };
}

// Markdown to safe HTML: headings, bold/italic, inline code, links, lists, tables, rules, quotes.
function inline(s) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  t = t.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  return t;
}
const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
export function markdown(text) {
  const lines = String(text || '').split(/\r?\n/);
  const out = [];
  let list = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    if (!line.trim()) { closeList(); continue; }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      closeList();
      const head = cells(line);
      i += 1;
      const rows = [];
      while (i + 1 < lines.length && /^\s*\|.*\|\s*$/.test(lines[i + 1])) { i += 1; rows.push(cells(lines[i])); }
      out.push(`<div class="md-table"><table><thead><tr>${head.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    let m = line.match(/^(#{1,4})\s+(.*)$/);
    if (m) { closeList(); out.push(`<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`); continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { closeList(); out.push('<hr>'); continue; }
    m = line.match(/^\s*>\s?(.*)$/);
    if (m) { closeList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    m = line.match(/^\s*[-*]\s+(.*)$/);
    if (m) { if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    m = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (m) { if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join('');
}

// Owner navigation: Overview · Projects · New Idea · Library · Sales, plus Academy and My Account.
// 2026-09-28: Sales added; Academy link points to the Academy's main-site home.
export const NAV = [
  ['Overview', 'operations-review.html', 'overview'],
  ['Projects', 'operations-review.html#projects', 'projects'],
  ['New Idea', 'operations-review.html#new', 'new'],
  ['Library', 'academy-interaction-library.html', 'library'],
  ['Sales', 'academy-sales.html', 'sales']
];
export function navHtml(active) {
  return `<nav class="aa-nav" aria-label="Academy owner navigation">${NAV.map(([label, href, key]) => `<a href="${href}" data-nav="${key}"${key === active ? ' aria-current="page"' : ''}>${label}</a>`).join('')}<span class="aa-nav-sep"></span><a href="rebel-ranch-academy.html">Academy</a><a href="account.html">My Account</a></nav>`;
}

export async function requireAdmin(supabase, loadingEl) {
  const { data: s, error } = await supabase.auth.getSession();
  if (error) throw error;
  const user = s.session?.user;
  if (!user) { location.href = `account.html?next=${encodeURIComponent(location.pathname.replace(/^\//, '') + location.search + location.hash)}`; return false; }
  const { data: roles, error: re } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (re) throw re;
  if (!(roles || []).some(r => r.role === 'admin')) { if (loadingEl) loadingEl.textContent = 'Administrator access is required.'; return false; }
  return true;
}
