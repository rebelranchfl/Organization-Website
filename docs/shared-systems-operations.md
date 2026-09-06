# Rebel Ranch Ministries — Shared Systems Operations

**Status:** Repository-level shared-system operating reference  
**Applies to:** Infrastructure used by more than one RRM program or public surface.  
**Governing control:** `/AGENTS.md`

## Purpose

This document is the shared infrastructure "Bible" for systems used across multiple Rebel Ranch Ministries programs and public surfaces.

It does **not** define program-specific business rules, brand rules, course workflows, seller workflows, creator workflows, or program-specific permissions. Those belong inside the applicable program ecosystem and should reference this document where they depend on shared infrastructure.

If a shared-system fact conflicts with a program document, code, deployment record, or older handoff, stop and bring the specific conflict to the owner. Do not guess.

## 1. Shared-system boundary

A system belongs here when more than one RRM program or repository surface depends on the same underlying infrastructure.

Current shared-system areas include:

- Supabase browser client and production backend foundation;
- authentication and account access;
- shared account/role infrastructure;
- shared email delivery;
- shared public header/footer/navigation shell;
- common security and permission boundaries;
- shared deployment/infrastructure facts that are truly repository-wide;
- other common services adopted across multiple programs.

Program-specific tables, workflows, notifications, dashboards, automations, and deployments remain with the program unless they later become genuinely shared infrastructure.

## 2. Supabase foundation

### Verified current browser client

The repository has one shared browser Supabase client at:

`assets/js/supabase-client.js`

Verified current configuration:

- production project URL: `https://dfrwxpuojeiykaignyny.supabase.co`;
- publishable browser key is stored in the shared browser client as a publishable key;
- the client uses a bounded browser authentication lock to avoid stale browser-lock hangs;
- owner/program surfaces load their own focused scripts on top of the shared client rather than each creating an independent Supabase client.

The shared browser client is infrastructure. Program-specific data access belongs in program-specific services/scripts and database policies.

### Database source of truth

Repository database changes live under:

- `supabase/migrations/`
- `supabase/functions/`
- `supabase/tests/`
- `supabase/config.toml`

A migration file existing in GitHub does **not** by itself prove the migration is live in production. Production state must be verified against the actual Supabase project before a live-status claim.

Likewise, a direct production migration does not prove the matching repository history is aligned. Both repository and production state must be checked where exact synchronization matters.

## 3. Authentication and accounts

### Shared account entry point

The repository contains a shared RRM account surface at:

`account.html`

It is used as a common account/sign-in entry point for RRM program access rather than requiring every program to create an unrelated authentication system.

Related shared account/auth surfaces include:

- `auth-confirm.html`
- `reset-password.html`
- `membership-status.html`

Program-specific dashboards may use the same authenticated account but must enforce their own program permissions and access rules.

### Authorization rule

UI visibility is never the security boundary.

Hiding a link/card/control based on a browser-visible role does not prove authorization. Protected data/actions must also be enforced by the applicable database Row Level Security (RLS), RPC/function permission checks, storage policies, or other server-side controls.

Administrator-only pages must independently verify authentication/authorization even if the account dashboard only shows their links to administrators.

### Shared roles vs program permissions

Shared account roles may be used to identify broad access such as administrator status, but program-specific authority belongs to that program's access model.

Do not infer that one shared role automatically grants every program action unless the applicable database policy/program standard explicitly says so.

## 4. Shared email delivery

The shared authentication email system is documented in:

`docs/email-delivery-setup.md`

Verified recorded architecture:

- Supabase Auth uses custom SMTP;
- SMTP provider: Resend;
- SMTP host: `smtp.resend.com`;
- SMTP port: `465`;
- sender: `Rebel Ranch Ministries <noreply@rebelranchministries.org>`;
- the domain was recorded as verified in Resend;
- a password-reset email was previously verified end to end after the custom SMTP setup.

That historical successful test proves the configuration worked at that verification point. It does not prove future email delivery without a current test when the exact current state matters.

Program-specific transactional email behavior belongs with the relevant program. Example: Marketplace seller-order notification logic belongs in the Marketplace documentation and should reference the shared email/Resend infrastructure rather than redefine the shared auth SMTP system.

Secrets must not be committed to the repository. Protected server-side keys belong in the appropriate protected environment/secret store.

## 5. Shared public shell and navigation

The current shared RRM public header/footer/navigation implementation is:

`assets/js/public-shell.js`

with shared styling in:

`assets/css/public-surface.css`

Verified current behavior in `public-shell.js` includes:

- shared RRM header and footer injection;
- RRM organization logo from `assets/brand/Rebel Ranch Ministries/rrm-logo-white.png`;
- common RRM navigation routes;
- Programs routing to current program destinations;
- My Account routing to `account.html`;
- common footer legal/social links;
- administrator account-dashboard convenience links for Operations Review, Store Manager, and Social Content Hub.

The administrator link injection is a convenience only. Each destination must still enforce its own authorization.

Program sites/subdomains with their own approved shell/brand do not automatically inherit the RRM shell. Program documentation controls that decision.

## 6. Security and permissions

Repository-wide security principles:

- preserve RLS and server-side authorization;
- do not expose service-role/server secrets in browser code;
- do not weaken private storage controls for presentation convenience;
- do not treat hidden UI as access control;
- do not assume authenticated means authorized;
- verify role/ownership/household/program boundaries in the actual database policy or trusted server function;
- protect minors' records and parent/guardian control according to the applicable program rules;
- do not move private user data into public storage merely to simplify delivery.

Program-specific security requirements remain in the program's own operating documents and schema/policies.

## 7. Deployment, hosting, and domain routing

These are separate jobs and must not be treated as the same thing:

- **GitHub repository:** where RRM keeps the master website/application code and files.
- **Cloudflare DNS:** controls where each RRM web address points.
- **Hosting / serving:** the service that actually answers a visitor's request and sends the website/application to the visitor.

A Cloudflare-managed domain can still point directly to another host. Cloudflare controlling DNS does not automatically mean Cloudflare is serving every website.

### Verified current RRM domain routing — 2026-09-06

The owner reviewed the active Cloudflare DNS records for `rebelranchministries.org`.

Verified current routing:

- root `rebelranchministries.org` has A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153` and is set to **DNS only**;
- `www.rebelranchministries.org` is a CNAME to `rebelranchfl.github.io` and is set to **DNS only**;
- `academy.rebelranchministries.org` is routed to the Cloudflare Worker `rebel-ranch-academy` and is proxied through Cloudflare;
- `shop.rebelranchministries.org` is a CNAME to Printify's custom-domain target.

Plain-language current architecture:

```text
Cloudflare controls the RRM domain directions
│
├── rebelranchministries.org / www
│   └── GitHub Pages serves the main RRM website
│
├── academy.rebelranchministries.org
│   └── Cloudflare Worker serves the RRA application
│
└── shop.rebelranchministries.org
    └── Printify serves the shop
```

### Main RRM website — verified current publishing route

The main RRM website files are maintained in GitHub and are currently served through **GitHub Pages**. Cloudflare manages the domain/DNS directions but the root and `www` records send visitors directly to GitHub Pages.

The historical GitHub Pages deployment record in `docs/github-pages-deploy-outage-2026-08-06.md` is therefore still relevant as history for the same publishing route, but it remains an incident record rather than the primary current operating instruction.

### Rebel Ranch Academy — verified current publishing route

The repository contains:

`.github/workflows/deploy-rebel-ranch-academy.yml`

That workflow currently:

- builds/tests the Academy Program Hub;
- uses Cloudflare Wrangler;
- deploys pull-request previews to a separate Academy preview worker;
- deploys non-PR runs to `academy.rebelranchministries.org` using the `rebel-ranch-academy` Cloudflare deployment target;
- uses protected `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` GitHub secrets.

Plain-language RRA path:

```text
RRA source/code in GitHub
        ↓
GitHub automation builds it
        ↓
Cloudflare Worker receives it
        ↓
academy.rebelranchministries.org
```

GitHub remains the master source for the RRA code. The Worker is the service that runs/serves the Academy application.

### Future architecture direction — owner-approved direction, not a current migration project

The owner wants RRM to move toward more useful automation and interactive systems rather than manually managing processes that can be automated.

As each RRM program matures, evaluate whether moving that program from simple static-page hosting toward a Cloudflare Worker/application model would provide a real benefit, such as:

- making decisions based on a request or user state;
- routing people or requests automatically;
- checking conditions before taking an action;
- communicating with Supabase or other approved systems;
- running program logic;
- supporting personalized or interactive experiences;
- reducing repeated manual work;
- supporting reliable automation behind the program.

**Direction:** keep GitHub as the master code/source repository. Evaluate Worker/application delivery **program by program** where it enables useful automation, logic, integration, or interactivity.

This direction does **not** authorize a blanket migration of the main RRM site or every program today. Do not create a large conversion project merely for technical consistency. A program should move when there is a defined functional reason, approved scope, and verified migration plan.

Long-term alignment means the programs should move toward a coherent application/automation architecture where that improves how RRM actually operates. It does not require every public page to use identical hosting technology.

## 8. Historical deployment incidents

`docs/github-pages-deploy-outage-2026-08-06.md` is a historical incident/lessons-learned record. Its recorded GitHub Pages route is consistent with the currently verified main-site route, but the document itself remains a historical incident record, not the complete deployment authority.

Historical incident records belong in archive/history during the physical repository reorganization after references are checked.

## 9. Program-specific systems discovered during shared-system review

The following material is **not** shared-system authority and should remain within its program ecosystem during later consolidation:

- `docs/phase-3-architecture.md` — Creation Station architecture, despite references to the shared Supabase client;
- Marketplace Gate 1/2 deployment plans, handoffs, reconciliation records, listing/directory handoffs, and notification handoffs — Marketplace implementation/history;
- RRA content-agent workflows, Academy deployment workflow, and Academy-specific automation — RRA implementation;
- program-specific storage buckets, RLS rules, notifications, seller/creator tables, and business workflows.

When such documents contain a genuinely shared fact, move/copy the shared fact into this document and have the program document reference it. Do not move program-specific logic into shared operations.

## 10. Verification rule for shared systems

Before changing a shared system:

1. verify every program/surface known to depend on it;
2. verify the exact current implementation and current production state;
3. identify program-specific assumptions that could break;
4. make the smallest authorized change;
5. test the shared function itself;
6. test the affected end-user paths in every materially affected program/surface;
7. do not call the change complete until those paths pass.

A shared-system change has a wider blast radius than a program-only change. Treat it accordingly.
