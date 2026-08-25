# Rebel Ranch Ministries Visual Rules

**Status:** Approved and locked  
**Version:** 2.3  
**Current rollout:** Phase 1 public surfaces plus the owner-approved Programs Hub extension (`programs.html`). This governs which pages receive the current RRM public styling and structural rebuilds; it does not restrict which already-approved program pages may be linked as destinations.  
**Authority:** This document supersedes conflicting public-site surface guidance in `brand-guide.md` and `site-design-system.md`.

Every agent must read this document before starting visual, layout, or public-page work. If a requested project or target does not comply with these rules, raise a flag and identify the conflict before changing files.

## Phase 1 boundary and approved Programs Hub extension

- Phase 1 applies to `index.html`, `align-interest.html`, `business-request.html`, `support-supplies-interest.html`, `contact.html`, `support.html`, and `academy-learning-interest.html` (added 2026-08-05: `support.html` was reconnected to the shared header/footer shell and given a "cost behind the help" section per owner request; added 2026-08-21: `academy-learning-interest.html` was reconnected to the shared header/footer shell and rewritten to lead with curiosity instead of disclaimers).
- **Owner-approved extension — 2026-08-25:** `programs.html` is an approved main Rebel Ranch Ministries public surface. It uses the same page frame, hero, section-divider, card, action, spacing, shared-shell, and accessibility rules in this document. This approval does not authorize migration or redesign of any other program page.
- `programs.html` is the permanent public explanation and routing hub for the RRM program ecosystem. The homepage may remain the changing front door for current activity, launches, featured work, and participation paths.
- Roots, Boots & Animal Poops and Rebel Ranch Rescue may be represented as anchored sections on `programs.html` until separate program pages are explicitly approved and built. Do not invent dead routes or placeholder destination pages.
- Do not migrate, restyle, or otherwise change any other repository page as part of this extension.
- Creation Station has an intentionally separate visual system. Do not touch Creation Station files, pages, or components unless the user gives separate, explicit authorization.
- Future rules will be applied in later phases. Approval of `programs.html` never grants permission to perform a site-wide conversion.

## Page frame and colors

- The current approved RRM page background is one consistent forest green: `#204227`.
- Black `#050806` remains reserved for the shared header and footer.
- Primary headings use cream `#F0EDD8`.
- Body text on green surfaces uses `#D7D1B3`.
- Small labels and approved highlights use bright gold `#EF9F27`.
- Do not introduce another surface color or gradient without approval.

## Hero

- An approved RRM public page that has a hero uses `linear-gradient(180deg, #1D4024 0%, #122A18 100%)` across the full section width.
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
- Approved RRM card and form surfaces use `linear-gradient(180deg, #1D4024 0%, #122A18 100%)`.
- Standard card structure remains a `1px solid #284A29` border, a `3px` `#C17F24` to `#97C459` top accent, `20px` corners, and `24px` padding.
- Form-specific borders, corner radii, fields, and spacing remain as established unless separately approved; only the form surface uses the standard fade.
- All approved RRM cards use the same surface fade unless an owner-approved program-specific rule explicitly says otherwise.
- Card-shadow treatment is intentionally deferred pending visual review; do not change it as part of this standard.

## Actions and program routing

- Primary buttons use `#C17F24` to `#7B4B13` with cream text.
- Supporting buttons use `#28502F`, a `#4A7C59` border, and cream text.
- Full pill radius is reserved for real clickable controls. Non-interactive labels, status text, or informational elements must not use pill styling.
- Homepage and Programs Hub program/action links may point to forms, internal anchors, the approved direct PayPal destination, or approved live program entry pages.
- A program card may link to more than one page within an already-approved program as long as every destination is an existing, approved page — never a newly invented or unapproved one.
- Rebel Ranch Academy's live program destination is the interactive Program Hub at `https://academy.rebelranchministries.org`. The shared-header Academy link must point there. The older `academy.html` file is intentionally unchanged and on hold for a later content review; it is not the general public Academy destination. Do not redirect, delete, or edit `academy.html` without separate owner approval.
- `programs.html` is the canonical RRM program overview. The shared-header Programs control must provide a route to `programs.html` while retaining direct navigation to approved programs.
- Until separate pages exist, Roots, Boots & Animal Poops routes to `programs.html#roots-boots` and Rebel Ranch Rescue routes to `programs.html#rescue`.
- The shared-header **Support the Mission** link goes to `support.html`. The direct PayPal link remains used by approved on-page support actions.
- Required Privacy Policy and Legal Disclosures links and official social-media links remain available; they are not program-navigation links.

## Locked spacing

- Content width: `min(1160px, 92vw)`.
- Major section padding: `clamp(4.5rem, 8vw, 7rem)`.
- Every major content section after the hero uses this same padding above and below. Do not add separate section margins, extra internal vertical padding, or one-off spacing overrides.
- Every major section handoff after the hero uses the approved full-width green divider with its centered gold accent.
- Section-heading-to-content spacing: `clamp(2rem, 4vw, 3.25rem)`.
- Card grid gap: `18px`; two-column gap: `20px`; card padding: `24px`.

## Shared shell

- Every live RRM public page uses `assets/css/public-surface.css` and `assets/js/public-shell.js` for the shared header/footer shell.
- The official RRM logo must be linked from `assets/`; never embed the logo or any other image as base64 data in HTML or CSS.
- The Programs dropdown may include direct links to Business Freedom, Creation Station, Rebel Ranch Academy, Marketplace, Roots, Boots & Animal Poops, Rebel Ranch Rescue, and Partner With Us. `programs.html` must also be accessible as the all-programs destination.

## Do not use on approved RRM public surfaces

- The former `#1A3620` page background.
- The former `#274D2C` to `#1D3D24` card fade.
- The former radial page background or near-black card surface.
- A bounded or rounded hero-gradient container.
- White or cream page surfaces.
- Large multicolor divider bars, thick featured-card borders, brown-and-gold card surfaces, decorative copy boxes, or nested boxes.
- Non-clickable pill-shaped labels or badges.
- Any approved-surface change that alters Creation Station or expands into unapproved repository pages.
