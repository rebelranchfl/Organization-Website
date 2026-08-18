# Creation Station / Account Review — Running List

Started 2026-08-17, owner-driven review while browsing the live site as a
real (non-admin) user for the first time. Purpose: catalog everything
found before sequencing/prioritizing — per owner's explicit request, this
is a list-building pass, not a build pass. Nothing in this doc has been
implemented yet unless marked Done.

Status tags used below: **Confirmed gap** (verified in code, real issue),
**Decision needed** (owner has to choose a direction before work starts),
**Ready to build** (low-risk, no open question, just needs doing),
**Open question** (needs owner's product/business input, not just code).

---

## A. Account & sign-up (account.html)

**A1. Signup form doesn't change state after submit — Confirmed gap.**
Right now: `supabase.auth.signUp()` succeeds → form calls `.reset()` and
shows an inline status message in the same `#signup-status` box, still
inside the same card. No card flip, no visual "submitted" state. Owner
wants: the "Create an account" card should flip to a "Submitted" card
showing the check-your-email verbiage. File: `account.html`, `#signup-form`
submit handler (~line 1069) and `#signup-panel`/`#signup-status` markup
(~line 484).

**A2. "Green on green" success message — Confirmed gap, low contrast.**
`.status-box.success` (account.html CSS ~line 284) sets text color to
`--rrm-green` (`#97C459`) on a background of the same `--rrm-green` at
12% opacity, over an already dark-green page background. Genuinely hard
to read. Same fix pass as A1 likely, since it's the exact message shown
in that flow.

**A3. "Welcome, Test" — no way to edit display name — Confirmed gap.**
`display_name` is captured once at signup (`account.html` signup form),
copied into a `profiles` table, and read back on the account page. Every
reference to `profiles.display_name` in the codebase is a `SELECT` —
there is no `.update()` anywhere, no settings/edit-profile UI at all.
Needs a real settings control + a Supabase write path to be built.

**A4. Signup message doesn't distinguish new vs. already-registered —
Confirmed gap.** Same "check your email" message shows whether or not an
account already existed (see the brookeritchie90@gmail.com incident,
2026-08-17 — she already had a confirmed account from 2026-07-24 and
resubmitting signup triggered a silent `user_repeated_signup`, no new
email, but the same misleading message). Fix belongs in the same
handler as A1.

---

## B. Creation Station header, nav, and branding

**B1. Header standardization — Decision needed, and it reverses a prior
lock.** The "twinkle" header the owner likes is custom to
`creation-station-account.html` only — it is NOT the current standard.
The actual shared Creation Station header (used on 8 pages: creation.html,
creation-station-studio.html, creation-station-teaser.html,
creation-young-creators-interest.html, creation-station-live-classes.html,
membership-status.html, creation-station-membership.html,
creation-station-disclaimer.html) is marked `OWNER-LOCKED` in the code
comments — a past deliberate protection. Owner has now said: "I like the
twinkle, use it everywhere." **Needs owner's explicit confirmation that
this supersedes the lock** before touching those 8 pages, since that's
exactly the kind of change AGENTS.md requires a clear go-ahead for.

**B2. Dashboard has no twinkle at all currently — Confirmed, contradicts
what owner observed.** The only `cs-twinkle` animation in
`creation-station-dashboard.html`'s CSS is applied to an unrelated
empty-state icon, not the sidebar. The sidebar's "stars" are static
decorative dots (radial-gradient background), not animated. Owner wants
real twinkle added to the sidebar nav and thinks it would also suit the
dashboard hero.

**B3. Sidebar's "RRM Account" link has no logo — owner's idea, Claude's
take: agree.** Currently plain text (`<a href="account.html">RRM
Account</a>`, creation-station-dashboard.html ~line 24). Adding the
actual RRM logo mark there is a real, well-established way-finding
pattern — especially valuable given how jarring the color jump already
is between the two sub-brands (see B4/C-section below); a small
recognizable mark gives an instant "this leads home" cue without reading
text.

**B4. Jarring color transition RRM → Creation Station — owner's idea,
Claude's take: agree.** Owner wants a loading-bar transition like
creation.html's "Open the Parent Preview" pattern, applied when
navigating from the RRM account hub into Creation Station. Related: cut
the redundant "View Membership Options" / "Membership Status" buttons on
account.html since they only ever go to Creation Station anyway — fold
that into the Creation Station card itself doing the transition.

---

## C. creation-station-experience.html — the "Companion" demo problem

**C1. The page is a pure static demo, not real product — Confirmed,
real stakes, not just cosmetic.** No Supabase calls anywhere in the
file — only `localStorage` for the visitor's own demo inputs. The page's
own UI literally says "Parent Demo · Limited Sample Experience... The
complete project library and member tools are not public." The
"Creation Companion" mascot feature shown here does not exist in the
owner's real admin dashboard (rebelranchfl@gmail.com) either — consistent
with it being demo-only.

**C2. This fake demo is what prospective buyers see, repeatedly —
Confirmed, worth prioritizing.** 6 links across 4 sections of
creation.html all point to this same demo page: hero (2 links — "See
What They Experience" button + the hero visual image), the `#experience`
"guiding" section (2 links — "Open the Parent Preview" button + the
dashboard-preview image, this is also where the header nav's "See the
Experience" anchor lands), the portfolio/studio showcase section (1
link — "See the Parent Preview"), and the closing CTA (1 link — "Open
the Parent Preview"). Every single path marketing offers to "see the
dashboard" leads to a demo that was explicitly designed to not be the
real thing. Worth treating as a trust issue, not just a polish item.

**C3. Open question — is "Companion" a real planned feature or was it
invented just for the demo?** Code alone can't answer this — it's a
product decision. If it's meant to ship for real, the demo isn't lying,
it's previewing. If it was only ever a demo flourish, showing it
repeatedly to prospects as "the experience" is actively misleading and
should either become real or be removed from the demo.

---

## D. Copy / marketing mismatches

**D1. creation.html `#portfolio` section — Confirmed mismatch.** Heading
"A project can become proof of growth," intro copy about a private
growth/reflection portfolio "kept under parent or guardian control" —
directly underneath, the embedded "Creation Station Studio™" demo
(marked `OWNER-LOCKED COMPONENT` in the code) is a full storefront
mockup: real sample products with prices, "Add to Demo Cart" buttons, a
"Creator Cart" sidebar with item count and running total. The stated
theme (growth journal) and what's actually shown (shopping cart demo)
are two different value props stitched into one section. Needs either a
rewritten intro that actually introduces the storefront, or splitting
into two sections so each visual matches its own copy. (Note: this
component is owner-locked in the code — changing it needs the same kind
of explicit go-ahead as B1.)

**D2. "Find Me" → "Ready to sell?" — owner's idea, Claude's take:
agree.** Actual section: creation.html `#adult-path`, "Already making?
Choose how people can find you." Punchier, more direct framing of a
genuinely good, under-marketed offer (free storefront + free Marketplace
listing + free local discovery).

**D3. Screen-time/parents/kids benefits rewrite — strong material,
not yet placed.** Owner's raw pitch (perseverance finishing hard
projects, reflection skills, real business skills — inventory, customer
messages, running a store — parents recouping money spent on hobby
supplies instead of just spending it, free storefront + free Marketplace
listing = free local marketing + free hosting, 1-hour real break for
parents during Club sessions, belonging/community for kids who get made
fun of for crafting) is genuinely strong, specific, emotionally
grounded marketing copy — worth turning into real website copy. Not yet
mapped to a specific section/file; creation.html's full section list
still needs mapping beyond the two sections already found (`#paths`,
`#adult-path`) before drafting placement.

---

## E. Small, low-risk, ready-to-build fixes

**E1. Dashboard "View membership" button doesn't jump to pricing —
Ready to build.** `assets/js/creation-station-app.js` line ~76 links to
bare `creation-station-membership.html`; the real pricing section
already has `id="join"` sitting unused. One-line fix: append `#join`.

**E2. creation-station-account.html footer — Ready to build.** Page has
only a one-line placeholder footer (`Rebel Ranch Ministries · Creation
Station · Faith, Family & Freedom`), not the real shared Creation
Station footer component (`data-creation-station-footer`) that 6 other
pages use. Swap in the real component, drop the redundant line.

**E3. Glitter/gradient-animated text — Ready to build once "where" is
decided.** Genuinely doable in plain CSS (animated gradient text-fill),
no library needed. Blocked only on B1's header decision, since that's
the likely place to use it.

---

## Already done, 2026-08-18 (batch 4 — D1, E3 resolved)

- **D1**: creation.html `#portfolio` section heading changed to "From
  Project to Profit," intro paragraph extended with Brooke's own line
  about turning the portfolio into a real business with a free
  Rebel Ranch Marketplace listing. Backup:
  `.backups/20260818-portfolio-section-copy/`.
- **E3 (glitter font) — resolved, no build needed.** Explored true
  speck-textured glitter (real per-letter sparkle, not a gradient) via
  an artifact, then tried generating real glitter text through the new
  Canva connector (4 AI candidates generated, links given to Brooke to
  review). Brooke decided to keep the existing sparkle/star decoration
  already built in B1/B3 instead of pursuing either further. Closed.

**Still open, in priority order:**
1. **D3** — two concrete copy additions drafted and sitting unconfirmed:
   a screen-time sentence for `.relief-section`, and a belonging sentence
   for the Creation Station Club card in the `#paths` 3-card section.
   Needs Brooke's yes or edits before building.
2. **Section C** — the experience-page demo problem. Still open, still
   the biggest one left: creation-station-experience.html is a static
   demo (fake "Companion," no real data) and 6 links across creation.html
   all point prospective buyers to it instead of anything real. Now that
   a real Companion exists in the actual dashboard (built 2026-08-18),
   worth revisiting whether the demo can point to something closer to
   real, or whether it should be labeled more honestly as a preview.

## Already done, 2026-08-18 (batch 3 — B1 corrected, B3, B4, A3)

- **B1 (corrected scope)**: real twinkle animation (not just static dots)
  now on the dashboard sidebar, near the Creation Station brand mark —
  this was scoped to the dashboard specifically, not the OWNER-LOCKED
  shared marketing header, per Brooke's correction.
- **B3**: the sidebar's "RRM Account" link now shows the real RRM logo
  (`assets/brand/Rebel Ranch Ministries/rrm-logo-white.png`, same asset
  the main site header uses) next to the text.
- **B4**: `creation-station-account.html` now plays an "Entering
  Creation Station" transition (logo, headline, loading bar) on arrival —
  reused the exact working pattern already proven on
  creation-station-experience.html, just retargeted at the real page.
  Removed the redundant "View Membership Options" / "Membership Status"
  buttons from account.html's dashboard actions (both only ever led into
  Creation Station; the Creation Station card covers that now, with its
  own transition).
- **A3**: display name is editable now — "Edit name" control on
  account.html, writes to `profiles.display_name`. Checked the database
  directly first: the RLS policy and the grant needed for this write
  already existed, so this was UI-only, no schema change required.

Backup/change record: `.backups/20260818-twinkle-transition-displayname/`.

Still open: D1 (plan proposed to Brooke, awaiting confirmation before
touching the owner-locked component), Section C (experience-page demo
problem — the biggest one left), D3 (benefits copy, needs a section
mapped to it), E3 (glitter font — no longer blocked on B1 now that B1
turned out to be dashboard-only, but not started).

## Already done, 2026-08-18 (batch 2 — E1, E2, D2, A1/A2/A4)

- **E1**: dashboard "View membership" button now links to
  `creation-station-membership.html#join` — jumps straight to pricing.
- **E2**: `creation-station-account.html` now uses the real shared
  Creation Station footer component instead of the one-line placeholder.
- **D2**: creation.html's `#adult-path` heading changed from "Already
  making? Choose how people can find you." to "Ready to sell?"
- **A1/A2/A4**: account.html's signup form now flips to a real
  "Submitted" card on success instead of just resetting with an inline
  message. Fixed the low-contrast green-on-green success text (now
  uses `--rrm-ink` for readable text with the green kept as an accent).
  Detects the already-registered case (`data.user.identities.length===0`)
  and shows honest, different messaging — "you already have an account,
  sign in instead" — rather than the same "check your email" text
  regardless of what actually happened. Switching tabs or clicking "Use
  a different email" resets back to a fresh form.

Backup/change record: `.backups/20260818-review-list-quick-fixes/`.

Still open: B1 (header lock decision), D1 (owner-locked
"proof of growth" section, needs the same kind of explicit confirmation
as B1), A3 (editable display name — its own feature build), B3 (RRM
logo in sidebar), B4 (transition animation), D3 (benefits copy rewrite,
still needs a section mapped to it), E3 (glitter font, blocked on B1).

## Already done, 2026-08-18

**Real Creation Companion, built 2026-08-18** — replaces the demo-only
concept discussed in section C. New Supabase table
`public.creator_companions` (RLS + grants verified clean via
`get_advisors`), a customizable companion (name, catchphrase, color) now
lives in the real dashboard's hero (`studio` view), and its message
reflects the creator's **actual** `creator_projects.completion`/`status`
data — not fake demo content. Includes a twinkle sparkle accent per B2.
See `.backups/20260818-creation-companion-feature/CHANGE-DESCRIPTION.md`.
This does NOT resolve section C's core problem (the experience-page demo
and its 6 links from creation.html) — that's still open. It also doesn't
touch B1 (header lock decision), B3 (RRM logo in sidebar), B4
(transition animation), D1/D3 (copy rewrites), or E1-E3 — all still open.

## Already done, 2026-08-17 (for reference, not part of this list's open items)

Marketplace product cards: responsive grid, image/description/price
reorder, "$" auto-formatting on customer-facing prices, homepage seller
logo, directory logo resized, directory now shows all of a seller's
categories instead of just the first. See
`.backups/20260817-marketplace-card-and-directory-fixes/CHANGE-DESCRIPTION.md`.
Marketplace seller location/onboarding-field editing intentionally
deferred, separate from this list.
