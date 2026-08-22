# Social Content Hub V1 — Change Description

Date: 2026-08-22

AI-Agent: ChatGPT/GPT-5.6 Sol
Session: Rebel Ranch Marketplace — Social Content Hub

## Owner-approved scope

Build the Rebel Ranch Ministries Social Content Hub as an administrator-only back-office tool available from My Account.

Planned repository changes:

- add a Social Content Hub admin card through the existing `assets/js/public-shell.js` injection pattern;
- add a protected `social-content-hub.html` page that independently checks Supabase session + `user_roles` for `admin`;
- add a Supabase migration defining the V1 social-content tables and administrator-only RLS policies, without applying it to production;
- add SQL access-control tests covering anonymous, authenticated non-admin, and admin behavior;
- seed the current 14 Rebel Ranch Local launch records in the migration so the dashboard is useful immediately after a future approved deployment;
- preserve all Academy, Marketplace seller, Store Manager, Operations Review, public navigation, payment, and unrelated program behavior.

## Explicit production boundary

The owner approved GitHub branch commits only. This work must NOT apply the migration to live Supabase, merge to `main`, deploy the website, or alter live permissions/data without a separate approval.
