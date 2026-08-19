# "Choose your path" recopy: product-first -> outcome-first — 2026-08-19

Owner-approved, decided in discussion. Not a new build, not an
interactive quiz — a copy/label refinement of the visual cards added
earlier today. Same markup structure, same three images, same CSS
classes (`.path-family`, `.path-session`, `.path-adult` kept as internal
hooks even though the visible label no longer says "adult" up top —
renaming CSS classes for this would be unnecessary churn per
AGENTS.md's "smallest change necessary" rule).

## Why
Comparing `creation.html` and `creation-station-membership.html` side by
side surfaced that "Choose your path" mixed two different questions in
one row of three cards: persona (family vs. adult) and need (which
child outcome). Owner's proposed decision tree separates them cleanly:
Q1 adult-or-child, Q2 (child only) store crafts / sell crafts / make
friends. Q1 already existed as a full section further down the page
(`#adult-path`, Studio vs. Marketplace) — no need to duplicate it up
here, just link to it. Q2 becomes the three cards, recopied from
product names ("Creation Station Club") to outcomes ("Make Friends Who
Get It"), which also resolves an earlier flagged issue: presenting
"Dashboard" and "Landing Page" as two equal parallel products when
they're actually two tiers of one product ($9.99 base / $19.99 with
landing page) is avoided by framing them as outcomes instead of tier
names.

## Changes
- Section intro: kicker changed from "who you are here for" to "what
  you're looking for"; intro paragraph now says outcomes aren't
  exclusive ("you can add more later") and links adults straight to
  `#adult-path` inline, instead of giving adults a full third card.
- Card 1 (`path-family`, unchanged image `bracelets.png`): recopied to
  "A Place to Store Their Crafts" — the always-included base tier,
  correctly kept as the featured/largest card.
- Card 2 (`path-session`, unchanged image
  `creation-station-live-class-card.png`): recopied to "Make Friends
  Who Get It" (was "Live Online Sessions").
- Card 3 (`path-adult` class kept, unchanged image `lavender
  candle.png`): recopied from "Adult Makers & Crafters / Already
  creating?" to "Sell What They Make" — the $19.99 Studio + Landing
  Page tier, framed for older/teen creators per the owner's own phrase
  "landing page for older kids." Copy avoids promising income/sales
  (AGENTS.md rule) and keeps "every public step still goes through you
  first." Link now jumps to `creation-station-membership.html#inside`
  (the tier comparison) instead of the bare page, since that's the
  faster answer to "sell what they make."

## Not touched
- No CSS changes — same `.path-visual`/`.path-feature`/`.path-compact`
  styling from earlier today.
- `#adult-path` section itself untouched.
- No commits, no push.

AI-Agent: Claude Code
Session: Creation Station merch promotion + Passion to Profit copy discussion (2026-08-19)
