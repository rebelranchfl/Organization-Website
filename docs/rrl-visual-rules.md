# Rebel Ranch Local Visual Rules

**Status:** Approved and locked

**Authority:** Rebel Ranch Local (RRL) is a program of Rebel Ranch Ministries (RRM), the same relationship Creation Station and Rebel Ranch Academy have to RRM. RRM's general public-surface styling — `docs/rrm-visual-rules.md` and `docs/brand-guide.md` — governs RRM's own pages. It does **not** govern RRL pages. Once a program has its own locked visual identity, that program's styling applies on its own pages instead of RRM's general one, the same carve-out `docs/rrm-visual-rules.md` already makes for Creation Station. This document is RRL's equivalent of `docs/creation-station-visual-rules.md`.

Every agent must read this document before starting visual, layout, or styling work on any RRL/Marketplace page. If a page under RRL scope is styled with RRM's dark green/gold system instead of RRL's own, that is a defect to correct, not a valid alternative.

## Source of truth

- **Brand/palette/voice:** `marketing/social-media/rebel-ranch-marketplace/brand/BRAND.md`.
- **Implemented design tokens:** `assets/css/rebel-ranch-local.css` — defines `--olive`, `--cream`, `--paper`, `--tan`, `--line`, `--ink`, `--muted`, `--shadow` and the shared `.rrl-*` header/hero/card classes. Any new or corrected RRL page should load this file and reuse these tokens rather than inventing new hex values or a parallel palette.

## Palette

| Role | Name | Hex |
|---|---|---|
| Primary | Ranch Olive | `#2F3D1F` (`rebel-ranch-local.css`: `#2f3d1f`) |
| Secondary | Sage | `#6B7F4A` |
| Light canvas | Cream | `#F2E9DA` (`rebel-ranch-local.css`: `#f5eddf`/`#fbf6ec`) |
| Warm accent | Saddle Tan | `#B47A4A` (`rebel-ranch-local.css`: `#b47a4a`) |
| Dark warm | Leather Brown | `#5A3A24` |
| Dark neutral | Ranch Charcoal | `#1A1A1A` |

Camo/field-inspired direction, not tactical/military. Do not introduce RRM's forest-green/gold (`--rrm-green`, `--rrm-gold`, `#204227`, etc.) on an RRL page.

## Typography

- `REBEL RANCH` / major display headings: serif (Georgia/Times New Roman in current implementation), light/minimal texture only.
- `LOCAL` and supporting category text: clean, bold, highly readable.
- Body/UI text: clean sans-serif (Arial in current implementation).
- Avoid fake-western novelty type and RRM's Inter-based UI type on RRL surfaces.

## Pages in RRL scope

Live and on-brand today:
- `marketplace.html` (loads `assets/css/rebel-ranch-local.css`)
- `marketplace-seller-page.html` (loads `assets/css/rebel-ranch-local.css` + `assets/css/marketplace-seller-page.css`)

Live and **not yet compliant** — styled on RRM's `assets/css/brand-tokens.css` + a bespoke dark green/gold `assets/css/marketplace-seller.css` instead of RRL's own tokens:
- `marketplace-seller-dashboard.html` — correction in progress.

Not a live page (redirect stub to `marketplace.html`; do not resurrect its old dark-green styling if this page is ever rebuilt):
- `marketplace-directory.html` — its old `assets/css/marketplace-directory.css` is dead code (referenced only from a `.backups/` snapshot). If a real standalone directory page is built in the future, it must use RRL's tokens, not that file.

## Correcting a non-compliant page

1. Load `assets/css/rebel-ranch-local.css` and reuse its existing `--olive`/`--cream`/`--tan`/`--line`/`--ink`/`--muted`/`--shadow` tokens and `.rrl-*` shared classes rather than porting RRM's `--rrm-*` tokens or introducing new ones.
2. Match the storefront's established look and feel (cream canvas, olive text/borders, tan warm accents, serif display headings) rather than a new interpretation.
3. Update this document's "Pages in RRL scope" list once a page is corrected.

## Relationship to other program styling

Same boundary RRM already draws for Creation Station applies here: RRL's styling does not bleed into RRM's own pages, and RRM's styling does not bleed into RRL's. Each program's visual system is authoritative on its own pages only.
