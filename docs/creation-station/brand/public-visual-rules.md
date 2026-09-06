# Creation Station Public-Marketing Visual Rules

**Status:** Owner-approved and locked

**Version:** 1.2

**Approved:** 2026-08-03  
**Updated:** 2026-08-25

**Approved reference:** `creation.html`

**Matching CSS:** `assets/css/creation-station.css` and `assets/components/creation-station-footer/footer.css`

These rules preserve the Creation Station public-marketing visual identity while incorporating the owner's newer August 25 decisions about Studio routing, visual explanation, and the current Rebel Ranch Local identity.

No agent may redesign, restyle, replace, or reinterpret a locked component below without a newer, explicit owner decision. Accessibility, responsive, content, and routing corrections may be made when they preserve the approved Creation Station identity or when the owner explicitly authorizes the visible change.

## 1. Approved page reference

- `creation.html` is the approved visual reference for the Creation Station public-marketing experience.
- Preserve its colorful, energetic, parent-aware tone and its balance of purple, pink, coral, gold, teal, blue, and white.
- Do not import the main Rebel Ranch Ministries dark-green public-site system into Creation Station. Creation Station is an intentional sub-brand.
- Creation Station is visual by nature. Prefer screenshots, product examples, graphic progressions, icons, interactive previews, and actual Studio examples when those can replace paragraphs.
- Streamlining means reducing visible reading burden and duplication without shrinking the real program.

## 2. Locked primary button

The approved Creation Station primary action is the current borderless gradient button represented by `.btn.primary`.

- Background: `linear-gradient(135deg, #f04b98 0%, #ff756d 52%, #f7c94c 100%)`.
- Default text: dark plum `#2f1634` with heavy weight.
- Border: none.
- Corner radius: `.85rem`.
- Preserve the current soft shadow and slight upward hover motion.
- Hover and keyboard-focus treatment: dark purple gradient with white text and no permanent border.

## 3. Locked supporting buttons

- Supporting teal gradient actions remain appropriate for secondary actions.
- Supporting white buttons may remain white when intentionally paired with a primary gradient action.
- Do not add permanent outlines to gradient or teal Creation Station buttons.
- Full pill radius is reserved for real clickable buttons only under the repository-wide rule.

## 4. Locked header

- Preserve the deep-purple translucent header, subtle lower border, shadow, and blur treatment.
- Preserve the Creation Station logo, the Creation Station name, and the line `by Rebel Ranch Ministries`.
- Preserve the rainbow hamburger lines.
- The cross-program return link must be labeled **Rebel Ranch Ministries**, never **Rebel Ranch Home**.
- The Rebel Ranch Ministries return link remains visually distinct from internal Creation Station navigation.

## 5. Hero boundary and Studio-routing rule

- Preserve the approved purple-to-pink Creation Station hero identity.
- Do not add white circles, moons, orbit lines, semicircles, or unrelated decorative overlays.
- Keep hero copy concise. The hero is a hook and routing surface, not a place to repeat the full product explanation.
- The hero may retain the Studio visual, but **the visual destination must match what it promises**.
- A Studio-specific hero visual or CTA must link to an actual Studio example/public Studio view, not the project/dashboard Experience page.
- Until a dedicated live Studio demo is intentionally created, the approved Studio example inside `creation.html` (`#portfolio` / `#studio-title`) is the correct in-page Studio preview destination.

## 6. Locked footer

- The uniform Creation Station footer is a shared component maintained in `assets/components/creation-station-footer/` rather than copied into individual pages.
- Creation Station pages using the shared public footer must load `footer.js` into an element marked `data-creation-station-footer`.
- Preserve the deep-purple footer and thin rainbow top edge.
- Preserve the Creation Station logo and identity.
- Preserve the clearly linked line `by Rebel Ranch Ministries · Return to the main website`.
- Keep complete disclosure language on the dedicated disclaimer page rather than repeating long disclaimer copy throughout sales pages.
- Shared footer navigation should make the two high-value actions easy to find: joining Creation Station and returning to My Studio.

## 7. Creation Station Studio visual

- Preserve the full Creation Station Studio example on `creation.html` as the approved public visual proof of what a Studio can look like.
- It should show the creator's story, work/products, ordering interaction, and contact/social context rather than being reduced to a generic screenshot.
- Studio-specific CTAs elsewhere should route to this example or to a real public Studio experience.
- The Studio preview can evolve functionally as the real public Studio ordering experience improves, but it must remain recognizably Creation Station.

## 8. Rebel Ranch Local / Marketplace references — current rule

The older dark green/gold Marketplace card treatment is **retired** for new Creation Station references.

When Creation Station references the current Marketplace, use the current **Rebel Ranch Local** visual identity established by:
- `marketplace.html`
- `assets/css/rebel-ranch-local.css`

The current visual family is lighter and uses:
- cream/paper surfaces;
- olive green;
- tan;
- soft borders;
- white/light backgrounds; and
- current Rebel Ranch Local branding/assets where appropriate.

This current Local treatment fits more naturally inside Creation Station and accurately represents the destination a user will reach.

Do not make Creation Station itself look like Rebel Ranch Local. This exception applies only to the cross-program card/reference.

## 9. Locked Experience-page design extension

- The visual design and colors in `creation-station-experience.html` remain owner-approved.
- Preserve its purple-to-pink Creation Station energy, rainbow rhythm, borderless gradient primary actions, teal supporting actions, white/pale supporting surfaces, section treatments, cards, tracker styling, and responsive presentation.
- Preserve the current Creation Companion customizer and entry transition.
- The Experience page proves the **member/dashboard/project experience**. It is not the default destination for a CTA that specifically promises to show a public Studio.
- Wording on the Experience page must follow `docs/creation-station/creation-station-operations.md`, including the rule that current projects are structured/Companion-supported rather than guided instruction.

## 10. Visual explanation over repeated text

Before adding another paragraph, ask whether the same idea is already demonstrated by:
- the real dashboard preview;
- the six project stages;
- the Creation Companion;
- the Studio example;
- a product/card example;
- a live-session visual;
- a simple graphic progression; or
- another existing interactive component.

If yes, shorten the text and let the visual carry more of the explanation.

Public pages should use a layered approach:
1. short headline;
2. one short support thought;
3. visual proof;
4. clear next action;
5. deeper detail only when the visitor chooses it.

## 11. Responsive requirement

A Creation Station visual is not complete until it works at desktop and mobile widths.

- Decorative floating words/labels must not clip against the viewport.
- A desktop composition may use a different mobile arrangement when necessary.
- Do not preserve a desktop scatter/ring layout on mobile if it causes clipping, overlap, tiny text, or awkward empty space.
- Mobile adaptation must preserve the idea, not necessarily the exact coordinates.

## 12. Implementation check

Before presenting a Creation Station public-marketing page for review:

1. Confirm the shared header and footer remain Creation Station-specific.
2. Confirm primary and teal gradient buttons do not have permanent outlines.
3. Confirm the hamburger lines retain the rainbow treatment.
4. Confirm non-clickable labels do not look like clickable pill buttons.
5. Confirm no hero orbit/circle decoration has been introduced.
6. Confirm a Studio-labeled CTA actually shows a Studio.
7. Confirm Marketplace/Local references use the current light Rebel Ranch Local identity.
8. Confirm repeated explanatory paragraphs have been reduced where existing visuals already prove the point.
9. Confirm desktop and mobile layouts independently, especially decorative labels and image crops.
10. Stop and request owner approval before changing any other locked visual rule.

## 13. Still open

This document does not settle every future Creation Station surface. Dashboard feature scope, future project instruction, future AI teaching capability, Studio order-system expansion, and other program experiences remain governed by `docs/creation-station/creation-station-operations.md`, the current implementation, and future owner decisions.
