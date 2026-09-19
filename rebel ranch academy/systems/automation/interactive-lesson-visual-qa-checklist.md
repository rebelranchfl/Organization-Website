# Interactive Lesson Visual QA Checklist

Created 2026-09-14 after two of the same defects recurred on RRA-2026-0011 after already being flagged once — a documented failure to actually learn from a called-out issue, which the owner was right to be upset about. This checklist exists so that stops happening: it is a floor, run in full, on every revision of any interactive Academy lesson page (not just this one), not a set of things to eyeball in a couple of screenshots and call good.

## What went wrong, specifically (so it isn't repeated a third time)

1. **Blank space below the nav bar, twice, in two different forms.** First pass: `.section` was absolutely positioned with `inset:0` inside a `flex:1` stage, forcing every section to fill the viewport regardless of content length. Fixed by making sections flow normally — but `.app` still had `min-height:100vh` on a flex column with no `flex-grow` child, so the leftover space just moved to *after* the nav instead of disappearing. The owner caught this in her own screenshots on three different pages. I had also seen it myself in a test screenshot during the first fix and wrongly rationalized it as "acceptable" instead of treating it as the same bug. **The actual fix: no forced minimum height at all.** A short page should just be short.
2. **Duplicate graphics for the same content on one page, while other pages had none.** Flagged once in the first owner review round; not fixed in the second build (the icon row was added, not removed, and stacked on top of the existing diagram image). Fixed by removing the icon row and keeping only the diagram.

## The checklist (run all of it, every revision)

- [ ] **Zero dead space below the nav on every single section.** Verify programmatically, not by eyeballing a sample: for each section, `nav.pager`'s bottom edge should equal the page's total scroll height. Test every section in one pass (a loop clicking "Next" through the whole lesson), not a handful of screenshots chosen because they looked fine.
- [ ] **At most one graphic per section**, and no page should have two visual treatments of the same information (e.g., an icon set AND a diagram both showing the same four items). If a page has zero graphics and another has two, that's an imbalance to fix, not a coincidence to leave.
- [ ] **Any navigation aid the owner asked for must be genuinely discoverable**, not just technically present. A button that opens a modal is not the same as a visible list on the page, if what was asked for was the latter. When in doubt, make it visible by default in addition to any modal/shortcut version.
- [ ] **No section should ask the learner to do something outside the platform** (e.g., "write it down" on paper) when an in-page, saved alternative is straightforward to build. Every actionable prompt should have a real input tied to the learner's saved progress.
- [ ] **Every sourced/footnoted claim uses one consistent, honestly-applied verification-tier label** — never a bespoke sentence per source. Two tiers only: content confirmed vs. existence confirmed only. Apply the same two labels everywhere the source appears (inline footnote, References/Sources section, and the durable `sources.md` record).
- [ ] **Any section built from a real correction the owner gave verbally must actually reflect what she said**, not a generic AI gloss on the topic — if an explanation given in her own words exists in the conversation, use its actual reasoning and structure, not an invented example that sounds plausible but wasn't checked (e.g., a scenario an ER team or similarly high-stakes context would never actually do).
- [ ] Before reporting any of the above as fixed, **re-run the specific check that would have caught the previous version failing** — not just a general glance at a new screenshot.

## Process failure this documents

Two defects came back after being named once already. The proximate cause each time was checking a sample of evidence (a few screenshots) and concluding "looks fine" instead of checking the specific thing that was flagged, everywhere it could recur. The fix going forward is procedural, not just this one page's CSS: run the actual check (a script asserting a measurable property across every section, not a visual skim) before calling a fix done.
