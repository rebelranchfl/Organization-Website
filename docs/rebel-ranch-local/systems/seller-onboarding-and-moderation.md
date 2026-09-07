# Rebel Ranch Local Seller Onboarding and Moderation

**Status:** Current system authority for seller onboarding, applications, compliance, moderation, affiliations, and seller-dashboard behavior.

This document preserves the durable Rebel Ranch Local behavior established during the former Marketplace Gate 2 work without carrying forward phase-specific deployment plans, session handoffs, or stale implementation-state notes.

Read this together with:
- `docs/rebel-ranch-local/systems/marketplace-architecture-rules.md`
- `docs/rebel-ranch-local/brand/visual-rules.md`
- `docs/shared-systems-operations.md` for shared Supabase/auth/email/platform behavior.

When implementation status matters, verify the current code, migrations, and production system rather than relying on a historical deployment record.

## 1. Seller onboarding model

A signed-in user without a `seller_profiles` row may create a seller profile through the Rebel Ranch Local seller dashboard.

Once a seller profile exists, the owning account may access seller workspace areas including:
- Status;
- Requirements;
- Affiliations;
- Notifications; and
- History.

Administrative review capability is available only to authorized administrators. Client-side visibility is convenience only; database authorization remains the real security boundary.

Primary seller-dashboard components include:
- `marketplace-seller-dashboard.html`
- `assets/js/marketplace-seller-data.js`
- `assets/js/marketplace-seller-views.js`
- `assets/js/marketplace-seller-app.js`
- `assets/css/marketplace-seller.css`

## 2. Categories and regions

Rebel Ranch Local uses structured Marketplace categories and regions.

Current system objects include:
- `marketplace_categories`;
- `marketplace_regions`; and
- `seller_category_assignments`.

Seller profiles may reference a region. Public region handling is intended to support useful local discovery without treating a precise home address as ordinary public profile data.

Categories are used to organize seller participation and may drive applicable compliance requirements.

## 3. Seller applications and review history

Seller admission is handled through `seller_applications`, which supports a history of application attempts rather than treating approval as a single mutable field with no record.

A seller may prepare and submit an application but may not self-approve it or force-set moderation fields.

Application decisions synchronize with the Marketplace seller review state through database logic. Review history is preserved through `seller_review_events`.

The seller-facing UI must not write directly to `seller_reviews` as a substitute for the authorized application/review process.

## 4. Public profile versioning

`seller_profile_versions` preserves snapshots of public-facing seller profile information when relevant profile changes occur.

Private legal, tax, payout, licensing, insurance, compliance, credential, or other protected information must remain separate from the public seller presentation.

## 5. Seller affiliations and team boundary

Rebel Ranch Local may connect sellers to creator or household records for display/relationship purposes without turning those affiliations into account authorization.

Current affiliation/team objects include:
- `seller_creator_affiliations`;
- `seller_household_affiliations`; and
- `seller_team_members`.

Public creator or household affiliation does **not** grant seller-account access.

Seller-team authorization must use explicit seller membership records and scoped roles.

Marketplace access remains independent of Creation Station paid membership. Household/creator ownership checks required by Marketplace must not accidentally depend on paid Creation Station access.

## 6. Minor creator safeguard

Making an affiliation public for a minor creator requires the established parent/household-owner approval boundary.

The system uses the creator age band to identify minor accounts. A seller or unrelated account must not be able to self-approve a minor creator's public affiliation.

The seller dashboard should translate expected authorization failures into understandable user-facing messages rather than exposing raw database errors.

Do not weaken this parent/guardian boundary for convenience.

## 7. Compliance pipeline

The Marketplace compliance model is category-driven rather than a single universal checklist.

Current system objects include:
- `compliance_requirements`;
- `seller_requirement_assignments`;
- `seller_attestations`; and
- `seller_credentials`.

Requirements may be assigned based on seller category. Sellers may provide attestations and credential evidence, while verification/moderation fields remain controlled by authorized administrative behavior.

Seller-facing forms must not expose administrative verification fields as seller-editable inputs.

Do not store raw SSN/EIN or similar structured sensitive identifiers as ordinary Marketplace profile fields. Credential identifiers remain limited-purpose and supporting evidence should stay within the protected credential/document system.

## 8. Private Marketplace document storage

Marketplace seller credential/document evidence uses the private `marketplace-seller-private` storage area.

The storage boundary is intended for protected seller evidence rather than public storefront media. Browser access must continue to be constrained by the applicable ownership/admin authorization rules.

Do not move protected credential material into public storage merely to simplify display or review.

## 9. Marketplace notifications

`marketplace_notifications` provides an authenticated in-app notification feed tied to actual Marketplace state changes.

Seller-facing users must not be able to spoof approval or moderation notifications by directly inserting trusted system notices.

External order notification behavior is governed separately by:

`docs/rebel-ranch-local/systems/order-notifications.md`

Shared email infrastructure is governed by the shared systems authority, not by historical Marketplace notes about earlier SMTP state.

## 10. Seller dashboard data boundaries

The seller dashboard must preserve these durable boundaries:

- seller users cannot directly self-approve applications;
- seller users cannot directly rewrite trusted seller review state;
- seller users cannot self-verify credential evidence;
- seller users cannot force-set reviewer, verifier, assignment, or other admin-controlled fields;
- unrelated authenticated users cannot access another seller's private workspace;
- ordinary staff access does not automatically equal Marketplace moderation authority;
- admin UI visibility never replaces database authorization;
- minor public affiliations retain parent/household-owner safeguards; and
- private seller/compliance data must not leak into the public storefront.

## 11. Current correction history that remains relevant

A production correction added proper reviewer attribution when an administrator approves/rejects a seller application and corrected synchronization when changes are requested. Future work must preserve those behaviors rather than reintroducing the earlier defect.

The current implementation should therefore preserve:
- reviewer identity/timestamp on review decisions; and
- synchronization of `changes_requested` into the seller review state where applicable.

Corrections to already-applied database behavior should be made through a new timestamped migration rather than rewriting an applied migration file.

## 12. Verification standard

Before describing a seller-onboarding, compliance, moderation, affiliation, or dashboard change as complete:

1. Verify the exact affected workflow against the current implementation.
2. Confirm database authorization/RLS still enforces the intended access boundary.
3. Confirm seller users cannot set administrative fields directly.
4. Confirm unrelated accounts cannot access another seller's protected data.
5. Confirm minor affiliation safeguards still require the correct parent/household-owner authority.
6. Confirm protected seller documents remain private.
7. Confirm any changed application decision correctly updates the corresponding review/history state.
8. Verify the rendered seller dashboard at relevant desktop/mobile widths when UI behavior changed.

Historical Gate 2 deployment plans, session handoffs, and deployment records are not current authority and should not be used to determine present system state.