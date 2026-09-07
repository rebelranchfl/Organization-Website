# Rebel Ranch Academy — Release Workflow Standard

**Status:** Owner-approved governing standard  
**Date:** 2026-09-07  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** Repository documentation consolidation

## Purpose

Final Product Approval and Release Authorization are separate owner decisions.

A product may be fully approved as a finished Academy product and still remain private, unreleased, unsold, unpublished, or held for later timing.

Governing rule:

> **Approval means the product is accepted. Release means the owner has separately authorized it to become available.**

No Academy agent may treat Final Product Approval as permission to publish, deploy, sell, price publicly, email, advertise, or otherwise release a product.

Release is also not the end of the Academy lifecycle. After a verified release, the Academy may learn from legitimate learner, product, marketing, technical, and owner feedback under `/rebel ranch academy/docs/intelligence/ACADEMY-CONTINUOUS-IMPROVEMENT-LOOP.md`.

## Lifecycle

```text
FINAL PRODUCT REVIEW
→ FINAL PRODUCT APPROVED
→ RELEASE PREP
→ OWNER RELEASE DECISION
→ APPROVED TO PUBLISH
→ PUBLISH / DEPLOY
→ VERIFY LIVE
→ RECORD VERSION + URL + VERIFICATION EVIDENCE
→ LIVE
→ OBSERVE LEGITIMATE RESULTS
→ LEARN / IMPROVE FUTURE AUTHORIZED WORK
```

The owner manages decisions. The system manages work.

## 1. Final Product Approval

The Final Product Review approval control must be labeled **Approve Final Product** or equivalent language that clearly means product acceptance, not public release.

After approval:

- the product is considered accepted for the approved revision;
- the approved product/revision is preserved;
- the project is not yet LIVE;
- nothing is published automatically;
- Release Prep may begin.

## 2. Release Prep

Release Prep creates a durable release record for the approved product revision.

At minimum record:

- project ID;
- Academy revision number;
- release/version label;
- intended destination or delivery surface;
- intended access model where already owner-approved;
- approved pricing/access state when applicable;
- release notes;
- release-prep checklist;
- owner release decision and note;
- publication timestamp when applicable;
- live URL or delivery location;
- verification timestamp;
- verification evidence/summary;
- final release status.

Release Prep should verify only the release package. It must not reopen approved product content without routing the issue back through the appropriate lifecycle stage.

## 3. Release Prep Checklist

Use applicable items such as:

- approved product revision identified;
- final learner-facing experience matches the approved product;
- title/subtitle/copy are final;
- access/pricing state matches the owner's approved decision;
- delivery assets are present;
- links and navigation work;
- mobile/print behavior is acceptable where relevant;
- privacy/analytics disclosure is present where data collection requires it;
- destination/domain/path is confirmed;
- version label is recorded;
- no test/draft-only material is accidentally included;
- rollback/recovery path is understood for a release that fails verification.

A checklist item is a release-control check, not permission to invent a new requirement or reopen product design.

## 4. Owner Release Decision

The owner must receive a distinct release decision after Release Prep.

Allowed decisions:

- **APPROVE RELEASE** — authorizes publication/deployment of this prepared version;
- **HOLD** — keep the approved product unreleased;
- **RETURN FOR WORK** — route a specific issue back to Product Design or Visual Production.

Approval is version-specific. It authorizes only the prepared release record/revision.

An agent may prepare evidence and a recommendation. It may not make the Owner Release Decision.

## 5. Publishing

`APPROVED TO PUBLISH` is authorization, not proof that publication occurred.

Publishing/deployment must be recorded separately.

The system should record:

- when publication/deployment occurred;
- where it was published;
- the resulting URL/delivery location;
- the exact version/revision published;
- any publication note needed for traceability.

Do not mark a product LIVE merely because publication was attempted or a deployment command returned success.

## 6. Verify Live

After publishing, verify the actual released product—not merely the deployment log.

At minimum confirm where applicable:

- the URL/delivery location resolves;
- the intended version is actually present;
- the learner can open/use the product;
- critical navigation/actions function;
- required learner-facing assets load;
- the released state matches the owner's authorization;
- access/pricing behavior matches the prepared release;
- no unintended draft/test content is visible;
- the verified result is the same product/version approved for release.

Record what was actually checked and the result. A bare `verified=true` value without evidence is not enough for a consequential release claim.

Only after applicable verification passes should the Academy project become `LIVE`.

## 7. Live verification failure

If publication occurs but live verification fails:

1. do not mark the product LIVE;
2. stop further release/marketing actions that depend on a valid live product;
3. record the exact failed check and user-facing consequence;
4. use the safest authorized rollback/hold/recovery path when needed;
5. route the defect to the stage/system that owns it;
6. re-test the exact live path after correction;
7. evaluate the failure under the Continuous Improvement & Learning Loop when it reveals a reusable system lesson.

A release failure must not be hidden by an upstream deployment success.

## 8. Version History

Every release remains a durable record. A later version does not erase the earlier release.

A new release should create a new release record rather than overwriting release history.

The system must be able to answer:

- what version was released;
- when;
- where;
- who/what authorized it;
- what live verification was performed;
- whether it later required correction, rollback, or replacement.

## 9. Return for Work

A release-stage problem must be routed deliberately.

- research/evidence problem → Research;
- product architecture/content/value problem → Product Design;
- visual/delivery/integration problem → Visual Production;
- deployment/routing/system problem → the applicable technical/system control;

The release record remains in history and records why the release was returned.

## 10. Post-live learning

A verified LIVE product may generate legitimate signals such as:

- learner questions or repeated confusion;
- completion/abandonment patterns;
- product/tool usage;
- support problems;
- owner observations;
- factual/source changes;
- technical failures;
- visual/usability problems;
- marketing/audience results;
- successful patterns worth testing again.

These signals feed the Academy Continuous Improvement & Learning Loop. They do **not** silently rewrite the live product or automatically create a new version.

Use:

**OBSERVE → PRESERVE EVIDENCE → CLASSIFY SIGNAL → IDENTIFY/TEST CAUSE → RECOMMEND OR APPLY AUTHORIZED CORRECTION → VERIFY → OBSERVE NEXT RESULT**

When the improvement would change approved content, architecture, branding, pricing, access, offer, or release scope, route it through the appropriate owner gate rather than changing the live product silently.

A LIVE product remains LIVE while a noncritical future improvement is being considered unless a factual, safety, technical, or other material defect requires a hold/correction.

## 11. Marketing/release boundary

A product being LIVE does not automatically authorize a new marketing campaign, paid advertisement, email blast, public pricing change, promotional promise, or new offer structure.

Marketing work may use verified LIVE product facts and approved brand/offer language, but its own owner-controlled scope and applicable intelligence/verification rules remain in force.

This prevents “release approved” from turning into unlimited downstream authority.

## 12. Owner-facing language

Use clear language:

- **Final Product Approved — Not Released**
- **Release Prep**
- **Ready for Owner Release Decision**
- **Approved to Publish**
- **Published — Verify Live**
- **Live**
- **Live — Improvement Signal Open** when a noncritical learning item exists and that distinction is useful.

Avoid wording that makes `APPROVED`, `READY`, `PUBLISHED`, `VERIFIED`, and `LIVE` appear interchangeable.

## 13. Hard boundaries

- Final Product Approval never auto-publishes.
- Release Prep never auto-publishes.
- An agent may not make the Owner Release Decision.
- `APPROVED TO PUBLISH` is not `LIVE`.
- `PUBLISHED` is not `LIVE` until verification succeeds.
- `LIVE` does not mean post-live performance is proven successful.
- A deployed correction is not a verified improvement until the exact correction is re-tested and, where outcome evidence is required, the next relevant result supports it.
- No public price, paid access, campaign, email, ad, or launch is created merely because a release record exists.
- Existing authentication, RLS, privacy, evidence, minors, organizational, brand, and owner-control rules remain in force.
