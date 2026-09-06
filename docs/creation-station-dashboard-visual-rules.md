# Creation Station Dashboard (Member App) Visual Rules

**Status:** Owner-approved and governing

**Version:** 1.1

**Approved:** 2026-08-08  
**Reconciled:** 2026-09-06 — aligned with current Creation Station authority and implementation posture

**Approved reference:** `assets/css/creation-station.css` (the same file that governs `creation.html`, per `creation-station-visual-rules.md`)

**Matching CSS:** `assets/css/creation-station-dashboard.css`

## Why this document exists

`creation-station-visual-rules.md` locks the Creation Station **public marketing page** (`creation.html`) but does not govern the full member dashboard experience. This document governs the dashboard's durable visual identity: colors, gradients, typography, button emphasis, and the distinction between interactive controls and non-interactive labels.

Read this document together with:
- `docs/rebel-ranch-ecosystem-charter.md`
- `docs/creation-station-positioning.md`
- `docs/creation-station-visual-rules.md`
- the applicable current Creation Station system/technical controls when implementation status matters.

Dated handoffs and historical implementation notes are not current authority. Verify current implementation rather than relying on an older handoff.

## 1. Canonical color tokens — copy exactly, do not re-derive

Pulled directly from `assets/css/creation-station.css`'s `:root` block (the owner-locked homepage reference). The dashboard's own `:root` in `assets/css/creation-station-dashboard.css` must use these same values, not independently chosen approximations:

```css
--ink: #271b31;
--text: #594b61;
--purple-950: #25043f;
--purple-900: #34105b;
--purple-800: #4b1878;
--purple-700: #65299a;
--purple-500: #9352c8;
--purple: #5b258f;
--pink: #f04b98;
--coral: #ff756d;
--orange: #f59b45;
--gold: #f7c94c;
--lime: #b7d957;
--teal: #0397a4;
--aqua: #55d7d1;
--blue: #3868c9;
--lavender: #efe5ff;
--rose: #ffe2ef;
--sky: #daf6f4;
--rainbow: linear-gradient(135deg, #f04b98 0%, #ff756d 20%, #f7c94c 43%, #b7d957 65%, #55d7d1 100%);
--primary: linear-gradient(135deg, #f04b98 0%, #ff756d 52%, #f7c94c 100%);
--purple-gradient: linear-gradient(135deg, #7b36ad 0%, #542083 48%, #2b0848 100%);
--deep-gradient: linear-gradient(145deg, #23043d 0%, #46106e 48%, #7f2586 100%);
```

Near-miss colors are not acceptable substitutes for the canonical tokens.

## 2. Page canvas — two tones, not one

The public Creation Station identity alternates dark/jewel-tone moments with light content areas. The dashboard should preserve that rhythm:

- **Dark/jewel-tone bands** (hero banners, featured moments): use `--deep-gradient` or a close variant consistent with the approved public identity.
- **Light bands** (ordinary content, cards, panels): use pale lavender-white, **`#f8f3ff`**, with `#fbf8ff` as a secondary light shade, rather than warm cream.
- The sidebar (`linear-gradient(180deg,#1a0f33,#0e0720)`) is an approved dark treatment and should remain consistent unless a later owner-approved redesign supersedes it.

## 3. Button emphasis

The dashboard is an application with many ordinary actions, so it needs a clear distinction between ordinary controls and the primary/recommended action.

- Plain/default buttons may retain a neutral Creation Station treatment.
- `.button.primary` is reserved for the primary/recommended action and must use the canonical `--primary` gradient rather than an independently chosen approximation.
- Do not make every action visually primary.
- Do not style non-actions as buttons.

## 4. Typography

Match the public Creation Station font stack:

```css
font-family: "Segoe UI", ui-sans-serif, system-ui, -apple-system, Roboto, Arial, sans-serif;
```

## 5. Rainbow wordmark

Use the approved formula wherever the dashboard intentionally renders “Creation Station” as a rainbow wordmark:

```css
background: linear-gradient(135deg, #f04b98 0%, #ff756d 20%, #f7c94c 43%, #b7d957 65%, #55d7d1 100%);
-webkit-background-clip: text;
background-clip: text;
color: transparent;
```

## 6. Non-interactive elements must not look clickable

This is a standing rule across Creation Station and the broader RRM web system.

**Pill-shaped UI is reserved for clickable links/actions.** Non-interactive labels, status indicators, tags, badges, descriptors, and informational text must not use pill styling or otherwise visually imitate clickable controls.

If an element does not perform an action or navigate when clicked, it must be visually distinct from buttons and links. This applies regardless of whether older code or documentation used `.tag`, badge, chip, or similar patterns.

Any existing violation should be treated as an implementation issue to evaluate and correct through the normal owner-controlled change and verification process; this document does not by itself claim that every existing instance has already been corrected.

## 7. Scope and authority boundaries

This document governs **dashboard visual identity**, not Creation Station's entire product definition or technical architecture.

- Product definition, audience, current capabilities, the Creation Companion, Studio pathway, membership/product positioning, and future direction are governed by `docs/creation-station-positioning.md`.
- Public-page visual identity is governed by `docs/creation-station-visual-rules.md`.
- Backend, security, data, publication, and implementation status belong in the applicable current Creation Station system/technical controls.
- Layout, navigation, feature scope, gamification, and Companion evolution may continue to improve under owner direction and the ecosystem Charter's continuous-improvement standard.

The Creation Companion is **built and part of the current dashboard experience**. Its current capability and future AI-assistance direction must be described according to `docs/creation-station-positioning.md`; do not revert to historical language that treats the Companion as merely open or unbuilt work.

Historical handoffs and phase documents may explain how the system evolved, but they do not override current governing documents or verified current implementation.

## Implementation check

Before presenting a Creation Station dashboard visual change as complete:

1. Confirm canonical color tokens in `creation-station-dashboard.css` match section 1 where those tokens are used.
2. Confirm `.button.primary` and equivalent primary actions use the approved primary treatment and ordinary actions remain visually secondary.
3. Confirm the font stack begins with `"Segoe UI"`.
4. Confirm light-toned sections use the approved lavender-white family rather than the retired warm cream treatment.
5. Confirm intentional Creation Station rainbow wordmarks use the approved formula.
6. Confirm non-interactive elements do not use pill styling or visually impersonate clickable controls.
7. Verify the rendered dashboard end-to-end before describing an implementation change as resolved or complete.
