# Rebel Ranch Ministries Social Media Insights Tracker

## Purpose

This file tracks how Rebel Ranch Ministries content actually performs on Facebook
and Instagram, so the agent can tell Brooke what is working instead of guessing.
It answers the recurring question "should we be making reels, posts, what are
people responding to" with logged data instead of opinion.

This is read-only performance analysis. The agent does not boost a post, spend ad
budget, change audience targeting, connect or disconnect accounts, or change page
or account roles from this workflow. Any of that requires separate explicit
authorization.

The agent owns this file the same way it owns `group-rules.md` and
`image-library.md`: it pulls the data, logs it, and proposes changes. Brooke
approves, rejects, or corrects the proposed changes — she does not pull the data
herself or maintain a separate tracker.

Before creating a new draft batch, the agent should check this file the same way
it already checks `brand-rules.md`, `content-calendar.md`, `group-rules.md`,
`image-library.md`, and `posted-archive.md`.

---

## Review cadence

- The agent logs a new Insights Snapshot roughly every 2 weeks, or before building
  each new draft batch in `draft-posts.md` — whichever comes first — as long as
  there is enough new posting history to be meaningful.
- Do not draw a conclusion from fewer than about 5-6 posts of a given format
  (static/carousel vs. Reel/video) in the period being reviewed. If there isn't
  enough history yet, log what exists, note the sample is too small, and wait for
  the next cadence instead of forcing a recommendation.
- A single unusually high- or low-performing post is not a pattern. A pattern is
  the same result repeating across at least 2 consecutive review periods.

---

## Where the agent looks

Facebook and Instagram are reviewed through whatever authenticated, read-only
access is actually available — Meta Business Suite (covers both a connected
Facebook Page and Instagram professional account in one place) if the accounts are
linked there, or each platform's native Insights tab otherwise.

**Facebook Page Insights, per post in the period:**
- Reach and impressions
- Engagement (reactions, comments, shares) and engagement rate
- Video views / average watch time for any video or Reel shared to the Page
- Page follower growth over the period
- Top 5 and bottom 5 performing posts, each tagged with its format and
  `content-calendar.md` bucket (Business Freedom, Marketplace, Support the
  Mission, etc.)
- Which posting days/times drew the strongest reach or engagement

**Instagram Insights, per post in the period:**
- Reach and impressions
- Engagement (likes, comments, saves, shares) and engagement rate
- Reels specifically: plays, average watch time, completion rate — logged
  separately from static image/carousel numbers so the two formats can be
  compared directly
- Follower growth, and new-follower attribution if the platform shows it
- Top 5 and bottom 5 performing posts, tagged the same way as Facebook
- Story views/completion if Stories are in use

If a metric or platform can't be accessed (no login, insights not visible,
account not yet professional/linked), record that limitation in the snapshot
instead of estimating a number.

---

## The reels-vs-posts question, specifically

This file exists to answer that question with data, not to answer it once and
lock it in. Every snapshot logs Reels/video performance against static
image/carousel performance **separately, by content bucket** — a Reel that
crushes it for Support the Mission doesn't tell you anything about whether a
Business Freedom Reel would do the same.

Do not recommend a shift toward Reels (or away from them) based on one post or
one snapshot. Recommend it only once the same direction shows up across 2+
consecutive snapshots for the same format/bucket combination — see the
Recommendation workflow below.

---

## Recommendation workflow

When a pattern holds across 2+ consecutive snapshots, the agent adds a
Recommendation entry (template below) instead of editing `content-calendar.md`
directly. Brooke approves, rejects, or corrects the recommendation the same way
she handles a draft post.

Only after a recommendation's status is `Approved` does the agent edit
`content-calendar.md` — updating the Weekly Posting Rhythm or Weekly Minimum for
the specific day/bucket involved — and then mark the recommendation `Applied`,
noting the date and exactly what changed in `content-calendar.md`.

Status formatting rule: keep the status label and its single current value on one
line, matching the rule already used in `draft-posts.md`. Allowed values are
`Needs review`, `Approved`, `Rejected`, and `Applied`.

---

# Insights Snapshot Template

The agent uses this template for every review period. One snapshot entry can cover
both platforms if reviewed together.

## Snapshot #

Date range reviewed:

Platform(s):
Facebook / Instagram / Both

Data source:
Meta Business Suite / native Facebook Insights / native Instagram Insights —
note any access limitation here.

Posts published in this period, by format:
Static image — count
Carousel — count
Reel/video — count
Story — count

Follower count at start of period:

Follower count at end of period:

Top performing posts (up to 5):
Post reference (link or `posted-archive.md` entry) / format / content bucket /
reach / engagement rate / notable metric (e.g. saves, watch time)

Bottom performing posts (up to 5):
Same fields as above.

Reels/video vs. static/carousel comparison:
Numbers side by side, broken out by content bucket where the sample allows it.

Best-performing posting day/time observed:

Other notable patterns:

Cross-reference note:
Anything here worth adding to a specific post's Follow-Up section in
`posted-archive.md`.

---

# Recommendation Template

## Recommendation #

Date:

Based on snapshots:
List the Snapshot # entries this recommendation is drawn from (must be 2+
consecutive periods showing the same pattern).

Pattern observed:

Platform(s) and format(s) involved:

Content bucket(s) involved:

Proposed change to `content-calendar.md`:
State the exact section and edit — e.g. "Add a Reel-format option alongside the
existing static post for Tuesday — Farm / Boots on the Ground" or "Increase the
Weekly Minimum Reel count from 0 to 2."

Confidence:
Building (1 supporting snapshot, watching for a second) / Confirmed (2+
consecutive snapshots)

Status: Needs review

---

## Notes

- No snapshots logged yet. The first entry gets created the next time the agent
  has authorized, read-only access to Facebook and/or Instagram Insights.
- This file does not replace `posted-archive.md`. `posted-archive.md` stays the
  source of truth for *what was posted and when*; this file is the source of truth
  for *how it performed and what that means for the plan*.
