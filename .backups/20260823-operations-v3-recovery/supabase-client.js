import "./vendor/supabase-js-2.52.0.js";

const { createClient } = globalThis.supabase;

export const SUPABASE_URL = "https://dfrwxpuojeiykaignyny.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ts45JL34s7yFGW5hlI0pUA_-HRUt18a";

// Keep Supabase's normal cross-tab serialization, but do not allow a stale
// browser Web Lock to freeze every authenticated page indefinitely. If a lock
// cannot be acquired promptly, continue the requested auth operation rather
// than leaving Account / Operations Review permanently stuck on loading.
const boundedBrowserAuthLock = async (name, acquireTimeout, fn) => {
  const locks = globalThis.navigator?.locks;
  if (!locks?.request) return await fn();

  const requested = Number(acquireTimeout);
  const timeoutMs = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, 5000)
    : 5000;
  const controller = new AbortController();
  let timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await locks.request(
      name,
      { mode: 'exclusive', signal: controller.signal },
      async () => {
        clearTimeout(timer);
        timer = null;
        return await fn();
      }
    );
  } catch (error) {
    if (error?.name !== 'AbortError') throw error;
    console.warn(`Supabase auth lock timed out after ${timeoutMs}ms; continuing without the stale browser lock.`);
    return await fn();
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      lock: boundedBrowserAuthLock
    }
  }
);

const path = window.location.pathname;
const isOperationsReview = path.endsWith('/operations-review.html') || path === '/operations-review.html';
const isAcademyStageReview = path.endsWith('/academy-stage-review.html') || path === '/academy-stage-review.html';

if (isOperationsReview || isAcademyStageReview) {
  import('./academy-owner-usability.js');
}

if (isOperationsReview) {
  import('./operations-review-enhancements.js');
  import('./operations-review-owner-controls.js');
  import('./operations-review-diff-edit.js');
  import('./operations-review-visual-map.js');
  import('./operations-review-opportunity-intelligence.js');
  import('./operations-review-audience-conversion-intelligence.js');
  import('./operations-review-learner-intelligence.js');
  import('./operations-review-readability.js');
  import('./operations-review-dashboard-v3.js?v=20260823-1205');
  import('./operations-review-lifecycle-workspace.js');
  import('./operations-review-project-intake.js');
  import('./operations-review-stage-links.js');
  import('./academy-stage-progress-status.js');
  import('./academy-late-findings.js');
  import('./operations-review-release-workflow.js');
  import('./operations-review-final-product-acceptance.js');
}

if (isAcademyStageReview) {
  import('./academy-stage-progress-status.js');
  import('./academy-late-findings.js');
  import('./operations-review-final-product-acceptance.js');
}
