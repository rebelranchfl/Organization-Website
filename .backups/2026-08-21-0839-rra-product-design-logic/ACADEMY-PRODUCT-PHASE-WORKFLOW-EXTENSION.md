# Rebel Ranch Academy — Product Phase Workflow Extension

**Status:** Owner-approved working extension  
**Purpose:** Add separate research, product-design, visual-production, and release gates to the existing Academy content workflow without prematurely changing active projects.

---

## 1. Why this extension exists

The original Academy workflow treated research, content, materials, pricing, QA, and owner review as one long production cycle.

That is not enough control for sellable Academy products.

The owner needs separate answers to three different questions:

1. **Is the information and evidence right?**
2. **Is this the product we want to teach/sell?**
3. **Is the finished product ready to release?**

Those decisions must not be collapsed into one approval.

---

## 2. New complete workflow

For substantive sellable Academy material, the target workflow is:

```text
IDEA
→ CONTEXT REVIEW
→ RESEARCH
→ SOURCE AUDIT
→ RESEARCH QA
→ OWNER RESEARCH REVIEW

→ PRODUCT ARCHITECTURE
→ PRODUCT MANUSCRIPT
→ ACTIVITIES / TOOLS
→ PRODUCT PRICING & PACKAGING
→ PRODUCT QA
→ OWNER PRODUCT REVIEW

→ VISUAL PRODUCTION
→ DELIVERY ASSETS
→ FINAL PRODUCT QA
→ OWNER FINAL PRODUCT REVIEW

→ RELEASE PREPARATION
→ OWNER RELEASE DECISION
→ PUBLISH / SELL
→ LIVE RECORD
```

Research, product design, visual production, and release are separate responsibilities even when the same technical AI model performs more than one role.

---

## 3. Gate A — Owner Research Review

The Research Agent stops at a research-ready package containing:

- context review;
- research;
- sources/source audit;
- evidence conflicts and open questions;
- approved teaching foundation/master content when used as a research synthesis;
- revision-preservation check;
- research QA.

Owner decisions:

- `APPROVE RESEARCH FOUNDATION`
- `NEEDS MORE RESEARCH`
- `REJECT RESEARCH DIRECTION`

`APPROVE RESEARCH FOUNDATION` does **not** approve a product, design, price, sale, or publication.

It authorizes Product Design Agent intake.

---

## 4. Gate B — Owner Product Review

The Product Design Agent creates:

- `product-architecture.md`;
- `product-manuscript.md`;
- activities/tools;
- `product-preservation-check.md`;
- `visual-production-brief.md`;
- pricing/package recommendation;
- `product-qa.md`.

Owner decisions:

- `APPROVE PRODUCT DESIGN`
- `NEEDS MORE PRODUCT WORK`
- `REJECT PRODUCT CONCEPT`

Approval authorizes visual production only.

---

## 5. Gate C — Owner Final Product Review

The Visual Production Agent creates the actual finished learner-facing assets and preview package.

Owner decisions:

- `APPROVE FOR RELEASE`
- `NEEDS VISUAL/DELIVERY WORK`
- `RETURN TO PRODUCT DESIGN`
- `REJECT PRODUCT`

Only `APPROVE FOR RELEASE` may unlock the release workflow.

---

## 6. Gate D — Release decision

Release remains an explicit owner action.

The release process may include:

- creating/updating a product landing page;
- adding a product to an approved storefront;
- setting the approved public price;
- uploading delivery files;
- adding SEO metadata/schema;
- updating sitemap/indexing paths;
- creating public preview assets;
- connecting marketing assets;
- recording the final live URL and version.

No agent may infer release authorization merely because final product review was positive unless the owner explicitly selected the release action defined by the dashboard/workflow.

---

## 7. Temporary compatibility with the current dashboard

The existing Academy dashboard currently has one owner-review decision set:

- Approve;
- Needs More Work;
- Reject.

Until the dashboard/schema is upgraded for the new gates, do not overload `APPROVE` to silently mean all four approvals.

For active legacy projects, including `RRA-2026-0001`, interpret the next owner approval according to the stage named in the project's progress record and owner-review record.

For the current water project:

- Revision 3 is still the **research/evidence correction cycle**;
- its next approval should be recorded as **Research Foundation Approved**;
- that approval authorizes creation of a product-design handoff;
- it does not authorize release or visual production automatically.

A durable `product-design-handoff.md` file should be created after research approval before the Product Design Agent begins.

---

## 8. Product Design Agent activation contract

The Product Design Agent may claim a project only when all are true:

1. research is complete;
2. source decisions required for product use are resolved or explicitly documented;
3. research QA has no blocking issue;
4. owner research approval is recorded;
5. `product-design-handoff.md` exists with `Status: AUTHORIZED`;
6. no active research revision is in progress.

If any condition is false, the Product Design Agent does nothing.

This prevents simultaneous research and product rewriting from colliding.

---

## 9. Product-design handoff record

`product-design-handoff.md` should include:

```text
Project ID:
Research revision approved:
Approval date:
Owner decision:
Approved research files:
Approved source set / source-decision status:
Required KEEP items:
Known uncertainty that must remain visible:
Safety/professional boundaries:
Requested/likely audience:
Product questions to solve:
Status: AUTHORIZED
```

The handoff is a permission boundary, not merely a summary.

---

## 10. Visual-production handoff record

After product-design approval, create `visual-production-handoff.md` with:

```text
Project ID:
Product design revision approved:
Approval date:
Approved product architecture:
Approved manuscript:
Approved activities/components:
Approved visual brief:
Approved/proposed price status:
Required brand assets:
Known accessibility/print constraints:
Status: AUTHORIZED
```

The Visual Production Agent must not begin without this handoff.

---

## 11. Future dashboard statuses

The owner-facing dashboard should eventually distinguish these states without exposing unnecessary technical clutter:

- `RESEARCH WORKING`
- `RESEARCH REVIEW`
- `PRODUCT WORKING`
- `PRODUCT REVIEW`
- `VISUAL PRODUCTION`
- `FINAL PRODUCT REVIEW`
- `APPROVED — AWAITING RELEASE`
- `PUBLISHING`
- `LIVE`

The dashboard may retain simpler umbrella statuses internally for backward compatibility, but the visible stage must make clear **what the owner is approving**.

---

## 12. Future progress weighting

Once the dashboard/schema is upgraded, end-to-end product completion should not treat research as 100% of the final product.

Recommended high-level product lifecycle weighting:

- context + research + source audit: 35%
- research QA + owner research gate: 5%
- product architecture + manuscript: 25%
- activities/tools + packaging/pricing: 10%
- product QA + owner product gate: 5%
- visual production: 15%
- final QA + final owner gate: 5%

Release/publication status is tracked separately from production completion because release requires explicit authorization and may involve external systems.

---

## 13. Water-project implementation

`RRA-2026-0001` remains owned by the current Research/Content Agent until Revision 3 returns for owner review.

Do not start Product Design Agent work against it while the research correction is active.

After the owner approves the corrected additive research foundation:

1. record the approval specifically as research-foundation approval;
2. create `product-design-handoff.md`;
3. Product Design Agent reviews the approved files;
4. Product Design Agent proposes the best offer structure instead of assuming a PDF;
5. owner reviews the product architecture/manuscript;
6. only after product approval does visual production begin.

The water project is the first end-to-end test case for this extension.

---

## 14. Relationship to SEO and marketing

Product design should create enough structure for later public discovery, but the Product Design Agent does not publish SEO pages.

Every approved product should hand the release system:

- primary search topic;
- likely learner search questions;
- product/public-page title options;
- concise public description;
- key learning outcomes;
- appropriate structured-data type recommendation;
- internal-link opportunities within the Academy/RRM ecosystem;
- campaign angles.

SEO implementation and public indexing remain part of authorized release/public-site work.
