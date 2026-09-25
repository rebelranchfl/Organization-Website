# Social Content Hub — Agent Guide (Claude, ChatGPT, or any browser agent)

**Status:** Active — Stage 1 (browser-operated)
**Created:** 2026-09-25
**AI-Agent:** Claude Code (Claude Opus 5.5)
**Session:** Social Content Hub — verify system + all-programs full-control v2

## The one rule

**The Social Content Hub is the single source of truth.**
`https://rebelranchministries.org/social-content-hub.html` (owner admin login).

Every agent — Claude, ChatGPT, or anyone else — works *through the Hub*, not
around it. The owner controls everything there: programs, purposes, campaigns,
links, channels, posts, images, schedules, outreach. Agents never need a
private copy of the queue, and the owner never needs an agent to make a change.

`draft-posts.md` and `partner-outreach/outreach-queue.md` are archives as of
2026-09-25. Do not add new work to them.

Still binding and still read before writing anything: `brand-rules.md`,
`content-calendar.md` (Educate-First rule, weekly minimums), `image-library.md`,
`partner-outreach/partner-rules.md`, `funding/funding-rules.md` (donation/tax
language), `docs/non-negotiables.md`, and `AGENTS.md`.

## Before you start any session

1. Open the Hub in the browser the owner is signed into.
2. Set **Working as** (top right) to your name — `Claude` or `ChatGPT`.
   Every change is logged under that name in the **Activity** tab.
3. Read the five counters at the top — they are the work queue.

## Jobs, in the order to do them

### 1. Post what is ready (Content → "Ready to post", or the Schedule tab)
Ready = status `Approved`, image `Approved` or `Not Needed`, not paused.

1. Open the **Schedule** tab. Work *Overdue* first, then today, then
   "Approved and ready, but not scheduled".
2. For each post: **Copy post** (caption + link + hashtags are combined for
   you) and **Image** (opens the image to download).
3. For each channel on the post:
   - **Facebook Page / Instagram:** schedule or publish in Meta Business Suite
     (business.facebook.com → Planner / Create post). One post can go to both.
   - **Facebook group:** open **Mark posted**, pick the group — its posting
     rules appear right there. Follow them exactly (donation posts, links,
     promo days, once-per-week limits). If the rules say no, don't post there.
4. Back in the Hub: **Mark posted** → channel, `Published` (live now) or
   `Scheduled` (queued in Meta), time, and the post link if you have it.
   Record **one entry per channel**.

Never post anything that is not `Approved`. Never boost, pay, or change
account settings.

### 2. Make missing images (Content → "Needs an image")
ChatGPT handles image generation.

1. **Copy image prompt** on the card. If there is no prompt, write one in
   **Edit → Image prompt** from `brand-rules.md` + `image-library.md` (program-
   specific visuals — do not default to farm/ranch imagery unless the post is
   about farm work), and set image status to `Ready for Image`.
2. Set image status to `Generating` while you work.
3. Generate, inspect for spelling, wrong logos, wrong program look, fake UI.
4. **Upload image** on the card. The image lands as `Needs Review` for the
   owner. Do not approve your own image.

### 3. Draft new content (Content → "+ New content")
Pick Program, Purpose, Campaign; write the caption, CTA, hashtags; pick a link
from the link library (the owner manages links in **Setup → Links** — e.g. the
GoFundMe link); pick channels; write the image prompt. Save as `Draft` or
`Needs Review`. Only the owner sets `Approved`.

Respect the purpose's weekly limit (Donations = 1/week). The Hub warns when
scheduling over a limit.

### 4. Partnership pipeline (Outreach tab)

**Who runs it:** Claude (scheduled task "RRM Partnership Agent", weekdays).
ChatGPT runs the same steps *only* if Claude is unavailable. Owner rule
2026-09-25: Claude = research + technical; ChatGPT = images + backup.

**Address:** everything goes out from and comes back to
`partners@ffnchurch.org` (Proton, "Partnerships" folder). Setup → Outreach &
agent settings holds the address, signature, on/off switch, prospects per run,
research focus, **qualification rules (fit scoring)** and follow-up days —
read them at the start of every run.

**Owner-managed lists (Setup), always read before researching:**
- **Service area** (`social_service_areas`) — only Active areas; High first.
  Gilchrist County and all of Alachua County including Gainesville are High.
- **Prospect types** (`social_prospect_types`) — High first. Small local
  businesses, farms/growers, feed stores and makers are High: at least half
  of every run's new prospects come from High types, not just banks and big
  organizations.
- **Needs list** (`social_needs`) — Active items not `Met`, High first. Match
  prospects to specific needs and name the need in `offer_ask`.
- **Templates** (`social_templates`) — start every first message, follow-up
  and thank-you from the matching Active template, then personalize it.

**Language:** follow the "Confident language standard" in
`marketing/funding/funding-rules.md`. We're a nonprofit ministry of a
tax-exempt church; gifts are tax-deductible and we send a receipt; say the
partner benefits outright. Don't hedge and don't explain the donor's taxes.

**The loop** (stage = `social_outreach.status`; each message in
`social_outreach_messages` has its own status):

1. **Research** → add prospects as stage `Prospect` with `fit_reason`,
   `fit_score` (1–5), `county`, `category`, `offer_ask`, contact details,
   `sources` (real links you actually checked), `found_by` = your name.
   Check for duplicates first (name, website, email). Up to
   `partner_research_per_run` per run. **Owner reviews:** Approve prospect →
   `Prospect Approved`, or Not a fit → `Rejected` (reason saved in notes —
   read those; they teach you what she doesn't want).
2. **Draft** → for each `Prospect Approved` with no open draft, add an
   Outbound message, status `Suggested`; set stage `Draft`.
3. **Revise** → messages at `Needs Edit` have an `owner_comment`. Rewrite the
   body to address it, set back to `Suggested`, clear nothing else.
4. **Owner approves** → message `Approved` (stage `Approved`).
5. **Send** → only after the owner says so **in chat** for that batch (an
   `Approved` status alone is never permission). Send from
   `partners@ffnchurch.org` in Proton with the signature, then Mark sent
   (stage `Sent`, follow-up date set).
6. **Replies** → read the Partnerships folder; for each new reply log an
   Inbound message (`Received`, `external_ref` = sender + date + subject so it
   is never logged twice); stage → `Replied`.
7. **Suggest a response** → add an Outbound `Suggested` message answering
   the reply; stage `In Conversation`. Back to step 4.
8. **Follow-ups** → when `follow_up_on` ≤ today and no reply, draft a short,
   friendly follow-up as `Suggested`. Max two follow-ups, then propose
   `Archived` in notes.
9. **Close** → owner sets `Partner`, `Declined` or `Archived`.

Rules that always apply: `partner-rules.md` (A/B/C categories, phone/email/
online only — limited transportation, no festival vendor/booth framing),
`funding-rules.md` donation/tax language ("tax-deductible", donation letter
offered, never "tax exempt" or guaranteed write-offs), Rebel Ranch Ministries
is "a ministry of Faith, Family, and Nature Church", Roots, Boots & Animal
Poops and Rebel Ranch Rescue are their own RRM programs, and 3P Help Me is
never mentioned. Never promise money, dates or services the owner hasn't
confirmed.

### 5. Close the loop (Results & Learning tab)
- Weekly: open each post record → add reach, reactions, comments, shares,
  clicks from Meta Insights.
- When a pattern repeats across 2+ weeks, add a **Learning** (`Proposed`) with
  what you saw, the evidence, and what to change. The owner approves; then
  apply it (new content, calendar change) and set it to `Applied`.

## Stages (what is automated when)

| Stage | Posting | Images | Outreach | Results |
|---|---|---|---|---|
| **1 — now** | Browser agent via Meta Business Suite + groups | ChatGPT, uploaded in Hub | Browser/email drafts, owner OKs sends | Typed in from Insights |
| 2 | Meta Graph API auto-publish for Page/IG from the Hub schedule (owner creates the Meta app + token herself) | same | Scheduled follow-up reminders | Pulled from Insights API |
| 3 | Groups stay browser-only (Meta removed group posting from its API) | Optional image API | — | Auto-proposed learnings |

## Where things live (for builders)

- Page: `social-content-hub.html` + `assets/js/social-content-hub.js`
- Database (Supabase project `dfrwxpuojeiykaignyny`), all admin-only via RLS:
  `social_programs`, `social_purposes`, `social_campaigns`, `social_links`,
  `social_channels`, `social_content_items`, `social_content_assets`,
  `social_post_history`, `social_reels`, `social_reel_frames`,
  `social_outreach`, `social_learnings`, `social_activity_log`
- Uploaded images: private storage bucket `social-media`
- Migration: `supabase/migrations/20260925120000_social_content_hub_v2_all_programs.sql`
