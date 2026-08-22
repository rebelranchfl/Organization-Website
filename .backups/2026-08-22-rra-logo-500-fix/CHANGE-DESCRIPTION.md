# RRA logo not displaying — header/hero/footer

**Date:** 2026-08-22
**AI-Agent:** Claude Code
**Session:** RRA logo header/hero fix
**File changed:** `rebel ranch academy/Rebel-Ranch-Academy-Program-Hub/app/page.tsx`
**Backup:** `page.tsx.before` (pre-edit copy of the same file, from git HEAD at time of edit)

## Diagnosis

Confirmed live on `academy.rebelranchministries.org` via browser network inspection:
every `/rra-logo.png` and `/roots-boots-animal-poops-logo.png` request goes through
`GET /_vinext/image?url=...&w=...&q=75` and returns HTTP 500 ("Worker threw exception").
This is the Cloudflare Worker's image-optimization proxy (`worker/index.ts`), which
calls `env.IMAGES.input(...)` — a Cloudflare Images binding that is not configured
anywhere in this project (no `wrangler.json`/binding declared). The proxy throws
because that binding does not exist in the deployed Worker.

`next.config.ts` already sets `images: { unoptimized: true }` (added in commit
0872582, "Migrate Rebel Ranch Academy to RRM-owned hosting"), which is the standard
Next.js way to tell `next/image` to skip the optimizer and use the raw src. However,
the deployed build still routes every non-SVG `<Image>` through `/_vinext/image`
regardless of that setting — this app runs on `vinext` (a Vite/Cloudflare-Workers
Next.js-compatible runtime), and its `<Image>` component does not honor
`images.unoptimized` the way stock Next.js does. So the config change made in that
prior commit did not actually fix the problem it was meant to fix.

## Fix

Replaced all four `next/image` `<Image>` usages in `app/page.tsx` (header brand
logo, hero seal logo, "Roots, Boots & Animal Poops" program logo, footer logo) with
plain `<img>` tags carrying the same `src`, `alt`, `width`, and `height`. Removed the
now-unused `import Image from "next/image"`. Plain `<img>` tags are served directly
as static assets by the Worker (`env.ASSETS.fetch`) and never touch the
`/_vinext/image` optimization proxy, so they do not depend on the missing Cloudflare
Images binding at all.

No CSS changes were needed — the existing selectors (`.brand-lockup img`,
`.hero-seal img`, `.roots-logo img`, `.footer-brand img`) already target `img`
elements directly (Next's `<Image>` renders as a plain `<img>` when not using the
`fill` prop, which this code never did), so layout and sizing are unchanged.

## Not done / left for the owner

- No dependency, config, or wrangler/Cloudflare Images binding changes were made.
  Configuring a real Cloudflare Images binding was considered but rejected as
  unnecessary scope — these are static pre-sized PNGs with no need for on-the-fly
  resizing, so bypassing the optimizer is the correct minimal fix, not a workaround.
- Change is local only — not committed, not pushed, not deployed. Per this repo's
  `AGENTS.md`, committing/pushing/deploying requires separate explicit
  authorization.
- Did not run the project's local dev server to visually re-verify, because it
  requires a fresh `npm run install:ci` (no `node_modules` present) and spins up a
  full Cloudflare Workers/Miniflare dev environment — heavier than warranted for a
  mechanical `Image` → `img` swap that structurally removes the failing code path.
  Recommend the owner (or next session) verify visually after this is deployed.
