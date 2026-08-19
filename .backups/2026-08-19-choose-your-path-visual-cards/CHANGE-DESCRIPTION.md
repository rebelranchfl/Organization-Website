# "Choose your path" section: convert to visual cards — 2026-08-19

Owner-approved: the three path cards in `creation.html`'s "Choose your
path" section (`#paths`) were text-only (number + heading + description).
Owner wanted image cards instead, for faster recognition.

## Images used (all already public assets already used elsewhere on the
site — no new sourcing needed, no reuse of the page's own hero image so
nothing repeats within the page):
- Path 01 (Parents & Young Creators / `path-family`): `assets/bracelets.png`
- Path 02 (Creation Station Club / `path-session`):
  `assets/creation-station-live-class-card.png` (already the dedicated
  square hero-card graphic on `creation-station-live-classes.html`)
- Path 03 (Adult Makers & Crafters / `path-adult`): `assets/lavender
  candle.png`

Explicitly did NOT reuse `creation-station-family-hero.png` (this page's
own hero image) for any path card — it already appears once, at the top
of this same page; repeating it as a card thumbnail one section down
would read as a mistake. Also did not use any of the owner's private
per-member project photos (the tote bag / mug / lip gloss demo project
images from the dashboard) — those live in the `creation-station-private`
Supabase storage bucket (owner-scoped, signed-URL access only), not the
site's public `assets/` folder, so they are not usable as public
marketing images without being separately exported and added as a real
public asset first.

## Files
- `creation.html` — added one `<img class="path-visual">` to each of the
  three path cards (`.path-family`, `.path-session`, `.path-adult`),
  placed before the existing number+content row.
- `assets/css/creation-station.css` — added `.path-visual` (16:9,
  `object-fit: cover`, rounded corners, soft shadow) reusing the same
  treatment already established for `.featured-products img` elsewhere
  on this page — no new one-off styling invented. Changed `.path-feature,
  .path-compact` grid from a plain `auto 1fr` two-column layout to add an
  explicit top image row spanning both columns
  (`grid-template-rows: auto auto; grid-column: 1 / -1` on the image),
  without altering the existing number/heading/description markup or
  its styling.

## Not touched
- No changes to path copy, links, or the number badges.
- No commits, no push.

AI-Agent: Claude Code
Session: Creation Station merch promotion + Passion to Profit copy discussion (2026-08-19)
