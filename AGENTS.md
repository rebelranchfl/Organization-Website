# Repository Working Rules

**Status:** Repository-wide controlling AI/operator entry point  
**Applies to:** Every task, every turnover, every agent, every program, every system, and every durable change in this repository.

This file governs **how work is performed**. Detailed organization, brand, website, program, and system rules live in their authoritative documents and are referenced from here rather than duplicated here.

## 1. Controlling authority

1. The owner's current explicit instruction controls.
2. This repository-wide control applies to all work unless the owner explicitly changes it.
3. More-specific program/system `AGENTS.md` files and owner-approved standards supplement this file; they do not silently override a conflicting owner directive.
4. If two documented rules conflict, **STOP**. Show the owner the specific conflict in plain language, obtain the owner's decision, update the appropriate authoritative document, and then continue.
5. Never resolve a conflict by guessing, choosing the easier rule, choosing the newest-looking file, or silently following an agent preference.

## 2. Mandatory verification — EVERY TASK / TURNOVER

**NOTHING HAPPENS UNLESS IT IS VERIFIED FIRST.**

At the start of every new task, turnover, or materially changed instruction:

1. Read this `AGENTS.md`.
2. Read `docs/rebel-ranch-ecosystem-charter.md`.
3. Identify the exact organization/program/system, brand, files, and requested outcome.
4. Check for a more-specific `AGENTS.md` in the target area and read it.
5. Read the authoritative documents for that exact area.
6. Read the complete target files and connected code/styles/configuration needed to understand the requested change.
7. Verify the current state before proposing or changing anything.
8. Record or surface any conflict, stale instruction, missing approval, or unverified assumption before action.

Do not rely on chat memory, prior summaries, filenames, assumptions, or an earlier turn when the exact current source can be verified.

## 3. Mandatory verification — IMMEDIATELY BEFORE EVERY CONSEQUENTIAL ACTION

Immediately before every consequential action — including a GitHub write, code change, document change, design generation, image generation, database change, deployment, publication, message, payment-related action, configuration change, or status claim — verify the exact prerequisites for that action.

Use this gate:

**VERIFY SOURCE → VERIFY ASSET / INPUT → VERIFY WORDING / REQUIREMENT → VERIFY AUTHORIZATION → ACT → VERIFY OUTPUT END TO END**

If any required item is not verified, **STOP**. Do not invent, substitute, approximate, infer, recreate, or work around the missing verification.

Examples:

- Brand visual requested → actual approved logo/brand asset must be located and available to the production tool before generation.
- Existing tagline/catchphrase requested → exact wording must be found in an approved source before use.
- New brand phrase → owner approval is required before production use.
- Website fix → code change is not proof; the exact affected user path must be verified end to end before calling it fixed.
- Deployment → commit/push is not proof of live behavior.
- Document move/rename → references and dependencies must be checked before the move.

## 4. No completion claim without end-to-end proof

Do not use **fixed**, **complete**, **implemented**, **live**, **ready**, **resolved**, or equivalent language unless the exact requested outcome has been verified end to end.

State separately:

- what was changed;
- what was verified;
- what remains unverified;
- what still requires owner action or approval.

## 5. Required source routing

Use the authoritative document for the subject instead of maintaining duplicate rules in this file.

### Organization / ecosystem

- `docs/rebel-ranch-ecosystem-charter.md` — organization/program structure, program relationships, current confirmed/open decisions.
- `docs/non-negotiables.md` — mission, vision, entity/legal/financial boundaries, and true organization-wide non-negotiables. During repository consolidation, overlapping content must be reconciled with the Charter rather than independently expanded.

### RRM organization brand

- `docs/brand-guide.md` — **RRM organization brand only**: approved RRM logo, brand identity, color/typography rules.
- `docs/rrm-visual-rules.md` — current approved RRM public-surface visual implementation.

**Brand architecture rule:** RRM is its own brand, and **every RRM program gets its own brand**. Do not silently default a program to the RRM brand. If a program's brand is not yet defined, treat it as not yet defined and route the decision to the owner.

### Shared website / digital experience

- `docs/digital-experience-first.md` — shared RRM digital-experience architecture.
- `docs/site-design-system.md` — shared page/UX construction principles. It must not be used as a substitute for a program's own brand/visual rules.

### Program work

Read the program-specific controls and standards for the target program. Program documents govern program-specific purpose, brand, workflow, audience, content, operations, and implementation while remaining subject to this repository control.

Examples include:

- Rebel Ranch Academy — use `/rebel ranch academy/AGENTS.md` and its governing RRA documents.
- Creation Station — use its positioning, brand/visual, workflow, and current operating documents.
- Rebel Ranch Local / Marketplace — use its RRL/Marketplace brand, visual, workflow, and operating documents.
- Business Freedom, Roots Boots & Animal Poops, Rebel Ranch Rescue, and future programs — use their program-specific authoritative documents as those ecosystems are consolidated.

### Shared infrastructure

Authentication, accounts, Supabase/database, email, deployment, shared shell/navigation, security/permissions, and other genuinely shared systems belong to repository/shared-system operations. Program documents should reference those shared systems and document only the program-specific behavior or permissions.

### Marketing — repository-wide vs program-specific

Marketing has **two connected levels** and they must not be mixed into one uncontrolled documentation pile.

**Repository-level Marketing** is the authoritative home for marketing systems and methods that apply across more than one RRM program, including shared marketing rules, common workflows, owner approval processes, publishing processes, shared analytics/reporting, cross-program campaign coordination, and reusable content-production methods.

**Program-level Marketing** belongs inside the applicable program ecosystem. It governs that program's specific audiences, campaigns, offers, messaging, assets, launch plans, program-specific calls to action, and execution.

Use this routing test:

- if the marketing rule/process applies across multiple programs → repository-level Marketing;
- if the marketing material only makes sense for one program → that program's Marketing area;
- if a program uses a shared marketing workflow → reference the repo-level workflow instead of copying it into the program;
- repository-level Marketing may coordinate programs but must not redefine or override a program's approved brand, audience decisions, offers, or program-specific marketing rules;
- when an existing marketing document contains both shared and program-specific material, read the actual content, preserve both, and separate the authoritative information during consolidation rather than choosing a home based on the filename or current folder.

Do not create anticipated marketing folders merely because this architecture permits them. Create/reorganize folders when actual content requires them and after references/dependencies are verified.

## 6. Documentation consolidation rule

Before creating a new documentation file:

1. Determine whether the information belongs in an existing repository-control, shared-system, program, workflow, or project document.
2. Update the existing authoritative document when appropriate.
3. Create a new document only when it represents a genuinely separate durable system, workflow, program area, project record, or historical archive that should not be folded into an existing source.

For repository cleanup:

- **duplicate + consistent** → consolidate into the proper authoritative document;
- **duplicate + useful extra detail** → preserve the useful detail in the proper authoritative document;
- **contradictory** → stop and obtain owner clarification one conflict at a time;
- **outdated/superseded** → remove from active authority only after references/dependencies are verified; preserve history in archive when needed.

Do not classify documents by title alone. Read the contents first.

## 7. Authorization and scope control

- Do not modify a file or system unless the owner has explicitly authorized the requested change/scope.
- Make the smallest change necessary to satisfy the request.
- If completing the request requires touching another file/system outside the authorized scope, stop and ask first.
- Do not install dependencies or change configuration without explicit permission.
- Do not delete, rename, move, deploy, publish, change permissions, make payments, or perform unrelated cleanup without explicit authorization.
- Preserve unrelated files, functionality, styling, content, configuration, data, and working state.
- Open decisions remain open until the owner decides them.

## 8. Recoverability and backup strategy

**Every change must be recoverable.**

Use Git and the right protection level instead of creating duplicate file backups before ordinary edits.

### Normal/small changes

- Git commit history is the recovery mechanism.
- Do not create a duplicate `.backups` copy merely because a tracked file is being edited.
- Keep commits clear enough that the prior state and the change can be identified and restored if needed.

### Multi-file, structural, risky, migration, deployment, or potentially destructive work

- Before making the risky change, create or verify a dedicated branch, checkpoint, or other clear Git recovery point appropriate to the work.
- Keep risky work isolated until it is reviewed and verified.
- Do not treat a branch as permission to skip authorization, testing, or end-to-end verification.

### Disaster recovery

- Periodically maintain a full repository backup outside this repository so loss of the GitHub repository itself does not remove the only copy.
- Disaster backup is separate from normal Git version history and separate from temporary working branches.
- Do not store the disaster backup inside the same repository it is intended to protect.

### Existing `.backups` material

- Existing `.backups` folders are historical material created under the prior workflow.
- Do not treat them as active sources of truth.
- Do not automatically delete them. Review them during repository cleanup, verify whether any unique information must be preserved, then archive/remove redundant material through an owner-authorized cleanup step.

## 9. Brand and asset control

- Use only the exact approved brand/logo asset for the organization/program being represented.
- Never recreate, approximate, substitute, or ask an image generator to invent an existing official logo.
- Locate and verify approved taglines, catchphrases, names, colors, typography, and imagery rules before use.
- New recurring brand language, taglines, slogans, marks, or identities require owner approval before production use.
- After generation/design, compare the output against the verified brand inputs. A visually altered/invented logo or unapproved brand phrase fails verification.

## 10. Website interaction rule — pills are clickable only

**No pill design or pill/capsule shape may appear on a web page unless the element is actually clickable.**

Do not use full-pill/capsule styling for non-clickable labels, tags, badges, statuses, metrics, informational chips, or decorative elements. This applies across RRM and every program unless the owner explicitly changes the rule.

## 11. Shared website safety

- Do not present planned features as live.
- Preserve authentication, approval, moderation, private storage, role restrictions, RLS, and parent/guardian controls.
- The visible UI is never the sole security boundary.
- Do not embed images as base64 data inside HTML or CSS; use linked repository assets.
- Use the applicable approved shared shell/navigation implementation for surfaces governed by that system.
- Follow the applicable RRM or program-specific visual rules; program brands are not automatically restyled to RRM.

## 12. Change attribution and traceability

Every durable AI-originated change must identify:

- the AI agent/tool; and
- the chat/session that produced the change.

For commit messages, use trailer lines such as:

`AI-Agent: ChatGPT/GPT-5.6 Sol`  
`Session: <chat/session title>`

For migrations or other durable implementation records, include equivalent attribution in the appropriate record.

## 13. Communication with the owner — plain language is mandatory

**Every AI agent must communicate with the owner as if the owner has no prior knowledge of the subject being discussed. This applies to every subject — technical or non-technical.**

- Use ordinary, direct language first.
- Do not assume knowledge of technology, coding, GitHub, databases, legal terms, finance, regulation, education systems, science, engineering, business operations, or any other specialized subject.
- If a specialized word, acronym, process, or system name is necessary, explain what it means immediately in plain words.
- Explain **what something means** before explaining what should be done about it.
- When possible, use a simple real-world example to show how the thing works or why it matters.
- Do not make the owner interpret raw code, diffs, logs, Git terminology, database output, regulatory wording, legal language, financial terminology, or system errors without first translating the practical meaning.
- Lead with what happened, what was verified, what it means for the owner, whether action is required, and the exact next step.
- Do not bury unresolved contradictions, assumptions, risks, or limitations.
- Plain language must still be accurate. Do not remove an important fact merely because it is complicated; explain the fact more clearly instead.

## 14. Final verification and reporting

After authorized work:

1. Verify only the requested scope, but verify it fully.
2. Review the final changed-file/system list.
3. Confirm unrelated work remained untouched.
4. Verify the exact requested outcome end to end when the required environment/tools permit it.
5. Report every changed file/system, checks performed, limitations, unresolved conflicts, remaining owner decisions, and the branch/checkpoint/recovery point when one was required for the work.

If end-to-end verification is impossible with the available access, say exactly what is verified and what is not. Do not upgrade partial evidence into a completion claim.