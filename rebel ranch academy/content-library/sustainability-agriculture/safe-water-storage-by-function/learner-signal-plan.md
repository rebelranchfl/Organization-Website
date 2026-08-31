# RRA-2026-0004 — Learner Signal Plan

Collect only structured product-intelligence signals needed to improve the Academy experience.

## Useful events / categories
- selected_use: drinking, emergency, livestock, irrigation, produce_contact, other_nonpotable
- container_added: jug, bucket, barrel, drum, tote, tank, cistern, trough, other
- prior_history_status: known_food_water, known_nonfood, toxic_disqualifier, unknown
- quick_check_completed
- capacity_planner_started / completed
- classification_result: works, correct_first, nonpotable_only, do_not_use, verify_first
- correction_type: history, structure_support, closure_dispensing, capacity, maintenance, optional_upgrade
- depth_opened: why, contamination_paths, weight_math, technical, evidence
- plan_completed / printed
- next_learning_choice

## Privacy boundary
Do not collect names, emails, exact addresses, IP addresses, browser fingerprints, health details or unrestricted narratives as learner intelligence. Use a random product/session key when grouping is useful. Account association is only for an approved signed-in feature that legitimately requires it.

## Intelligence questions
Aggregate signals should help answer:
- Which use combinations are most common?
- How often are unknown-history containers encountered?
- Which correction is most common?
- Do learners need livestock/irrigation branches often enough to justify deeper follow-on products?
- Where do learners abandon the experience?
- Which depth layers are actually opened?
- How often does the free quick-check lead to completion of the full plan?

Small samples must not be overgeneralized.