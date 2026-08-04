# Rebel Ranch Ministries Visual Rules

**Status:** Approved and locked  
**Version:** 2.1  
**Current rollout:** Phase 1 — homepage and forms reached directly from the homepage. This governs which pages receive Phase 1 styling and structural rebuilds; it does not restrict which already-approved program pages the homepage may link to — see the updated linking rule below.  
**Authority:** This document supersedes conflicting public-site surface guidance in `brand-guide.md` and `site-design-system.md`.

Every agent must read this document before starting visual, layout, or public-page work. If a requested project or target does not comply with these rules, raise a flag and identify the conflict before changing files.

## Phase 1 boundary

- Phase 1 applies only to `index.html`, `align-interest.html`, `business-request.html`, `support-supplies-interest.html`, and `contact.html`.
- Do not migrate, restyle, or otherwise change any other repository page as part of Phase 1.
- Creation Station has an intentionally separate visual system. Do not touch Creation Station files, pages, or components unless the user gives separate, explicit authorization.
- Future rules will be applied in later phases. A Phase 1 task never grants permission to perform a site-wide conversion.

## Page frame and colors

- The Phase 1 page background is one consistent forest green: `#204227`.
- Black `#050806` remains reserved for the shared header and footer.
- Primary headings use cream `#F0EDD8`.
- Body text on green surfaces uses `#D7D1B3`.
- Small labels and approved highlights use bright gold `#EF9F27`.
- Do not introduce another surface color or gradient without approval.

## Hero

- A Phase 1 page that has a hero uses `linear-gradient(180deg, #1D4024 0%, #122A18 100%)` across the full section width.
- The hero fade begins below the black header and continues to the first section handoff.
- The fade belongs to the section itself. Do not show it as a bordered, rounded, floating, or container-shaped rectangle.
- Preserve the established inner content width and responsive spacing.

## Sections and dividers

- Sections tell the story and remain visually open. Do not put explanatory copy in decorative boxes or nest boxes inside boxes.
- Every major section handoff uses a full-width, `1px` green line: `rgba(151, 196, 89, .62)`.
- A centered `3px` gold accent (`#EF9F27` fading to transparent) sits over that line. It is no wider than `min(10rem, 28vw)`.
- Do not use unrelated internal green rules between content blocks.

## Cards and forms

- Cards are reserved for services, paths, programs, and real choices.
- Phase 1 card and form surfaces use `linear-gradient(180deg, #1D4024 0%, #122A18 100%)`.
- Standard card structure remains a `1px solid #284A29` border, a `3px` `#C17F24` to `#97C459` top accent, `20px` corners, and `24px` padding.
- Form-specific borders, corner radii, fields, and spacing remain as established unless separately approved; only the form surface uses the standard fade.
- All Phase 1 cards use the same surface fade. Do not create a separate fill for Monthly Guidance or General Contact.
- Card-shadow treatment is intentionally deferred pending visual review; do not change it as part of this standard.

## Actions and homepage link routing

- Primary buttons use `#C17F24` to `#7B4B13` with cream text.
- Supporting buttons use `#28502F`, a `#4A7C59` border, and cream text.
- Homepage program and action links may point to: forms, internal homepage anchors, the approved direct PayPal destination, or the approved entry page(s) of a program that already has its own live, built pages. As of 2026-08-04 that includes Business Freedom's homepage section, Creation Station, and Rebel Ranch Marketplace. This rule was written when Business Freedom was the only built program; it no longer applies as written now that Creation Station and Marketplace exist as real, approved destinations.
- A homepage card may link to more than one page within an already-approved program (for example, Creation Station's membership page and its live-sessions page) as long as every destination is an existing, approved page — never a newly invented or unapproved one.
- Rebel Ranch Academy has no live program page yet. Its homepage card may link only to its interest form, an internal anchor, or stay unlinked, until Academy has an approved page of its own.
- The shared-header **Support the Mission** link on Phase 1 pages goes directly to `https://www.paypal.com/ncp/payment/QM7MMH9V4LDBY`.
- Required Privacy Policy and Legal Disclosures links and official social-media links remain available; they are not program-navigation links.

## Locked spacing

- Content width: `min(1160px, 92vw)`.
- Major section padding: `clamp(4.5rem, 8vw, 7rem)`.
- Every major content section after the hero uses this same padding above and below. Do not add separate section margins, extra internal vertical padding, or one-off spacing overrides.
- Every major section handoff after the hero uses the approved full-width green divider with its centered gold accent.
- Section-heading-to-content spacing: `clamp(2rem, 4vw, 3.25rem)`.
- Card grid gap: `18px`; two-column gap: `20px`; card padding: `24px`.

## Do not use in Phase 1

- The former `#1A3620` page background.
- The former `#274D2C` to `#1D3D24` card fade.
- The former radial page background or near-black card surface.
- A bounded or rounded hero-gradient container.
- White or cream page surfaces.
- Large multicolor divider bars, thick featured-card borders, brown-and-gold card surfaces, decorative copy boxes, or nested boxes.
- Any Phase 1 change that alters Creation Station or expands into unapproved repository pages.
