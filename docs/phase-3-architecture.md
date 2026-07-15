# Phase 3 Creation Station Architecture

## Multiple future views

The operational dashboard is one presentation over canonical Creation Station records. `creation-station-data.js` builds an account context from account roles, active membership, household ownership, creator type, and age band. It exposes view eligibility for parent/guardian, young creator, teen creator, adult maker, business growth, and administrator presentations without deciding their final layouts.

Future pages should import the shared service and render only the presentation appropriate to their audience. They must not copy project, portfolio, class, resource, website, membership, or KPI records into view-specific tables.

## Reusable frontend services

- `loadAccountContext`: authentication, roles, membership tier, household relationship, creator types, and available presentation layers.
- `loadWorkspaceData`: canonical projects, templates, portfolios, resources, classes, registrations, and activity.
- `calculateWorkspaceMetrics`: reusable operational KPI calculations.
- Project, upload, portfolio, website-revision, activity, and moderation mutations.
- `supabase-client.js`: the single shared browser client configuration.

## Presentation-specific code

- `creation-station-dashboard.js` renders the current operational member dashboard and binds its dialogs/buttons.
- `creation-station-admin.js` renders the moderation queue and binds administrator actions.
- HTML and CSS remain presentation concerns. The current design is intentionally an operational foundation, not the final Studio UX.

## Canonical KPI support

- Project starts/completions/current completion: `creator_projects`.
- Progress over time: immutable `project_progress_events` captured by a database trigger.
- Skill development: `project_templates.skill_tags` joined to project completions and progress history.
- Portfolio growth: `creator_portfolios` and timestamped `portfolio_items`.
- Class registration/participation: `class_registrations.created_at` and `attended_at`.
- Resource usage: `creation_activity` events with `activity_type='resource_opened'` and the resource ID.
- Website readiness: versioned `creator_website_requests` and publication states.
- Marketplace listings, views, inquiries, orders, and revenue belong to future Marketplace canonical records; they should be joined by creator/account IDs rather than copied into Creation Station.
- Academy recommendations and next milestones should be derived later from the same creator, progress, skill, participation, and business records.

## Current limitations before final UX work

- The service is a browser-side ES module rather than a typed package; future growth may justify smaller domain modules or TypeScript, but no database rewrite is required.
- `creation_activity` is an intentionally lightweight event stream. New resource interactions must call `recordResourceUse`; other future event types need explicit instrumentation.
- KPI definitions such as completion rate and growth milestone require product-approved formulas before final dashboards are designed.
- Public portfolio images still require a trusted signed-URL delivery workflow; the Storage bucket must remain private.
