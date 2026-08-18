# Change Description — Social Media Insights & Performance Review Workflow

Date: 2026-08-18
Requested by: Brooke (owner)
Requested via: chat — "we have ai workflow for marketing in our rrm repo, we need to add to that to check our social media insights for both fb and instagram and analyze utilizing the findings to create and update our marketing plan. should we be making reels, posts, what are ppl responding to, etc and adjusting accordingly."

## Why

The existing `marketing/social-media/` workflow (brand-rules.md, content-calendar.md,
draft-posts.md, group-rules.md, image-library.md, posted-archive.md) creates and
schedules content but has no step that looks at how content actually performed on
Facebook or Instagram. There was no mechanism for the agent to answer "should we be
making reels, posts, etc." from real data — only from brand/tone rules. This change
adds that missing feedback loop.

## Files changed

1. **New file:** `marketing/social-media/insights-analysis.md`
   Tracks Facebook Page Insights and Instagram Insights data (reach, engagement,
   Reels/video vs static-post performance, follower growth, best posting times) on a
   recurring review cadence, and turns repeated patterns into specific proposed
   adjustments to `content-calendar.md`. Read-only performance analysis — the agent
   does not boost posts, spend ad budget, or change account/audience settings from
   this file. Recommendations require Brooke's approval (recorded as a status field,
   same pattern as `draft-posts.md`) before the agent edits `content-calendar.md`.

2. **Edited:** `marketing/social-media/brand-rules.md`
   Added `insights-analysis.md` to the list of files the agent must check before
   using an approved post, and added a short "Performance-informed content rule"
   making clear that format mix (Reels/video vs static posts) and content-bucket
   emphasis are decided from logged insights data, not assumption — with the
   existing brand/tone/program-status rules in this file still governing every
   format equally (a Reel follows the same visual-matching and voice rules as a
   static post).

3. **Edited:** `marketing/social-media/content-calendar.md`
   Added an "Insights-Informed Adjustments" section describing the review loop:
   agent logs an insights snapshot on a set cadence → agent proposes a specific
   calendar change when a pattern holds across 2+ review periods → Brooke
   approves/rejects/corrects the recommendation in `insights-analysis.md` → only
   then does the agent edit the Weekly Posting Rhythm or Weekly Minimum in this
   file, noting the date and source recommendation.

## What was NOT changed

- `draft-posts.md`, `group-rules.md`, `image-library.md`, `posted-archive.md` —
  untouched. Reels/video assets can already be tracked in `image-library.md` using
  its existing generic `File path` field; no template change was needed there for
  this task.
- No commit, push, or deploy performed. Local file changes only, pending Brooke's
  review.
- No actual Facebook/Instagram Insights data was pulled in this change — the file
  ships as an empty tracker with the template and rules; the first real snapshot
  entry is created the next time the agent has authorized access to Meta Business
  Suite / native Insights and runs the review.
