// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Custom booking system build for rebelranchministries.org (2026-09-24)
// Shared helpers for the booking-* Edge Functions: CORS, service client, settings,
// hashing, rate limiting, Resend email (same pattern as notify-website-request), and .ics.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const SITE_URL = "https://rebelranchministries.org";
export const FROM_ADDRESS = "Rebel Ranch Ministries <noreply@rebelranchministries.org>";

const ALLOWED_ORIGINS = new Set([
  "https://rebelranchministries.org",
  "https://www.rebelranchministries.org",
]);

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) || local ? origin : SITE_URL,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

export const clean = (value: unknown, max = 2000): string => String(value ?? "").trim().slice(0, max);

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const nl2br = (value: unknown) => escapeHtml(value).replace(/\r?\n/g, "<br>");

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function manageUrl(token: string): string {
  return `${SITE_URL}/book-manage.html#t=${encodeURIComponent(token)}`;
}

export interface BookingSettings {
  notification_email: string;
  timezone: string;
  public_booking_enabled: boolean;
  private_location_text: string | null;
  confirmation_message: string | null;
  reminder_hours_before: number;
  cancellation_policy_text: string | null;
}

export async function loadSettings(admin: SupabaseClient): Promise<BookingSettings> {
  const { data, error } = await admin.from("booking_settings").select("*").eq("id", true).single();
  if (error || !data) throw new Error("Booking settings missing");
  return data as BookingSettings;
}

/** Returns true when the caller is under the limit (and records this attempt). */
export async function underRateLimit(
  admin: SupabaseClient,
  req: Request,
  action: string,
  limit: number,
  windowMinutes: number,
): Promise<boolean> {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") || "unknown";
  const keyHash = await sha256Hex(`booking-rate:${ip}`);
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count } = await admin
    .from("booking_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key_hash", keyHash)
    .eq("action", action)
    .gte("created_at", since);
  if ((count ?? 0) >= limit) return false;
  await admin.from("booking_rate_limits").insert({ key_hash: keyHash, action });
  // Housekeeping: keep only the last day of throttle rows.
  await admin.from("booking_rate_limits").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
  return true;
}

export function formatWhen(startIso: string, endIso: string, tz: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "long", month: "long", day: "numeric", year: "numeric",
  }).format(start);
  const time = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", timeZoneName: "short" })
      .format(d);
  return `${day}, ${time(start).replace(/ [A-Z]{2,5}$/, "")} – ${time(end)}`;
}

function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function buildIcs(opts: {
  bookingId: string;
  title: string;
  startIso: string;
  endIso: string;
  location: string | null;
  description: string;
  sequence?: number;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rebel Ranch Ministries//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.bookingId}@rebelranchministries.org`,
    `SEQUENCE:${opts.sequence ?? 0}`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(opts.startIso)}`,
    `DTEND:${icsDate(opts.endIso)}`,
    `SUMMARY:${icsText(opts.title)}`,
    ...(opts.location ? [`LOCATION:${icsText(opts.location)}`] : []),
    `DESCRIPTION:${icsText(opts.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545 line folding at 75 octets (approximated by characters).
  return lines
    .map((line) => {
      const parts: string[] = [];
      let rest = line;
      while (rest.length > 74) {
        parts.push(rest.slice(0, 74));
        rest = " " + rest.slice(74);
      }
      parts.push(rest);
      return parts.join("\r\n");
    })
    .join("\r\n") + "\r\n";
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** Sends one email through Resend and records the outcome in booking_email_log. */
export async function sendEmail(
  admin: SupabaseClient,
  opts: {
    bookingId: string | null;
    type: string;
    to: string;
    subject: string;
    html: string;
    ics?: string;
  },
): Promise<boolean> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const log = (status: "sent" | "failed" | "skipped", error: string | null) =>
    admin.from("booking_email_log").insert({
      booking_id: opts.bookingId,
      type: opts.type,
      recipient: opts.to,
      status,
      error: error ? error.slice(0, 2000) : null,
    });
  if (!resendKey) {
    await log("skipped", "RESEND_API_KEY is not configured");
    return false;
  }
  try {
    const body: Record<string, unknown> = { from: FROM_ADDRESS, to: [opts.to], subject: opts.subject, html: opts.html };
    if (opts.ics) body.attachments = [{ filename: "rebel-ranch-booking.ics", content: toBase64(opts.ics) }];
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      await log("failed", `${response.status} ${await response.text()}`);
      return false;
    }
    await log("sent", null);
    return true;
  } catch (e) {
    await log("failed", String(e));
    return false;
  }
}

// ---------------------------------------------------------------------------
// Email bodies. Plain, readable HTML; the private location appears ONLY in emails
// to the visitor who holds a confirmed booking.
// ---------------------------------------------------------------------------
const wrap = (inner: string) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1b2a1e;max-width:560px">${inner}<p style="color:#5b6b5e;font-size:13px;margin-top:28px">Rebel Ranch Ministries</p></div>`;

export interface BookingEmailContext {
  booking: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    party_size: number;
    minors_count: number;
    guardian_name: string | null;
    notes: string | null;
    start_at: string;
    end_at: string;
  };
  eventName: string;
  /** This booking type's own private location, else the general one from settings. */
  location: string | null;
  settings: BookingSettings;
}

function detailsBlock(ctx: BookingEmailContext, includeLocation: boolean): string {
  const b = ctx.booking;
  const rows = [
    `<strong>Booking:</strong> ${escapeHtml(ctx.eventName)}`,
    `<strong>When:</strong> ${escapeHtml(formatWhen(b.start_at, b.end_at, ctx.settings.timezone))}`,
    `<strong>Party size:</strong> ${b.party_size}${b.minors_count ? ` (${b.minors_count} under 18)` : ""}`,
  ];
  if (includeLocation && ctx.location) {
    rows.push(`<strong>Where / how to join:</strong><br>${nl2br(ctx.location)}`);
  }
  return `<p>${rows.join("<br>")}</p>`;
}

export function visitorConfirmationEmail(ctx: BookingEmailContext, token: string, heading = "You're booked") {
  const s = ctx.settings;
  return {
    subject: `${heading}: ${ctx.eventName}`,
    html: wrap(`
      <h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>
      <p>Hi ${escapeHtml(ctx.booking.name)},</p>
      ${detailsBlock(ctx, true)}
      ${s.confirmation_message ? `<p>${nl2br(s.confirmation_message)}</p>` : ""}
      <p>A calendar file is attached so you can add it to your calendar.</p>
      <p><a href="${manageUrl(token)}">View, reschedule, or cancel your booking</a></p>
      ${s.cancellation_policy_text ? `<p style="font-size:14px"><strong>Cancellation policy:</strong><br>${nl2br(s.cancellation_policy_text)}</p>` : ""}
      <p style="font-size:14px">Please keep this email private — the link above lets anyone who has it change your booking.</p>
    `),
  };
}

export function visitorReminderEmail(ctx: BookingEmailContext, manageLink: string | null) {
  const s = ctx.settings;
  return {
    subject: `Reminder: ${ctx.eventName} — Rebel Ranch Ministries`,
    html: wrap(`
      <h2 style="margin:0 0 12px">See you soon</h2>
      <p>Hi ${escapeHtml(ctx.booking.name)}, this is a reminder about your upcoming booking.</p>
      ${detailsBlock(ctx, true)}
      ${s.confirmation_message ? `<p>${nl2br(s.confirmation_message)}</p>` : ""}
      ${manageLink ? `<p><a href="${manageLink}">Manage your booking</a></p>` : "<p>Need to change plans? Use the link in your confirmation email.</p>"}
    `),
  };
}

export function visitorCancelledEmail(ctx: BookingEmailContext, byAdmin: boolean) {
  return {
    subject: `Cancelled: ${ctx.eventName}`,
    html: wrap(`
      <h2 style="margin:0 0 12px">Your booking has been cancelled</h2>
      <p>Hi ${escapeHtml(ctx.booking.name)},</p>
      <p>${byAdmin
        ? "Rebel Ranch Ministries had to cancel the booking below. We're sorry for the inconvenience."
        : "Your booking below has been cancelled as you requested."}</p>
      ${detailsBlock(ctx, false)}
      <p><a href="${SITE_URL}/book.html">Book another time</a></p>
    `),
  };
}

export function ownerEmail(
  ctx: BookingEmailContext,
  kind: "new" | "cancelled" | "rescheduled",
  extra: { acknowledgments?: { title: string; version: number; typed_name: string | null; guardian: string | null }[]; oldStart?: string; cancelledBy?: string } = {},
) {
  const b = ctx.booking;
  const label = kind === "new" ? "New booking" : kind === "cancelled" ? "Booking cancelled" : "Booking rescheduled";
  const acks = (extra.acknowledgments ?? [])
    .map((a) =>
      `<li>${escapeHtml(a.title)} (version ${a.version})${a.typed_name ? ` — signed by ${escapeHtml(a.typed_name)}` : ""}${a.guardian ? `; guardian ${escapeHtml(a.guardian)}` : ""}</li>`
    )
    .join("");
  return {
    subject: `${label}: ${ctx.eventName} — ${formatWhen(b.start_at, b.end_at, ctx.settings.timezone)}`,
    html: wrap(`
      <h2 style="margin:0 0 12px">${label}</h2>
      ${extra.oldStart ? `<p><strong>Previously:</strong> ${escapeHtml(new Intl.DateTimeFormat("en-US", { timeZone: ctx.settings.timezone, dateStyle: "full", timeStyle: "short" }).format(new Date(extra.oldStart)))}</p>` : ""}
      ${extra.cancelledBy ? `<p><strong>Cancelled by:</strong> ${escapeHtml(extra.cancelledBy)}</p>` : ""}
      ${detailsBlock(ctx, false)}
      <p><strong>Name:</strong> ${escapeHtml(b.name)}<br>
      <strong>Email:</strong> ${escapeHtml(b.email)}<br>
      <strong>Phone:</strong> ${escapeHtml(b.phone ?? "—")}<br>
      ${b.minors_count ? `<strong>Guardian:</strong> ${escapeHtml(b.guardian_name ?? "—")}<br>` : ""}
      <strong>Notes:</strong> ${b.notes ? nl2br(b.notes) : "—"}</p>
      ${acks ? `<p><strong>Waivers &amp; forms acknowledged:</strong></p><ul>${acks}</ul>` : ""}
      <p><a href="${SITE_URL}/booking-admin.html">Open booking admin</a></p>
    `),
  };
}

export async function loadEmailContext(admin: SupabaseClient, bookingId: string): Promise<BookingEmailContext> {
  const { data: booking, error } = await admin
    .from("booking_bookings")
    .select("id,name,email,phone,party_size,minors_count,guardian_name,notes,start_at,end_at,event_type_id,status")
    .eq("id", bookingId)
    .single();
  if (error || !booking) throw new Error("Booking not found");
  const { data: et } = await admin.from("booking_event_types").select("name,location_text").eq("id", booking.event_type_id).single();
  const settings = await loadSettings(admin);
  return {
    booking,
    eventName: et?.name ?? "Booking",
    location: et?.location_text?.trim() || settings.private_location_text || null,
    settings,
  };
}

export async function loadAcknowledgmentSummary(admin: SupabaseClient, bookingId: string) {
  const { data } = await admin
    .from("booking_acknowledgments")
    .select("typed_name,guardian_typed_name,booking_requirement_versions(version_number,booking_requirements(title))")
    .eq("booking_id", bookingId);
  // deno-lint-ignore no-explicit-any
  return (data ?? []).map((a: any) => ({
    title: a.booking_requirement_versions?.booking_requirements?.title ?? "Requirement",
    version: a.booking_requirement_versions?.version_number ?? 0,
    typed_name: a.typed_name,
    guardian: a.guardian_typed_name,
  }));
}

export function calendarFor(ctx: BookingEmailContext, token: string | null, sequence = 0): string {
  return buildIcs({
    bookingId: ctx.booking.id,
    title: `${ctx.eventName} — Rebel Ranch Ministries`,
    startIso: ctx.booking.start_at,
    endIso: ctx.booking.end_at,
    location: ctx.location,
    description: token ? `Manage your booking: ${manageUrl(token)}` : "Rebel Ranch Ministries booking",
    sequence,
  });
}
