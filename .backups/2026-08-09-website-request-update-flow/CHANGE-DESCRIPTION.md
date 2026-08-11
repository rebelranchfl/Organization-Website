# Change description — 2026-08-09

**AI-Agent:** Claude Code
**Session:** Creation Station dashboard corrections walkthrough (2026-08-08/09)

## Files backed up (pre-edit copies, this folder)
- `creation-station-data.js.bak`
- `creation-station-app.js.bak`

## Why

Confirmed root cause of the "Start or update request" submit doing
nothing: `creator_website_requests` has a partial unique index,
`creator_website_one_live_revision_idx`, allowing only one row per
creator with `status in ('submitted','approved')`. `submitWebsite()`
always did a raw INSERT with `status:'submitted'` — the button was
never wired to actually update anything, "update" was aspirational
labeling. The first-ever submission per creator worked; every
subsequent attempt collided with the owner's own already-submitted
request and failed with a duplicate-key error, with the reflection
that the owner never had it announced they'd need to hard-refresh or
retry anything, since the confirmation email path was never reached.

## What is changing

`assets/js/creation-station-data.js`:
- `loadWorkspace()`'s `creator_website_requests` select now also
  fetches `revision_number` (previously loaded but unused/invisible).
- New `updateWebsiteRequest(identity, id, payload)` — updates the
  existing row by id (owner-scoped), resets `status` to `submitted`
  and refreshes `submitted_at`, same shape as `submitWebsite`.

`assets/js/creation-station-app.js`:
- New `prefillWebsiteForm(creatorId)` — looks up the selected
  creator's existing request (status `submitted`, `approved`, or
  `changes_requested`) from already-loaded `state.data.websites` and,
  if found, fills every field (brand name, story, products, social
  links, payment/delivery checkboxes) for real editing; if not found,
  clears the form for a first-time submission. Sets
  `state._editingWebsiteId`/`state._editingWebsiteRevision` and updates
  the dialog title ("Update your Studio request" vs "Creator website
  request").
- `openWebsite()` now calls this on open instead of a blind
  `.reset()`; a new `website-creator` change handler re-runs it if the
  household has multiple creators and the parent switches which one
  they're submitting for mid-dialog.
- `website-form` submit handler now branches: if
  `state._editingWebsiteId` is set, calls `updateWebsiteRequest` (with
  `revision_number` incremented) instead of `submitWebsite`, and shows
  "Website request updated and resubmitted for review" instead of the
  first-time message. The confirmation-email call and activity log
  entry fire either way.

**Deliberately not changed:** parent approval fields (name,
relationship, consent checkbox) always start blank on every open, even
when editing — re-affirming consent for whatever content is actually
being resubmitted, not silently reusing a prior approval tied to
different content. `admin_notes` from a prior review round is left
untouched on update, visible to the admin as history.

**Unchanged:** the insert path for a creator's first-ever request
works exactly as before. No database schema changes in this fix — the
partial unique index and revision columns already existed; only the
application code that should have been using them was missing.
