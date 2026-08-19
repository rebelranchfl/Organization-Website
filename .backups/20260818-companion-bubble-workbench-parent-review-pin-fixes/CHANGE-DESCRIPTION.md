# Round 2: companion speech bubble, badge/next-step separation, workbench card cleanup, parent review, sitewide twinkle, kid PIN landing

Authorized by Brooke 2026-08-18, same conversation, direct follow-up correction
round on the round-1 companion/journey/badge/card work (backed up in
`.backups/20260818-companion-journey-badge-flow-fixes/`). She reviewed that
round and flagged seven more issues.

Authorized target: same five files as round 1 —
creation-station-dashboard.html, assets/css/creation-station-dashboard.css,
assets/js/creation-station-app.js, assets/js/creation-station-views.js,
assets/js/creation-station-data.js.

## What changed

1. Companion now speaks from one real speech bubble attached to the robot
   itself (positioned above him, tail pointing down), instead of a second
   duplicate avatar+message row sitting under the track next to a bare
   "Customize" button. Removed that duplicate row. The one remaining
   Customize control is now labeled "Customize Companion" so it's
   unambiguous that it edits the robot, not the project.

2. `achievementPanel()` (First Project Badge) is now strictly the badge
   celebration — medal, headline, and a line encouraging the next project
   toward the next badge. Removed the "Ready to sell what you made?" /
   "Not quite ready yet?" choice cards from it entirely. Added a new
   `nextStepsPanel()` that renders those two choices in their own plain
   panel below the workbench/aside layout (same slot as the tier-3
   "Ready to run it like a pro?" section, right above it) — shown to any
   tier once the first project is done, not just tier 3.

3. `studio()` reordered so the journey/companion panel sits directly above
   the workbench, with no metric-grid between them — metric-grid moved to
   right after the badge panel instead.

4. `projectCard()`: removed the category/difficulty `.tag` pills entirely
   (non-clickable content styled as clickable pills, against the
   dashboard's own standing tag/button rule). Actions row now has exactly
   two real buttons: Resume Project/View project, and a new "Remove from
   workbench" button that archives the project directly from the card
   (same effect as the existing Archive control inside the edit dialog,
   now also reachable without opening it). The corner favorite control now
   shows the word "Favorite" next to the star, not an icon-only button.

5. New Project dialog and the description field now say plainly that this
   text becomes the product description shown on the creator's Creation
   Station Studio page once they're ready to sell, and that it's saved
   with the project for the creator and a parent/guardian to review.
   Parent View (`parent()`) now lists each creator's active projects with
   that description underneath, so a parent can actually see it without
   opening the creator's dialogs.

6. Sidebar twinkle sparkles enlarged/brightened (they were present but
   barely visible). Added the same twinkle sparkle treatment to the
   persistent top hero band and to every view's screen heading, so it
   shows on Studio, Projects, Portfolio, Resources, Sessions, Growth,
   Creation Station Studio, Parent, and Admin — not just the sidebar.

7. Kid PIN entry (`enterKid` in `creation-station-app.js`) now always
   routes to the Studio view on success instead of only doing so when the
   view the parent happened to be on wasn't kid-eligible. A parent sitting
   on an already kid-eligible view (Projects, Growth, etc.) no longer
   leaves the child stranded there — entering a child's PIN always lands
   them straight on their own Studio dashboard.

No Supabase/schema change. Do not commit, push, publish, or deploy.
