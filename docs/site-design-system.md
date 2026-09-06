# Rebel Ranch Ministries — Shared Site Design System

**Purpose:** Define shared public-page and UX construction principles for Rebel Ranch Ministries without duplicating RRM brand rules or program-specific brand/workflow rules.

This document answers **how a public experience should be structured and used**. It does not define the detailed brand identity of RRM or any program.

## Authority and routing

Read this together with:

- `AGENTS.md` — repository-wide AI/operator control and verification;
- `docs/rebel-ranch-ecosystem-charter.md` — current organization/program structure and status;
- `docs/digital-experience-first.md` — shared digital-experience architecture;
- `docs/brand-guide.md` — RRM organization brand only;
- `docs/rrm-visual-rules.md` — current RRM public-surface visual implementation;
- the applicable program-specific brand, visual, workflow, and operating documents for program surfaces.

**Every RRM program has its own brand.** This shared design system must not be used to erase or replace a program's approved brand. If a program-specific rule conflicts with a shared design pattern and the intended treatment is not already documented, stop and route the conflict to the owner.

Current program availability, rollout status, pricing, live destinations, and feature status must come from the Ecosystem Charter and applicable program records. Do not duplicate those changing facts here.

## 1. Page purpose

A public experience should answer four questions in a useful order:

1. What is this?
2. Who is it for and why does it matter?
3. What can the visitor actually do here now?
4. What is the clearest next step?

Every surface does not need every possible message. Lead with the visitor's immediate need and provide only the context necessary to understand and act.

## 2. Digital experience first

Follow `digital-experience-first.md`.

A page is not successful merely because it contains complete explanatory copy. Where the visitor can meaningfully choose, search, filter, learn, contribute, request, manage, contact, buy, sell, or otherwise act, the experience should support that job directly.

Interaction must have a real purpose. Decorative motion or extra controls do not satisfy this requirement.

## 3. Sections versus cards

**Sections are for stories, explanations, context, and invitations.**

Use sections for things such as:

- purpose or mission context;
- program explanation;
- current activity or proof;
- image/visual storytelling;
- supporting information;
- a closing invitation or action.

Do not automatically put ordinary copy into decorative boxes.

**Cards are for real choices or comparable items.**

Use cards when the visitor needs to compare/select among parallel options such as services, programs, products, plans, sessions, listings, or actions.

If removing the border/container would not make the information harder to understand or choose between, it probably does not need to be a card.

## 4. Page rhythm

Use a clear progression unless the user need requires something different:

1. clear opening purpose and primary action;
2. the main available content, tool, offer, or choice;
3. concise explanation/proof/context;
4. supporting paths or connected actions;
5. one clear closing next step.

Avoid several sections that repeat the same mission statement or CTA. Each major section should have one distinct job.

Exact RRM colors, spacing, card surfaces, dividers, button treatments, and visual tokens belong in `rrm-visual-rules.md` and `brand-guide.md`. Exact program-specific treatments belong in that program's brand/visual documentation.

## 5. Calls to action

- Make the primary action clear within the opening experience when an immediate action exists.
- Do not create competing primary actions without a real user need.
- Send the visitor directly to the known action rather than through unnecessary intermediary pages.
- Keep general contact available, but do not use it as the primary route when a more specific approved action exists.
- Do not repeat the same CTA merely to fill space.
- Never make a non-clickable element look like a clickable control.

### Pill rule

**Pill/capsule shapes are reserved for actual clickable controls only.**

Do not use pill styling for non-clickable badges, labels, tags, statuses, metrics, or decorative elements.

## 6. Brand boundaries

- RRM organization surfaces use the approved RRM brand and visual rules.
- Every RRM program has its own brand and must use its approved program-brand rules.
- A program may intentionally share RRM elements, but that relationship must be documented in the program brand.
- Do not silently default an undefined program brand to RRM.
- Do not mix program logos, colors, visual systems, offers, or identities simply because the programs are connected inside RRM.

## 7. Shared shell and common infrastructure

When a surface is governed by the shared RRM public shell, use the approved shared header/footer/navigation implementation rather than hand-authoring a duplicate shell.

Detailed shared-shell implementation belongs with shared system operations and applicable visual rules, not repeated here.

Authentication, accounts, database, email, deployment, analytics, security, and other genuinely shared infrastructure should be documented once at repository/shared-system level. Program documents should state only their program-specific behavior, roles, permissions, and user paths.

## 8. Content and voice

- Use plain, specific language.
- Explain technical terms when they are necessary.
- State what is actually available now before describing future direction.
- Do not present planned features as live.
- Use short headings and let body copy carry necessary detail.
- Remove repeated messaging rather than restating the same idea in several sections.
- Frame problems clearly without unsupported blame or guarantees.
- Program-specific voice and catchphrases must come from the applicable approved program brand/content standards.

## 9. Visuals and imagery

Use imagery when it helps a visitor understand the real subject, system, person, object, process, result, or choice.

Do not treat decorative graphics as a substitute for explanation or functionality.

Official organization/program logos and brand assets must be the exact verified approved assets. Do not redraw, recreate, approximate, or replace them with generated substitutes.

## 10. Before release

Before any public surface is called ready/live, verify the applicable user journey end to end.

Confirm, as applicable:

- the visitor can understand what the surface is for;
- the primary action is clear;
- every button/control works and goes to the intended approved destination;
- no non-clickable pill/capsule styling exists;
- no planned feature is presented as live;
- program brand and RRM brand boundaries are correct;
- the applicable shared shell and security boundaries are intact;
- desktop and mobile layouts are usable with no clipping or overflow;
- no placeholder, draft, test, or internal-only content is exposed;
- the actual released experience matches the reviewed candidate.

Do not call the work complete merely because files were changed or committed. Follow the repository-wide end-to-end verification requirement in `AGENTS.md`.