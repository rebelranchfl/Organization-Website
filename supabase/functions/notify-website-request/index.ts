// AI-Agent: Claude Code
// Session: Creation Station dashboard corrections walkthrough (2026-08-08/09)
// Sends a confirmation email (to the admin and the submitting household) when a
// Creation Station Studio/website request is submitted. The caller only supplies a
// requestId; the function looks up every other detail itself with the service role,
// after confirming (via a JWT-scoped client, so RLS applies) that the caller actually
// owns that request.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ADMIN_EMAIL = "rebelranchfl@gmail.com";
const FROM_ADDRESS = "Rebel Ranch Ministries <noreply@rebelranchministries.org>";

Deno.serve(async (req: Request) => {
  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return new Response(JSON.stringify({ error: "requestId is required" }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    // Authorization check: run this query as the caller (their JWT, RLS applies),
    // not the service role, so a signed-in user can only trigger this for a request
    // they actually own.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: owned } = await userClient
      .from("creator_website_requests")
      .select("id")
      .eq("id", requestId)
      .maybeSingle();
    if (!owned) {
      return new Response(JSON.stringify({ error: "Request not found or not authorized" }), { status: 403 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: reqRow, error: reqErr } = await admin
      .from("creator_website_requests")
      .select("id, brand_name, owner_user_id, creator_id, parent_approver_name, parent_approver_relationship, submitted_at")
      .eq("id", requestId)
      .single();
    if (reqErr || !reqRow) {
      return new Response(JSON.stringify({ error: "Request not found" }), { status: 404 });
    }

    const { data: creator } = await admin
      .from("creator_profiles")
      .select("display_name")
      .eq("id", reqRow.creator_id)
      .maybeSingle();

    const { data: ownerUser } = await admin.auth.admin.getUserById(reqRow.owner_user_id);
    const householdEmail = ownerUser?.user?.email;

    const recipients = [ADMIN_EMAIL, householdEmail].filter(Boolean) as string[];
    if (!resendKey || recipients.length === 0) {
      return new Response(JSON.stringify({ error: "Email not configured or no recipients" }), { status: 500 });
    }

    const submittedDate = reqRow.submitted_at ? new Date(reqRow.submitted_at).toLocaleString() : "just now";
    const subject = `Creation Station Studio request submitted: ${reqRow.brand_name}`;
    const html = `
      <p>A Creation Station Studio request has been submitted and is waiting for review.</p>
      <p><strong>Brand / Studio name:</strong> ${reqRow.brand_name}</p>
      <p><strong>Creator:</strong> ${creator?.display_name ?? "Unknown"}</p>
      <p><strong>Parent/guardian approval on file:</strong> ${reqRow.parent_approver_name ?? "Not recorded"}${reqRow.parent_approver_relationship ? ` (${reqRow.parent_approver_relationship})` : ""}</p>
      <p><strong>Submitted:</strong> ${submittedDate}</p>
      <p>Review it in the Creation Station dashboard's Admin view.</p>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: recipients, subject, html }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      return new Response(JSON.stringify({ error: errText }), { status: 502 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
