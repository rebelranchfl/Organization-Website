# Change Description — Academy Nav-Link Rule Update

**Date:** 2026-08-20
**AI agent:** Claude (Cowork)
**Session:** Rebel Ranch Academy transition alignment

## Authorized purpose

Owner explicitly confirmed in chat (2026-08-20) that the "Rebel Ranch Academy has no
live program page yet" restriction in `docs/rrm-visual-rules.md` is outdated: RRA
now has its own live external app (the Rebel Ranch Academy Program Hub), and the
owner authorized updating this one rule so it reflects current reality instead of
continuing to be flagged as a conflict on every future task.

## File changed

- `docs/rrm-visual-rules.md` — one bullet under "Actions and homepage link routing."

## Exact change

Old bullet:
> Rebel Ranch Academy has no live program page yet. Its homepage card may link only
> to its interest form, an internal anchor, or stay unlinked, until Academy has an
> approved page of its own.

New bullet:
> Rebel Ranch Academy now has a live program destination: the Rebel Ranch Academy
> Program Hub, an external application (currently at
> rebel-ranch-academy-hub.brookeritchie.chatgpt.site). The homepage card and the
> shared-header nav's Rebel Ranch Academy link may point to the Program Hub.
> `academy.html` remains the public introduction to RRA per the approved RRA
> Concept and Direction document (`rebel ranch academy/REBEL-RANCH-ACADEMY-CONCEPT-AND-DIRECTION.md`);
> changes to `academy.html` itself still require separate owner approval and are not
> authorized by this rule update.

## Files explicitly not changed

- `academy.html`
- The Rebel Ranch Academy Program Hub application
- Any other section of `docs/rrm-visual-rules.md`
- Any other repository file

## Backup

- Full prior version of `docs/rrm-visual-rules.md` saved alongside this file as
  `rrm-visual-rules-BACKUP.md` before editing.

## Not committed or pushed

This edit was made to the local working tree only. No git commit, push, or deploy
was performed. That requires separate explicit authorization per `AGENTS.md`.
