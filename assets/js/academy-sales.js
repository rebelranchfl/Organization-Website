// Academy owner page: every sale and membership payment (with receipts) and the
// membership plan editor. Saving a plan sends its price to PayPal automatically.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
import { supabase, SUPABASE_URL } from './supabase-client.js';
import { navHtml, requireAdmin } from './academy-admin-shared.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const usd = (v) => `$${Number(v || 0).toFixed(2)}`;
const day = (v) => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
document.getElementById('aa-nav-host').innerHTML = navHtml('sales');
const view = document.getElementById('aa-view'), loading = document.getElementById('aa-loading'), notice = document.getElementById('aa-notice');

if (await requireAdmin(supabase, loading)) { loading.remove(); await load(); }

async function load() {
  const [pur, subs, pays, plans] = await Promise.all([
    supabase.from('academy_purchases').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('academy_member_subscriptions').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('academy_membership_payments').select('*').order('paid_at', { ascending: false }).limit(500),
    supabase.from('academy_membership_plans').select('*').order('sort_order').order('price_usd'),
  ]);
  const P = pur.data || [], S = subs.data || [], M = pays.data || [], plansList = plans.data || [];
  const subById = Object.fromEntries(S.map((s) => [s.id, s]));
  const sales = [
    ...P.filter((p) => p.status !== 'PENDING').map((p) => ({ date: p.completed_at || p.created_at, who: p.buyer_email, what: p.item_title, kind: 'Item', amount: p.amount_usd, status: p.status, no: p.receipt_number, pp: p.paypal_capture_id || p.paypal_order_id, link: `academy-receipt.html?type=item&id=${p.id}` })),
    ...M.map((m) => ({ date: m.paid_at, who: subById[m.subscription_id]?.buyer_email, what: `Membership — ${subById[m.subscription_id]?.plan_name || ''}`, kind: 'Membership', amount: m.amount_usd, status: m.status, no: m.receipt_number, pp: m.paypal_sale_id, link: `academy-receipt.html?type=membership&id=${m.id}` })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const paid = sales.filter((s) => s.status === 'COMPLETED');
  const now = new Date(), monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeMembers = S.filter((s) => s.status === 'ACTIVE' || s.status === 'PAST_DUE').length;
  const pending = P.filter((p) => p.status === 'PENDING').length;

  view.innerHTML = `
    <section class="aa-kpis">
      <div class="aa-kpi"><span class="aa-note">Total sales</span><strong>${usd(paid.reduce((t, s) => t + Number(s.amount), 0))}</strong></div>
      <div class="aa-kpi"><span class="aa-note">This month</span><strong>${usd(paid.filter((s) => new Date(s.date) >= monthStart).reduce((t, s) => t + Number(s.amount), 0))}</strong></div>
      <div class="aa-kpi"><span class="aa-note">Items sold</span><strong>${paid.filter((s) => s.kind === 'Item').length}</strong></div>
      <div class="aa-kpi"><span class="aa-note">Active members</span><strong>${activeMembers}</strong></div>
    </section>

    <section class="aa-section">
      <div class="aa-section-head"><h2>Every sale</h2><span class="aa-note">${pending ? `${pending} checkout${pending === 1 ? '' : 's'} started but not paid (not shown)` : ''}</span></div>
      ${sales.length ? `<div class="aa-table-wrap"><table class="aa-table"><thead><tr><th>Date</th><th>Buyer</th><th>What</th><th>Amount</th><th>Status</th><th>Receipt</th><th>PayPal ID</th></tr></thead><tbody>
        ${sales.map((s) => `<tr><td>${esc(day(s.date))}</td><td>${esc(s.who || '')}</td><td>${esc(s.what)}</td><td>${esc(usd(s.amount))}</td><td>${esc(s.status === 'COMPLETED' ? 'Paid' : s.status.toLowerCase())}</td><td><a href="${s.link}">${esc(s.no || 'view')}</a></td><td class="aa-note">${esc(s.pp || '')}</td></tr>`).join('')}
      </tbody></table></div>` : `<p class="aa-note">No sales yet. Sales appear here the moment PayPal confirms payment.</p>`}
    </section>

    <section class="aa-section">
      <div class="aa-section-head"><h2>Members</h2></div>
      ${S.filter((s) => s.status !== 'PENDING').length ? `<div class="aa-table-wrap"><table class="aa-table"><thead><tr><th>Member</th><th>Plan</th><th>Price</th><th>Status</th><th>Started</th><th>Renews / ends</th></tr></thead><tbody>
        ${S.filter((s) => s.status !== 'PENDING').map((s) => `<tr><td>${esc(s.buyer_email || '')}</td><td>${esc(s.plan_name)}</td><td>${esc(usd(s.amount_usd))}/${s.billing_interval === 'YEAR' ? 'yr' : 'mo'}</td><td>${esc(s.status.toLowerCase().replace('_', ' '))}</td><td>${esc(day(s.started_at))}</td><td>${esc(day(s.current_period_end))}</td></tr>`).join('')}
      </tbody></table></div>` : `<p class="aa-note">No members yet.</p>`}
    </section>

    <section class="aa-section" id="plans">
      <div class="aa-section-head"><h2>Membership plans</h2><span class="aa-note">Saving sends the price to PayPal automatically. A new price creates a new PayPal plan; existing members keep the price they signed up at.</span></div>
      ${plansList.map((pl) => planForm(pl)).join('')}
      <details class="pp-drawer"><summary>Add a membership plan</summary>${planForm(null)}</details>
    </section>`;

  view.querySelectorAll('form[data-plan]').forEach((f) => f.addEventListener('submit', savePlan));
}

function planForm(pl) {
  const id = pl?.id || '';
  const synced = pl?.paypal_plan_id ? `Linked to PayPal plan ${esc(pl.paypal_plan_id)} at ${usd(pl.paypal_plan_price)}/${pl.paypal_plan_interval === 'YEAR' ? 'yr' : 'mo'} · ${day(pl.paypal_synced_at)}` : 'Not sent to PayPal yet';
  return `<form class="aa-form pp-box" data-plan="${id}" style="margin:10px 0">
    <div class="aa-split" style="grid-template-columns:1fr 1fr">
      <label>Plan name<input name="name" value="${esc(pl?.name || '')}" required maxlength="80"></label>
      <label>Price (dollars)<input name="price" type="number" min="1" step="0.01" value="${esc(pl?.price_usd ?? '')}" required></label>
      <label>Billing<select class="aa-field" name="interval"><option value="MONTH" ${pl?.billing_interval !== 'YEAR' ? 'selected' : ''}>Monthly</option><option value="YEAR" ${pl?.billing_interval === 'YEAR' ? 'selected' : ''}>Yearly</option></select></label>
      <label>Shown to the public<select class="aa-field" name="active"><option value="false" ${!pl?.active ? 'selected' : ''}>No (hidden)</option><option value="true" ${pl?.active ? 'selected' : ''}>Yes</option></select></label>
    </div>
    <label>Description (what members get)<textarea name="description" maxlength="400">${esc(pl?.description || 'Open every Academy lesson, guide and tool while your membership is active.')}</textarea></label>
    <p class="aa-note">Includes: every paid Academy item.</p>
    <div class="pp-btns"><button class="aa-btn" type="submit">${pl ? 'Save & send to PayPal' : 'Create & send to PayPal'}</button><span class="aa-note">${pl ? synced : ''}</span></div>
    <p class="aa-note" data-msg role="status"></p>
  </form>`;
}

async function savePlan(e) {
  e.preventDefault();
  const form = e.currentTarget, f = new FormData(form), id = form.dataset.plan, out = form.querySelector('[data-msg]');
  const row = { name: String(f.get('name')).trim(), price_usd: Number(f.get('price')), billing_interval: f.get('interval'), description: String(f.get('description') || '').trim(), active: f.get('active') === 'true', updated_at: new Date().toISOString() };
  out.textContent = 'Saving…';
  let planId = id;
  if (id) {
    const { error } = await supabase.from('academy_membership_plans').update(row).eq('id', id);
    if (error) { out.textContent = error.message; return; }
  } else {
    const code = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || `plan-${Date.now()}`;
    const { data, error } = await supabase.from('academy_membership_plans').insert({ ...row, code }).select('id').single();
    if (error) { out.textContent = error.message; return; }
    planId = data.id;
  }
  out.textContent = 'Sending price to PayPal…';
  try {
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/academy-commerce`, {
      method: 'POST', headers: { Authorization: `Bearer ${s.session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync_plan', plan_id: planId }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.detail || body.error || `PayPal sync failed (${res.status})`);
    notice.textContent = body.created_new_plan ? 'Saved. PayPal plan created.' : 'Saved. PayPal already had this price.';
    await load();
  } catch (err) { out.textContent = `Saved here, but PayPal was not updated: ${err.message}. Press save again to retry.`; }
}
