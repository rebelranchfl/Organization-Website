# Change description — 2026-08-09

**AI-Agent:** Claude Code
**Session:** Creation Station dashboard corrections walkthrough (2026-08-08/09)

## Files backed up (pre-edit copies, this folder)
- `creation-station-dashboard.html.bak`
- `creation-station-data.js.bak`
- `creation-station-app.js.bak`

## Why

Owner-approved pieces of "Bucket 3": a Studio/website request should
require documented parent/guardian approval (typed name, relationship,
explicit consent statement, timestamp — not just a checkbox) before it
can be submitted, and the owner wants an email notice (not a required
manual approval step) when a request comes in. Owner does not need to
personally approve before it counts as submitted — the existing Admin
review queue handles that afterward, same as before.

## What is changing

**Database** (migration `20260809180000_creation_station_parent_approval_website_requests.sql`,
applied live via Supabase MCP `apply_migration` before being committed):
adds nullable `parent_approver_name`, `parent_approver_relationship`,
`parent_approved_at`, `consent_statement` to
`public.creator_website_requests`. No backfill; existing rows predate
this feature.

**`creation-station-dashboard.html`** — added a required "Parent or
guardian approval" fieldset to the end of the website-request dialog
(`#website-dialog`, before the submit button): parent/guardian full
name, relationship to the creator, and an explicit consent checkbox
with the actual statement text as its label (native `required` on all
three blocks submission until filled).

**`assets/js/creation-station-data.js`** — `submitWebsite()` now chains
`.select('id').single()` so the caller gets the new row's id back. New
`notifyWebsiteRequest(requestId)` action invokes the new
`notify-website-request` Edge Function.

**`assets/js/creation-station-app.js`** — `website-form` submit handler:
reads the three new fields (the consent statement text is read directly
from the checkbox's own `<label>` so the stored snapshot always matches
what was actually shown, not a hand-duplicated copy elsewhere), includes
them in the insert payload, and — after a successful submit — calls
`notifyWebsiteRequest` with the new row's id (failure there is caught
and swallowed; a stalled email must never block or fail the actual
submission).

**New Edge Function `notify-website-request`**
(`supabase/functions/notify-website-request/index.ts`, deployed live,
`verify_jwt: true`): given a `requestId`, first checks the *caller's own*
JWT-scoped client can see that row (so RLS enforces a user can only
trigger this for a request they actually own), then uses the service
role to look up the creator's name and the household owner's real email
via `auth.admin.getUserById`, and sends one email via Resend (same
verified `noreply@rebelranchministries.org` sender already configured
for Auth emails) to both `rebelranchfl@gmail.com` and the household's
email. `RESEND_API_KEY` was set as a project Edge Function secret via
the Management API (same key already in use for Auth SMTP, now also
available to this function — Auth SMTP config and Edge Function secrets
are separate systems in Supabase, so this had to be set independently
even though the key value is the same).

**Unchanged:** every other dialog, view, and action in these files. No
existing `creator_website_requests` data modified or backfilled.
