# Move Beta feedback form into the seller dashboard — 2026-08-16

**Correction of an earlier mistake this session.** The feedback form and
"BETA" badge had been added directly to the public `marketplace.html`
page — visible to every visitor, not just testers. Owner correctly
called this out: a public "we're still figuring this out" form
undermines the site for anyone just browsing. Reverted `marketplace.html`
back to its original state (confirmed clean — zero remaining references)
and rebuilt the feedback form as a proper dialog inside
`marketplace-seller-dashboard.html` instead, which is login-gated.

## Files
- `marketplace-seller-dashboard.html` — new `#feedback-dialog`, styled
  with the page's own existing `dialog`/`dialog form`/`dialog label` CSS
  (already used by the existing `#review-dialog`, so no new dialog
  styling invented). New "Send Feedback" button in the persistent header,
  next to the "View My Live Page" link added earlier today — same
  principle: accessible from every tab, not buried in one.
- `assets/js/marketplace-seller-app.js` — wires the button to open the
  dialog and the Cancel/× buttons to close it. The form itself submits
  directly to the same Formspree endpoint as before
  (`https://formspree.io/f/xnjrqydq`, tagged "Marketplace Beta Feedback")
  — a plain POST, matching how every other form on this site submits to
  Formspree (no AJAX handling exists anywhere else to mirror, so not
  inventing a new pattern here).

AI-Agent: Claude Code
Session: Creation Station dashboard corrections walkthrough (2026-08-16)
