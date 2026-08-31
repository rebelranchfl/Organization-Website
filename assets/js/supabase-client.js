import "./vendor/supabase-js-2.52.0.js";

const { createClient } = globalThis.supabase;

export const SUPABASE_URL = "https://dfrwxpuojeiykaignyny.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ts45JL34s7yFGW5hlI0pUA_-HRUt18a";

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
  { auth: { lock: boundedBrowserAuthLock } }
);

// Shared client only. Owner surfaces load their own focused scripts explicitly.
