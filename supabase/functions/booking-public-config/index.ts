// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Custom booking system build for rebelranchministries.org (2026-09-24)
// Public, read-only booking configuration for book.html: whether booking is on, active visit
// types, and active waivers/forms with their CURRENT version. PDF waivers get a short-lived
// signed URL from the private booking-waivers bucket. Never returns private settings
// (notification email, private location).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json, corsHeaders, serviceClient, loadSettings } from "../_shared/booking.ts";

const SIGNED_URL_SECONDS = 60 * 60;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST" && req.method !== "GET") return json(req, { error: "Method not allowed" }, 405);
  try {
    const admin = serviceClient();
    const settings = await loadSettings(admin);
    const base = {
      enabled: settings.public_booking_enabled,
      timezone: settings.timezone,
      cancellation_policy_text: settings.cancellation_policy_text,
    };
    if (!settings.public_booking_enabled) {
      return json(req, { ...base, event_types: [], requirements: [] });
    }

    const { data: types, error: typeErr } = await admin
      .from("booking_event_types")
      .select("id,name,slug,description,duration_minutes,max_party_size,sort_order")
      .eq("active", true)
      .order("sort_order")
      .order("name");
    if (typeErr) throw typeErr;

    const { data: reqs, error: reqErr } = await admin
      .from("booking_requirements")
      .select("id,title,kind,required,requires_typed_name,requires_guardian_for_minors,applies_to_all,sort_order,created_at,booking_requirement_event_types(event_type_id)")
      .eq("active", true)
      .order("sort_order")
      .order("created_at");
    if (reqErr) throw reqErr;

    const requirements = [];
    for (const r of reqs ?? []) {
      const { data: v } = await admin
        .from("booking_requirement_versions")
        .select("id,version_number,body_text,file_path,link_url")
        .eq("requirement_id", r.id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!v) continue; // a requirement with no version yet is not shown (and not enforced)
      let fileUrl: string | null = null;
      if (v.file_path) {
        const { data: signed } = await admin.storage.from("booking-waivers").createSignedUrl(v.file_path, SIGNED_URL_SECONDS);
        fileUrl = signed?.signedUrl ?? null;
      }
      requirements.push({
        id: r.id,
        title: r.title,
        kind: r.kind,
        required: r.required,
        requires_typed_name: r.requires_typed_name,
        requires_guardian_for_minors: r.requires_guardian_for_minors,
        applies_to_all: r.applies_to_all,
        // deno-lint-ignore no-explicit-any
        event_type_ids: (r.booking_requirement_event_types ?? []).map((j: any) => j.event_type_id),
        version: {
          id: v.id,
          version_number: v.version_number,
          body_text: v.body_text,
          link_url: v.link_url,
          file_url: fileUrl,
        },
      });
    }

    return json(req, { ...base, event_types: types ?? [], requirements });
  } catch (e) {
    console.error(e);
    return json(req, { error: "Booking is temporarily unavailable." }, 500);
  }
});
