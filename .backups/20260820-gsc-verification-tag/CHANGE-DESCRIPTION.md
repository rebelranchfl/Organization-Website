# Change Description — Google Search Console Verification Tag

**Date:** 2026-08-20
**AI agent:** Claude (Cowork)
**Session:** Rebel Ranch Academy transition alignment / tracking setup

## Authorized purpose

Owner asked to confirm and, if needed, finish Google Search Console setup for
rebelranchministries.org, using the browser directly (Claude in Chrome, full
site permissions granted by owner). Search Console had no property for the
site at all under the rebelranchfl@gmail.com Google account (the account that
also owns the working GA4 property). Added the domain as a URL-prefix property
and used Search Console's "HTML tag" verification method, which requires one
meta tag in the page's <head>.

## File changed

- `index.html` — one line added inside `<head>`, immediately after the opening
  `<head>` tag and before the existing `<meta charset="UTF-8"/>` line.

## Exact change

Added:
```html
<meta name="google-site-verification" content="s8HOdYJuFT-N7BNgO7R1LQohRfJSMU0B1D524SZDEUg" />
```

No other line in the file was touched.

## Why this method

Search Console's own "Google Analytics" verification method was tried first
(since GA4 is already active on the site under the same Google account) and
failed: "We could not find any Google Analytics tracking codes on the index
page of your site." Rather than debug why GA4's tag isn't detected in the
page's static source (worth a separate look — see note below), the HTML-tag
method was used instead, since it only requires one additive, easily-reverted
line.

## Files explicitly not changed

- Any other repository file
- The GA4 property/configuration itself

## Backup

- Full prior version of `index.html` saved alongside this file as
  `index-BACKUP.html` before editing.

## Not committed or pushed

This edit was made to the local working tree only. No git commit, push, or
deploy was performed. That requires separate explicit authorization per
`AGENTS.md`.

## Follow-up worth flagging to the owner

Search Console could not find the GA4 tag in the page's static HTML source,
even though GA4 itself confirms it's receiving real traffic. This usually
means the tag is being injected in a way a simple crawl doesn't see the same
way a real browser does (e.g. loaded through Google Tag Manager, an external
script that isn't in the raw HTML `<head>`, or added dynamically by
JavaScript after page load) — not necessarily a problem, but worth knowing
about since it can also affect other tools that read the page's raw source
(some SEO crawlers, social share previews, etc.).
