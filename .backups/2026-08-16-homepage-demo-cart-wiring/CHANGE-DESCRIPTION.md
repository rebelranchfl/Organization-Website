# Wire up the homepage demo cart — 2026-08-16

**Files:** new `assets/js/creation-demo-cart.js`, one added `<script>`
line in `creation.html` (owner-locked page — owner explicitly named it
this session as the target, per AGENTS.md's file-authorization rule).

Owner reported clicking "Add to Demo Cart" on the homepage's sample
Studio showcase did nothing — the Items/Total never changed. Confirmed
by searching every JS file in the repo: no script anywhere implements
`data-demo-add`, `data-demo-cart-count`, `data-demo-cart-total`,
`data-demo-cart-message`, or `data-demo-cart-reset` — the markup was
built but never wired up.

Added a small, self-contained script (not inline, to avoid touching the
locked page's structure beyond one added `<script src>` line, matching
the pattern of the two script tags already there) that increments a
count/running total per click and resets on the existing "Reset demo
cart" button. Pure client-side, no data persistence, no backend calls —
matches what a "demo" implies. Did not touch anything else on the
page — no visual, copy, or structural changes beyond this one addition.

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-16)
