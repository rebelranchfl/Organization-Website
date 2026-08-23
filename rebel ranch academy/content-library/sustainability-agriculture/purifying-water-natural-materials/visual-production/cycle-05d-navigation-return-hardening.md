# RRA-2026-0001 — Visual Production Cycle 05d Navigation Return Hardening

**Stage:** VISUAL_PRODUCTION  
**Progress after cycle:** 95%  
**Final Product QA:** IN PROGRESS — NOT PASS  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RRA Visual Production Agent

## Purpose

Continue the remaining rendered-navigation gate without claiming a browser round trip that this execution environment cannot perform.

The prior cycle confirmed the current release candidate's multi-use behavior, saved-state restoration, materially different personalized plans, mobile width, print behavior, and current GitHub route/fragment existence. The remaining required gate is actual navigation from the release candidate into every deeper page and back to the learner's exact previous place.

## Control-plane check

Supabase confirmed at cycle start:

- Project `RRA-2026-0001`;
- `AGENT_WORKING`;
- `VISUAL_PRODUCTION`;
- 94%;
- no unresolved late finding routed to Visual Production;
- no open Visual Production feedback requiring a new content change.

## Defect identified

Both deeper Water pages used this behavior:

`if (history.length > 1) history.back()`

That was too broad. A directly opened deeper page can still have unrelated browser history. In that case, clicking **Back to where I was** could send the learner to an unrelated prior page instead of Water.

This is a navigation-quality defect because browser history length alone does not prove the previous entry belongs to the Water learner journey.

## Correction applied

Updated:

- `water-system-visual-preview.html`;
- `water-system-implementation-visuals.html`.

The return control now uses browser history only when `document.referrer` confirms the learner arrived from the same-origin `water-learning-experience-final.html` page. Otherwise the existing explicit fallback href remains available:

`water-learning-experience-final.html#evidence`

This preserves exact browser-history return when the learner actually came from Water and avoids misrouting direct/deep-link visitors into unrelated history.

## Preservation / backup

Before either learner-facing file was changed, exact pre-change blobs were preserved under:

`_backups/20260822-2046-navigation-return-hardening/`

with a written `CHANGE-SCOPE.md` describing the authorized modification.

No research, evidence, product architecture, visual teaching content, pricing, release state, or public deployment changed.

## Verification completed

Static GitHub-main verification confirms:

- decision visual still contains required `#clear-safe`, `#testing`, and `#uv` fragments;
- implementation visual still contains required `#scale` and `#substitutions` fragments;
- both pages still point their fallback return link to `water-learning-experience-final.html#evidence`;
- both pages now gate `history.back()` on a same-origin Water release-candidate referrer;
- the preview manifest remains `VISUAL_PRODUCTION / RENDERED_QA_IN_PROGRESS` and still identifies `water-learning-experience-final.html` as the primary release candidate.

## Runtime limitation

The installed Chromium engine still blocks normal URL navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, including in-memory intercepted HTTP routes and data URLs. Therefore this cycle did **not** claim the remaining actual:

`main → deeper page/fragment → Back to where I was → exact prior location`

browser round trip.

The code has been hardened, but the Rendered Product QA Standard requires actual exercised navigation before Final Product QA may pass.

## Remaining gate

In a browser/runtime that permits normal page navigation:

1. open the exact `water-learning-experience-final.html` release candidate;
2. enter and preserve a multi-use Water Plan;
3. click every deeper route (`clear-safe`, testing, UV, decision overview, implementation overview, scale, substitutions);
4. confirm correct file and fragment with zero 404s;
5. click **Back to where I was**;
6. confirm return to the exact prior Water location;
7. confirm all selected uses and My Water Plan state remain intact;
8. recheck preview-manifest identity.

Only then may Final Product QA become PASS and the project move to `FINAL_PRODUCT_REVIEW / READY_FOR_REVIEW`.

## Release boundary

No public release, deployment, sale, public pricing, promotion, affiliate placement, SEO publication, storefront activation, or owner-gate bypass occurred.
