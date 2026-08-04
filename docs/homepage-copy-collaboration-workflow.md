# How we build homepage/marketing copy together

**Status:** Working notes, not a locked standard — update this as the process evolves.

This documents the process that produced the Creation Station, Marketplace, and Academy homepage cards (2026-08-04), so the same approach can be repeated by any agent working on marketing copy for this site.

## The cycle

1. **Research first, silently.** Before drafting anything, read: the Charter (`docs/rebel-ranch-ecosystem-charter.md`), the locked visual/linking rules (`docs/rrm-visual-rules.md`), the actual live pages a card would link to, and any copy already established elsewhere on the site for that program. Never draft blind — reuse real, already-approved language where it exists (e.g. reusing Marketplace's own live H1 as its homepage card headline, reusing the origin story's "Funds are fuel" line for the donation card).

2. **First draft: options, not a finished decision.** Headline options (usually two), plus short "real-talk" lines — never a paragraph, one idea per line — plus a proposed link/expand structure.

3. **Expect the owner to push back with the real version.** If a draft reads as "corporate sales voice" instead of "one real local person talking to another," the owner will say so and hand over raw, unpolished material — a real complaint, a specific number, a joke, an idiom. That raw material is consistently better than anything drafted cold. Ask for it directly if it doesn't come unprompted (worked well: "give me the raw version, the way you did with slime money and skibidi screen time").

4. **Condense, don't sanitize.** Keep the owner's exact images and phrasing wherever possible (specific numbers, idioms, jokes). Only smooth two things: profanity (family/church-facing audience), and anything that crosses an explicit Charter rule — flag that rule by name and quote it, then offer a rewrite that keeps the voice but not the liability (e.g. "recoup your money" → "help offset it"; "earn real income" → "built for opportunity" — the Charter explicitly bans promising income/profit/cost-recovery, but explicitly allows "potentially recover some costs," so there's usually a safe phrasing that keeps the punch).

5. **Card anatomy (the pattern that emerged as the standard):**
   - Headline: punchy — an "X to Y" formula, a blunt statement, or a direct question. Reuse an existing on-site tagline when one already fits.
   - 3-4 one-line "real-talk" chips, each carrying exactly one idea. If a line is trying to say two things, split it into two lines instead of writing a longer sentence.
   - Either an **expand** (`<details>/<summary>`, reusing the existing sitewide pattern from the Business Freedom service cards — do not invent a new interaction pattern) revealing 2-3 named paths with real links, when the topic has multiple real destinations — or a **single CTA link** when there's only one honest destination.
   - Match the CTA/expand richness to what's actually built. A program with no live page yet (Academy, at time of writing) gets a plain interest-form link, not a fake "paths" reveal — overpromising structure for something unbuilt undermines the same trust the Charter is protecting.

6. **Check against the Charter and locked rules out loud, before implementing.** Two failure modes to watch for specifically: (a) copy that promises income/profit/cost-recovery, and (b) links that violate the locked homepage-linking rule. If the owner's request conflicts with a locked rule, say so explicitly and ask whether to update the rule — don't silently break it, and don't silently refuse the request either.

7. **Nothing gets written to a file until the owner says "lock it."** Every card in this round went through at least one full review cycle in chat first. Draft → owner reacts/redirects → redraft → owner locks. Skipping straight to implementation on a first draft has not been how this works.

8. **Watch for structural catches, not just copy catches.** The owner caught two real information-architecture problems during this round that were not wording issues: the "Rebel Ranch Ministries" hub card being a category mismatch inside a "what we're building" grid, and Partnerships (unpaid help) getting a full card while Donations (actual funding) was buried as a subordinate line inside it. Both required restructuring, not rewriting — take those seriously as design feedback, not just tone feedback.

9. **Implement using only already-established CSS/classes/components.** No new one-off colors, gradients, or interaction patterns — reuse tokens and components already in the file (see `.card`, `.real-talk`, `.service-details` in `index.html`).

10. **Verify what's actually checkable, and say plainly when something isn't.** Confirm every new link target exists on disk before shipping it. If browser preview tooling isn't cooperating (it wasn't, consistently, against local `file://` pages this session), say so directly rather than claiming a visual check that didn't happen.

11. **Implementing the code and shipping it are two separate approvals.** Writing changes into the file is not the same as committing and pushing them — get an explicit go-ahead for each, even within the same session, per `AGENTS.md`.
