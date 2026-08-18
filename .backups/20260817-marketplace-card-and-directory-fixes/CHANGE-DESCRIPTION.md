# Marketplace card layout, pricing, logo, and category display fixes

Authorized by Brooke 2026-08-17 ("go"), scoped to items 1, 2, 3, 4, 5, 6
from the diagnosis given — location/onboarding-field editing (item 7) is
explicitly excluded from this pass, to be handled separately due to its
Supabase write/permissions risk.

Authorized targets:
- assets/css/marketplace-seller-page.css
- assets/js/marketplace-seller-public.js
- assets/js/marketplace-directory.js
- assets/css/marketplace-directory.css
- assets/js/marketplace-directory-search.js
- marketplace.html (added to this list after the fact — this file was
  edited before its backup existed, a process slip. Backup was recovered
  immediately from `git show HEAD:marketplace.html` before continuing,
  since the file was still unstaged/unmodified in git history at that
  point. Flagging this here rather than quietly fixing it.)

Authorized changes:
1. `.listing-grid` (marketplace-seller-page.css): add responsive
   grid-template-columns (3 / 2 / 1 by screen width) so product cards on
   a seller's public page stop stacking in a single column.
2. `renderListings` (marketplace-seller-public.js): reorder each card's
   content to tag, title, image gallery, description, price (was tag,
   title, price, description, image).
3. Add a `formatPriceLabel` helper (marketplace-seller-public.js) that
   prefixes "$" to customer-facing prices when the seller typed a plain
   number, leaving free text like "Contact for Quote" untouched. Applied
   only to the customer-facing render — the seller's own dashboard price
   preview intentionally stays as typed, per Brooke's stated design (no
   $ required at entry, $ required at display).
4. `marketplace-directory.js`: add `logo_object_path` to the homepage
   carousel's seller query and render the seller's logo/initials mark on
   each card, matching the pattern already used on the full directory
   page. This reverses a previously-documented decision
   (`docs/marketplace-seller-listings-and-directory-handoff.md`) to leave
   the homepage carousel untouched — now explicitly authorized.
5. `.seller-directory-mark` (marketplace-directory.css): increase from
   52px to a size closer to the seller's own page mark (96px), rebalance
   card padding/gap to match.
6. `sellerCard` (marketplace-directory-search.js): render every category
   name in `categoryNames`, not just the first (`categoryNames[0]`).

Explicit exclusions:
- No changes to location/region editing or any other onboarding-only
  field (legal business name, entity type, phone, producer status) —
  that's a separate follow-up.
- No changes to Supabase schema, RLS policies, or grants.
- No changes to any other Marketplace file not listed above.
- Do not commit, push, publish, or deploy.
