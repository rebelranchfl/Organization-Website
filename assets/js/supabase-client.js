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
const isAcademyStageReview = path.endsWith('/academy-stage-review.html') || path === '/academy-stage-review.html';

// Operations Review now owns its lightweight owner-action inbox directly from
// operations-review.html. Do not auto-load any legacy Operations Review helper
// modules here. Full project/stage work belongs on the focused Stage Review page.

if (isAcademyStageReview) {
  import('./academy-owner-usability.js');
  import('./academy-stage-progress-status.js');
  import('./academy-late-findings.js');
  import('./operations-review-final-product-acceptance.js');
  import('./academy-stage-review-action-flow.js');
}
