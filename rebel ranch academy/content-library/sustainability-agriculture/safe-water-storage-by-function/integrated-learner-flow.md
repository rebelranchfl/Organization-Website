# RRA-2026-0004 — Integrated Learner Flow

## Core experience

`START WITH THE JOB → INVENTORY WHAT YOU HAVE → CHECK CONTAINER HISTORY → SEE THE CONTAINER ANATOMY → COMPARE EACH SELECTED USE → CALCULATE CAPACITY / WEIGHT / REDUNDANCY → PRIORITIZE CORRECTIONS → BUILD MAINTENANCE LOOP → RUN FAILURE-MODE ACTIVITY → MY WATER STORAGE PLAN → TRANSFER THE PRINCIPLE`

## Experience rules

- Intended uses are **multi-select**.
- Every selected use remains visible throughout the journey.
- Learner inputs update the living plan; the learner never has to retype the same answers into a second worksheet.
- Plain language and recognizable scenes lead; technical diagrams/evidence are optional depth.
- Deeper controls open in context or return the learner to the exact place with state preserved.
- A single container may receive different branch outcomes; do not force a universal classification.
- The product must explain the exact unknown when it cannot classify responsibly.

## Navigation contract

Persistent state keys should include:
- selectedUses[]
- containers[]
- emergencyPeople
- emergencyDays
- targetCapacity by branch
- anatomyInspection by container
- classification by container/use
- corrections by container/use
- maintenance choices
- optional depth preference

All normal links and `Why? / See the system / Show the math / Sources` controls must either:
1. open in-place without changing learner state, or
2. carry a return anchor/state reference and restore the exact prior step.

No depth route may point to a file that is not in the preview manifest/release candidate.

## Learner-facing progress

Use human step names:
1. My Water Jobs
2. What I Already Have
3. What These Containers Held Before
4. See What Makes Storage Work
5. Match Containers to Jobs
6. Capacity, Weight & Backup
7. Fix What Matters First
8. Keep the System Working
9. Test the Thinking
10. My Water Storage Plan

Do not expose internal lifecycle labels or system field names.

## Final plan continuity

The final plan is not a separate destination that forgets the journey. It is the current state of the learner's answers and classifications summarized visually and in print.

Changing an earlier answer must update the final plan where practical.