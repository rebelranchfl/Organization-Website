# Rebel Ranch Ministries — Brand Guide

This is the documented source of truth for the site's visual identity.
Before this, colors were chosen page-by-page with no shared reference.
The rules below aren't invented — they were reverse-engineered by
auditing how colors actually behave (which CSS property, how often,
where) across all 19 main-site pages, then verified with the owner
against a swatch review. **Marketplace follows this same system —
it does not get a separate sub-brand.** Reasoning: unlike Creation
Station (a genuinely different audience — young creators, a softer
register), Marketplace serves the same Rebel Ranch community engaged
in commerce, and real money/trust is involved, so it should look and
feel like the same organization, not a bolted-on separate product.

## Logo

The official mark is the barbed-wire-and-skull emblem: "REBEL RANCH
MINISTRIES" arced above, a skull in a cowboy hat and bandana at center,
"FAITH · FAMILY · FREEDOM" below.

- **Dark backgrounds** → `assets/brand/rrm-logo-white.png`
- **Light backgrounds** → `assets/brand/rrm-logo-black.png`

Both are square, transparent-background, high resolution (6250×6250) —
safe to scale down for any use without a redesign. Scale proportionally
only.

**Sub-brand marks** (used only within their own section):
- `assets/Creation Station Logo.png` / `assets/creation-station-logo.png` — Creation Station
- `assets/RRA Logo.png` / `assets/RRA Logo for white backgrounds.png` / `assets/rebel_ranch_academy_logo_transparent.png` — Rebel Ranch Academy

## Color — this is a system of roles, not just a swatch list

Defined as CSS custom properties in `assets/css/brand-tokens.css`. The
critical thing this guide gets right that earlier attempts got wrong:
**which property each color is used for matters as much as the hex
value.** Bright green in particular was misused in an early draft of
this guide as a fill color (buttons, badges) — it is never a fill
anywhere on the real site. Follow the roles below exactly.

| Token | Hex | Role |
|---|---|---|
| `--rrm-bg-1/2/3` | `#152A18` → `#07120A` → `#050b06` | Page canvas — always a radial gradient (corner-light to center to edge-dark), never a flat fill |
| `--rrm-card-1/2` | `#102315` → `#0A160D` | Card/panel fill — a vertical gradient, one step lighter than the page background |
| `--rrm-card-line` | `#284a29` | Card border |
| `--rrm-ink` | `#F0EDD8` | Headings and primary text on dark backgrounds |
| `--rrm-muted` | `#d7d1b3` | Body/secondary text on dark backgrounds |
| `--rrm-green` | `#97C459` | **Accent only — never a fill.** Gradient endpoint (always paired with gold, for thin top-accent bars), hover/active link text, small icon/label text, list-marker color, low-opacity glow washes (~6-10% alpha) |
| `--rrm-green-dark` | `#4A7C59` | Border/outline color for secondary buttons and small icon-mark borders, paired with `--rrm-green-fill` behind it. Rarely a fill by itself |
| `--rrm-green-fill` | `#142617` | The near-black companion fill behind a `--rrm-green-dark` border (secondary buttons) |
| `--rrm-green-fill-hover` | `#1b341f` | Hover state for the above |
| `--rrm-gold` | `#C17F24` | The only fill color for primary interactive elements (CTA buttons, as a gradient with `--rrm-gold-dark`). Also used for borders and decorative strokes |
| `--rrm-gold-dark` | `#7b4b13` | Darker gradient stop paired with `--rrm-gold` on primary buttons |
| `--rrm-gold-bright` | `#EF9F27` | Text role — eyebrow/overline labels, links, emphasized words inside headings |
| `--rrm-rust` | `#a94c3e` | The site's real third accent. Marks "negative/old way" framing (before/after comparisons). Verified in active use, not invented |
| `--rrm-brown` | `#2A1A0A` | Deep accent, mostly inside decorative radial-gradient art, rarely a visible flat color |

**Rules to actually follow when building anything new:**
1. Page background is always the 3-stop radial gradient, never flat.
2. Cards are always the 2-stop vertical gradient with a `--rrm-card-line` border, never a flat fill.
3. Bright green never fills a button, badge, or panel. If you want green to read as "positive," use it as *text* on a dark tinted background, not as the background itself.
4. Gold is the only color allowed to fill a primary button. Use the `--rrm-gold` → `--rrm-gold-dark` gradient.
5. Secondary/outline buttons use a `--rrm-green-dark` border over a `--rrm-green-fill` background, with `--rrm-ink` text (not colored text).
6. Rust marks "negative" or "problem" states — a real, existing part of the brand, not a new invention.

**Tokens intentionally removed from this guide** (found declared across
every page's old inline `:root` block but never actually used anywhere,
confirmed by a zero-result search for `var(--name)`): `--danger`,
`--blue`, `--line`, `--bg2`, `--panel`, `--panel2`. Don't reintroduce
them without a real reason — they were dead weight, not signal.

**Creation Station remains an intentional exception** — its own
cream/purple/teal palette (`creation-station-dashboard.css` and
related files) stays as a deliberate sub-brand for that section, per
owner decision (2026-07): it serves a genuinely different, younger
audience, unlike Marketplace.

## Typography

No custom/branded font anywhere in the site — every page uses the
system stack (`Arial, Helvetica, sans-serif`). Confirmed intentional
to keep as-is (owner decision, 2026-07) — no separate typography
treatment for Marketplace or any other section.

## Favicon

The site had no favicon before this guide existed.
`assets/brand/rrm-logo-black.png` (or white, depending on background)
is referenced directly as a stopgap — browsers scale it down fine. A
purpose-cropped, multi-size favicon is a worthwhile future polish, not
blocking.
