# Rebel Ranch Ministries — Shared Site Design System

**Purpose:** Define shared public-page and UX construction principles for Rebel Ranch Ministries without duplicating RRM brand rules or program-specific brand/workflow rules.

This document answers **how a public experience should be structured and used**. It does not define the detailed brand identity of RRM or any program.

## Authority and routing

Read this together with:

- `AGENTS.md` — repository-wide AI/operator control and verification;
- `docs/rebel-ranch-ecosystem-charter.md` — organization identity, program relationships, mission, and permanent boundaries;
- `docs/digital-experience-first.md` — shared digital-experience architecture;
- `docs/brand-guide.md` — RRM organization brand only;
- `docs/rrm-visual-rules.md` — current RRM public-surface visual implementation;
- the applicable program-specific brand, visual, workflow, and operating documents for program surfaces.

**Every RRM program has its own brand.** This shared design system must not be used to erase or replace a program's approved brand. If a program-specific rule conflicts with a shared design pattern and the intended treatment is not already documented, stop and route the conflict to the owner.

Organization identity, program relationships, mission, and permanent boundaries come from the Ecosystem Charter. Current availability, rollout status, pricing, live destinations, feature status, and other changing operational facts come from the applicable program, system, or project controls. Do not duplicate those changing facts here.

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

Digital-first design governs digital delivery. It must not be interpreted as requiring RRM or its programs to replace valuable human, community, mentorship, real-world, agricultural, service, or future hands-on experiences with digital substitutes.

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

## 10. Visual acceptance, concept fidelity, and drift recovery

This section is mandatory for every public-page visual, layout, responsive-design, concept, and image-generation task. Read it before proposing, generating, implementing, reviewing, or approving visual work. Apply it together with the applicable program brand or visual authority and page decision record.

### 10.1 Maintain cumulative approval state

Visual direction is cumulative. A later task does not erase an earlier owner approval, rejection, correction, exclusion, or warning.

The applicable page decision record must identify important section visuals, wording, and layout treatments using these states:

- `PROPOSED` — may be discussed or previewed but not implemented;
- `APPROVED` — owner-approved for the stated use, but not proof of implementation;
- `REJECTED` — must not be reused, retained, or treated as a fallback;
- `SUPERSEDED` — replaced by a newer approved direction;
- `INTEGRATED` — placed in the current working implementation, but not proof of visual quality;
- `VERIFIED` — inspected in the actual rendered experience and confirmed against the approved reference and purpose.

For each important visual or visual section, record enough information to prevent substitution or drift: section purpose, intended two-second takeaway, exact asset or reference, status, approval or rejection date, required wording when applicable, mobile and desktop role, and any prohibited or previously rejected treatment.

If an asset or treatment is rejected, remove it from the active implementation during the authorized correction. Do not leave it in place merely because the replacement is not yet selected; instead, report the section as blocked or pending.

### 10.2 Define the visual job before generation or layout

Before selecting, generating, or placing a visual, state:

1. what the visitor should understand within about two seconds;
2. how that understanding supports the section's distinct job and the page's user or sales journey;
3. what the visual must show to communicate that meaning;
4. where live text and controls will sit;
5. what must remain visible in phone and desktop crops; and
6. which approved constraints and rejected patterns must be carried forward.

If the visual does not materially help the visitor understand the subject, process, choice, proof, result, or next action, do not use it merely to fill space.

### 10.3 Image-generation gate

Before asking an image generator to create or revise a public-page visual, verify the applicable brand inputs, page decision record, approved reference, and current rejection list. The prompt must include the section purpose, customer story or action, intended aspect ratio and rendered placement, required focal point, live-text region, crop-safe area, elements that must remain visible, and prohibited or previously rejected elements.

Official logos and exact interface wording must not be generated. Use the verified asset or live page text instead.

Inspect each generated candidate against the prompt before showing it to the owner. Do not knowingly pass along a candidate with an obvious mismatch, meaningless focal subject, wrong clothing or identity, fake or unreadable interface, malformed text, incorrect placement, or repeated rejected pattern. Correct or discard the failed candidate first.

### 10.4 Judge the rendered visual, not the source file

High source resolution is not proof that a visual works on the page. Inspect it at its actual rendered size and in context.

For every important visual, verify:

- the subject and intended meaning are understandable without zooming;
- the visual is large enough relative to its complexity and surrounding text;
- detailed diagrams and multi-stage stories receive more display space than simple photographs when needed;
- the image and text have a deliberate hierarchy rather than competing for attention;
- placement is optically balanced, not merely mathematically centered inside an undersized or misplaced container;
- faces, actions, products, signs, controls, and other meaning-carrying elements remain visible in the applicable crops;
- empty space is intentional and supports live content;
- overlays do not obscure the meaningful action; and
- repeated components are not forced into identical layouts when their information density or purpose differs.

### 10.5 Natural-language gate

Headings, labels, captions, and journey steps must sound like language the intended visitor would naturally understand. Test the wording by asking whether a real person would plausibly say it, search for it, or recognize it as their situation. Technically accurate but unnatural marketing language fails this gate and must be rewritten before approval.

### 10.6 Required technical and visual verification

Both verification types are required; neither substitutes for the other.

Technical checks include, as applicable: text and icon sizes, touch targets, contrast, image dimensions and aspect ratios, file and link resolution, selected and focus states, keyboard behavior, responsive overflow, runtime errors, and the actual destination of every action.

Visual judgment checks include: two-second comprehension, relevance, hierarchy, relative scale, optical alignment, balance, crop safety, subject visibility, brand fit, natural wording, and whether the actual page matches the approved concept.

For responsive public pages, inspect at least one real phone width at or below `456px` and one desktop width at or above `1180px`, plus any exact viewport shown in the approved reference. Review both the full page and close section crops. Compare the implementation side by side with the approved concept; matching section names or functionality is not proof of matching composition.

Do not call a visual implementation ready, aligned, verified, or complete until every required technical and visual check passes. Record failures honestly and correct them before publication.

### 10.7 Drift recovery

When the owner identifies drift, deviation, repeated rejected work, or rogue expansion, stop further visual generation and implementation. Re-read the repository control, this section, the applicable program authority, program brand or visual rules, and page decision record. Record the rejection, compare the current result with the approved source, list the specific mismatches, restate the authorized correction and exclusions, and then repeat this complete visual-acceptance gate.

Do not continue from memory, quietly reinterpret the concept, or preserve a rejected treatment as a temporary fallback.

## 11. Before release

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
