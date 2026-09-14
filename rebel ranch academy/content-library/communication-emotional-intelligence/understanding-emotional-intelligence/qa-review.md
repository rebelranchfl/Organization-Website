# QA Review — RRA-2026-0011: What Is Emotional Intelligence?

Checked against ACADEMY-CONTENT-PRODUCTION-WORKFLOW.md Section 20 (pre-owner-review QA gate for content/concept/pricing, prior to any Visual Production work). This is **not** the Rendered Product QA Standard — that standard governs interactive, multi-page learner products (like RRA-2026-0001) after Visual Production; this project has not reached Visual Production yet and is a simpler single-page lesson + activity, so that standard does not apply at this gate.

## Context
- [x] Required governing documents were reviewed (see context-review.md).
- [x] Correct learning area and program boundaries preserved (Communication and Emotional Intelligence; not merged into another RRM program).
- [ ] **NOT VERIFIED — flagged, not hidden:** Current live RRM/Academy websites could not be reviewed this session (network egress blocked in this sandbox). GitHub-main Program Hub README/source was reviewed as the documented fallback. Recommend re-confirming against the live site before this project is treated as fully context-verified, since the deployed hub could in principle have drifted from GitHub main.

## Evidence
- [x] Significant factual claims are sourced (10 sources, full table in sources.md).
- [x] Primary/direct sources used where practical (6 of 10; the founding definition, the four-branch model, the critique, and the meta-analysis are all primary).
- [x] Important claims corroborated where practical (core definition corroborated by 3 independent sources; the "does it matter" question deliberately shows disagreement rather than false consensus).
- [x] Conflicting evidence documented, not hidden (Goleman's popularization vs. Locke's critique vs. Joseph & Newman's mixed meta-analytic finding — all three are in the lesson itself, not buried).
- [ ] **NOT VERIFIED:** Links were not live-clicked in this session (no browser QA pass performed). Every link was returned directly by a search tool at the time of research and should resolve, but "the search tool returned it" is not the same as "a human or automated link-checker clicked it just now." Recommend a link-check pass before or during Owner Review.
- [x] Sources actually support the claims attributed to them (verified against the summarized content returned for each search, not merely cited by title).
- [x] Historical belief is not mislabeled as fact — Thorndike/Gardner are explicitly labeled "documented historical account, not independently verified against primary text this session" in both sources.md and research.md.
- [x] Institutional authority is not substituted for evidence — the APA Dictionary entry is used as corroboration, not as the sole basis for the claim.

## Teaching
- [x] Explains why, not only what (four abilities explained with mechanism, not just a list).
- [x] Real examples included (traffic, coworker, grocery-store meltdown, hard conversations).
- [x] Practical application exists (reappraisal technique + full activity).
- [x] Learner does/decides/practices/compares (the activity requires writing a real reframe and testing it; the close-out requires picking a real upcoming moment).
- [x] REBEL RANCH PRINCIPLE included, with an explicit "where this stops being a fair comparison" limitation, not just positive analogies.
- [x] Analogies identify their limits (see above).

## Voice
- [x] Reads as plain-spoken and direct rather than generic AI listicle prose — reviewed by re-reading the full master-content.md against the "should not sound like" list in the workflow standard (no motivational filler, no institutional tone, no manufactured urgency).
- [ ] **Not owner-verified:** Voice match is this agent's best-effort judgment against the written standard. The owner is the actual authority on whether this "sounds like RRA" — this is explicitly called out as an owner-review item, not something QA can self-certify.

## Product
- [x] Delivery format (screen-first illustrated guide, short/introductory) fits the subject and is justified in concept.md.
- [ ] **Visual needs identified, not yet produced.** Two diagrams are specified in concept.md (four-abilities diagram; reappraisal-vs-suppression comparison). No image files exist yet — that is Visual Production's job, which has not been authorized to start. This project is **not** claiming visuals are done; it is claiming the brief for them is ready.
- [x] Material useful on its own without the (not-yet-built) visuals — every visual is explanatory support for text that already stands on its own.
- [x] Pricing has written rationale (pricing.md).
- [x] Final package stored together in the project folder.

## Safety and boundaries
- [x] A proportional, single, plain-language boundary note is present ("What this is not") rather than a wall of disclaimers.
- [x] No promised outcomes, credentials, or regulated-service claims.
- [x] No minor-privacy issue — no data collection, no account requirement.

## Blockers / open items carried into project.json
1. Live-site review incomplete (environment network restriction).
2. Link-check pass not performed (sources returned by search tools, not individually re-fetched and confirmed in this session).
3. Thorndike (1920) and Gardner (1983) citations rest on corroborated secondary summaries, not independently opened primary texts.
4. Voice/tone match is agent self-assessment, pending real owner judgment.
5. Visuals are specified, not produced — Visual Production has not been authorized or started.

None of these block **presenting the project for Owner Review at this gate** — the workflow's actual QA gate (Section 20) is about the content/evidence/pricing package being ready for the owner to look at, not about the product being flawless. They are recorded honestly so nothing here is mistaken for "verified" that isn't.

## Overall QA status: PASS (for this gate), with the five items above carried forward as open, not resolved.

## Revision note — 2026-09-14, owner review of rendered Visual Production preview

The owner reviewed the actual rendered `eq-lesson-preview.html` (not just this markdown record) and requested changes now in progress:
- The "Try It" activity (line 24 above, "the activity requires writing a real reframe") is being **replaced**: the owner rejected free-text paragraph writing as impractical for this audience ("nobody is looking to write in paragraph form... this is unacceptable for any material"). The new design is a matching exercise (ability → definition) plus a scenario checkbox exercise (reappraisal vs. suppression identification). Line 24's original QA pass is preserved above as the historical record of what was reviewed at the time; it no longer describes the current activity.
- "TRANSFER THE PRINCIPLE" (line 25 above) was renamed to "REBEL RANCH PRINCIPLE" — a doctrine-wide rename (ACADEMY-CONTENT-PRODUCTION-WORKFLOW.md Section 7), not a content change.
- New content added since this QA pass: an IQ-vs-EQ comparison section (with a new source, #11 in sources.md, evidence standard applied identically to the other 10), and a quick multiple-choice quiz.
- This QA record has not been re-run end-to-end against the new content; treat the additions above as pending their own QA pass before Final Product Review, same standard as everything else in this file.

## Revision note — 2026-09-14, second owner review pass (after the first rebuild above)

The owner reviewed the rebuilt preview again and found a real functional bug plus further content/UX issues:
- **Real bug, fixed:** `academy_learner_progress` had RLS policies but no base table GRANTs to the `authenticated` role, so every save attempt failed with "permission denied for table academy_learner_progress." Fixed via migration `20260914180000_academy_learner_progress_grants.sql`, applied live and verified against `information_schema.role_table_grants`.
- Per-section glossary boxes (added in the first rebuild) were **removed** — owner clarified "glossary" meant one consolidated list at the end of the lesson, not a box on every page.
- The combined "Before you go" section (disclaimer + forward-commitment prompt + sources) was split into three clean sections: "One Thing To Try" (the CREATE-step prompt), "Glossary" (consolidated), and "References" (renamed from "Sources").
- The "What this is not" clinical disclaimer was **removed** per owner's explicit instruction — flagged as a broader doctrine question in `rebel ranch academy/systems/automation/safety-boundary-calibration-flag.md`, not resolved for other projects.
- Footnotes #4, #7, #8, #11 previously had no direct link at all; real URLs were located via search (WebFetch itself remained blocked) and added, with each source's verification status stated honestly (link found via search vs. content independently verified are not the same thing, and the References section says which applies to each).
- The REBEL RANCH PRINCIPLE section was substantially rewritten: opens with a plain explanation of what the name means (also added as a standing requirement in ACADEMY-CONTENT-PRODUCTION-WORKFLOW.md Section 7), replaced "signal" with "emotion" throughout, and each bullet now explains its actual mechanism instead of asserting an outcome.
- The Match & Check activity gained explicit usage instructions and a large, prominent success banner (the previous "All four matched" text was easy to miss).
- All of the above was verified with a fresh Playwright pass against the rendered page (TOC section count and order, matching completion, footnote link content, quiz intro copy) before this note was written.

## Revision note — 2026-09-14, third owner review pass (real bugs and two repeat defects)

- **Real functional bug, fixed:** the "permission denied" migration fix above (line 66) held; separately, `min-height:100vh` on the app's flex column meant every short page still forced blank space to appear — just relocated to *after* the nav instead of before it, across at least three pages. Root-caused and removed entirely; verified programmatically across all 13 sections (nav bottom edge now equals total page height on every one, not just a sampled few) rather than by eyeballing screenshots, per the new `interactive-lesson-visual-qa-checklist.md`.
- **Repeat defect, now actually fixed:** the "core" section had both an icon row and the four-abilities diagram showing the same four items — flagged once already in an earlier round and not fixed in the previous rebuild. The icon row is removed; the diagram is the section's only graphic.
- The REBEL RANCH PRINCIPLE section was rewritten again: shortened to uniform one-line bullets, replaced an invented and factually poor ER-team/air-traffic-controller example with the owner's own correct reasoning (people require handling; you never know what someone's dealing with; this is the basis of bedside manner and being the first line of conflict resolution before HR).
- "One Thing To Try" no longer tells the learner to write something down outside the platform — it's now a real saved input (a short text field plus a bottle-it-up/reappraise-it choice) tied to their account.
- The footnote/source verification-tier language was inconsistent across entries; replaced with exactly two labels ("Content confirmed" / "Existence confirmed only") applied identically everywhere a source appears, documented as a standing policy in `sources.md`.
- Added an always-visible inline table of contents on the first page, in addition to the header button/modal, since the owner did not consider the button-triggered version sufficient.
- The "What this is not" disclaimer removal from the previous pass is now owner-confirmed explicitly, not just instructed in the moment — she does not want disclaimers "all over" Academy content generally; the broader doctrine question remains flagged in `safety-boundary-calibration-flag.md` for a deliberate future pass, not applied unilaterally beyond this project.

AI-Agent: Claude (Claude Code)
Session: RRA pipeline reactivation verification, owner-directed, 2026-09-14
