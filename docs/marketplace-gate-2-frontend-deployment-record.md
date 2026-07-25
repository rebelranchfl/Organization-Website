# Marketplace Gate 2 Frontend — Deployment & Testing Record

## Summary

Date: 2026-07-24

The seller/admin dashboard (`marketplace-seller-dashboard.html` and its
supporting `assets/js/marketplace-seller-*.js` / `assets/css/marketplace-seller.css`
files) was built per `docs/marketplace-gate-2-frontend.md` and tested
end-to-end directly against production (`dfrwxpuojeiykaignyny`) using a
throwaway test account, since every Gate 2 table still had 0 rows in
production and there was no risk to real data.

## What was tested and confirmed working

* Seller onboarding: creating a `seller_profiles` row, an initial
  `seller_applications` row, and a primary `seller_category_assignments`
  row in one flow.
* Adding a second category and confirming `private.auto_assign_requirements()`
  correctly auto-assigned the matching `compliance_requirements` row.
* Submitting an attestation (`seller_attestations`).
* Uploading a credential document to the `marketplace-seller-private`
  Storage bucket and confirming the `seller_credentials` row and object
  path were both correct.
* Submitting an application for review and confirming
  `private.sync_seller_review_from_application()` correctly flipped
  `seller_reviews.review_status` to `pending_review`.
* Notifications (`marketplace_notifications`) generated correctly on
  requirement assignment and application submission; mark-read and
  mark-all-read both work.
* Review history (`seller_review_events`) recorded every transition
  correctly.
* The admin queue (a gated view inside the same dashboard, not a separate
  page — see `docs/marketplace-gate-2-frontend.md`) correctly listed
  pending applications, credentials, and requirements, and the review
  dialog correctly loaded full applicant detail on demand.
* Admin actions confirmed working: approve, request changes, verify
  credential, and waive requirement.

## Bug found and fixed during testing

`private.guard_seller_application()` stamped `reviewed_at` on an admin
approve/reject decision but never stamped `reviewer_user_id`, so both
`seller_applications.reviewer_user_id` and the synced
`seller_reviews.reviewer_user_id` stayed `null` after every approval or
rejection. Additionally, `private.sync_seller_review_from_application()`
never handled a `changes_requested` decision at all, so requesting changes
on an application left `seller_reviews.review_status` stale.

Both were fixed via a corrective migration —
`supabase/migrations/20260724223000_marketplace_gate_2_fix_reviewer_stamp.sql`
— applied directly to production during live testing, per the project's
standing rule of never editing an already-applied migration file. The fix
was verified immediately afterward against a fresh test application: both
`reviewer_user_id` and the `changes_requested` sync now work correctly.

No corrective action was needed on any other admin action — `verifyCredential`,
`rejectCredential`, `waiveRequirement`, and `markNotApplicable` all correctly
stamped their respective actor/timestamp fields from the start.

## Test data cleanup

All test data was removed from production after testing: the test
`seller_profiles` row (cascaded to its applications, category/requirement
assignments, attestation, credential, review events, and team-owner row),
the uploaded Storage object, and the temporary `admin` role grant on the
test account. The `marketplace_categories` (6 rows: Produce, Meat & Poultry,
Baked Goods, Handmade Goods, Classes & Workshops, Trades & Services) and one
`compliance_requirements` row (Cottage Food Permit) seeded to make testing
meaningful were intentionally left in place — they are genuine, sensible
starter reference data matching what `producer-interest.html` already
implied the business expects, not test artifacts.

## Known gaps, not addressed by this pass

* No admin UI exists yet for creating/editing `marketplace_categories`,
  `marketplace_regions`, or `compliance_requirements` — those lookup tables
  are currently maintained by direct database access. Worth a small admin
  CRUD screen in a future pass if category/requirement changes become
  frequent.
* Supabase Auth's default email sender is unreliable for this project —
  signup confirmation and password-reset emails did not arrive during
  testing (checked spam, waited past rate limits). This blocks real sellers
  from signing up smoothly today. Tracked separately as a suggested task
  (configure a real SMTP provider such as Resend or Brevo).
* The rare case of a household owner who is not the seller-profile owner
  granting affiliation approval for a minor creator has no dedicated UI
  surface yet (see `docs/marketplace-gate-2-frontend.md` for detail) —
  intentionally out of scope for this pass.
