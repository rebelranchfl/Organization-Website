# Rebel Ranch Ministries — Brand Guide

This is the documented source of truth for the **Rebel Ranch Ministries (RRM) organization brand**. It does not define or override the individual brands of RRM programs.

## Brand architecture — owner directive 2026-09-06

**RRM is its own brand. Every RRM program also gets its own brand.**

The RRM brand governs organization-level RRM material and shared RRM public surfaces. Program brands belong to their respective program ecosystems and must be documented and maintained there.

A program may intentionally share elements with RRM, but similarity does not erase the program's separate brand. Do not automatically apply RRM visual identity, logo, tone, imagery, taglines, or other brand choices to a program unless that program's approved brand rules say to do so.

Examples include Rebel Ranch Academy, Creation Station, Rebel Ranch Local / Marketplace, Business Freedom, Roots, Boots & Animal Poops, Rebel Ranch Rescue, and future RRM programs. Each program must have an owner-approved brand definition appropriate to that program. If a program's brand is not yet fully defined, treat it as **not yet defined**; do not invent a brand or silently default it to RRM.

When RRM and a program appear together, follow both the RRM organization-brand rules and the applicable program-brand rules. If they conflict and the intended treatment is not already documented, stop and bring the specific conflict to the owner for clarification. Record the resulting decision in the appropriate authoritative document.

> **Current RRM public-surface authority:** [rrm-visual-rules.md](./rrm-visual-rules.md) governs the approved RRM public surfaces identified there. Program-specific visual systems remain governed by their own approved program rules.

## RRM Logo

The official RRM organization mark is the barbed-wire-and-skull emblem: "REBEL RANCH MINISTRIES" arced above, a skull in a cowboy hat and bandana at center, "FAITH · FAMILY · FREEDOM" below.

- **Dark backgrounds** → `assets/brand/rrm-logo-white.png`
- **Light backgrounds** → `assets/brand/rrm-logo-black.png`

Both are square, transparent-background, high resolution (6250×6250). Scale proportionally only. Do not recreate, approximate, or substitute the RRM logo.

Known program logo assets currently present in the repository include:

- Creation Station: `assets/Creation Station Logo.png` / `assets/creation-station-logo.png`
- Rebel Ranch Academy: `assets/RRA Logo.png` / `assets/RRA Logo for white backgrounds.png` / `assets/rebel_ranch_academy_logo_transparent.png`

The presence of an asset does not by itself establish the complete brand rules for that program. Program brand documentation controls program use.

## RRM Color System

Defined as CSS custom properties in `assets/css/brand-tokens.css`. These are **RRM organization-brand roles**, not automatic program-brand rules.

| Token | Hex | RRM role |
|---|---|---|
| Phase 1 page surface | `#204227` | Current RRM canvas for approved public surfaces |
| Phase 1 hero/card/form surface | `#1D4024` → `#122A18` | Current RRM vertical fade for approved heroes, cards, and forms |
| `--rrm-bg-1/2/3` | `#152A18` → `#07120A` → `#050b06` | Historical legacy-page canvas |
| `--rrm-card-1/2` | `#102315` → `#0A160D` | Historical legacy-page card fill |
| `--rrm-card-line` | `#284a29` | RRM card border |
| `--rrm-ink` | `#F0EDD8` | RRM headings and primary text on dark backgrounds |
| `--rrm-muted` | `#d7d1b3` | RRM body/secondary text on dark backgrounds |
| `--rrm-green` | `#97C459` | RRM accent only; never a fill |
| `--rrm-green-dark` | `#4A7C59` | RRM border/outline role |
| `--rrm-green-fill` | `#142617` | RRM secondary-control fill |
| `--rrm-green-fill-hover` | `#1b341f` | RRM secondary-control hover fill |
| `--rrm-gold` | `#C17F24` | RRM primary interactive fill / border / decorative stroke |
| `--rrm-gold-dark` | `#7b4b13` | RRM primary-button gradient stop |
| `--rrm-gold-bright` | `#EF9F27` | RRM eyebrow/link/emphasis text |
| `--rrm-rust` | `#a94c3e` | RRM negative/old-way framing accent |
| `--rrm-brown` | `#2A1A0A` | RRM deep decorative accent |

For current RRM public-surface application, follow `rrm-visual-rules.md` when it is more specific.

## RRM Typography

The current RRM organization website uses the system stack (`Arial, Helvetica, sans-serif`). This is an RRM rule. **Do not treat it as a prohibition on a separately approved program typography system.**

## RRM Favicon

`assets/brand/rrm-logo-black.png` (or white, depending on background) may be referenced as the current RRM favicon treatment. A program may have its own favicon/mark when its approved brand system defines one.

## Program-brand rule

Program brand decisions belong with the program. Repository-wide documentation may identify the relationship between RRM and its programs, but it must not duplicate or independently redefine detailed program branding. When program-brand information is found scattered through repository-wide documents during the documentation consolidation project, preserve the information, resolve contradictions with the owner, and move the final authoritative rule into the applicable program ecosystem.
