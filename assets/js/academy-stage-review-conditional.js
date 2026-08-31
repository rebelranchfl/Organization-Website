const params = new URLSearchParams(location.search);
const stage = params.get('stage') || '';

// Load only the tool required for the stage the owner intentionally opened.
if (stage === 'RESEARCH_REVIEW') {
  import('./academy-stage-review-research-lazy.js');
}

if (stage === 'FINAL_PRODUCT_REVIEW') {
  import('./operations-review-final-product-acceptance.js');
}

// Late Findings remains opt-in and is never part of normal Stage Review startup.
if (location.hash === '#late-findings') {
  import('./academy-late-findings.js');
}
