# Get Seen, Get Found — Decision Record

## Control

- Page file: `business-visibility.html`
- Program: Business Freedom
- Current state: LIVE and production-verified with the exact approved-concept rebuild and final owner-approved wording, visual-balance, and closing-image corrections
- Last updated: 2026-09-08

## North star

- Purpose: help suitable local customers find, recognize, and trust the business.
- Approved public name: `Get Seen, Get Found`.
- Hub alignment: replace the problem-heading identity `People cannot find me` with `Get Seen, Get Found`; the recognition problem may remain supporting copy rather than the service name.
- No draft content, image, structure, desktop view, or mobile view is approved merely because the file exists.

## Approved sales direction

- Lead with the paid visibility service, its value, and the outcome for the customer.
- Recognition line: `Known around town. Hard to find online.`
- Core idea: `Word of mouth starts the search. Digital discovery finishes it.`
- The primary problem is a missing or incomplete digital presence, including businesses that rely on only Facebook, only a map listing, or only word of mouth. Incorrect or outdated details are a secondary problem within that larger story.
- Key line: `One doorway is not a digital presence.`
- Show that customers may look through Search & Maps, a website, social media, contact information, messages and booking, and services and service-area information.
- Explain that the paid work is customer-specific: understand how the business's customers search, choose the relevant channels, then build and connect a practical presence. Do not promise placement on every platform.
- Place Rebel Ranch Local late in the page as a supporting free local doorway and mission proof, not as the lead offer or an equal call to action. Purchasing this service does not improve Rebel Ranch Local ranking or approval.
- Paid price language: `Starting at $199` (not monthly).
- Primary call to action: `Help Customers Find Me` linking to `business-request.html?service=online-presence`.

## Approved experience and visual direction

- Design mobile first, then expand the same hierarchy for desktop.
- Use a strong opening photograph, visual explanations, short copy, and progressive disclosure instead of a word-heavy wall of cards.
- The digital-discovery section uses labeled, tappable icons. Selecting one icon reveals one concise explanation below; only one explanation is open at a time.
- Use authentic, contemporary small-business and customer photography. Avoid rural stereotypes, generic handshakes, old technology, trademarked platform logos, fake statistics, and invented testimonials.
- Use the Slate Ocean page-body palette: `#173244`, `#102635`, `#21475A`, `#28566B`, `#FFFFFF`, `#D7E4EC`, `#19BFE6`, `#65C7E8`, `#43D6B5`, `#FF5263`, with `#FF6500` reserved for the primary paid call to action.
- Do not use cream or beige backgrounds. The official shared RRM header and footer remain unchanged and continue to come from `assets/css/public-surface.css` and `assets/js/public-shell.js`.
- This service page may establish reusable Business Freedom design language, but it must not force every future service page into the same layout.

## Decision ledger

| Date | Item | State | Owner decision | Why/evidence |
|---|---|---|---|---|
| 2026-09-06 | Landing-page priority | APPROVED | Complete `Get Seen, Get Found` after the documentation and hub-name alignment | Online visibility and social media are a distinct core Business Freedom service and need a dedicated promotional page. |
| 2026-09-06 | Existing local draft | PROPOSED | Evaluate and reuse what fits instead of automatically creating a replacement | Existing work should be used where it meets the approved direction, but file existence is not approval. |
| 2026-09-07 | Mobile-first concept and sales sequence | APPROVED | Build the paid-first Slate Ocean concept, including the tappable digital-discovery section and late supporting RRL section | Owner reviewed multiple concepts and approved testing the combined direction. |
| 2026-09-07 | Business Freedom palette | APPROVED | Replace the cream-led body styling with Slate Ocean; no cream or beige backgrounds | Owner explicitly rejected the recurring cream treatment and approved the new palette. |
| 2026-09-07 | Shared site shell | APPROVED | Keep the repository's official RRM header and footer unchanged | Owner explicitly requested the RRM header and footer and asked that any integration issue be flagged. |
| 2026-09-07 | Local implementation | APPROVED | Implement and verify this page locally before formalizing the broader Business Freedom style | Owner said to proceed with the page and then use it to create the program style and brand. |
| 2026-09-07 | Local page build | INTEGRATED | Rebuilt the page with paid-first messaging, purpose-built mobile and desktop imagery, tappable digital-discovery controls, late supporting RRL placement, and the shared RRM shell | Implemented only in the authorized page-specific files and asset folder. |
| 2026-09-07 | Local verification | VERIFIED | Confirmed mobile and desktop rendering, shared header/footer presence, page asset and link resolution, JavaScript syntax, and the live state change of the discovery controls | Local server returned the page successfully; full-page visual reviews completed at phone and desktop widths. |
| 2026-09-07 | Program visual standard | INTEGRATED | Recorded the approved Slate Ocean direction in `docs/business-freedom/brand.md` while keeping future service layouts flexible | The owner requested that the finished page establish Business Freedom's style and brand. |
| 2026-09-07 | Aprons on men | REJECTED | Do not show men wearing aprons in current or future Business Freedom imagery | Owner identified the repeated apron treatment as unwanted and directed that it not be used again. |
| 2026-09-07 | RRL identity | APPROVED | Use the official Rebel Ranch Local logo in the supporting RRL section | Owner confirmed that the RRL icon should be the RRL logo. |
| 2026-09-07 | Mobile interaction report | VERIFIED | The live local discovery controls change the explanation and selected state; the long in-chat page preview is a static screenshot and cannot respond to taps | Clean local browser test selected Website, displayed the Website explanation, and deselected Social Media. |
| 2026-09-07 | No-apron image set | INTEGRATED | Use desktop hero v2, mobile hero v3, and customer-arrival v2; all male owners wear ordinary work shirts and pants | Replaces the three rejected apron images without changing the approved story or layout. |
| 2026-09-07 | Mobile hero v2 | REJECTED | Do not use this intermediate asset because excessive empty wall delays the visual story on a phone | Caught during private mobile review and superseded by the tighter v3 composition. |
| 2026-09-07 | Responsive image sizing | VERIFIED | Images must render at their designed aspect ratio instead of inheriting fixed HTML heights | Added page-specific `height: auto`; verified the mobile hero, closing owner/customer scene, and desktop hero visually. |
| 2026-09-07 | Reviews and Directories | APPROVED | Do not add separate Reviews or Directories controls | Reviews are covered inside search/maps, social, and website trust; several included channels already provide directory-style discovery, so separate controls would add less value and weaken the mobile focus. |
| 2026-09-07 | Final corrected page | APPROVED | Use the no-apron image set, official RRL logo, six tappable discovery controls, and corrected responsive image sizing | Owner reviewed the corrected page and said to push. |
| 2026-09-07 | Commit and GitHub push | APPROVED | Publish only the exact nine-file visibility-page package on a dedicated branch | Owner explicitly instructed: `ok lets push`. |
| 2026-09-07 | Merge and production deployment | APPROVED | Merge the approved visibility-page release and publish it through the repository's existing GitHub Pages production path | Owner explicitly instructed: `push live`. |
| 2026-09-07 | Production release | LIVE | Publish the approved page and connect it from both matching paths on the Business Freedom hub | Page build `1200372481` completed from merge `d5cceba1`; hub-route build `1200386004` completed from merge `1d5e8208`; the public page, assets, responsive mobile presentation, and both hub links were verified. |
| 2026-09-07 | Concept-faithful revision | APPROVED | Rebuild the live page to match the final owner-approved mobile visual concept: photo-backed hero, compact visual journey, six tappable discovery controls, isolated-versus-connected diagram, three-step service explanation, before/after comparison, supporting RRL section, and photographic paid close | Owner confirmed the balanced concept works, then explicitly required the implemented page to look like that image, pass all verification, and be pushed live. |
| 2026-09-07 | Full verification and deployment | APPROVED | Verify mobile and desktop presentation, every discovery control, all calls to action, linked assets, shared shell, accessibility basics, and the Business Freedom hub route before publishing the revision | Owner explicitly instructed that all verification must pass before the page is pushed live. |
| 2026-09-07 | Concept-faithful local build | VERIFIED | Replace the restrained prior implementation with the approved visual sales sequence and two purpose-built hero crops, while preserving the shared RRM shell | Real mobile-browser review passed across the hero, journey, discovery controls, connected-system comparison, service process, before/after, RRL support, closing call to action, and footer. Both desktop and mobile hero crops contain no aprons. |
| 2026-09-07 | Concept-faithful functional checks | VERIFIED | Publish only after the six discovery controls, primary calls to action, local assets, document structure, and responsive page all pass | All six controls independently changed the selected state, icon, heading, explanation, and missed-connection message; both paid calls to action resolve to `business-request.html?service=online-presence`; 29 local page references, 21 unique IDs, both hero assets, the shared shell, and whitespace checks passed. |
| 2026-09-07 | Concept-faithful production release | LIVE | Use the owner-approved balanced visual concept as the public `Get Seen, Get Found` page | Pull request `#99` merged as `806855c3`; GitHub Pages deployment `34158308319` completed successfully. Cache-busted public checks returned 200 for the page, request route, stylesheet, script, and both new hero assets; mobile visual review confirmed the new hero and connected-system sections; the public source contains exactly six discovery controls, no Reviews or Directories controls, both paid calls to action, and the shared RRM shell. |
| 2026-09-07 | Claimed concept-faithful live implementation | REJECTED | The implementation published through pull request `#99` is not the approved visual concept | The owner compared the public desktop page directly with the approved concept and identified a materially different composition. The implementation preserved the outline but changed density, spacing, proportions, imagery, and section layouts. Technical checks did not establish visual fidelity. |
| 2026-09-07 | Exact approved-concept rebuild | APPROVED | Build the approved concept as shown without reinterpretation or visual deviation | The owner explicitly directed: `build the fucking concept as is and do not fucking deviate`. The approved reference is `codex-clipboard-7799cae7-8eff-4bad-b531-eb5f618f2ad3.png`. |
| 2026-09-07 | Exact approved-concept local implementation | VERIFIED | Use the approved composition itself: compact split-photo hero, horizontal three-step journey, six-icon discovery row with a photographic expansion, side-by-side isolated/connected diagrams, horizontal three-step service strip, storefront-centered before/after, compact RRL block, and compact photographic close | Direct visual review at 456px mobile and 1183px desktop confirmed the same section composition, density, imagery, and proportions as the approved reference. The earlier stacked mobile cards and wide sparse desktop sections are absent. All six icon controls passed mouse behavior; keyboard activation passed; only one control remains selected; photographic and icon detail states switch correctly; the shared shell, two paid routes, 42 local references, 22 unique IDs, assets, syntax, overflow, and browser console checks passed. |
| 2026-09-07 | Final discovery imagery and readability revision | VERIFIED LOCALLY | Use the owner-approved image for every discovery doorway; increase small text and icons to the documented readable minimums; shape the Before/After storefront as a map pin; and visually remove the square background around the official RRL emblem | At 456px and 1183px, all six controls load the correct image and keep exactly one selected state. Phone labels render at 15px, explanatory copy at 16px, phone icons at 32px, desktop icons at 40px, body copy at 17px, and the page has no horizontal overflow. Mouse and keyboard activation passed, both paid links remain correct, all requested images load, and no page requests fail. |

| 2026-09-08 | Journey decision language | INTEGRATED AND VERIFIED LOCALLY | Replace "Choose what feels clear" with "Hear about you," "Find and explore," and "Decide you’re the right fit," using the exact supporting sentences approved by the owner. | The natural customer journey is present and readable in the rendered phone and desktop page. |
| 2026-09-08 | Closing image | INTEGRATED AND VERIFIED LOCALLY | Remove `business-visibility-customer-arrival-v2.jpg` from the closing section. Use the owner-approved generated concept as `business-visibility-customer-purchase-v1.png`. | The rendered close now shows phone research leading to a purchase in a woman-owned crafts, tea, and candle shop; both faces, the product handoff, and live-copy space remain visible on phone and desktop. |
| 2026-09-08 | RRL section visual balance | INTEGRATED AND VERIFIED LOCALLY | Enlarge the RRL network relative to the copy and optically center it against the full section; do not treat centering inside an undersized right column as sufficient. | Phone and desktop rendering confirm the official emblem is larger and the complete network is balanced against the section copy. |
| 2026-09-08 | Site-wide visual acceptance control | APPROVED | Apply the shared visual-acceptance, rendered-size, optical-alignment, natural-language, concept-comparison, asset-status, and drift-recovery gate from docs/site-design-system.md; Business Freedom additionally follows brand.md and this record. | Technical success cannot substitute for judging what a visitor sees. Rejections and corrections must remain cumulative so failed assets and language cannot silently return. |
| 2026-09-08 | Corrected production release | LIVE AND VERIFIED | Publish the exact locally verified page, approved assets, and governing visual controls without unrelated files | Pull request `#101` merged as `0daa1da3`; GitHub Pages deployment `34258464274` completed successfully. Public phone review at 416px and desktop review at 1833px confirmed the approved composition, 17px body text, 32px/40px discovery icons, no horizontal overflow, the enlarged and centered RRL network, the approved customer-to-purchase close, both paid routes, and the direct Business Freedom hub links. All six discovery controls loaded their correct images and explanations; keyboard activation passed. |

## Active visual and wording register

| Section | Exact item | State | Required takeaway / constraint |
|---|---|---|---|
| 02 — customer journey | "Hear about you"; "Find and explore"; "Decide you’re the right fit" with the owner-approved supporting sentences | INTEGRATED AND VERIFIED LOCALLY | Recommendation leads to online research, evaluation, choice, and action; use natural customer language. |
| 03 — discovery doorways | Six owner-approved expandable images | INTEGRATED AND VERIFIED LOCALLY | Each visual must remain understandable at its actual rendered size; detailed multi-stage visuals may receive more space than simple photographs. |
| 06 — Before/After | Storefront inside map-pin frame | INTEGRATED AND VERIFIED LOCALLY | Show movement from known locally to digitally discoverable; keep the visual optically centered between both outcomes. |
| 07 — Rebel Ranch Local | Official RRL emblem and network | INTEGRATED AND VERIFIED LOCALLY | Keep the official emblem; enlarge and optically center the network relative to the complete section. |
| Closing section | business-visibility-customer-arrival-v2.jpg | REJECTED | Must not remain or return. A person's back is not an acceptable focal point for the service outcome. |
| Closing section | `business-visibility-customer-purchase-v1.png`, copied without alteration from generated concept `exec-41bb9ae3-0cdc-4163-a1c1-8610d7fcb79d.png` | INTEGRATED AND VERIFIED LOCALLY | Show online discovery leading to an in-person purchase; preserve both faces and usable space for live closing content. |

### Exact approved Section 02 wording

1. **Hear about you** — Someone recommends your business.
2. **Find and explore** — They research your products, services, work, reviews, and brand.
3. **Decide you’re the right fit** — They choose you and take the next step.

## Remaining boundaries

- Exact photography may be refined during local visual verification without changing the approved story or sales hierarchy.
- Application of this style to other Business Freedom pages requires separate approval.
- Reviews and Directories are intentionally covered by the six approved discovery pathways rather than shown as separate controls.

## Incident and prevention

- Symptom: all three generated images containing a male owner used an apron, creating an unwanted repeated stereotype.
- Root cause: the image prompts did not explicitly prohibit aprons, allowing the image model's generic artisan shorthand to dominate.
- Correction: replace the affected assets with versioned images that explicitly require work-appropriate clothing and prohibit aprons, smocks, and bib garments.
- Preventive control: the Business Freedom photography standard now explicitly prohibits aprons on men; every generated image must be checked for this before owner review.
- Additional escaped defect: HTML image height hints were being honored as fixed mobile heights, making the page unnecessarily long and cropping subjects out of view. The page stylesheet now explicitly preserves responsive image proportions, and mobile/desktop visual checks were repeated.
- Second escaped visual-fidelity defect: the agent treated the approved mobile concept as a loose section outline, then created a wide and sparse desktop interpretation. It was incorrectly marked concept-faithful because the section order and functionality passed. Correction requires direct side-by-side visual comparison against the approved reference at phone and desktop widths; matching components or behavior cannot substitute for matching composition, density, imagery, and proportions.

## Next permitted action

- Use this finished page as an approved Business Freedom visual reference where its decisions fit. Do not force its exact layout onto another service page; begin another landing page only with separate owner direction.
