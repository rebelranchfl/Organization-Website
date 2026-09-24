// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Custom booking system build for rebelranchministries.org (2026-09-24)
// Open times for one visit type over a date range. All slot math (weekly hours, date
// overrides, notice, horizon, buffers, capacity, DST) lives in public.booking_slots().

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json, corsHeaders, serviceClient, loadSettings, clean } from "../_shared/booking.ts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const eventTypeId = clean(body.event_type_id, 36);
    const from = clean(body.from, 10);
    const to = clean(body.to, 10);
    if (!UUID_RE.test(eventTypeId) || !DATE_RE.test(from) || !DATE_RE.test(to)) {
      return json(req, { error: "Choose a visit type and dates." }, 400);
    }
    const admin = serviceClient();
    const settings = await loadSettings(admin);
    if (!settings.public_booking_enabled) return json(req, { enabled: false, timezone: settings.timezone, slots: [] });

    const { data, error } = await admin.rpc("booking_slots", {
      p_event_type_id: eventTypeId,
      p_from: from,
      p_to: to,
    });
    if (error) throw error;
    return json(req, {
      enabled: true,
      timezone: settings.timezone,
      // deno-lint-ignore no-explicit-any
      slots: (data ?? []).map((s: any) => ({ start_at: s.start_at, end_at: s.end_at })),
    });
  } catch (e) {
    console.error(e);
    return json(req, { error: "Open times could not be loaded. Please try again." }, 500);
  }
});
