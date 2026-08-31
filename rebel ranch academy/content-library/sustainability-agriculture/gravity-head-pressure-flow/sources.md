# Source Audit — RRA-2026-0009

**Evidence rule:** `Authority does not replace evidence. Proximity to the source, transparency, corroboration, and relevance matter more than institutional prestige.`  
**Source behavior:** Agent-vetted. Owner source-by-source review is optional; owner overrides are binding.

| # | Claim / topic | Source | Type / proximity | Direct link | What it supports | Corroboration / limitation | Final use | Owner |
|---|---|---|---|---|---|---|---|---|
| S1 | Hydrostatic pressure; Bernoulli energy relation | OpenStax, *University Physics Vol. 1 — Bernoulli's Equation* | University open textbook / near-primary synthesis | https://openstax.org/books/university-physics-volume-1/pages/14-6-bernoullis-equation | `p=ρgh` static case and Bernoulli energy relationship | Ideal/frictionless Bernoulli form does not capture real pipe losses; paired with NRCS/UF engineering guidance | Yes | Pending |
| S2 | Flow rate, continuity, hydrostatic/Bernoulli equations | OpenStax, *Chapter 14 Key Equations* | University open textbook / direct equation reference | https://openstax.org/books/university-physics-volume-1/pages/14-key-equations | `Q=dV/dt`, continuity, pressure-depth equations | General physics; real-system sizing requires engineering loss models | Yes | Pending |
| S3 | 2.31 ft head = 1 psi; water weight; field conversions | Mississippi State University Extension, *Irrigation* | University extension / direct field reference | https://www.extension.msstate.edu/agriculture/farming/irrigation | Head-pressure conversion; 8.33 lb/gal | Field conversion; values approximate and temperature-dependent at high precision | Yes | Pending |
| S4 | Static, pressure, friction, velocity and total dynamic head | USDA NRCS, *National Engineering Handbook Part 652 Irrigation Guide — Chapter 7* | Federal engineering handbook / direct technical guidance | https://efotg.sc.egov.usda.gov/references/public/AL/Chapt7.pdf | 0.433 psi/ft; dynamic-head components; friction/fittings; pump design logic | Engineering guidance; pump sections exceed learner-level scope but support system model | Yes | Pending |
| S5 | Flow/pipe sizing; when pumps add lift/pressure/flow | UF/IFAS, *Basic Tips for Designing Efficient Irrigation Systems (AE539)* | University extension / direct technical synthesis | https://ask.ifas.ufl.edu/publication/AE539 | Pipe/flow relationship, friction, pump function | Irrigation context; principles transfer to water systems but device-specific design still needed | Yes | Pending |
| S6 | Hazen-Williams friction factors; elevation effects | UF/IFAS, *Hydraulic Considerations for Citrus Microirrigation Systems (CH156)* | University extension / direct hydraulic design reference | https://ask.ifas.ufl.edu/publication/CH156 | Friction depends on flow/diameter/roughness/length; uphill/downhill effects | Hazen-Williams has scope assumptions; Darcy-Weisbach is more general | Yes | Pending |
| S7 | Gravity flow vs siphon; low-pressure design; practical head | Kansas State Research & Extension, *Waterers and Watering Systems: A Handbook for Livestock Producers and Landowners* | University extension handbook / direct field guidance | https://bookstore.ksre.ksu.edu/pubs/waterers-and-watering-systems-a-handbook-for-livestock-producers-and-landowners_S147.pdf | Gravity/siphon definitions, 0.43 psi/ft, friction significance, field advantages/limits | Livestock context and examples are not universal sizing rules; siphon lift depends on conditions | Yes | Pending |
| S8 | Static vs dynamic pressure | Oklahoma State University Extension, *Managing Pressure in the Home Irrigation System* | University extension / direct practical guidance | https://extension.okstate.edu/fact-sheets/managing-pressure-in-the-home-irrigation-system | Difference between no-flow and operating pressure; frictional drop | Irrigation context; supports measurement concept | Yes | Pending |
| S9 | Transparent pipeline friction calculator | Washington State University, *Pipeline Pressure Loss Calculator* | University technical tool / direct calculator | https://irrigation.prosser.wsu.edu/Content/Calculators/General/Pipeline-Pressure-Loss.php | Friction comparison by flow, diameter, length, material; fittings | Calculator is an estimate/design aid, not field proof | Background + possible product-stage reference | Pending |
| S10 | Persian qanat gravity transport and maintenance architecture | UNESCO World Heritage Centre, *The Persian Qanat* | Heritage nomination/source description / direct documented system | https://whc.unesco.org/en/list/1506/ | Long-distance gravity tunnels, gentle slope, access shafts, management | Demonstrates transport/history, not modern potability or code | Yes | Pending |
| S11 | Omani aflaj gravity distribution | UNESCO World Heritage Centre, *Aflaj Irrigation Systems of Oman* | Heritage source description / direct documented system | https://whc.unesco.org/en/list/1207/ | Gravity channeling from underground/spring sources; community water sharing | Historical/cultural system evidence, not modern pressure design | Yes | Pending |
| S12 | Roman aqueduct gravity routing and inverted siphon concept | MIT, *Aqueduct Design* exercise | Engineering education / secondary historical synthesis | https://web.mit.edu/course/other/learnbydesign/prototype/exercises/mit10.390a.pdf | Roman gravity channels, route/slope preservation, tunnels/bridges/siphons | Educational historical summary; use for concept, not precise dating/performance claims beyond text | Yes | Pending |
| S13 | Head/pressure conversion and practical water-handling reference | U.S. Forest Service, *Water Handling Equipment Guide* | Federal field equipment guide / direct operational reference | https://www.fs.usda.gov/t-d/pubs/pdfpubs/pdfWHEG13/WHEG13.pdf | 1 ft head ≈0.433 psi; 1 psi≈2.31 ft; atmospheric/suction context | Wildland-fire context; used only for corroborated hydraulic conversion | Yes | Pending |

## Source-count summary
- Agent-vetted sources: **13**
- Primary/direct/near-primary technical or documented-system sources: **10**
- Secondary/direct educational syntheses: **3**
- Blocking source issues: **0**

## High-impact corroboration
- Head/pressure conversion: S3 + S4 + S7 + S13.
- Static vs dynamic / real losses: S4 + S6 + S8.
- Pipe diameter/length/friction: S4 + S5 + S6 + S9.
- Gravity/siphon/pump distinctions: S4 + S5 + S7.
- Historical gravity systems: S10 + S11 + S12.

## Conflicts / uncertainty preserved
- Ideal Bernoulli does not replace real-system head-loss analysis.
- Hazen-Williams is useful but not a universal fluid equation.
- Siphon practical lift is condition-dependent; do not present ~30 ft as an exact universal ceiling.
- Historical gravity systems demonstrate function and design knowledge, not modern drinking-water safety.
- Static pressure does not establish delivered flow/capacity.

AI-Agent: ChatGPT/GPT-5.6 Sol  
Session: RRA Content Agent
