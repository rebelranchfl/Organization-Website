# Rebel Ranch Academy Cloudflare Migration Backup

**Date:** 2026-08-20  
**AI-Agent:** ChatGPT/Codex  
**Session:** Rebel Ranch Academy program hub

## Owner-approved scope

- Preserve `academy.html` without edits.
- Reconcile the older GitHub Program Hub source with the approved polished Academy site.
- Make the RRM GitHub repository the source of truth for the Academy.
- Prepare and publish the Academy through the owner's Cloudflare account.
- Use `https://academy.rebelranchministries.org` as the Academy's public address.
- Update general RRM Academy links only as part of the verified cutover.
- Add Academy search-discovery files and correct conflicting Academy documentation.

## Existing files backed up here before editing

- `index.html`
- `account.html`
- `freedom.html`
- `assets/js/public-shell.js`
- `sitemap.xml`
- `docs/rrm-visual-rules.md`
- `rebel ranch academy/REBEL-RANCH-ACADEMY-CONCEPT-AND-DIRECTION.md`
- Program Hub `README.md`
- Program Hub `app/globals.css`
- Program Hub `app/layout.tsx`
- Program Hub `app/page.tsx`
- Program Hub `next.config.ts`
- Program Hub `package.json`
- Program Hub `.openai/hosting.json`
- Program Hub `tests/rendered-html.test.mjs`
- Program Hub build scripts (permission repair so Cloudflare can run them)
- Program Hub `vite.config.ts`
- Program Hub `public/og.png`

## New files expected

- Program Hub `public/robots.txt`
- Program Hub `public/sitemap.xml`
- Program Hub official polished logo files copied from the approved live source

No backup copy exists for a newly created file because it did not exist before this migration.
