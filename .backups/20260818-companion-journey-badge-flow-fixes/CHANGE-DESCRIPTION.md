# Companion + journey flow fixes, project card cleanup, badge prominence

Authorized by Brooke 2026-08-18, same conversation as the earlier robot
integration. She reviewed the live Companion panel on the dashboard and
flagged seven connected problems: the robot is a small, static card that
doesn't work with the journey track; starting a new project drops the
user with no guidance and no visible next step; a brand-new project
reads as "5% complete" for doing nothing but naming it; the project card
is visually busy (time estimate, a full Favorite button, a raw dump of
unanswered reflection questions); the First Project Badge is buried among
other cards instead of feeling like a real celebration; the reflection
Q&A should feed a portfolio-ready description instead of just sitting on
the card; and the "Business Sessions at Academy" choice is duplicated
(it already exists lower on the same screen for paid tiers).

Authorized target: creation-station-dashboard.html,
assets/css/creation-station-dashboard.css, assets/js/creation-station-app.js,
assets/js/creation-station-views.js, assets/js/creation-station-data.js.

## What changed

1. `creation-station-data.js` — `actions.startProject` no longer hardcodes
   `status:'in_progress', completion:5` on insert; it now lets the table's
   real defaults (`not_started` / 0) apply, and returns the created row's
   id (`.select('id').single()`) so the app can route the user straight to
   it after creation.

2. `creation-station-views.js`:
   - Moved `reflectionPrompts`, `serializeReflection`, `parseReflection`
     here (exported) from app.js, and added a new first prompt,
     `description` ("What are you making? Tell us about it!"), so a
     project's own description round-trips through the same `notes` text
     blob as the four existing reflection questions — no new database
     column needed.
   - `projectCard()`: removed the "estimated minutes" text entirely;
     removed the raw notes dump and replaced it with just the parsed
     `description` line; removed the inline title-row favorite star;
     moved Favorite into a small star-icon toggle button positioned in
     the lower-left corner of the project image/art area; gave the
     no-photo "art" background a nicer decorative filler instead of a
     bare icon on a flat tile.
   - Replaced `companionPanel()` + `journeyTracker()` with one
     `journeyCompanionPanel()`: the journey stage track is unchanged in
     substance, but for young creators the robot SVG now sits absolutely
     positioned above the current stage's dot with a continuous idle
     bounce (so it reads as alive, not static), and the name/message/
     Customize control moved into a slim speech bar under the track
     instead of its own long separate card.
   - `achievementPanel()` (First Project Badge): enlarged and moved to
     render immediately after the screen heading — before the journey/
     companion panel — so it's the first thing seen when earned instead
     of being buried under other panels. Removed the third
     "Business Sessions at Academy" choice card since that same link
     already exists in the tier-3 "Ready to run it like a pro?" section
     lower on the same screen; kept the two genuinely different next
     steps (Set Up My Studio / Keep Practicing).
   - `studio()`: updated to call the new merged panel and the
     repositioned achievement panel.
   - Exported `pick` and `companionPhrases` (previously private) so the
     app.js edit-dialog companion nudge (below) can reuse the same
     stage-phrase copy instead of duplicating it.

3. `creation-station-app.js`:
   - Imports `reflectionPrompts`, `serializeReflection`, `parseReflection`,
     `pick`, `companionPhrases` from views.js instead of defining
     `reflectionPrompts`/`serializeReflection`/`parseReflection` locally.
   - New Project dialog (`openProject`/submit handler): added a
     "What are you making?" description field alongside the title; it's
     saved through `startProject` as the first reflection entry via
     `serializeReflection`. After a project is created, the app switches
     to the Studio view (if not already there) and smooth-scrolls to the
     journey panel so the new project and the companion's greeting are
     immediately visible — instead of leaving the user on an unchanged
     screen with no visible next step.
   - Resume Project dialog (`openEdit`/`renderEditStagePicker`): added a
     `reflect-description` field (prefilled/saved alongside the existing
     four reflection questions) and a companion mini-panel that shows a
     stage-appropriate nudge line (reusing the same `companionPhrases`
     the dashboard home uses) every time the stage picker changes, plus a
     standing reassurance line for young creators about it being okay to
     ask a grown-up for help. This gives the companion a presence inside
     the actual "resume my project" flow, not just the dashboard home.
   - `importProject()`: now carries the project's parsed description
     into the new Studio product's description field instead of leaving
     it hardcoded empty.

4. `creation-station-dashboard.html`:
   - `#project-dialog`: added the new project-description textarea.
   - `#edit-dialog`: added the `reflect-description` textarea and an
     `#edit-companion` container for the stage nudge described above.

5. `assets/css/creation-station-dashboard.css`: new/updated rules for
   the merged journey+companion panel (`.journey-companion-pop` bounce
   animation, `.companion-speech-bar`), the redesigned project card
   (`.art-favorite` corner star, `.project-art` filler background,
   `.project-desc`), and the bigger `.achievement-panel-hero`/
   `.badge-medal-big` badge treatment. Old `.companion-panel` rules that
   are no longer referenced by any markup were left in place only where
   still shared (`.companion-avatar`/`.companion-body`/`.companion-speech`
   are reused by the new markup); truly dead selectors were removed.

No Supabase/schema change — the description field reuses the existing
`creator_projects.notes` column via the same text-blob reflection format
already used for the other four questions; `createStudioProduct` and
`portfolio_items` already had a `description` column, unused until now.

Do not commit, push, publish, or deploy.
