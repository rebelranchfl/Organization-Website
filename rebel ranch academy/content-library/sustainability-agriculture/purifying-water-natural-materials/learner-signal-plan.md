# RRA-2026-0001 — Learner Signal Plan

**Status:** PRODUCT WORKING  
**Purpose:** Define privacy-minimized signals that can improve Water and future Academy products without collecting unnecessary personal identity.

## Principles

- collect structured product/learning signals, not names, email addresses, physical addresses, health histories or open-ended personal stories;
- use a random session/product key when grouping a session is useful;
- account linkage is optional and only when an approved feature legitimately needs it;
- do not store IP address or browser fingerprint as Academy learner intelligence;
- do not use signals as proof that all learners want the same thing.

## Core profile signals

- `water_source_selected`
- `water_use_selected` — one event/value per selected use so multi-use demand is visible;
- `water_use_removed`
- `water_scale_selected`
- `testing_status_selected`
- `testing_path_selected`
- `known_unknown_category_selected`
- `resource_category_selected`
- `build_buy_path_selected`

## Branch signals

- `branch_opened`
- `branch_plan_completed`
- `branch_system_option_selected`
- `branch_verification_selected`
- `branch_backup_selected`

Branch values should be controlled categories such as `DRINK_COOK`, `ANIMALS`, `IRRIGATION`, `EMERGENCY_BACKUP`.

## Visual / depth signals

- `system_visual_opened`
- `show_me_why_opened`
- `show_me_science_opened`
- `technical_details_opened`
- `sources_opened`
- `scale_visual_opened`
- `historical_comparison_opened`

## Responsible Rebellion signals

- `experiment_started`
- `experiment_test_recorded`
- `experiment_comparison_completed`
- `experiment_system_preference_selected`
- `transfer_principle_opened`

## My Water Plan signals

- `my_water_plan_opened`
- `my_water_plan_branch_added`
- `my_water_plan_updated`
- `my_water_plan_completed`
- `next_action_selected`

## Continuity / friction signals

Useful implementation QA signals:
- `step_started`
- `step_completed`
- `depth_return_success`
- `state_restore_success`
- `validation_blocked_continue`

Do not knowingly ship events named `404` as a normal learner path. Broken links are implementation defects, not learning data.

## Intelligence questions these signals can answer

- Which water sources dominate real use?
- How many learners need multiple simultaneous uses?
- Which use combinations recur most?
- Which branches create the most engagement or drop-off?
- Do learners use the actual system visuals?
- How often do learners choose deeper science/evidence?
- Which testing paths are most common?
- Which Responsible Rebellion experiments are actually used?
- Which next-learning paths deserve opportunity research?

## Release boundary

Signal architecture may be prepared during Product Design. Public analytics collection, disclosure/privacy copy and deployment remain separate owner release decisions.

---
AI-Agent: ChatGPT/GPT-5.6 Sol  
Session: RRA Product Design Agent
