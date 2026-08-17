# robots.txt + sitemap.xml — 2026-08-16

**New files:** `robots.txt`, `sitemap.xml` (no prior versions existed —
confirmed via audit: neither file was present anywhere in the repo).

Owner confirmed "100% we need to fix this SEO immediately" after an
audit found no robots.txt, no sitemap, and the homepage itself missing a
meta description. Starting with these two since they're purely
technical/additive — no content-writing judgment calls, safe to build
without further owner input, unlike meta descriptions/Open Graph tags
which need real per-page copy and are being scoped separately.

## robots.txt
Allows all crawling by default, explicitly disallows only the pages that
are genuinely private/logged-in (`account.html`,
`creation-station-dashboard.html`, `marketplace-seller-dashboard.html`,
etc.) or internal dev/test tooling (`supabase-connection-test.html`,
`phase3-visual-fixture.html`, `marketplace-seller-page-theme-preview.html`
— found during today's earlier audit work, not something a search
engine should ever surface). Points to the sitemap.

## sitemap.xml
Lists the ~35 genuinely public, real content pages — excludes the same
private/dashboard/dev pages as robots.txt, plus the two per-record
template pages (`creation-station-studio.html`,
`marketplace-seller-page.html`) that only mean something with a query
parameter and have no useful content at their bare URL.

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-16)
