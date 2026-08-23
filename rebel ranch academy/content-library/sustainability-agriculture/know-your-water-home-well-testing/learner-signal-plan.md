# RRA-2026-0002 — Learner Signal Plan

## Purpose

Capture structured product-learning signals that help RRA understand real learner needs without collecting unnecessary identity.

## Privacy-minimized defaults

- random product/session key when session grouping is useful;
- account ID only when signed in and legitimately required;
- no names/emails in signal values;
- no IP address or browser fingerprint as Academy intelligence;
- no unrestricted health-history free text;
- controlled categories preferred;
- minor/parent boundaries preserved;
- public analytics collection requires appropriate disclosure at release.

## Core signals

| Signal | Controlled values / example | Product-intelligence use |
| --- | --- | --- |
| water_source | private_well / public_system / other_unknown | audience mix and product branch demand |
| intended_use_selected | drinking_cooking / infant_young_child / household / animals / irrigation / emergency / treatment_verification / other | understand coexistence of real-use branches |
| testing_reason | routine / flood / repair / sensory_change / local_issue / illness_concern / vulnerability / new_home / treatment_question / other | routine vs event demand |
| local_risk_category | septic / ag_livestock / fuel_pesticide / landfill_waste / geology / known_groundwater / unknown | identify local-risk learning needs |
| testing_question_created | category only; no free-text result | whether learners successfully reach diagnostic output |
| route_compared | county_state / certified_local_lab / mail_lab / home_screen | route-interest patterns |
| route_selected | same controlled values | actual route preference |
| result_record_started | yes | repeat-use depth |
| result_record_completed | yes | product completion quality |
| next_job | confirm_retest / inspect_source_well / local_support / define_treatment_job / maintain / monitor / schedule | downstream need patterns |
| depth_opened | tell_more / why / science / system / sources | preferred depth |
| export_plan | yes | tangible-output value |
| plan_returned | yes | repeat-use value |
| branch_changed_after_event | yes | whether living-state design is useful |
| next_learning_choice | parent_water / result_literacy / annual_well_care / other approved route | Opportunity Intelligence input |

## Do not collect as learner signals by default

- exact street/address;
- names or emails;
- full laboratory reports as analytics payloads;
- unrestricted illness descriptions;
- precise medical status;
- free-form personal history;
- hidden device fingerprinting.

Learner-owned result records may contain necessary test values for the product to function, but analytics should aggregate only the controlled product signals above unless a later owner-approved data design says otherwise.

## Signal-to-intelligence questions

1. Are most users private-well households or public-system learners?
2. Which intended uses commonly coexist?
3. Are event-triggered flows used enough to warrant deeper standalone resources?
4. Which evidence routes are compared versus actually selected?
5. Where do learners stop before building a Testing Question Map?
6. Which depth layer is actually opened?
7. Do learners return to the plan after the first session?
8. Which next jobs recur and deserve future Academy products?

## Opportunity Intelligence trigger examples

- high recurring `flood` signal → evaluate a post-flood well testing resource;
- high `treatment_verification` signal → evaluate a treatment-performance verification companion;
- high `result_record_completed` but low confidence/navigation completion → investigate result-literacy product need;
- high `animals`/`irrigation` selection → research whether evidence supports dedicated use-specific water-quality branches rather than inventing them here.

Signals are evidence of product use/interest, not automatic authorization for new projects or release.

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: RRA Product Design Agent automation cycle
