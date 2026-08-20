# "Choose your path" value-prop rewrite + "guiding" accuracy fix — 2026-08-19

Owner review of the live page after the outcome-framing recopy. Owner's
points, addressed:

1. Card 1 didn't communicate the real pitch: parents get uninterrupted
   time, kids get productive screen time, and everything on the page
   eventually connects to real business skills / "passion to profit."
   The rest of the page already says this well (relief section, "more
   than a craft," "passion to profit," final CTA "give their creativity
   somewhere meaningful to go") — none of it reached the path section's
   intro or card copy. Rewrote the section intro and all three card
   bodies to carry that value prop, using the owner's own draft language
   where possible, tightened for length/repetition and to stay inside
   AGENTS.md's "do not promise income" rule (describes tools/opportunity,
   not guaranteed outcomes). The owner's mention of "business acumen
   courses" for card 3 was corrected to the real existing product name
   ("business sessions at the Academy," linked elsewhere in the app at
   academy-learning-interest.html) rather than inventing a course that
   doesn't exist (AGENTS.md: don't present planned features as real).
2. "See what does the guiding." (#experience section heading) was
   flagged as inaccurate — the dashboard tracks and structures, it
   doesn't actively guide. Changed to "See what keeps them on track."
3. Card numbers (01/02/03) removed from all three path cards per owner
   request — purely decorative, not needed. Required a matching CSS fix:
   `.path-feature, .path-compact` grid-template-columns changed from
   `auto 1fr` (auto column was sized for the number badge) to `1fr`
   (single column) now that the badge is gone.
4. Bundle packages weren't mentioned anywhere in this section. Added a
   link to the real bundle pricing (creation-station-membership.html#join)
   in the section's subnote line, alongside the existing adult-wayfinding
   link.

## Resolved after follow-up
Card 1's image was initially left as `assets/bracelets.png` because the
owner's actual live-dashboard screenshot arrived as a pasted chat image,
not a file path this session could read directly. Found it after the
owner clarified: Windows OneDrive auto-saves screen captures to
`Pictures\Screenshots`, and `Screenshot 2026-08-19 113622.png` there
matched the "live dashboard image" she referenced (tote bag project,
completed journey through step 6). Cropped out the browser chrome (top
64px, address bar/toolbar) with a PowerShell System.Drawing script and
saved the result as `assets/creation-station-dashboard-preview.png`.
Card 1 now uses this real screenshot instead of the bracelets demo
photo.

## Files
- `creation.html` — path-section intro + all three card bodies
  recopied; card numbers removed from all three cards; #experience
  heading text fixed.
- `assets/css/creation-station.css` — `.path-feature, .path-compact`
  grid-template-columns: `auto 1fr` -> `1fr`.

## Not touched
No commits, no push yet — pending the card 1 image resolution and
owner review of the new copy.

AI-Agent: Claude Code
Session: Creation Station merch promotion + Passion to Profit copy discussion (2026-08-19)
