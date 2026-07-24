# Rebel Ranch Ministries — Brand Guide

This is the first documented source of truth for the site's visual
identity. Before this, colors were chosen page-by-page with no shared
reference, which caused drift (the same intended color typed slightly
differently from file to file) and no consistent logo usage. This
document — plus `assets/css/brand-tokens.css` — is now that reference.

## Logo

The official mark is the barbed-wire-and-skull emblem: "REBEL RANCH
MINISTRIES" arced above, a skull in a cowboy hat and bandana at center,
"FAITH · FAMILY · FREEDOM" below.

- **Dark backgrounds** → `assets/brand/rrm-logo-white.png`
- **Light backgrounds** → `assets/brand/rrm-logo-black.png`

Both are square, transparent-background, high resolution (6250×6250) —
safe to scale down for any use (header, favicon, print) without a
redesign. Do not stretch non-uniformly; scale proportionally only.

**Sub-brand marks** (used only within their own section, not on main
ministry pages):
- `assets/Creation Station Logo.png` / `assets/creation-station-logo.png` — Creation Station
- `assets/RRA Logo.png` / `assets/RRA Logo for white backgrounds.png` / `assets/rebel_ranch_academy_logo_transparent.png` — Rebel Ranch Academy

## Color

Defined as CSS custom properties in `assets/css/brand-tokens.css`. This
formalizes the dark olive/gold/green palette that was already the
majority pattern across main-site pages (index, marketplace, academy,
align, community, contact, producer-interest, and others) rather than
inventing something new — it's the palette closest to the actual logo's
rugged, earthy tone. One deliberate addition: `--rrm-rust`, a true
rust/leather tone tying directly to the logo's barbed wire, for use as a
secondary accent where gold alone feels too soft (hover states, secondary
CTAs, dividers).

| Token | Hex | Use |
|---|---|---|
| `--rrm-bg` | `#07120A` | Page background (dark, primary) |
| `--rrm-bg-alt` | `#0D1E15` | Secondary dark background / gradients |
| `--rrm-panel` | `#102315` | Card/panel background on dark pages |
| `--rrm-panel-alt` | `#152A18` | Secondary panel tone |
| `--rrm-ink` | `#F0EDD8` | Body text on dark backgrounds (warm off-white) |
| `--rrm-muted` | `#B9B596` | Secondary/muted text on dark backgrounds |
| `--rrm-line` | `#1E3A20` | Borders/dividers on dark backgrounds |
| `--rrm-green` | `#97C459` | Primary accent (links, highlights) |
| `--rrm-green-dark` | `#4A7C59` | Secondary green (hover, depth) |
| `--rrm-gold` | `#C17F24` | Primary CTA / brand gold |
| `--rrm-gold-bright` | `#EF9F27` | Gold hover/emphasis state |
| `--rrm-rust` | `#B5541E` | Secondary accent, ties to logo's barbed wire |
| `--rrm-rust-dark` | `#8A3F15` | Rust hover/emphasis state |
| `--rrm-brown` | `#2A1A0A` | Deep brown, dark UI accents |
| `--rrm-danger` | `#6A1A1A` | Errors/warnings |
| `--rrm-bone` | `#F5EFE1` | Light background (cards on light pages, e.g. Marketplace dashboard) |
| `--rrm-paper` | `#FFFAF2` | Lightest surface (inputs, inner cards) |

**Creation Station is an intentional exception** — it keeps its existing
softer cream/purple/teal look (`creation-station-dashboard.css` and
related files) as a deliberate sub-brand for that kid-focused section.
Do not migrate it to the tokens above without a separate decision.

## Typography

No custom/branded font is loaded anywhere in the site today — every page
uses the system stack (`Arial, Helvetica, sans-serif`). This is
consistent already and doesn't need to change to be "on brand." If a
Western-styled display font for headings is wanted later (something
closer to the logo's lettering), that's a deliberate future addition,
self-hosted rather than a third-party CDN call, consistent with how
`supabase-js` is already vendored locally rather than loaded from a CDN.

## Favicon

The site has no favicon anywhere today. `assets/brand/rrm-logo-black.png`
(or white, depending on default browser theme) is referenced directly as
a stopgap — browsers scale it down fine. A purpose-cropped, multi-size
favicon (`.ico` plus 32/180px PNGs) is a worthwhile future polish pass,
not blocking.
