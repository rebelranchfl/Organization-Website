// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Custom booking system build for rebelranchministries.org (2026-09-24)
// Manage an existing booking.
//  * Visitors: token from the confirmation-email link (only its SHA-256 hash is stored).
//      action "view" | "cancel" | "reschedule" (re-runs slot validation under the lock;
//      waiver acknowledgments stay attached to the booking).
//  * Admins: action "admin_cancel" with the signed-in admin's JWT (existing user_roles check).
// Owner and visitor are emailed on every change.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  json, corsHeaders, serviceClient, clean, sha256Hex, underRateLimit, loadEmailContext,
  visitorConfirmationEmail, visitorCancelledEmail, ownerEmail, calendarFor, sendEmail,
} from "../_shared/booking.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RESCHEDULE_MESSAGES: Record<string, [number, string]> = {
  slot_unavailable: [409, "Sorry — that time was just taken or is no longer open. Please pick another time."],
  not_active: [409, "This booking has already been cancelled."],
  already_started: [409, "This visit has already started or passed and can't be changed online."],
  disabled: [403, "Online booking changes are currently closed. Please contact us directly."],
};

async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: userData } = await userClient.auth.getUser(auth.slice(7));
  const userId = userData?.user?.id;
  if (!userId) return false;
  const { data } = await serviceClient()
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = clean(body.action, 20);
    const admin = serviceClient();

    // ------------------------------------------------------------------ admin cancel
    if (action === "admin_cancel") {
      if (!(await isAdmin(req))) return json(req, { error: "Administrator access is required." }, 403);
      const bookingId = clean(body.booking_id, 36);
      if (!UUID_RE.test(bookingId)) return json(req, { error: "Booking not found." }, 404);
      const { data: updated, error } = await admin
        .from("booking_bookings")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: "admin" })
        .eq("id", bookingId).eq("status", "confirmed")
        .select("id").maybeSingle();
      if (error) throw error;
      if (!updated) return json(req, { error: "This booking is not active." }, 409);
      const ctx = await loadEmailContext(admin, bookingId);
      const notifyVisitor = body.notify_visitor !== false;
      const results = await Promise.all([
        notifyVisitor
          ? sendEmail(admin, { bookingId, type: "cancellation_admin", to: ctx.booking.email, ...visitorCancelledEmail(ctx, true) })
          : Promise.resolve(false),
        sendEmail(admin, { bookingId, type: "owner_cancelled", to: ctx.settings.notification_email, ...ownerEmail(ctx, "cancelled", { cancelledBy: "Admin" }) }),
      ]);
      return json(req, { ok: true, visitor_emailed: results[0] });
    }

    // ------------------------------------------------------------------ visitor actions
    if (!(await underRateLimit(admin, req, "manage", 30, 10))) {
      return json(req, { error: "Too many requests. Please wait a few minutes and try again." }, 429);
    }
    const token = clean(body.token, 100);
    if (token.length < 20) return json(req, { error: "This link is not valid. Please use the link from your confirmation email." }, 404);
    const tokenHash = await sha256Hex(token);
    const { data: booking } = await admin
      .from("booking_bookings")
      .select("id,event_type_id,start_at,end_at,status,name,party_size,minors_count")
      .eq("manage_token_hash", tokenHash)
      .maybeSingle();
    if (!booking) return json(req, { error: "This link is not valid. Please use the link from your confirmation email." }, 404);

    if (action === "view") {
      const [{ data: et }, { data: settings }] = await Promise.all([
        admin.from("booking_event_types").select("name,active").eq("id", booking.event_type_id).single(),
        admin.from("booking_settings").select("timezone,cancellation_policy_text,public_booking_enabled").eq("id", true).single(),
      ]);
      const upcoming = new Date(booking.start_at).getTime() > Date.now();
      return json(req, {
        booking: {
          event_type_id: booking.event_type_id,
          event_name: et?.name ?? "Visit",
          start_at: booking.start_at,
          end_at: booking.end_at,
          status: booking.status,
          name: booking.name,
          party_size: booking.party_size,
          minors_count: booking.minors_count,
        },
        timezone: settings?.timezone ?? "America/New_York",
        cancellation_policy_text: settings?.cancellation_policy_text ?? null,
        can_cancel: booking.status === "confirmed" && upcoming,
        can_reschedule: booking.status === "confirmed" && upcoming && !!settings?.public_booking_enabled && !!et?.active,
      });
    }

    if (action === "cancel") {
      const { data: updated, error } = await admin
        .from("booking_bookings")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: "visitor" })
        .eq("id", booking.id).eq("status", "confirmed").gt("start_at", new Date().toISOString())
        .select("id").maybeSingle();
      if (error) throw error;
      if (!updated) return json(req, { error: "This booking can no longer be cancelled online." }, 409);
      const ctx = await loadEmailContext(admin, booking.id);
      await Promise.all([
        sendEmail(admin, { bookingId: booking.id, type: "cancellation_visitor", to: ctx.booking.email, ...visitorCancelledEmail(ctx, false) }),
        sendEmail(admin, { bookingId: booking.id, type: "owner_cancelled", to: ctx.settings.notification_email, ...ownerEmail(ctx, "cancelled", { cancelledBy: "Visitor" }) }),
      ]);
      return json(req, { ok: true });
    }

    if (action === "reschedule") {
      const newStart = clean(body.start_at, 40);
      if (!newStart || Number.isNaN(Date.parse(newStart))) return json(req, { error: "Please choose a new time." }, 400);
      const { data: moved, error } = await admin.rpc("booking_reschedule", { p_booking_id: booking.id, p_new_start: newStart });
      if (error) {
        const code = /booking:([a-z_]+)/.exec(error.message ?? "")?.[1];
        const mapped = code ? RESCHEDULE_MESSAGES[code] : undefined;
        if (!mapped) console.error("booking_reschedule failed", error);
        const [status, message] = mapped ?? [400, "The visit could not be rescheduled. Please try again."];
        return json(req, { error: message, code: code ?? "unknown" }, status);
      }
      const oldStart = Array.isArray(moved) ? moved[0]?.old_start_at : undefined;
      const ctx = await loadEmailContext(admin, booking.id);
      const sequence = Math.floor(Date.now() / 1000) % 100000;
      await Promise.all([
        sendEmail(admin, {
          bookingId: booking.id, type: "reschedule_visitor", to: ctx.booking.email,
          ...visitorConfirmationEmail(ctx, token, "Your visit has been rescheduled"),
          ics: calendarFor(ctx, token, sequence),
        }),
        sendEmail(admin, { bookingId: booking.id, type: "owner_rescheduled", to: ctx.settings.notification_email, ...ownerEmail(ctx, "rescheduled", { oldStart }) }),
      ]);
      return json(req, { ok: true, start_at: ctx.booking.start_at, end_at: ctx.booking.end_at });
    }

    return json(req, { error: "Unknown action." }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { error: "Something went wrong. Please try again." }, 500);
  }
});
