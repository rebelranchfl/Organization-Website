# Rebel Ranch Local Visual Rules

**Status:** Approved and locked

**Authority:** Rebel Ranch Local (RRL) is a program of Rebel Ranch Ministries (RRM), the same relationship Creation Station and Rebel Ranch Academy have to RRM. RRM's general public-surface styling — `docs/rrm-visual-rules.md` and `docs/brand-guide.md` — governs RRM's own pages. It does **not** govern RRL pages. Once a program has its own locked visual identity, that program's styling applies on its own pages instead of RRM's general one, the same carve-out `docs/rrm-visual-rules.md` already makes for Creation Station. This document is RRL's equivalent of `docs/creation-station/brand/public-visual-rules.md`.

Every agent must read this document before starting visual, layout, or styling work on any RRL/Marketplace page. If a page under RRL scope is styled with RRM's dark green/gold system instead of RRL's own, that is a defect to correct, not a valid alternative.

## Source of truth

- **Brand/palette/voice:** `marketing/social-media/rebel-ranch-marketplace/brand/BRAND.md`.
- **Implemented design tokens:** `assets/css/rebel-ranch-local.css` — defines `--olive`/`--olive-2`, `--cream`/`--cream-warm`, `--paper`, `--tan`/`--tan-2`, `--rust`/`--rust-2`, `--brown`/`--brown-2`, `--line`, `--ink`, `--muted`, `--shadow`/`--shadow-lift` and the shared `.rrl-*` header/hero/card classes. Any new or corrected RRL page should load this file and reuse these tokens rather than inventing new hex values or a parallel palette.

## Palette

| Role | Name | Hex |
|---|---|---|
| Primary | Ranch Olive | `#2F3D1F` (`rebel-ranch-local.css`: `--olive:#2f3d1f`, `--olive-2:#3c4e29` for gradients) |
| Secondary | Sage | `#6B7F4A` |
| Light canvas | Cream | `#F2E9DA` (`rebel-ranch-local.css`: `--cream:#f5eddf`, `--cream-warm:#ecdcbe` for section variety, `--paper:#fbf6ec`) |
| Warm accent | Saddle Tan | `#B47A4A` (`rebel-ranch-local.css`: `--tan:#b47a4a`, `--tan-2:#96613a` for gradients) |
| Primary warm accent | Rust | `--rust:#b5502a`, `--rust-2:#93401a` for gradients — see "Rust usage" below |
| Dark warm | Leather Brown | `#5A3A24` (`rebel-ranch-local.css`: `--brown:#5c3a22`, `--brown-2:#432911` for gradients) |
| Dark neutral | Ranch Charcoal | `#1A1A1A` |

Camo/field-inspired direction, not tactical/military. Do not introduce RRM's forest-green/gold (`--rrm-green`, `--rrm-gold`, `#204227`, etc.) on an RRL page.

### Rust usage

On RRL's **public-facing pages** (`marketplace.html` and similar), rust is the primary warm accent — used freely for icon badges, borders/frames, category labels, and share/invite links, not restricted to a single meaning.

This is a deliberate, narrower exception to the seller **dashboard's** color rule (`assets/js/marketplace-seller-views.js` / `assets/css/marketplace-seller.css`), where rust/orange is reserved for money, urgency, or promo *only*, alongside olive = brand/primary action, sage = status-good, amber = status-pending/caution, red = destructive-only. That stricter rule still governs the dashboard. Do not backport the dashboard's narrow rust rule onto public RRL pages, and do not backport the public pages' broader rust usage onto the dashboard.

## Typography

- `REBEL RANCH` / major display headings: serif (Georgia/Times New Roman in current implementation), light/minimal texture only.
- `LOCAL` and supporting category text: clean, bold, highly readable.
- Body/UI text: clean sans-serif (Arial in current implementation).
- Avoid fake-western novelty type and RRM's Inter-based UI type on RRL surfaces.

## Pages in RRL scope

Live and on-brand today:
- `marketplace.html` (loads `assets/css/rebel-ranch-local.css`)
- `marketplace-seller-page.html` (loads `assets/css/rebel-ranch-local.css` + `assets/css/marketplace-seller-page.css`)
- `marketplace-seller-dashboard.html` (corrected 2026-08-26 — now loads `assets/css/rebel-ranch-local.css`; `assets/css/marketplace-seller.css` rewritten to use RRL's `--olive`/`--cream`/`--paper`/`--tan`/`--line`/`--ink`/`--muted`/`--shadow` tokens throughout instead of RRM's `--rrm-*` tokens)

Not a live page (redirect stub to `marketplace.html`; do not resurrect its old dark-green styling if this page is ever rebuilt):
- `marketplace-directory.html` — its old `assets/css/marketplace-directory.css` is dead code (referenced only from a `.backups/` snapshot). If a real standalone directory page is built in the future, it must use RRL's tokens, not that file.

## Correcting a non-compliant page

1. Load `assets/css/rebel-ranch-local.css` and reuse its existing `--olive`/`--cream`/`--tan`/`--line`/`--ink`/`--muted`/`--shadow` tokens and `.rrl-*` shared classes rather than porting RRM's `--rrm-*` tokens or introducing new ones.
2. Match the storefront's established look and feel (cream canvas, olive text/borders, tan warm accents, serif display headings) rather than a new interpretation.
3. Update this document's "Pages in RRL scope" list once a page is corrected.

## Relationship to other program styling

Same boundary RRM already draws for Creation Station applies here: RRL's styling does not bleed into RRM's own pages, and RRM's styling does not bleed into RRL's. Each program's visual system is authoritative on its own pages only.

## Mobile public-page composition

- On phones, hero copy and controls sit in their own readable content area. The hero image follows as a separate visual; live text must not be placed over that image.
- Large visual category cards may remain on desktop. On phones, they become compact expandable rows so visitors choose a category before its image, description, and action are revealed.
- The RRL program header may retain the RRL identity, but it must provide a usable mobile navigation control with a clear path back to the wider RRM website.
- RRL public pages end with the standard Rebel Ranch Ministries organization footer so the program remains visibly connected to its parent organization.
- The Marketplace hero's former Browse/Services pill actions and the oversized five-item mobile value panel were rejected on 2026-09-21 because they crowded the phone experience and repeated the next section's choices.
- The Marketplace hero search was removed from the hero on 2026-09-21. Search remains available with the revealed local listings, where it supports the visitor's next task instead of competing with the hero.
- The RRL mobile header uses the approved rust accent with white text and controls. The mobile hero image uses a product-focused crop beneath the separate copy area.
