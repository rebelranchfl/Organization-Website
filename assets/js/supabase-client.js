import "./vendor/supabase-js-2.52.0.js";

const { createClient } = globalThis.supabase;

export const SUPABASE_URL = "https://dfrwxpuojeiykaignyny.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ts45JL34s7yFGW5hlI0pUA_-HRUt18a";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

if (window.location.pathname.endsWith('/operations-review.html') || window.location.pathname === '/operations-review.html') {
  import('./operations-review-enhancements.js');
  import('./operations-review-owner-controls.js');
  import('./operations-review-diff-edit.js');
}
