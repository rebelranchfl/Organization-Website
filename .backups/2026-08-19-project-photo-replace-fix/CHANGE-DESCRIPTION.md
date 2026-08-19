# Fix: project photo upload doesn't replace the old photo — 2026-08-19

Owner-reported bug: uploading a new photo for a project in the Creation
Station dashboard kept showing the original photo instead of the new one.

## Root cause
`actions.uploadProjectAsset` in `assets/js/creation-station-data.js`
always inserted a brand-new `project_assets` row on every upload and
never removed the previous one. Every consumer of `project_assets`
(`projectCard()` in `creation-station-views.js`, and the studio-product
import flow in `creation-station-app.js`) picks a single asset via
`.find()` with no explicit ordering, so the display kept resolving to
whichever row came back first from the database — in practice the
original upload, not the new one. The whole app already treats project
photos as one-per-project (nothing anywhere lists multiple), so the fix
makes upload actually replace, matching that existing assumption.

## Fix
`uploadProjectAsset` now uploads the new file and inserts its row first
(so a failed upload never leaves a project with zero photos), then
deletes any previously-existing `project_assets` rows for that project
— removing both their storage objects and their database rows.

Verified before making the change that RLS already permits this for the
project owner: `assets_owner_all` on `project_assets` is `cmd: ALL`
scoped to `owner_user_id = auth.uid()`, and the `creation-station-private`
storage bucket already has a `creation_storage_delete` policy scoped to
the user's own folder. No grant/policy change needed.

## Files
- `assets/js/creation-station-data.js` — `uploadProjectAsset` in the
  `actions` object.

## Not touched
No other file. No commits, no push.

AI-Agent: Claude Code
Session: Creation Station merch promotion + Passion to Profit copy discussion (2026-08-19)
