# Rebel Ranch Ministries — Scheduling & Booking System

**Status:** Shared-system component record (built 2026-09-24; replaces Calendly)
**Parent shared-system reference:** `docs/shared-systems-operations.md`
**Built by:** Claude Code (Claude Opus 5.5), session "Custom booking system build for rebelranchministries.org (2026-09-24)"

## What it is, in plain words

People schedule time with Rebel Ranch Ministries on `rebelranchministries.org/book.html` (page heading: **Schedule a Time**). It is the one place for every kind of booking — in-person ranch visits, remote calls, classes, and so on. They pick a booking type, a date, and an open time, fill in their details, and complete any waivers or forms the owner has switched on. They get a confirmation email with the private location or joining details, a calendar file, and a private link to reschedule or cancel. The owner gets an email for every new, moved, or cancelled booking. A reminder email goes out automatically before each visit.

The owner controls everything — booking types, hours, closed days, waivers — from `booking-admin.html` (page title **Scheduling & Booking**; reached from the **Scheduling & Booking** card in the admin section of My Account). Nothing is hard-coded.

**Linking to one booking type:** `book.html?type=<web address name>` opens straight to that type's calendar (the web address name is the "slug" set on the Booking Types tab). Use this to link from a program page to just its own bookings.

## Pages

| Page | Who uses it | Notes |
| --- | --- | --- |
| `book.html` | Public | Not linked from any public page yet (see "Links"). |
| `book-manage.html` | Visitors, from the link in their email | `noindex`. The private code sits after `#` in the link, so browsers never send it to any server. |
| `booking-admin.html` | Owner (admin role) | `noindex`. Uses the existing login (`account.html`) and the existing `user_roles` admin role. Non-admins are sent back to My Account. |

Scripts: `assets/js/booking/` (`booking-common.js`, `book.js`, `manage.js`, `admin.js`). Public styles: `assets/css/booking.css` (built only from `docs/rrm-visual-rules.md` values). The admin page reuses `store-manager.html`'s internal-tool styling.

## Where settings live

All in the Supabase project `dfrwxpuojeiykaignyny` ("Rebel Ranch Platform"), tables prefixed `booking_`:

| Table | Holds | Edited from admin tab |
| --- | --- | --- |
| `booking_settings` (one row) | On/off switch, notification email, time zone, private location text, confirmation message, reminder hours, cancellation policy | Settings |
| `booking_event_types` | Booking types: length, start-time spacing, buffers, notice, how far ahead, party limit, bookings per slot, own private location/joining details, on/off | Booking Types |
| `booking_availability_rules` | Weekly hours (several windows per day allowed) | Weekly Hours |
| `booking_date_overrides` | Closed days and single-day special hours | Blocked Dates |
| `booking_requirements` + `booking_requirement_event_types` | Waivers & forms and which booking types they apply to | Waivers & Forms |
| `booking_requirement_versions` | Every version of every waiver/form. **Never changed or deleted.** | Waivers & Forms (edit = new version) |
| `booking_bookings` | Bookings | Bookings |
| `booking_acknowledgments` | Exactly which waiver **version** each booking agreed to, typed names, time | Bookings → Details |
| `booking_email_log` | Every email attempt and whether it sent | Bookings → Details |
| `booking_rate_limits` | Hashed visitor IP counters for abuse throttling (kept one day) | — |

Waiver PDFs live in the **private** storage bucket `booking-waivers`. Visitors only ever get a link that expires after one hour.

### Hours rules

- Times are entered in the settings time zone (default `America/New_York`). Daylight-saving changes are handled by the database's time-zone rules — a 9:00 AM tour stays 9:00 AM local all year.
- Weekly hours marked "All booking types" apply to every booking type **unless** a booking type has hours of its own; then only its own hours apply to it.
- A "Closed all day" date closes that day. "Special hours" on a date replace the normal weekly hours for that date.
- Closing a day does **not** cancel bookings already on it. Cancel those from the Bookings tab.
- Buffers: "buffer after" on a 9:00–10:00 visit with 15 minutes means the next visit can start at 10:15 or later.
- Double-booking is limited **per booking type**. Two different booking types can be booked at the same time. If you can only take one booking at a time across all types, give the types hours that don't overlap (see Open decisions).
- **Location:** each booking type can have its own private location or joining details (for example a video-call link for a remote booking). If it's left empty, the general location from Settings is used.

## How to add a waiver (owner steps)

1. Get the waiver wording reviewed by a Florida attorney. The admin page shows this reminder too.
2. Open `booking-admin.html` → **Waivers & Forms** → **Add a waiver or form**.
3. Enter a title and choose the type:
   - **PDF waiver** — upload the PDF (10 MB max). Visitors must open the PDF before the "I agree" box unlocks.
   - **Checkbox statement** — type the wording; visitors check a box to agree.
   - **Link to outside form** — paste an `https://` link; visitors must open it before the box unlocks.
4. Choose **Required** or optional, whether a **typed full name** is needed, and whether a **parent/guardian name** is needed when anyone under 18 is coming.
5. Click **Create**. It switches **On** automatically once the first version is saved.
6. By default it applies to **all booking types**. Untick "All booking types" to pick specific ones.
7. Use ↑ / ↓ to set the order visitors see.

**Changing a waiver:** click **Edit (new version)**. Saving creates a new version. Everyone booking from then on sees and signs the new version. Everyone who already signed keeps a permanent record of the exact version they signed (Bookings → Details shows it, with a button to open that exact PDF). If a visitor had the page open with the old wording when you saved a new version, their submission is refused and they're asked to review the new wording.

## First-time setup (owner)

1. Sign in to My Account and click the **Scheduling & Booking** card (or open `booking-admin.html`).
2. **Settings:** check the notification email (`rebelranchfl@gmail.com` by default), add the general private location/directions, confirmation message, and cancellation policy. Leave booking **off** for now.
3. **Booking Types:** add each kind of booking. For remote ones, fill in the booking type's own location/joining details.
4. **Weekly Hours:** add your open hours.
5. **Waivers & Forms:** add waivers (see above).
6. Open `book.html` in a private window and try it.
7. **Settings:** switch online booking **on**.
8. Add a link to `book.html` where you want visitors to find it.

## Server pieces (Edge Functions)

All in `supabase/functions/`, sharing `_shared/booking.ts`. Deployed with JWT verification off because each one does its own checks:

| Function | Does | Protection |
| --- | --- | --- |
| `booking-public-config` | Public list of active booking types and current waiver versions (with 1-hour PDF links). Never returns the notification email or private location. | Read-only |
| `booking-availability` | Open times for a booking type and date range | Read-only; math in `public.booking_slots()` |
| `booking-create` | Books. Re-checks every rule in the database. Sends visitor + owner emails. | Honeypot field, 6 attempts / 10 min per IP |
| `booking-manage` | View / cancel / reschedule with the emailed link; `admin_cancel` for the owner | Link code (only its SHA-256 hash is stored); admin cancel checks the signed-in user's `admin` role |
| `booking-reminders` | Sends due reminders | Called hourly by `pg_cron` job `booking-reminders-hourly` (minute 7) with a secret kept in Supabase Vault (`booking_cron_secret`) |

Database functions `booking_slots`, `booking_create`, `booking_reschedule`, `booking_claim_due_reminders`, and `booking_verify_cron_secret` can be run only by the server (service role).

**Double-booking protection:** `booking_create` and `booking_reschedule` take a database lock for the booking type, then recount overlapping confirmed bookings (buffers included) against "bookings allowed per slot" before saving. Tested with 5 simultaneous requests for one slot: exactly 1 succeeded.

**Reminders:** a booking is reminded once, `reminder_hours_before` hours ahead (default 24). Bookings made (or moved) inside that window don't get a separate reminder — their confirmation arrived recently. If Resend rejects a reminder, the next hourly run retries it.

**Emails:** sent through Resend from `Rebel Ranch Ministries <noreply@rebelranchministries.org>` using the existing `RESEND_API_KEY` secret (same pattern as `notify-website-request`). The private location (the booking type's own, else the general one) appears only in emails to the person with a confirmed booking (confirmation, reschedule confirmation, reminder) — never on a web page, never in the owner or cancellation emails.

## Security summary

- Row Level Security is on for every `booking_` table. The public key cannot read or write any of them (verified: "permission denied").
- Admin access uses the existing `private.is_admin()` check. Waiver versions are insert-only; signatures and the email log are read-only even for the admin.
- Only the publishable key appears in browser code.

## Links

**Added (owner-approved 2026-09-24):** a **Scheduling & Booking** card in the admin section of My Account (`assets/js/public-shell.js`, next to Store Manager). Like the other admin cards it is a convenience only; the page itself checks the admin role.

**Public links added (owner-approved 2026-09-25):**
- "Come Hang Out" (Roots Boots & Animal Poops, Small Space) → `book.html?type=campfire-stories`
- Small space consultation (Small Space page) → `book.html?type=small-spaces-big-possibilities`
- Every partnership "Let's Talk" (Roots Boots land partnership; Programs → Community Partnerships, all five groups) → `book.html?type=lets-talk`
- Settings 2026-09-25: booking switched **on**; hours every day 9:00 AM–5:00 PM for all types; test type and test bookings removed (the two TEST waivers are switched off — waiver versions cannot be deleted by design).
- Paid types (Campfire Stories, Small Spaces) tell visitors in the booking email that a payment link comes next and the private Proton link follows payment. The system itself does not take payment.

**Still not added** (owner to decide where):
- Shared header in `assets/js/public-shell.js` (e.g. "Schedule a Time").
- `contact.html`, `programs.html`, and individual program pages — use `book.html?type=<slug>` to open one booking type directly.
- `sitemap.xml` for `book.html` (not the manage or admin pages).

## Migrations

`supabase/migrations/20260924120000_booking_system_schema.sql`, `…120100_booking_system_functions.sql`, `…120200_booking_system_storage_and_reminders.sql`, `…120300_booking_create_outdated_waiver_message.sql`, `…120400_booking_event_type_location.sql`. Applied to production on 2026-09-24.

## Open decisions

- Cross-booking-type conflicts (see Hours rules).
- Creation Station live classes have their own sign-up/payment system; moving them into this scheduler would be a separate project.
- `book.html` visual review: AGENTS.md requires independent visual review and owner approval for public pages; the page was built from existing approved values but has not had that review.
