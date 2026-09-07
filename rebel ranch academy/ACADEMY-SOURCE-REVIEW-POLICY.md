# Rebel Ranch Academy — Source & Claim Review Policy

**Status:** Owner-approved working standard  
**Program:** Rebel Ranch Academy (RRA)  
**Purpose:** Define what it means for the Academy research system to verify a source/claim and how owner source controls work without turning every Academy project into a mandatory line-by-line source approval task.

---

## 1. Core rule

The Research Agent is responsible for mandatory source and claim vetting.

The owner is **not** required to manually approve every source before a project may move forward.

A source appearing in `sources.md` as usable means the agent has already evaluated the source for the exact claim being made. The owner source controls are an override/audit mechanism, not a substitute for agent research.

Permanent rule:

> **Agent source vetting is mandatory. Owner source-by-source review is optional. Owner overrides are binding.**

And:

> **A source existing is not proof. The source must actually support the claim attributed to it.**

---

## 2. Source review and claim verification are related but different

The system must answer two questions:

### Is this a usable source?

Evaluate, as applicable:

- identity/title/author or issuing body;
- source type;
- direct link or durable citation;
- publication/effective/event date;
- proximity to the original evidence, rule, event, mechanism, or data;
- transparency/method;
- relevance to the exact question;
- conflicts/incentives/limitations;
- currentness for the claim;
- whether a closer primary/direct source is reasonably available.

### Does it support this exact claim?

For every material claim, verify:

- the source actually says/shows enough to support the wording used;
- the claim is not broader or more certain than the source;
- conditions, population, location, timeframe, units, assumptions, exceptions, and scope are preserved when material;
- a historical belief is not converted into proof merely because it was documented;
- an institutional recommendation is not converted into universal fact;
- a correlation is not silently rewritten as causation;
- a laboratory/controlled result is not automatically generalized beyond its tested conditions;
- a product/manufacturer claim is identified as such when independent evidence is limited;
- a secondary source is not used as though it were the original study/law/data when the original is available and materially important.

---

## 3. Required source/claim record

At minimum, the durable research/source record should let a future reviewer determine:

- claim/topic;
- exact source;
- source type;
- link/citation;
- date/currentness;
- what the source supports;
- what it does **not** establish when that limitation matters;
- source proximity: primary/direct, near-primary, or secondary;
- corroborating evidence;
- conflicting evidence;
- whether corroborating sources are genuinely independent;
- material limitations/uncertainty;
- how/where the claim is used in the product;
- agent verification state;
- owner override state when one exists.

The goal is traceability from learner-facing claim → approved evidence, not a decorative bibliography.

---

## 4. Agent verification states

Use a clear research state for material claims/sources when useful:

- `VERIFIED_FOR_USE` — evidence supports the claim at the strength/scope stated;
- `VERIFIED_WITH_LIMITS` — usable only with explicit limitations/qualification;
- `BACKGROUND_ONLY` — useful context, not sufficient support for the final claim;
- `CONFLICT_REQUIRES_DISCLOSURE` — credible evidence differs and the disagreement must remain visible;
- `NEEDS_CORROBORATION` — promising but not strong enough for consequential use yet;
- `NEEDS_REPLACEMENT` — source is stale, weak, inaccessible, misapplied, or otherwise unsuitable;
- `DO_NOT_USE` — source/claim must not be relied upon;
- `UNRESOLVED_BLOCKER` — important claim cannot yet be supported responsibly.

Do not mark `VERIFIED_FOR_USE` simply because a URL resolves or multiple websites repeat the same statement.

---

## 5. Independence and corroboration rule

Three pages repeating one original press release, study, dataset, trade article, or institutional statement are not three independent confirmations.

When corroboration matters, determine whether sources are genuinely independent or merely copying/citing the same origin.

High-impact claims require stronger corroboration when practical, particularly claims involving:

- health or physical safety;
- drinking water;
- food preservation;
- animals;
- chemicals;
- electricity, fire, gas, tools, structures, machinery;
- legal/tax/regulatory obligations;
- financial/credit/money decisions;
- children/minors;
- significant cost/savings/performance promises.

When high-quality independent corroboration reasonably cannot be obtained, reduce the strength of the claim or preserve the uncertainty rather than manufacturing confidence.

---

## 6. Currentness / stale-information gate

For time-sensitive claims, the agent must verify the date/version/effective period.

Examples include:

- laws/regulations;
- tax rules;
- scholarship/reimbursement rules;
- product/API/platform behavior;
- prices/market comparables;
- safety standards;
- scientific guidance that materially changes;
- current program policies;
- availability/status of external services.

An older source may still be useful historically, but it cannot silently support a current-state claim when the underlying rule/system may have changed.

For consequential current claims, record when the source was checked and what version/date controls.

---

## 7. Conflict search — do not research only for confirmation

For substantive claims, especially surprising, disputed, high-impact, or central claims, the Research Agent must actively look for evidence that could:

- contradict the claim;
- narrow it;
- reveal an exception;
- show a failed replication;
- identify a safety limitation;
- show that the result depends on conditions not present in the Academy claim;
- reveal a better/closer primary source.

The goal is not to “debunk” the owner's idea. The goal is to discover whether the idea survives serious evidence review.

Do not stop research as soon as the first source agrees with the desired conclusion.

---

## 8. Default owner source status

Unless the owner changes it, a source may remain owner-status `Pending` while the project moves forward, provided:

- the Research Agent completed the required source/claim audit;
- the material claim is in an allowable agent verification state;
- Research QA has no unresolved blocking evidence issue;
- the owner has not overridden the source.

`Pending` means:

- the owner has not personally overridden the agent's decision;
- it does **not** mean the agent failed to review the source;
- it does not block research/product work by itself.

This avoids shifting the entire research job back onto the owner.

---

## 9. Owner controls

The owner may at any time mark a source:

- `Approved` — owner explicitly accepts it;
- `Do Not Use` — remove it from future product use and reopen dependent claims when necessary;
- `Needs Replacement` — find a suitable replacement or revise/remove the dependent claim;
- `Pending` — no owner override; agent-vetted source remains usable according to its agent verification state.

The owner may also comment on:

- source quality;
- claim wording;
- framing;
- conflict;
- methodology;
- date/currentness;
- relevance;
- missing evidence.

Owner overrides are binding unless the owner later changes them.

---

## 10. Blocking source/claim situations

A real evidence blocker exists when, for example:

- an important claim cannot be verified strongly enough for the proposed use;
- credible evidence materially conflicts and the product cannot responsibly proceed without resolving/qualifying the issue;
- a source is inaccessible/unverifiable and no adequate replacement/corroboration exists;
- a source is materially stale for a current claim;
- the owner marks a necessary source `Do Not Use` or `Needs Replacement` and the dependent claim has no adequate alternative support;
- a high-impact claim lacks required corroboration;
- the claim would materially overstate what the evidence establishes;
- a calculation/result cannot be reproduced or its inputs cannot be verified.

When blocked, record:

- exact affected claim;
- failed verification state;
- why it matters;
- what evidence/decision is needed;
- what downstream work must stop.

Do not allow Product Design/Visual Production to build expensive downstream assets around an unresolved blocking claim.

---

## 11. Research QA / adversarial check

Before Owner Research Review, Research QA should test the strongest/most consequential conclusions rather than merely checking formatting.

Where applicable, ask:

- What are the central claims this product depends on?
- What evidence would prove these claims wrong or narrower?
- Did we find/search for that evidence?
- Are citations direct enough?
- Are sources independent?
- Are dates/current versions correct?
- Did we preserve material uncertainty/conflict?
- Can important calculations be reproduced?
- Are we teaching a method beyond the conditions the evidence actually supports?
- Did we accidentally convert an inference into a fact?
- Did we accidentally under-teach evidence-backed knowledge because learner-specific data is unknown?

A Research QA `PASS` should mean the evidence package survived these checks—not that every source agreed.

---

## 12. Owner Research Approval

Owner Research Approval means the owner accepts the research foundation as a body of work for the next stage.

It does not mean the owner personally verified every citation.

The owner may approve a research foundation while many individual source rows remain owner-status `Pending` if the agent verification and Research QA requirements pass.

That approval relies on:

- completed agent source/claim audit;
- Research QA;
- visible conflicts/limitations;
- no unresolved blocker;
- the owner's ability to inspect/override a source when desired.

Research Approval still does not approve Product Design, Final Product, or Release.

---

## 13. Product-design handoff behavior

Product Design may begin only when the Product Phase Workflow activation gate passes.

The handoff should preserve the source/evidence state, including:

- approved research revision;
- claim/source limitations that must remain visible;
- owner overrides;
- unresolved nonblocking uncertainty;
- source set state such as `Agent-vetted; owner overrides applied where present.`

Product Design may not strengthen a qualified claim merely because stronger wording improves the offer.

---

## 14. Dashboard behavior

The dashboard should show source controls without implying every source requires owner action.

Recommended explanation:

> Sources have already been reviewed by the research agent. These controls are optional. Use them if you want to approve, exclude, replace, or question a specific source.

A count such as `24 Pending` must not appear as `24 items waiting on you` unless a genuine owner decision is required.

The owner-facing view should prioritize:

- blocking evidence problems;
- meaningful conflicts;
- high-impact claims;
- material limitations;
- sources the owner specifically changed/questioned.

---

## 15. Continuous-improvement relationship

A source/claim failure should feed the Academy Continuous Improvement & Learning Loop when it reveals a reusable lesson, such as:

- recurring stale-source problem;
- repeated misuse of a source type;
- repeated overgeneralization;
- a query/research method that consistently misses strong contrary evidence;
- a primary-source route that materially improves verification;
- a claim category that consistently needs a stronger check.

Do not create a new rule from one isolated source mistake unless the evidence justifies it.

---

## 16. Superseding rule

This policy supersedes older Academy language that can reasonably be read to require the owner to manually approve every source before Research Approval, Product Design, Visual Production, or Release.

The permanent standard remains:

> **Agent source and claim vetting is mandatory. Owner source-by-source review is optional. Owner overrides are binding.**

The owner remains the final human decision-maker at the defined owner gates, but the system is responsible for doing the research/verification work before placing that decision in front of the owner.
