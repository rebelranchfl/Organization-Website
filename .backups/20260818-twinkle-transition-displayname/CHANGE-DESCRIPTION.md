# Sidebar twinkle, RRM logo, Creation Station entry transition, editable display name

Authorized by Brooke 2026-08-18 ("go ahead and fix the others that have
no lock involved") after correcting scope: the twinkle request was
specific to the Creation Station dashboard (sidebar + hero), not a
replacement of the OWNER-LOCKED shared header used on creation.html and
6 other marketing pages — that page never uses the locked header at all,
so no lock applies here.

Authorized targets:
- creation-station-dashboard.html + assets/css/creation-station-dashboard.css
  (B1 corrected scope: real twinkle animation on the sidebar's existing
  static dot decoration, matching the existing cs-twinkle keyframe
  already in this file. B3: add the real RRM logo,
  assets/brand/Rebel Ranch Ministries/rrm-logo-white.png — same asset
  index.html's own header uses — to the sidebar's "RRM Account" link.)
- creation-station-account.html (B4: add an entry-overlay transition —
  "Entering Creation Station" + logo + loading bar — that plays on
  arrival, reusing the exact working pattern already built and proven in
  creation-station-experience.html, just retargeted at the real page
  instead of the demo.)
- account.html (B4 continued: remove the "View Membership Options" /
  "Membership Status" buttons from the account hub's dashboard-actions,
  since both only ever lead into Creation Station and the Creation
  Station card above them covers the same destination, now with its own
  transition into the bargain.)
- account.html + a new `profiles` table update (A3: editable display
  name — the only field currently locked to whatever was typed once at
  signup, with "Welcome, Test" as the reported case. Adds a small
  settings control on the account page and a Supabase `.update()` call;
  this is a Supabase write, no schema/table change needed since
  `profiles.display_name` already exists.)

Explicit exclusions:
- D1 (the "proof of growth" copy) — plan proposed to Brooke, not yet
  confirmed, not started.
- Section C (experience-page demo problem), D3 (benefits copy, needs a
  section mapped first), E3 (glitter font) — still open, not part of
  this batch.
- Do not commit, push, publish, or deploy.
