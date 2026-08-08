# Creation Station Dashboard (Member App) Visual Rules

**Status:** Owner-approved and locked

**Version:** 1.0

**Approved:** 2026-08-08

**Approved reference:** `assets/css/creation-station.css` (the same file that governs `creation.html`, per `creation-station-visual-rules.md`)

**Matching CSS:** `assets/css/creation-station-dashboard.css`

## Why this document exists

`creation-station-visual-rules.md` locks the Creation Station **public marketing page** (`creation.html`) and says, in its own "Still open" section, that dashboard details are *not* covered and remain open. That gap is exactly why the member dashboard (`creation-station-dashboard.html` and everything under it — Studio, Projects, Portfolio, Resources, Sessions, Growth, Creation Station Studio, Parent, Admin views) has drifted from the homepage over time: nobody ever pinned it to exact values, only to a general "purple/pink/teal/gold, colorful" description.

This document closes that gap. It does **not** change the dashboard's layout, navigation structure, or features — those remain open per the same section of `creation-station-visual-rules.md`. It only pins the dashboard's **colors, gradients, fonts, and button emphasis** to byte-match the approved homepage reference, so the two feel like one product.

## 1. Canonical color tokens — copy exactly, do not re-derive

Pulled directly from `assets/css/creation-station.css`'s `:root` block (the owner-locked homepage reference). The dashboard's own `:root` in `assets/css/creation-station-dashboard.css` must use these same values, not its own independently-chosen ones:

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

**Why this matters:** the dashboard previously had its own close-but-not-identical values for shared colors (its `--pink` was `#ec4e91` vs. the homepage's `#f04b98`; its `--teal` was `#0098a5` vs. `#0397a4`; its rainbow gradient ran at 90deg with different stops vs. the homepage's 135deg). Near-miss colors read as "off" more than colors that are simply different — this is likely a real source of the "doesn't quite match" feeling.

## 2. Page canvas — two tones, not one

The homepage isn't uniformly dark or uniformly light — it alternates. The dashboard should follow the same rhythm:

- **Dark/jewel-tone bands** (hero banners, featured moments): use `--deep-gradient` or a close variant, matching `.hero`/`.studio-hero`/`.path-feature` on the homepage.
- **Light bands** (ordinary content, cards, panels): use the homepage's pale lavender-white, **`#f8f3ff`** (with `#fbf8ff` as a secondary light shade), not the dashboard's previous warm cream (`#fff8ed`). Update `--cream`/`--paper` accordingly.
- The sidebar itself (`linear-gradient(180deg,#1a0f33,#0e0720)`) is already correctly dark and already uses the correct rainbow wordmark treatment — keep it as-is.

## 3. Button emphasis — keep the primary/default distinction, just fix the exact colors

**Correction after checking the homepage's actual CSS:** the homepage's plain `.btn` class has no background of its own at all — every real homepage button always carries an explicit role class (`.primary`, `.light`, `.outline-light`, `.preview`). The homepage never had to design a "neutral, ordinary-action" button because it only ever has one or two buttons per section.

The dashboard is a real app with dozens of ordinary buttons per screen (Save, Cancel, Add, Remove, and more), so its plain `button`/`.button` **needs** a distinct neutral look, with `.button.primary` reserved for the one recommended action per screen — that's a legitimate, useful difference from the homepage, not a bug. Do not flip the default button color to pink/gold; doing so would erase the primary/secondary distinction users rely on to find the one recommended action.

The only real fix here is value drift, not structure: make sure the purple/teal used in the default button and the pink/gold used in `.button.primary` are the exact reconciled hex values from section 1 (the dashboard's old `.button.primary`/`#hero-cta` used a hardcoded `#ffbe45` gold stop instead of the real homepage `--primary` gradient — replace it with the real `--primary` token so the "this is the one important button" color matches the homepage exactly, even though the everyday/default button correctly stays purple-teal).

## 4. Typography

Match the homepage's font stack exactly:

```css
font-family: "Segoe UI", ui-sans-serif, system-ui, -apple-system, Roboto, Arial, sans-serif;
```

The dashboard previously listed plain `Arial, Helvetica, sans-serif` with no "Segoe UI" preference — a small but real, easily-fixed mismatch.

## 5. Rainbow wordmark

Use the homepage's exact formula everywhere the dashboard renders "Creation Station" as a wordmark (sidebar brand, footer tagline, any headline moment):

```css
background: linear-gradient(135deg, #f04b98 0%, #ff756d 20%, #f7c94c 43%, #b7d957 65%, #55d7d1 100%);
-webkit-background-clip: text; background-clip: text; color: transparent;
```

## 6. What this document does not settle

Layout (sidebar vs. any other structure), navigation, feature scope, gamification design, and Companion/Nova work remain governed by `creation-station-studio-dashboard-handoff.md` and future owner decisions — this document is colors, fonts, and button emphasis only. Before trusting that handoff document's feature-gap claims, re-verify against the current code — it was accurate when written (2026-07-27) but has already gone stale in places (e.g., it claims no gamification exists; points/streaks/an achievement badge are now live in `creation-station-views.js`'s `achievementPanel()`).

## Implementation check

Before presenting a Creation Station dashboard page for review:

1. Confirm `:root` color tokens in `creation-station-dashboard.css` byte-match section 1 above.
2. Confirm `.button.primary`/`#hero-cta` uses the exact `--primary` gradient token (not a hardcoded gold stop), and that the plain/default button correctly stays purple→teal — don't flip it.
3. Confirm the font stack starts with `"Segoe UI"`.
4. Confirm light-toned sections use `#f8f3ff`/`#fbf8ff`, not the old cream.
5. Confirm the rainbow wordmark formula matches section 5 exactly, wherever it's used.
