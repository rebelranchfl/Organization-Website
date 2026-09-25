// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Custom booking system build for rebelranchministries.org (2026-09-24)
// Creates a booking. Every rule is re-checked on the server inside public.booking_create():
// the slot is re-validated under a per-visit-type lock, each required waiver/form must be
// acknowledged against its CURRENT version, typed names must be present, and a guardian is
// required when minors are coming and any applicable requirement asks for one.
// Then emails the visitor (with private location, .ics, manage link) and the owner.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  json, corsHeaders, serviceClient, clean, sha256Hex, randomToken, underRateLimit,
  loadEmailContext, loadAcknowledgmentSummary, visitorConfirmationEmail, ownerEmail,
  calendarFor, sendEmail, PAYMENT_NOTE,
} from "../_shared/booking.ts";

const MESSAGES: Record<string, [number, string]> = {
  disabled: [403, "Online booking is currently closed."],
  event_type_unavailable: [409, "That booking type is no longer available. Please choose another."],
  slot_unavailable: [409, "Sorry — that time was just taken or is no longer open. Please pick another time."],
  party_size: [400, "Please enter a party size within the limit for this booking."],
  minors_count: [400, "The number of people under 18 can't be more than the party size."],
  contact_missing: [400, "Please enter your name and a valid email address."],
  guardian_missing: [400, "A parent or guardian name is required when anyone under 18 is coming."],
  requirement_missing: [400, "Please complete every required waiver or form."],
  typed_name_missing: [400, "Please type your full name for each waiver that asks for it."],
  guardian_signature_missing: [400, "Please type the parent or guardian's full name on each waiver that asks for it."],
  requirement_outdated: [409, "A waiver or form was just updated. Please review it again and resubmit."],
  invalid_request: [400, "Something was missing from the booking. Please try again."],
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json(req, { error: MESSAGES.invalid_request[1] }, 400);

    // Honeypot: real visitors never see or fill the "website" field. Pretend success.
    if (clean(body.website, 200) !== "") {
      return json(req, { ok: true, booking: null });
    }

    const admin = serviceClient();
    if (!(await underRateLimit(admin, req, "create", 6, 10))) {
      return json(req, { error: "Too many booking attempts. Please wait a few minutes and try again." }, 429);
    }

    const email = clean(body.email, 254).toLowerCase();
    const eventTypeId = clean(body.event_type_id, 36);
    if (!UUID_RE.test(eventTypeId) || !EMAIL_RE.test(email)) {
      return json(req, { error: MESSAGES.contact_missing[1] }, 400);
    }

    const acknowledgments = Array.isArray(body.acknowledgments)
      ? body.acknowledgments.slice(0, 50).map((a: Record<string, unknown>) => ({
        requirement_version_id: clean(a?.requirement_version_id, 36),
        typed_name: clean(a?.typed_name, 160),
        guardian_typed_name: clean(a?.guardian_typed_name, 160),
      }))
      : [];

    const token = randomToken();
    const payload = {
      event_type_id: eventTypeId,
      start_at: clean(body.start_at, 40),
      name: clean(body.name, 160),
      email,
      phone: clean(body.phone, 40),
      party_size: Number.parseInt(String(body.party_size), 10) || 0,
      minors_count: Number.parseInt(String(body.minors_count ?? 0), 10) || 0,
      guardian_name: clean(body.guardian_name, 160),
      notes: clean(body.notes, 2000),
      manage_token_hash: await sha256Hex(token),
      user_agent: clean(req.headers.get("user-agent"), 400),
      acknowledgments,
    };

    const { data: bookingId, error } = await admin.rpc("booking_create", { p: payload });
    if (error) {
      const code = /booking:([a-z_]+)/.exec(error.message ?? "")?.[1];
      const mapped = code ? MESSAGES[code] : undefined;
      if (!mapped) console.error("booking_create failed", error);
      const [status, message] = mapped ?? [400, "The booking could not be completed. Please check your details and try again."];
      return json(req, { error: message, code: code ?? "unknown" }, status);
    }

    const ctx = await loadEmailContext(admin, bookingId as string);
    const acks = await loadAcknowledgmentSummary(admin, ctx.booking.id);
    const visitorMail = visitorConfirmationEmail(ctx, token);
    const ownerMail = ownerEmail(ctx, "new", { acknowledgments: acks });
    const [visitorSent] = await Promise.all([
      sendEmail(admin, { bookingId: ctx.booking.id, type: "confirmation", to: ctx.booking.email, ...visitorMail, ics: calendarFor(ctx, token) }),
      sendEmail(admin, { bookingId: ctx.booking.id, type: "owner_new", to: ctx.settings.notification_email, ...ownerMail }),
    ]);

    return json(req, {
      ok: true,
      booking: {
        id: ctx.booking.id,
        event_name: ctx.eventName,
        start_at: ctx.booking.start_at,
        end_at: ctx.booking.end_at,
        timezone: ctx.settings.timezone,
        confirmation_message: ctx.settings.confirmation_message,
        payment_required: ctx.paymentRequired,
        payment_note: ctx.paymentRequired ? PAYMENT_NOTE : null,
        email_sent: visitorSent,
      },
    });
  } catch (e) {
    console.error(e);
    return json(req, { error: "The booking could not be completed. Please try again." }, 500);
  }
});
