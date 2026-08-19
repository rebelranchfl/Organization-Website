# Round 4: pill/button house rule, Portfolio page rebuild, readiness metric fixes, CTA dedup

Authorized by Brooke 2026-08-18, same conversation. After a "provide feedback
no work" discussion round covering 10 numbered issues (buttons/pills sized
inconsistently, an icon still in the card background, Portfolio page making
no sense, a duplicated growth-page heading, "Submit approved public work"
being meaningless, website readiness stuck at 0% despite a live store,
repeated "Creation Station"/redundant "start a project" buttons, and the
badge sitting apart from streak/points), she replied "thats fine we can use
your order," approving my proposed sequence and the specific diagnoses/
recommendations from that discussion turn.

Authorized target: same five dashboard files as rounds 1-3, plus AGENTS.md
(repo root) for the new standing pill/button rule she explicitly asked to
have written down.

## What changed (see individual task descriptions in this session for
exact rationale on each; summarizing here)

1. **AGENTS.md**: added a standing rule — full pill radius (999px, the
   rounded-capsule shape) is reserved for real clickable buttons only.
   Non-interactive status/info chips must use a visibly different, smaller
   radius so shape alone signals "not a button," not just context. This
   extends the existing 2026-08-15 rule in the same section (which banned
   exact button-mimicry) into a blanket rule per her explicit request.

2. **Button system**: default `.button`/`button` radius reduced from 999px
   to a moderate rounded-rect radius so a button whose label wraps to two
   lines doesn't balloon into a giant stadium shape (root cause of "why are
   these all different sizes" — confirmed the height rule was already
   uniform; the full-pill radius was the actual variable). Added `.small`
   and `.large` size variants. `.small` applied to secondary/inline actions
   (list-item Edit/Restore/Register/Mark read, product Edit/Remove, session
   Edit, project card's Remove from workbench).

3. **Remaining full-pill non-clickable elements fixed**: `.hero-stat`
   (header points/streak chips) and `.tag` (Growth page's skill category
   chips) — both dropped to a non-pill radius. Removed dead
   `.hero-card-eyebrow` CSS (confirmed unused by any current JS).

4. **Project card**: removed the category icon watermark (✦/◇/↗) from the
   image filler area entirely.

5. **Portfolio page rebuilt**: the page previously showed a single
   admin-moderated bio record per creator (`state.data.portfolios` —
   confirmed via code read to have zero connection to actual projects) with
   vault-like "Private → Submitted → Reviewed → Published" copy. Replaced
   with a private, family-only listing of the creator's actual completed
   projects (`state.data.projects` where status is completed), and rewrote
   the publishing-path copy to describe the real mechanism: private by
   default → a paid tier unlocks a Creation Station Studio storefront →
   fill out story/products/payment → live.

6. **Growth page**: renamed heading (was "Business Growth"/"Growth
   dashboard" — page covers general accomplishment, not just business).
   Rewrote the "Build a portfolio" and "Submit approved public work"
   readiness items, which previously keyed off the same orphaned portfolio
   record fixed in #5, to reflect the rebuilt Portfolio-as-completed-
   projects model.

7. **Website readiness**: the "Published" step checked `req.published_at`,
   a field only ever set by a legacy admin-only "enter a URL and publish"
   action built for the pre-auto-approve free/practice flow. Tier-3
   accounts go live immediately via `status:'approved'` + an auto-generated
   `public_slug` and never touch that admin action, so a genuinely live
   paid store could never satisfy this step. Changed the check to reflect
   actual live status instead.

8. **Sessions page heading copy** updated per her "Learn together, laugh
   together" direction.

9. **CTA dedup**: confirmed three separate buttons on the Studio page all
   opened the identical new-project dialog (global hero "Start New
   Project," the heading's "Start something new," and the workbench's
   "Browse projects," which despite its label just opened the same dialog).
   Cut to one clear entry point.

10. **Badge/streak/points**: brought into one visual grouping instead of
    the badge living in a separate panel apart from the header's
    points/streak display.

No Supabase/schema change. Do not commit, push, publish, or deploy.
