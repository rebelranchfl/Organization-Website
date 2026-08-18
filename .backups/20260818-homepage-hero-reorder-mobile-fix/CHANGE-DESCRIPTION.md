# Change Description — Homepage hero reorder + mobile hero logo fix

**Date:** 2026-08-18
**File(s) backed up:** index.html
**AI-Agent:** Claude Code
**Session:** RRM homepage — move mission section under hero, fix mobile hero logo stacking

## Requested change
Owner asked to:
1. Move the "WHO WE ARE" section (id="homestead" — the section headed "Helping
   Hardworking People Build Income, Opportunity, and Freedom.") so it sits
   directly under the hero, before the Business Freedom section. Current
   order is Hero → Business Freedom → Who We Are. New order: Hero → Who We
   Are → Business Freedom.
2. Fix the mobile hero: currently the hero copy stacks above a large RRM
   logo image (`.hero-logo`), which reads as an oversized, redundant logo
   the visitor has to scroll past. Same logo mark is already present in the
   sticky site header on all breakpoints.

## Planned implementation
1. Cut the entire `<section id="homestead">...</section>` block (partnership
   visual image + section-head + origin-story) from its current position
   (after Business Freedom) and paste it immediately after the closing
   `</section>` of the hero, before `<section id="business-freedom">`. No
   content inside the section is changed — reorder only.
2. In the existing `@media(max-width:900px){.home-hero-layout{...}}` rule,
   hide `.hero-logo-wrap` on mobile (`display:none`) instead of shrinking it,
   since the header already carries the brand mark at that width. Hero copy
   (eyebrow, h1, lead, buttons) becomes full-width on mobile with no
   redundant logo block to scroll through.

## Scope
- Structural reorder + one mobile CSS rule inside index.html only.
- No copy changes, no new sections, no visual-token changes, no changes to
  any other Phase 1 page.
