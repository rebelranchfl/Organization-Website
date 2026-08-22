import "./vendor/supabase-js-2.52.0.js";

const { createClient } = globalThis.supabase;

export const SUPABASE_URL = "https://dfrwxpuojeiykaignyny.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ts45JL34s7yFGW5hlI0pUA_-HRUt18a";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const path = window.location.pathname;
if (path.endsWith('/operations-review.html') || path === '/operations-review.html') {
  import('./operations-review-enhancements.js');
  import('./operations-review-owner-controls.js');
  import('./operations-review-diff-edit.js');
  import('./operations-review-visual-map.js');
  import('./operations-review-opportunity-intelligence.js');
  import('./operations-review-audience-conversion-intelligence.js');
  import('./operations-review-learner-intelligence.js');
  import('./operations-review-readability.js');
  import('./operations-review-dashboard-v3.js');
  import('./operations-review-lifecycle-workspace.js');
  import('./operations-review-project-intake.js');
  import('./operations-review-stage-links.js');
  import('./academy-stage-progress-status.js');
  import('./academy-late-findings.js');
  import('./operations-review-release-workflow.js');
}

if (path.endsWith('/academy-stage-review.html') || path === '/academy-stage-review.html') {
  import('./academy-stage-progress-status.js');
  import('./academy-late-findings.js');
}
