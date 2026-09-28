# Learner Area v1 — Page Decision Record

**Program:** Rebel Ranch Academy (RRA)  
**Surface (current, 2026-09-28):** main site — `rebel-ranch-academy.html` (home), `academy-library.html`, `academy-item.html`, `academy-lesson.html`, `academy-membership.html`, `academy-my-materials.html`, `academy-receipt.html`, `academy-checkout-return.html`  
**Code:** `/assets/academy/` (+ back office `assets/js/academy-release-listing.js`, `academy-sales.html`)  
**Earlier surface:** academy.rebelranchministries.org `/learn` (Program Hub, branch `claude/academy-learner-area-v1`, PR #138) — superseded by the main-site move; old address to be retired after owner review.  
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
| 2026-09-28 | **One website, one login:** the Academy moves onto rebelranchministries.org and the academy subdomain will be retired after owner review. Every program lives on the main site with its own look. `academy.html` stays untouched (separate owner rule). |
| 2026-09-28 | **Selling:** pay per item **and** memberships. Everything paid is fully locked (private storage, short-lived links, access decided by the database). Owner controls listing, price and membership plans in the back office; prices flow into PayPal automatically (no per-item PayPal links). Lesson player built but only reachable when material exists. Customers get receipts and purchase history in My Materials. |
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

## 3. Built for selling (2026-09-28) and still not in v1

Built: sign-in (shared RRM account, returns you to the page you came from), item page with Buy (PayPal), checkout return, My Materials (owned items, membership, receipts), printable receipts, membership page (menu item appears only when a plan is public), lesson player (reached from an item; not in the menu), owner release checklist on the project page, owner Sales page with membership plan editor.

Still not in v1: Dashboard, Progress, Certificates, Community.

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

## 5. Status (2026-09-28)

| Item | Status |
|---|---|
| Database (catalog, purchases, memberships, receipts, locks) | Applied. Lock rules tested in a rolled-back transaction: all pass. |
| Server functions | `academy-commerce` v2 and `paypal-webhook` v21 deployed; reject signed-out and off-site requests; notice handler still rejects unsigned PayPal notices. |
| Independent code review | DONE (separate agent). 2 high + 5 medium findings fixed and redeployed; lock rules re-tested. |
| Main-site pages | DEPLOYED 2026-09-28 (PR #139). PUBLICLY VERIFIED signed-out: all pages load on rebelranchministries.org at phone 390px and desktop 1280px with no errors or sideways scroll; My Materials, receipts and Sales send signed-out visitors to sign-in; the live site can reach the payment function. Not linked from the main navigation yet. |
| Signed-in flows (buy, receipt, My Materials, membership, owner release checklist, Sales) | NOT VERIFIED — needs the pages on the real address and a signed-in person. |
| Live PayPal payment | NOT VERIFIED — needs an owner-approved test purchase. |
| Independent visual review | NOT DONE |
| Old academy address | Still serves the Program Hub (now green + `/learn`). Not forwarded yet — owner to decide forwarding and relinking. |
| Leftover public access / Creation Station bundle | `publish-ledger` switched off, `site` bucket private; stale rule blocking Club and bundles removed (tested). |
