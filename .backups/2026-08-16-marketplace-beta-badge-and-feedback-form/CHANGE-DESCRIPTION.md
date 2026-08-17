# Marketplace Beta badge + feedback form — 2026-08-16

**File:** `marketplace.html`

Owner wants to label Marketplace as Beta to invite early testers and
gather feedback while building traction. Owner confirmed they're the
only current "active seller" (their own account), so there's no real
third-party seller a Beta label could undercut.

## What was added
1. A small "BETA" tag next to the existing "Rebel Ranch Marketplace"
   eyebrow in the hero — minimal, doesn't restructure the hero.
2. A new feedback section with a real form, reusing the existing
   Formspree endpoint already wired up on `contact.html`
   (`https://formspree.io/f/xnjrqydq`) with a distinguishing
   `form_type`/`_subject` value ("Marketplace Beta Feedback") so
   submissions are identifiable in the inbox alongside regular contact
   messages, exactly the pattern already used elsewhere on this site for
   reusing one Formspree endpoint across multiple forms. Name and email
   are optional (kept genuinely easy, per the owner's request); the
   message field is the only required one.

## Styling
`marketplace.html` had no existing form/label/input styling anywhere on
the page (its one other "form-like" section just links out to the
seller dashboard rather than collecting input inline), so a small new
`.feedback-form` rule set was added, built entirely from the page's own
already-defined color tokens (`--panel2`, `--ink`, `--green2`, `--gold`)
rather than inventing new colors — matches the established dark-green
Marketplace look.

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-16)
