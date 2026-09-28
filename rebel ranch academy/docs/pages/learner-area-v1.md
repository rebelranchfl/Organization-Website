# Learner Area v1 — Page Decision Record

**Program:** Rebel Ranch Academy (RRA)  
**Surface:** academy.rebelranchministries.org `/learn` (redirects to `/learn/library`)  
**Code:** `Rebel-Ranch-Academy-Program-Hub/app/learn/`  
**Mode:** implementation (owner "go", 2026-09-27: start with the layout and the Library screen)  
**AI-Agent:** Claude (claude-opus-5-5) · **Session:** Academy back office restructure 2026-09-27

## 1. Owner decisions on record

| Date | Decision |
|---|---|
| 2026-09-27 | "RRA UI Direction 1 Learning Hub Dashboard" concept (ChatGPT) is **APPROVED as the structure**. Logo, colors, taglines and labels are design-layer and changeable; do not copy the concept literally. |
| 2026-09-27 | ~~SUPERSEDED 2026-09-28~~ Colors: **keep the Academy navy / gold** so the learner area matches the program (owner: "Keep it navy… If we want to switch it later, we can"). This supersedes the brief green/gold preference from earlier the same day. Colors come only from the Academy tokens in `app/globals.css`, per the approved color direction in `REBEL-RANCH-ACADEMY-CONCEPT-AND-DIRECTION.md`: navy frame, cream/paper learning surfaces with navy text, gold for accents and actions (never as text on light surfaces), Georgia headings. |
| 2026-09-27 | Build against **current capability only** — no screen that leads to nothing. |
| 2026-09-27 | Split: Claude builds code and data wiring; ChatGPT generates images for the marked image spots. |
| 2026-09-27 | Do **not** turn on the content agent yet. |
| 2026-09-27 | Owner did not like the navy version. **Trial on preview:** RRM homepage black `#050806`, forest green `#204227`, green fade `#1D4024`→`#122A18`, maroon `#7A1E1E` (used sparingly), cream `#F0EDD8`/`#D7D1B3`, with the Academy gold for buttons. Navy kept in Git (commit 71e6bee). |
| 2026-09-28 | **Owner picked green over navy** ("i like the green over the blue"). The learner area uses the RRM black / green / maroon with Academy gold. Home page and RRA color direction were still navy. |
| 2026-09-28 | Owner chose **option 1**: the whole Academy matches. Home page switched to green/black/maroon + gold (scoped to the home page so `/wealth-management/trusts` is unchanged) and the color direction in `REBEL-RANCH-ACADEMY-CONCEPT-AND-DIRECTION.md` updated. |

## 2. Working brief

- **Visitor:** parents/homeschoolers, teens and adults arriving from the Academy home page.
- **Problem they recognize:** "What can I actually learn here, and can I start now?"
- **Two-second takeaway:** "Here is everything, sorted by area, and I can start something free right now."
- **Offer:** free sample activities now; paid materials appear automatically once released.
- **Sections and their jobs:**
  1. Header band — say what this page is (image spot `library-hero`).
  2. Learning areas — seven tiles (All + 6) that filter the page. Clickable.
  3. Academy materials — released items from Supabase `get_academy_catalog()`. **Hidden while nothing is released** (currently 0).
  4. Free activities — the 7 sample activities the home page already offers; "Open activity" shows what you learn, the challenge, and "Save to my plan" (same device-saved plan as the home page, key `rra-plan`).
- **Shell:** sidebar (Library only), "Academy home" and "Rebel Ranch Ministries" links; phone top bar with menu; footer with Academy block and RRM parent block (Contact, Privacy Policy, Legal Disclosures, socials, © Faith, Family & Nature Church, Inc.).
- **Assets:** approved Academy logo `rebel_ranch_academy_logo_transparent-cropped.png` and RRM white logo, both linked from rebelranchministries.org (same files the Academy home page uses). No base64 images.
- **Colors (2026-09-28):** black sidebar, top bar and footer; forest green page; green-fade cards, tiles and pop-up; Academy gold buttons and small labels; maroon only on the Free labels and thin accent lines.
- **Phone first:** single column, 2-column area tiles, menu drops down under the top bar. **Desktop:** fixed sidebar, 7 tiles in one row, 3-column cards.
- **Pill rule:** only buttons are rounded; the "Free" label is square.

## 3. Not in v1 (added only when there is something behind them)

Dashboard, My Materials, Lesson player, Checkout, Account / Sign-in on the academy domain, Progress, Certificates, Community. Pay-per-item vs membership is still an **open owner decision**.

## 4. Image spots for ChatGPT

Each spot is marked in the page with `data-image-slot`. Until an image is approved, the spot shows the area icon on a dark green gradient.

| Slot | Shape | Subject |
|---|---|---|
| `library-hero` | wide band, ~1200×260 | Ranch/learning scene; text sits on the left, so keep the left side calm and dark |
| `activity-hard-times` | 16:9 | Stay Useful in Hard Times |
| `activity-speak-up` | 16:9 | Speak Up Without Blowing Up |
| `activity-business-map` | 16:9 | Map the Work Behind the Work |
| `activity-money-map` | 16:9 | Build a Real-World Money Map |
| `activity-water-ready` | 16:9 | How Much Water Do You Really Need? |
| `activity-food-system` | 16:9 | See Food as a Life-Sustaining System |
| `activity-team-code` | 16:9 | Write Your Family Team Code |
| `material-<project_id>` | 16:9 | Released materials use `cover_image_url` from their release record |

Images follow the existing Academy image handoff and checks. No logo may be generated inside an image.

## 5. Status

| Item | Status |
|---|---|
| Supabase catalog (`20260927200000_academy_learner_catalog_v1.sql`) | Applied; anonymous visitor sees 6 areas, 0 released items |
| Shell + Library | BUILT LOCALLY · TECHNICALLY CHECKED in green/black/maroon + gold (build + render tests pass; phone 390px and desktop 1280px screenshots, no sideways scroll, no console errors; filter, pop-up, save-to-plan and Escape checked) |
| Independent visual review | NOT DONE |
| Owner visual approval | PENDING (private preview) |
| Public release | NOT DEPLOYED — merge only after owner approval |
