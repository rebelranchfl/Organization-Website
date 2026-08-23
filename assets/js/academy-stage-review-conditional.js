const params = new URLSearchParams(location.search);
const stage = params.get('stage') || '';

if (stage === 'RESEARCH_REVIEW') {
  import('./academy-stage-review-owner-experience.js');
}

if (stage === 'FINAL_PRODUCT_REVIEW') {
  import('./operations-review-final-product-acceptance.js');
}

if (location.hash === '#late-findings') {
  import('./academy-late-findings.js');
}
