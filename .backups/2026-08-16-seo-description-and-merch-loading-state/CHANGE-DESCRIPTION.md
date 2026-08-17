# Homepage SEO description correction + merch loading-state fix — 2026-08-16

## 1. Homepage meta description
**File:** `index.html`
Owner correctly called out that "faith-rooted" doesn't reflect the site
— confirmed by audit, every "faith" mention on the whole site is just
the legal entity name in fine print, never substantive content. Real
web research (Google search results, not guessing) found homesteading
is a real, growing, cost-motivated trend, and that Trenton's actual
community farmers market was recently shut down by the city — a genuine
local content opportunity. Updated `meta name="description"` and the
matching `og:description` to: "Financial freedom, homesteading, and
local food resources for Trenton & Gilchrist County families — plus a
real digital farmers market built by neighbors, not corporations."

## 2. Merch page — honest loading state
**File:** `merch.html`
Owner found the "The first collection is almost here" card showing even
though real products were loading from Printify. Root cause: that
message was the *default* visible state from page load, only replaced
once the product fetch actually finished — so a slow or failed fetch
left a false "we have nothing" impression. Split into three honest,
distinct states instead of one static message:
- **While loading:** "Loading the shop…" (new default state)
- **Fetch genuinely returns zero products:** the original "first
  collection is almost here" copy, now only shown when actually true
- **Fetch fails (network/server error):** a new, honest "We couldn't
  load the shop right now — please refresh, or visit the store
  directly" message, instead of silently reusing the empty-collection
  copy for an unrelated failure case
Also reworded the confusing "Everything stays right here until you
select a product" line to plainly describe the actual behavior
(filtering happens instantly on the page, no reload).

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-16)
