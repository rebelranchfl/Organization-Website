// AI-Agent: Claude Code (Claude Opus 5.5)
// Session: Custom booking system build for rebelranchministries.org (2026-09-24)
// Called hourly by pg_cron (job "booking-reminders-hourly"). Authenticates the call with a
// shared secret stored only in Supabase Vault. Claims due reminders atomically
// (reminder_sent_at is set in the same statement), so no booking is reminded twice. If
// Resend rejects a send, reminder_sent_at is cleared so the next hourly run retries it.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serviceClient, loadEmailContext, visitorReminderEmail, sendEmail } from "../_shared/booking.ts";

const plain = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return plain({ error: "Method not allowed" }, 405);
  const admin = serviceClient();
  const secret = req.headers.get("x-booking-cron-secret") ?? "";
  const { data: ok } = await admin.rpc("booking_verify_cron_secret", { p_secret: secret });
  if (ok !== true) return plain({ error: "Unauthorized" }, 401);

  const { data: due, error } = await admin.rpc("booking_claim_due_reminders");
  if (error) {
    console.error(error);
    return plain({ error: "Could not load reminders" }, 500);
  }
  let sent = 0;
  let failed = 0;
  for (const b of (due ?? []) as { id: string }[]) {
    try {
      const ctx = await loadEmailContext(admin, b.id);
      const ok = await sendEmail(admin, { bookingId: b.id, type: "reminder", to: ctx.booking.email, ...visitorReminderEmail(ctx, null) });
      if (ok) {
        sent++;
      } else {
        failed++;
        await admin.from("booking_bookings").update({ reminder_sent_at: null }).eq("id", b.id);
      }
    } catch (e) {
      console.error(e);
      failed++;
      await admin.from("booking_bookings").update({ reminder_sent_at: null }).eq("id", b.id);
    }
  }
  return plain({ ok: true, claimed: (due ?? []).length, sent, failed });
});
