# Change Description

- Purpose: switch all general RRM Academy links to the verified RRM-owned Academy site.
- Verified destination: `https://academy.rebelranchministries.org`
- Safety check: the Cloudflare production site, audience filter, learning plan, and lesson experience were tested successfully before this cutover.
- Files changed: `index.html`, `account.html`, `freedom.html`, `assets/js/public-shell.js`, and `sitemap.xml`.
- `academy.html` remains unchanged and on hold; only its public sitemap listing is removed.
- Recovery: the previous live links remain available in the preceding main-branch commit and timestamped migration backup.
