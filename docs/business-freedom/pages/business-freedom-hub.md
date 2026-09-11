# Business Freedom Hub — Decision Record

## Control

- Page file: `business-fixes.html`
- Program: Rebel Ranch Ministries → Business Freedom
- Current state: Custom AI Workforce direct and full-card routes are LIVE and PUBLICLY VERIFIED through PR `#105`; the earlier `business-freedom-hub-v1.5` baseline remains preserved; the Automated Payment Processing route was deployed through PR `#102` with owner/public verification pending
- Last updated: 2026-09-11
- Current exact version: `business-freedom-hub-v1.5` baseline plus payment-route release `#102` and publicly verified Custom AI Workforce route release `#105`

## North star

- Audience: small-business owners who know what is hurting but may not know the service name or solution.
- Purpose: let a visitor choose a familiar business problem, see the matching Business Freedom service immediately, compare available help, and reach the correct request path.
- Primary action: choose the problem that is getting in the way.
- Page role: this is the main Business Freedom service finder and comparison page. It is the “hub” because multiple Business Freedom paths begin and connect here.
- Claims boundary: present practical support and service scope without promising savings, income, profit, sales, or results.

## Approved specification

- Align each core hub choice, selector result, full service card, request form, and dedicated landing page to one approved public name.
- Use this canonical order and map:
  1. `Get Your Time Back` — core service with a live landing page.
  2. `Stop Losing Customers` — core service with a live landing page.
  3. `Keep Your Money` — core service with a live landing page.
  4. `Get Seen, Get Found` — core service with a live landing page.
  5. `Automated Payment Processing` — core service with a dedicated page deployed at `business-payment-processing.html`; owner/public verification pending.
  6. `Custom AI Workforce` — core custom digital-worker service with a dedicated page at `business-ai-workforce.html`; use `Build a Custom AI Workforce` for the direct problem-first choice.
  7. `Add an Operations Leader to Your Team` — core recurring service requiring one comprehensive landing page.
  8. `I've Got the Potential` — routing choice with the supporting statement `I just don't know how to get there.`; no landing page.
- Link the six completed landing pages from their matching selector results and full service cards:
  - `business-time.html`
  - `business-leads.html`
  - `business-money-leaks.html`
  - `business-visibility.html`
  - `business-payment-processing.html`
  - `business-ai-workforce.html`
- Preserve the exact approved recognition statement for `Automated Payment Processing`: `Tired of waiting for systems and programs to deposit my money.`
- Preserve the exact approved recognition statement for `Add an Operations Leader to Your Team`: `I need an experienced & certified pro on my side, but can't afford a full-time employee.`
- Preserve the approved `Keep Your Money` recognition story in every shortened hub and request-form use: `You do quality work. Money comes in. Too little of it stays.` The supporting explanation must describe following every dollar, analyzing the whole operation, finding root causes across connected systems and processes, and building one clean flow. Do not substitute lists of wasted time, trips, fuel, materials, software, repeated work, or other individual causes for this service identity, and do not frame the owner as the failure.
- Preserve the separate $49.99 `Get Paid Faster — Set Up Your Payment Links` offer in its existing Marketplace/request-form path. Do not add it to this hub yet.
- Do not publish the proposed local Get Paid Faster or Guidance detail-page drafts.
- Do not change prices, layout, styling, or the existing request destinations in this alignment pass.

## Decision ledger

| Date | Item/version | State | Owner decision | Why/evidence |
|---|---|---|---|---|
| 2026-09-06 | `business-freedom-hub-v1.1` naming and links | APPROVED and INTEGRATED | Rename Money to `Keep Your Money`; align Time to `Get Your Time Back`; connect the three completed detail pages | Names must be catchy, relevant, and suitable for social promotion; existing pages should be used before new pages are built. |
| 2026-09-06 | $49.99 Get Paid Faster hub placement | BLOCKED | Hold until the other Business Freedom work is complete and the Marketplace-specific path can be reviewed last | The offer is for Marketplace sellers who lack an online payment method; many local sellers intentionally use cash or COD. |
| 2026-09-06 | New public pages | BLOCKED | Build no additional pages without separate owner approval | Existing pages and the interactive hub must be worked first. |
| 2026-09-06 | Canonical six-service map | APPROVED | Use one public name across each hub choice, result, full service card, request option, and matching landing page | The live hub mixed problem statements, service names, draft pages, and a routing choice in a way that obscured the actual service map. |
| 2026-09-06 | `Automated Payment Processing` | APPROVED | Use this as the broad payment-processing service; design and automate the linkages between merchant services, payment systems, and supporting software | Most money movement is automated after owner approval; the service's value is making disconnected systems work together. |
| 2026-09-06 | `Add an Operations Leader to Your Team` | APPROVED | Build one comprehensive premium page explaining Operations Strategist, Operations Manager, and Process Engineer capabilities | This is the highest-priced recurring Business Freedom asset and must show the value and distinction of all three professional capabilities. |
| 2026-09-06 | Operations Leader recognition | APPROVED | `I need an experienced & certified pro on my side, but can't afford a full-time employee.` | Expresses access to expertise the small business cannot support as a full-time position without implying the owner makes bad decisions. |
| 2026-09-06 | `I've Got the Potential` routing choice | APPROVED | Use `I just don't know how to get there.` as its supporting statement and do not create a landing page | This is a routing path for visitors who need help identifying the right Business Freedom service, not a separate paid service. |
| 2026-09-06 | `business-freedom-hub-v1.2` alignment | LIVE | Align and publish the seven hub choices, six service summaries, interactive results, and request form to the canonical map without creating landing pages | Owner authorized the alignment and then separately instructed Codex to push all completed work live. The three existing completed-page links were preserved, and the $49.99 Marketplace option remained separate. |
| 2026-09-06 | `Keep Your Money` recognition alignment | LIVE | Replace every symptom-led hub and request-form summary with the completed landing page's recognition story and whole-business method | The live hub continued repeating supporting causes as the service identity even after the landing page established the correct story. The owner directed immediate correction and then authorized publication before imagery planning continues. |
| 2026-09-07 | `business-freedom-hub-v1.4` Visibility route | LIVE | Link `Get Seen, Get Found` from both its selector result and its full service card using the existing landing-page pattern | The owner required the Business Freedom homepage to link its completed landing pages and authorized the Visibility page to be pushed live; production build `1200386004` completed from merge `1d5e8208`, and both public routes were verified. |
| 2026-09-07 | `business-freedom-hub-v1.5` direct Visibility card | APPROVED | Make the primary Visibility choice card itself link directly to `business-visibility.html`, while preserving the existing direct link in the full service card | Owner clarified that the service's associated hub card must lead directly to its landing page and authorized publication after verification passes. |
| 2026-09-07 | `business-freedom-hub-v1.5` local implementation | VERIFIED | Publish the Visibility choice as a direct landing-page link without changing the behavior of the other six routing choices | Real-browser accessibility inspection identifies the Visibility choice as a link whose destination is `business-visibility.html`; the existing Visibility service-card link remains; hub JavaScript syntax and all local references pass. |
| 2026-09-07 | `business-freedom-hub-v1.5` production release | LIVE | Keep the primary Visibility choice linked directly to the concept-faithful landing page | Pull request `#99` merged as `806855c3` and GitHub Pages deployment `34158308319` completed successfully. Cache-busted public source and real-browser accessibility inspection both confirm the Visibility choice is a link to `business-visibility.html`; its mobile card presentation and the destination page were visually verified. |
| 2026-09-08 | Automated Payment Processing route | APPROVED and LOCALLY VERIFIED | Link the primary payment-processing choice and full service card directly to `business-payment-processing.html`, while preserving the existing request action | The owner approved the female-owner full-page concept and then authorized implementation; the local page, responsive presentation, interactions, and routes passed verification. Publication remains a separate gate. |
| 2026-09-09 | Automated Payment Processing route release | DEPLOYED; OWNER/PUBLIC VERIFICATION PENDING | Merge the landing page and both hub routes through PR `#102` | PR `#102` merged as `2d36e522`; GitHub Pages run `34386140764` completed successfully. The owner elected to verify the public experience, so deployment must not be recorded as public verification. |
| 2026-09-11 | Custom AI Workforce page and hub routes | LOCALLY VERIFIED; OWNER APPROVED; RELEASE AUTHORIZED | Add one direct problem-first choice, one full service card, and the approved dedicated page without changing unrelated hub behavior | The owner independently reviewed and corrected every comparison topic, selected the first V3 opening image, approved incorporation, and directed the completed work to be made live. Fresh phone and desktop evidence covers every state, shows no horizontal overflow, and confirms the corrected state/image/copy changes. |
| 2026-09-11 | Custom AI Workforce public release | LIVE and PUBLICLY VERIFIED | Merge and deploy the approved page plus both hub routes, then inspect the real public surfaces | PR `#105` merged as `b762c54a`; Pages run `34606315956` completed successfully. Cache-busted public checks at 456px and 1440px returned 200, loaded all six matching comparison states without broken images or browser errors, preserved Cost as default, showed zero horizontal overflow, and confirmed both hub routes, Custom estimate, and the verified call number. |

## Verification matrix

| Version | Check | Environment/width | Evidence | Date/verifier | Result |
|---|---|---|---|---|---|
| `business-freedom-hub-v1.1` | Naming, completed-page links, request paths, desktop/mobile layout, and overflow | Local server at 1440px and 390px | Time, Leads, and Money selector results and service-card links reach the correct completed pages; request forms show the approved names; page width equals viewport on phone | 2026-09-06 Codex | PASS |
| `business-freedom-hub-v1.1` | Public naming, completed-page links, request paths, held offer, and phone/desktop presentation | GitHub Pages; desktop and 390px phone | Time, Leads, and Money reach the correct live pages; request forms show approved names; Get Paid Faster is absent from the hub; no broken images were found. The shared footer retains an unrelated pre-existing 8px phone overscroll when a vertical scrollbar is present. | 2026-09-06 Codex | PASS for this release; shared-footer note recorded |
| `business-freedom-hub-v1.2` | Canonical names and supporting statements across seven choices, six service cards, interactive results, and eight request-form options | Local server; 1440px desktop and 390px phone | Exact names and approved recognition statements rendered correctly; existing Time, Leads, and Money page links remained the only detail-page links; the $49.99 Marketplace option remained unchanged and absent from the hub; no broken images or new layout overflow were found | 2026-09-06 Codex | PASS |
| `business-freedom-hub-v1.2` | Public naming, all interactive routes, completed-page links, held Marketplace offer, request-form choices, desktop/mobile presentation, shared shell, and linked assets | GitHub Pages; 1440px desktop and 390px phone | All seven approved hub names and results, six service summaries, and eight request-form choices rendered correctly; only the three completed detail pages were linked; Get Paid Faster remained absent from the hub; no broken images or embedded base64 images were found. The unrelated pre-existing shared-footer phone overscroll remained 8px when the vertical scrollbar was present. | 2026-09-06 Codex | PASS for this release; shared-footer note remains recorded |
| `business-freedom-hub-v1.3` | `Keep Your Money` choice, interactive result, full service card, details, action, and request-form description | Local server; 1440px desktop and 390px phone | Exact recognition story and whole-business method rendered; old symptom-led identity phrases were absent; approved landing-page route and pricing were unchanged; no broken images or new layout overflow were found. The unrelated pre-existing shared-footer 8px phone overscroll remains. | 2026-09-06 Codex | PASS; publication pending |
| `business-freedom-hub-v1.3` | Public deployment, exact recognition story, interactive result, full service content, request description, responsive layout, and browser log | GitHub Pages; 1440px desktop and 390px phone | Deployment run `34051160959` completed successfully from commit `3e36e9d`; the recognition story, whole-business method, and approved action rendered publicly; old symptom-led identity phrases were absent; no broken images or browser errors were found. The unrelated pre-existing shared-footer 8px phone overscroll remains. | 2026-09-06 Codex | LIVE |
| `business-freedom-hub-v1.4` | Visibility selector result, full service card, landing-page routes, and public deployment | Local route test and GitHub Pages | Both Visibility pathways expose `business-visibility.html`; local selector behavior passed; production build `1200386004` completed from merge `1d5e8208`; both live homepage routes and the destination page returned successfully. | 2026-09-07 Codex | LIVE |
| `business-freedom-hub-v1.5` | Direct Visibility choice-card route, preserved full-card route, unrelated selector behavior, linked destination, and mobile presentation | Local server and real mobile browser | The primary Visibility choice is a semantic link to `business-visibility.html`; the existing full service card retains its landing-page link; the other six choices remain buttons handled by the existing selector; hub script syntax, references, destination response, and mobile rendering passed. | 2026-09-07 Codex | PASS; publication pending |
| `business-freedom-hub-v1.5` | Production deployment, direct Visibility choice-card destination, landing-page response, and mobile rendering | GitHub Pages and real mobile browser | Deployment `34158308319` succeeded; the public hub source and accessibility tree identify the Visibility choice as a direct `business-visibility.html` link; both hub and destination returned 200 and displayed the approved mobile experience. | 2026-09-07 Codex | LIVE |
| Payment-processing local integration | Approved page composition, readable hero photograph, removal of borrowed section numbers, responsive layout, interactive control buttons, four photographic assets, request route, and both hub landing-page routes | Local server; phone and desktop browser | The closing-shop story remains visible behind readable hero copy; no page-section numbers render; all four images load at their natural 1672×941 dimensions; the rule controls update their explanation and pressed state; both calls to action reach `business-request.html?service=revenue-cycle`; both hub links reach `business-payment-processing.html`; no horizontal overflow or browser errors were found. | 2026-09-08 Codex | PASS; deployment followed through PR `#102` |
| Payment-processing deployment | Merge and GitHub Pages deployment only | GitHub PR and Actions | PR `#102` merged as `2d36e522`; Pages run `34386140764` completed successfully. No public-page or public hub-route verification was performed because the owner elected to verify personally. | 2026-09-09 Codex | DEPLOYED; OWNER/PUBLIC VERIFICATION PENDING |
| Custom AI Workforce local routes | Direct hub choice, full service card, dedicated-page destinations, preserved unrelated buttons, phone and desktop overflow | Local server; 456px phone and 1440px desktop | Both new hub links reach `business-ai-workforce.html`; the full card uses Custom estimate and the verified RRM call number; existing button-driven choices retain their existing script; no unrelated page or request-form route was changed. The owner supplied the separate visual review and release approval. | 2026-09-11 Codex + owner | LOCALLY VERIFIED; OWNER APPROVED |
| Custom AI Workforce public release | Deployment, page response, approved composition, six comparison states, image health, call actions, two hub routes, phone/desktop overflow, and browser errors | GitHub Pages; 456px phone and 1440px desktop | PR `#105` merged as `b762c54a`; Pages run `34606315956` succeeded; page and hub returned 200; all states and images loaded; Cost was default; call links and Custom estimate were correct; both hub routes were present; no browser errors or horizontal overflow occurred. | 2026-09-11 Codex/browser | LIVE; PUBLICLY VERIFIED |

## Flags and unanswered questions

- The Automated Payment Processing filename, concept, price presentation, primary action, page, and local hub routes are approved and locally verified. The page and hub routes are deployed through PR `#102`; owner/public verification remains pending.
- The Custom AI Workforce offer, public name, two service levels, no-package-price decision, call action, page filename, V3 hero, comparison states, and hub routes are live and publicly verified through PR `#105` and Pages run `34606315956`.
- The existing local `business-guidance.html` draft predates the approved Operations Leader direction and must not be treated as approved page content.
- `business-freedom-hub-v1.5` is live and publicly verified.

## Next permitted action

Preserve the publicly verified `business-ai-workforce.html` page and both hub routes. Move to `Add an Operations Leader to Your Team` only after its service-specific concept is approved through the shared visual learning and execution loop.
