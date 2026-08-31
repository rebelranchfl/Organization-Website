# Rebel Ranch Academy — Rendered Product QA Standard

**Status:** Owner-approved governing standard  
**Effective:** 2026-08-22  
**AI-Agent:** ChatGPT/GPT-5.6 Sol  
**Session:** RR Website — Owner platform correction

## Purpose

Final Product QA must verify the **actual learner-facing release candidate**, not the architecture, manuscript, handoff, preview manifest, filenames, closeout notes, or an agent's statement that a feature was implemented.

A product may not be marked Final Product QA PASS when the rendered product contradicts the approved Product Design or the QA record.

## Governing rule

> **If the learner cannot actually see it, use it, select it, navigate it, preserve it, or receive it in the release-candidate experience, it is not implemented.**

Documentation is evidence of intent. The rendered product is evidence of delivery.

## Required functional verification

Before a project may move from Visual Production to Final Product Review, the Visual Production worker must test the complete learner-facing release candidate from beginning to end.

At minimum, verify:

1. **Every required learner input behaves as designed.** If Product Design authorizes multi-select or multi-branch input, select multiple options in the actual product and confirm all selected values remain distinct downstream.
2. **Every navigation control resolves.** Click every learner-facing link, `Show me why`, `Show me the science`, `See the system`, deeper-learning control, previous/next control, download, print control, and other interactive route. Any 404, missing file, dead button, broken anchor, or wrong destination fails QA.
3. **State survives normal navigation.** Enter learner answers, open deeper material, return, move forward/back, and confirm the answers and dependent results remain intact where the approved architecture requires persistence.
4. **Personalized outputs actually change.** Use materially different learner inputs and confirm the final plan/result changes in ways that reflect those inputs. A static or mostly generic output does not satisfy personalization.
5. **Visual teaching is physically present.** Confirm the release candidate contains the required diagrams, cutaways, process visuals, branch maps, recognizable scenes, comparisons, system visuals, or other authorized visual teaching. Text inside bordered cards does not become a diagram merely because it is visually styled.
6. **Practical outputs exist.** Confirm required build concepts, system plans, comparison tools, checklists, experiments, decision tools, downloads, print outputs, or other tangible outputs are present and usable.
7. **Responsive/use behavior works.** Check the intended desktop and mobile widths and print/download behavior where applicable.
8. **Owner-visible preview is the same product being certified.** Final Product Review must preview the same release-candidate files that were functionally tested.

## Evidence required in Final Product QA

A PASS record must identify what was actually tested, not only state that testing occurred. Record:

- release-candidate file(s) tested;
- learner paths exercised;
- multi-input/branch combinations tested where applicable;
- links/depth controls tested and result;
- state-persistence test and result;
- personalization comparison used and result;
- required visual/tangible outputs observed;
- any failures found and corrected before PASS.

Do not write `PASS` based on the existence of a manifest, architecture section, planned filename, handoff statement, or prior agent claim.

## Hard fail conditions

Final Product QA is **FAIL** if any of the following is true:

- a required feature exists only in documentation and not in the learner-facing product;
- a required multi-select remains single-select;
- any learner-facing route returns 404 or points to a nonexistent file;
- normal deeper navigation loses learner state when persistence is required;
- the final personalized output does not materially reflect learner input;
- required visual teaching is replaced primarily by prose/cards when the approved design calls for diagrams, cutaways, scenes, branch visuals, or system visuals;
- the preview manifest points to a different or older product than the one tested;
- the QA record claims a behavior that was not exercised in the actual release candidate.

## Water Through the Layers regression test

For `RRA-2026-0001`, before the next Final Product Review, the Visual Production worker must specifically:

- choose at least **three intended uses at the same time** and confirm all three persist through the learner journey and appear distinctly in **My Water Plan**;
- exercise every deeper-learning route and confirm **zero 404s**;
- enter answers, leave for deeper content, return, and confirm the state remains;
- verify real learner-facing treatment/purification visuals exist, including the authorized system/layer/build teaching rather than only text boxes or emojis;
- verify My Water Plan visibly represents shared infrastructure and separate use branches where relevant;
- compare at least two materially different learner profiles and confirm the resulting plan changes meaningfully;
- inspect the exact Final Product Review preview and confirm it is the corrected release candidate.

## Relationship to other standards

This standard strengthens, and does not replace:

- Academy Learner Experience, Language & Visual Standard;
- Responsible Rebellion / Evidence-First Standard;
- Product Phase Workflow Extension;
- Revision Preservation Standard;
- Final Product Acceptance owner gate.

The owner still makes the Final Product decision. Agent QA is preparation for that decision, not a substitute for it.
