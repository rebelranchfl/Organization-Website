# Merch deep-link + Creation Station bridge banner — 2026-08-19

Owner-approved follow-up to the earlier "Passion to Profit" copy/merch-promo
batch today. Goal: when a Creation Station member clicks a merch link from
inside the Creation Station "realm," they should land pre-filtered to the
Creation Station collection and see a colorful welcome instead of a hard
cut into the dark green/gold RRM store theme.

## Files

### `merch.html`
1. Added a `?collection=creation-station` deep-link handler: on load, after
   products are fetched and rendered, reads the `collection` query param and
   pre-selects that collection filter (reusing the existing
   `activeCollection`/`applyFilters()` logic already in the file — no new
   filtering logic invented).
2. Added a thin rainbow-gradient bridge banner at the very top of `<body>`,
   above the RRM hero. Hidden by default; only unhidden by JS when the page
   is loaded with `?collection=creation-station`, so RRM-only visitors never
   see it and the page's default RRM styling is untouched. Uses the exact
   same rainbow-gradient stops already established for Creation Station
   elsewhere (dashboard sidebar promo, footer merch link) — reused, not
   invented.

### `creation-station-dashboard.html`
Sidebar `.cs-merch-promo` link updated from `merch.html` to
`merch.html?collection=creation-station`.

### `assets/components/creation-station-footer/footer.html`
`.cs-footer__merch` link updated the same way. This component only renders
on Creation Station pages (dashboard, live-classes, young-creators,
creation.html), so this is safe everywhere it appears.

### `creation.html`
The merch caption added earlier today ("Real Creation Station kids wear the
brand — Shop merch →") updated to the same deep-link URL.

## Not touched
- No changes to RRM's default (non-CS-referred) merch.html appearance.
- No changes to product data, Printify integration, or checkout destination.
- No commits, no push.

AI-Agent: Claude Code
Session: Creation Station merch promotion + Passion to Profit copy discussion (2026-08-19)
