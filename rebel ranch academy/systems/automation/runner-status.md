# Rebel Ranch Academy — Agent Runner Status

**Status:** TEMPORARILY DORMANT / DISABLED BY OWNER DIRECTION  
**Program:** Rebel Ranch Academy (RRA)  
**Current control date:** 2026-09-07

## Current state — authoritative

Academy automated production is **temporarily offline**.

The reason is operational quality control: unresolved backend/pipeline problems were allowing AI work to continue upstream even when downstream functions were not yet reliable. That created a risk of producing more material that would later require extensive rework.

The owner therefore directed that Academy automated production remain disabled until the backend/pipeline is repaired and the complete path is verified end to end.

## Current operating rules

- `Run Agent Now` is not an active Academy capability.
- The GitHub Academy production runner is disabled and must not perform production work.
- Hourly Academy production is suspended.
- No scheduled, manual, polling, dispatch, or other Academy production trigger may be treated as active merely because old infrastructure or records still exist.
- Academy database tables, request records, runner-state records, workflows, or related code may remain as dormant infrastructure while the backend is repaired.
- Dormant infrastructure is not proof that the capability is functional.
- No agent may restart production simply because one individual component appears to work.
- Production may resume only after the complete intended pipeline has been tested and verified end to end and the owner explicitly authorizes reactivation.

## What “polling dispatcher” means

The old system included a mechanism that periodically checked for waiting agent requests and tried to start them. That periodic checker was referred to as a polling dispatcher.

It is not a capability the owner needs to manage or understand as a separate product. It is historical implementation detail. For current purposes, it is simply one possible automated trigger, and it is **not authorized to run Academy production while the system is dormant**.

## Reactivation gate

Before any Academy production automation is turned back on, verify the entire intended chain, including as applicable:

1. owner action or scheduled trigger;
2. backend request creation and authorization;
3. dispatch/start behavior;
4. correct agent/project/stage selection;
5. durable GitHub output;
6. Supabase state synchronization;
7. downstream production steps;
8. deployment or preview behavior where applicable;
9. owner-facing status/result accuracy;
10. failure handling so an upstream agent does not continue creating work after a downstream failure.

A partial pass is not sufficient. The exact production path being restored must work from beginning to end before it is considered functional.

## Timing after repair

The Academy previously used hourly automation. That cadence is not a current requirement.

Once the pipeline is functional, timing and trigger design should be reconsidered based on the repaired system rather than automatically restoring the former hourly schedule.

## Owner gates remain in force

Even after production automation is eventually restored, automated work does not independently authorize public release, publishing, selling, final pricing, storefront activation, promotion, or bypassing an owner review gate.
