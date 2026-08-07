# GitHub Pages deploy outage — 2026-08-06/07

**AI-Agent:** Claude Code
**Session:** Creation Station dashboard access + site-wide deploy fix (2026-08-07)

## What happened

GitHub Pages (`build_type: legacy`, source `main` branch, custom domain
`rebelranchministries.org`) stopped successfully building the site after
commit `474474d` ("Add site-wide sign-in/out access and admin seller
pause/archive", pushed 2026-08-06 14:10 local time).

Build history (`GET /repos/rebelranchfl/Organization-Website/pages/builds`):

| Commit | Status | Created |
|---|---|---|
| `84d8972d` | built | 2026-08-06 15:30 UTC (last known-good deploy) |
| `474474d8` | errored ("Page build failed.") | 2026-08-06 18:10 UTC |
| `474474d8` | building, never completed | 2026-08-06 20:09 UTC |

Result: every commit pushed after `84d8972d` — including `474474d8` itself —
was live in the git history but never reached the actual site. The most
visible symptom the owner hit: no sign-in/account link anywhere on
`marketplace.html` (the very feature `474474d8` added), because the browser
was still being served the pre-outage build.

This is independent of the Supabase database. Migrations applied directly
against the Supabase project (via the MCP tools / `apply_migration`) are
unaffected by this outage and go live immediately — only the static
HTML/CSS/JS site (served by GitHub Pages) was stuck.

## Root cause

No `.nojekyll` file existed at the repo root and no `_config.yml` is present
either — this is a hand-built static HTML/CSS/JS site, not a Jekyll site.
Without `.nojekyll`, GitHub Pages still routes every deploy through Jekyll's
build step by default. GitHub's legacy Pages API does not surface Jekyll's
actual error output (only the generic `"Page build failed."`), so the exact
file/pattern Jekyll choked on inside `474474d8`'s changes was not
identifiable from the API alone.

## Fix

Added an empty `.nojekyll` file at the repo root. This tells GitHub Pages to
skip the Jekyll build step entirely and serve the repository's files as-is,
which is the correct mode for this site regardless of what specifically
tripped Jekyll. This also removes the Jekyll step as a future failure point
for any future commit.

## Verification

After pushing, confirm via `gh api repos/rebelranchfl/Organization-Website/pages/builds`
that the new build for the pushing commit reaches `"status":"built"`, then
spot-check `marketplace.html` in a browser for the "Sign In" / "My Account"
link that `474474d8` added.
