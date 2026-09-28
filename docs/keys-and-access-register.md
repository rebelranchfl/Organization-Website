# Keys and Access Register

**Status:** Controlling register for every key, token and secret RRM systems use.  
**Owner direction (2026-09-28):** keep all keys in one separate document so any agent can find where each key lives and how it is used, instead of asking the owner to make new keys.  
**AI-Agent:** Claude (claude-opus-5-5) · **Session:** Academy back office restructure 2026-09-27

## 0. The rules (read first)

1. **This file lists names and locations only. It never contains a key value.** Never paste a key, password or token into this file, into any other repository file, into chat, or into browser code.
2. **A key is used by the code that runs where the key lives.** Agents do not need to see keys. An agent changes or deploys the code (for example a Supabase Edge Function), and that code reads the key from its own locked storage.
3. **Before asking the owner for a new key, check this register.** If the key is listed as present, it already exists; use the code that reads it.
4. **If a new key is truly needed:** the owner creates it at the provider and pastes it into the locked storage named in this register (steps in section 4). Agents may guide the owner click by click but must not type or paste key values themselves. Then add the new key's **name** here.
5. **Public identifiers are not secrets** (section 3). They are safe in browser code, but they are listed so nobody mistakes them for missing keys.

## 1. Where agents get access (and why some chats "can't")

| Access | What it lets an agent do | How a chat gets it |
|---|---|---|
| **Supabase connection** (Supabase MCP connector, project `dfrwxpuojeiykaignyny`) | Read/change the database, deploy Edge Functions, read function code and logs. It cannot read or set secret values, which is by design. | Must be switched on for the chat. It is on in the claude.ai Project **"Supbase RRM Academy"**. Chats outside that Project may not have it. |
| **GitHub repository access** (`rebelranchfl/Organization-Website`) | Read/write code, open pull requests, trigger the Academy deploy by pushing. | Provided by the session's GitHub connection. It **cannot** list GitHub Actions secret names (the proxy blocks that path), so the GitHub secret names below were confirmed from the workflow files. |
| **Browser (Claude in Chrome)** | Looks at pages the owner is already signed in to (e.g. PayPal, Supabase dashboard) when the owner allows it. | Owner's Chrome with the extension running. Agents still never type or copy key values. |

**If a chat says it has no access:** it is missing one of the connections above. Do RRM Academy/website work inside the "Supbase RRM Academy" Project, where the Supabase connection is on.

## 2. Secrets (values locked; names only)

### 2A. Supabase — Edge Function secrets
Location: Supabase dashboard → Project `dfrwxpuojeiykaignyny` → Edge Functions → **Secrets**.

| Name | Provider / purpose | Used by (functions) | Confirmed present |
|---|---|---|---|
| `SUPABASE_URL` | Supabase (auto-provided) | most functions | Auto-provided by Supabase |
| `SUPABASE_ANON_KEY` | Supabase public key (auto-provided) | paypal-create-order, paypal-create-subscription, booking-manage, notify-website-request, academy-agent-dispatch | Auto-provided |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase full-access server key (auto-provided). **Never in browser code.** | paypal-*, academy-commerce, notify-website-request, verify-citation, academy-agent-dispatch, booking-*, submit-*-order | Auto-provided |
| `PAYPAL_CLIENT_ID` | PayPal REST app ID | `_shared/paypal.ts` → paypal-create-order, paypal-create-subscription, paypal-webhook | **Yes.** Live PayPal checkouts were created and live PayPal notices passed signature checks (latest 2026-08-18). None of that works without these keys. |
| `PAYPAL_CLIENT_SECRET` | PayPal REST app secret | same as above | **Yes** (same evidence) |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook ID used to verify PayPal notices | paypal-webhook | **Yes.** Notices recorded as `verified`. |
| `PAYPAL_ENVIRONMENT` | `live` or `sandbox` | `_shared/paypal.ts` | **Yes.** Recent records are `live`. |
| `SITE_URL` | Main site address; payment functions only accept requests from it | `_shared/paypal.ts` | Yes (payment functions run) |
| `RESEND_API_KEY` | Resend email sending | notify-website-request, notify-admin-activity, booking-*, submit-marketplace-order, submit-creation-studio-order | Yes (functions send email) |
| `ONESIGNAL_REST_API_KEY` | OneSignal phone push notifications | submit-marketplace-order, submit-creation-studio-order | Read by deployed code |
| `ADMIN_NOTIFY_WEBHOOK_SECRET` | Shared secret that lets the database trigger call notify-admin-activity | notify-admin-activity | Read by deployed code |
| `ACADEMY_GITHUB_TOKEN` (falls back to `GITHUB_TOKEN`) | GitHub token that lets Supabase start the Academy agent workflow | academy-agent-dispatch | Read by deployed code |
| `TEST_SUPABASE_FUNCTIONS_URL`, `TEST_SITE_URL` | Test-only settings | supabase/functions/tests | Test runs only |

### 2B. Supabase — secret stored inside the database
| Name / location | Purpose | Used by |
|---|---|---|
| Booking cron secret, checked by database function `booking_verify_cron_secret` | Proves the hourly booking-reminder call is genuine | booking-reminders |

### 2C. GitHub — Actions secrets
Location: GitHub → `rebelranchfl/Organization-Website` → Settings → Secrets and variables → Actions.

| Name | Purpose | Used by |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Lets GitHub publish the Academy Worker | `.github/workflows/deploy-rebel-ranch-academy.yml` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account for that publish | same |

### 2D. Session-provided (not stored by RRM)
| Name | Purpose |
|---|---|
| `GH_TOKEN` (agent session environment) | The agent's own GitHub access for this session. Comes with the session, not from RRM storage. |

## 3. Public identifiers (safe in browser code, not secrets)

| Identifier | Where |
|---|---|
| Supabase publishable key (`sb_publishable_…`) | `assets/js/supabase-client.js`; Academy Program Hub `app/lib/supabase-client.ts`; ledger functions |
| Supabase project URL `https://dfrwxpuojeiykaignyny.supabase.co` | same |
| PayPal hosted-button `client-id` in PayPal button script URLs | donation/interest pages (e.g. `contact.html`, `services.html`, `academy-learning-interest.html`) |
| OneSignal app ID | submit-marketplace-order, submit-creation-studio-order |

## 4. How to add or replace a key (owner steps)

**Supabase Edge Function secret (e.g. a PayPal key):**
1. Sign in at supabase.com → open project `dfrwxpuojeiykaignyny`.
2. Left menu → **Edge Functions** → **Secrets**.
3. **Add new secret**. Type the exact **name** from this register, paste the value, and save.
4. Tell the agent the name you saved. The agent never needs the value.

**PayPal REST keys (only if they ever need replacing):** PayPal Developer Dashboard → Apps & Credentials → **Live** → the RRM app → copy Client ID and Secret → save them in Supabase as `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` (steps above).

**GitHub Actions secret:** repository Settings → Secrets and variables → Actions → New repository secret.

## 5. Open items found while building this register (not changed)

- **`publish-ledger` Edge Function:** SWITCHED OFF 2026-09-28 (owner instruction). It now only answers "Disabled" (410). Its public `site` storage bucket was made private; files kept.
- **Creation Station memberships:** FIXED 2026-09-28. A leftover database rule (`memberships_creation_station_offer_check`) blocked Club and both bundles from ever being granted; it was removed (the current rule allows all six offers). The 10 "pending" August checkouts were sign-ups never approved at PayPal; none was an unpaid-but-charged member.

## 6. Keeping this register true

- Add a row whenever code starts reading a new key name (`Deno.env.get("…")`, `secrets.…` in a workflow).
- Remove a row only after the code that used it is gone.
- Re-check with: `grep -rhoE 'Deno\.env\.get\("[A-Z0-9_]+"\)' supabase/functions` and `grep -rhoE 'secrets\.[A-Z0-9_]+' .github/workflows`, plus reading deployed functions that are not saved in the repository.
