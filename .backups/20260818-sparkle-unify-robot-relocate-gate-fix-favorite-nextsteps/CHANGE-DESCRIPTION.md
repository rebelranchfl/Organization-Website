# Round 3: unify sparkle system, relocate companion out of the journey track, fix completed-project gate, opaque favorite backing, single 3-card next-steps panel

Authorized by Brooke 2026-08-18, same conversation, after a "talk to me, don't
work" discussion round on 6 numbered issues (see prior turn). She approved
items 1, 3, 4a, 4b, 5(option a), and 6 with a modification (keep the phrase
"Ready to run it like a pro?", no tier gating, all three choices shown to
everyone). Item 2 (kid PIN routing) is explicitly deferred — she's testing
both mobile and desktop herself and will report back; no code change for it
in this round.

Authorized target: same five files as rounds 1-2.

## What changed

1/4b. **One sparkle system, not three.** Removed the separate `.heading-
   sparkle` treatment (was colliding with eyebrow text on every screen
   heading, most visibly "ADMIN VIEW") and the separate sparkle pseudo-
   elements on the badge panel. `heading()` in views.js now reuses the exact
   same `.sidebar-sparkle` markup/class as the sidebar and hero, repositioned
   to the header's top corners (`top` far enough negative to clear the
   eyebrow's text, `left:0`/`right:0` so it never depends on eyebrow length).

3. **Companion moved out of the journey track entirely.** The track was too
   tight (six ~100px-wide stage columns) to hold a character plus a variable-
   length speech bubble without clipping or overlapping neighboring stages.
   The robot and his speech bubble now live in their own full-width row
   (`.journey-companion-row`) above the track, with real room for the bubble
   to wrap. The current stage is now indicated on the track itself with a
   pulsing glow ring (`.journey-stage.is-current .journey-dot`) instead of
   the character standing on top of it. Removed the now-unused absolute-
   position/padding-hack CSS (`.journey-companion-pop`, the 180px track
   padding-top) that existed only to make room for the old in-track
   placement.

4a. **Completed projects no longer show "Still working on it / All finished."**
   `openEdit()` now sets `state._editCompleted` from the project's status;
   `renderEditStagePicker()` skips the gate and stage picker entirely for a
   completed project and shows a short "this project is complete" line
   instead, plus (for young creators) a celebratory companion line pulled
   from the existing `companionPhrases.grow.celebrate` set rather than a
   stage nudge. The reflection/description fields and file upload stay
   editable underneath — completing a project doesn't lock a creator or
   parent out of reviewing or updating what's written there.

5. **Favorite control gets a solid backing.** `.art-favorite` was a
   translucent dark pill over the project image — fine on the plain filler
   gradient, unreliable in contrast once a real photo is behind it. Now
   solid white with a real shadow when not favorited, and the existing pink/
   gold gradient when it is, so it reads clearly regardless of what's in the
   photo.

6. **One next-steps panel, three choices, no tier gate.** Removed the
   duplicate: `nextStepsPanel()` and the separate tier-3-only "Ready to run
   it like a pro?" section are merged into a single panel using that exact
   heading text (her explicit request to keep the phrase), with all three
   choices — Set Up My Studio, Keep Practicing, Business Sessions at Academy
   — shown to every tier once the first badge is earned, not gated to tier 3.
   This also resolves an issue flagged in round 2: tier-1/2 creators
   previously had no path to the Business Sessions link at all.

Also created a new personal (non-repo) skill this session,
`collaborative-problem-solving`, at
`C:\Users\rebel\.claude\skills\collaborative-problem-solving\SKILL.md` —
unrelated to this repo's files, noted here only for context on why this
round was preceded by a design discussion instead of immediate edits.

No Supabase/schema change. Do not commit, push, publish, or deploy.
