import { createClient } from "@supabase/supabase-js";

// Same "Rebel Ranch Platform" Supabase project already used by the main
// RRM site (assets/js/supabase-client.js) and by Trust Cross-Reference's
// own citation-verification backend. One project, reused, not a new one.
export const SUPABASE_URL = "https://dfrwxpuojeiykaignyny.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ts45JL34s7yFGW5hlI0pUA_-HRUt18a";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
