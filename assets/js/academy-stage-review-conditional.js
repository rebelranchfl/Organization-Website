// Loads stage-specific tools only for the stage actually shown on the project page.
// Updated 2026-09-27: reads the resolved stage from the page instead of the URL, so
// links without ?stage= still get the research reader / final acceptance checklist.
// AI-Agent: Claude (claude-opus-5-5) · Session: Academy back office restructure 2026-09-27
document.addEventListener('academy-stage-review-ready', e => {
  const stage = e.detail?.stage || new URLSearchParams(location.search).get('stage') || '';
  if (stage === 'RESEARCH_REVIEW') import('./academy-stage-review-research-lazy.js').then(m => m.mount?.(stage));
  if (stage === 'FINAL_PRODUCT_REVIEW') import('./operations-review-final-product-acceptance.js');
  // Release checklist + Library listing (2026-09-28): approved final product through LIVE.
  if (['FINAL_PRODUCT_REVIEW', 'AWAITING_RELEASE', 'PUBLISHING', 'LIVE'].includes(stage)) import('./academy-release-listing.js').then(m => m.mount?.(e.detail?.projectId));
}, { once: true });

// Late Findings remains opt-in and is never part of normal startup.
if (location.hash === '#late-findings') import('./academy-late-findings.js');
