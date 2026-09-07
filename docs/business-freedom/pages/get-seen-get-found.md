# Get Seen, Get Found — Decision Record

## Control

- Page file: `business-visibility.html`
- Program: Business Freedom
- Current state: LIVE and production-verified at the concept-faithful revision
- Last updated: 2026-09-07

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

## Next permitted action

- Use this finished page as an approved Business Freedom visual reference where it fits, without forcing its exact layout onto the remaining service pages. Build the next page only with separate owner approval.
