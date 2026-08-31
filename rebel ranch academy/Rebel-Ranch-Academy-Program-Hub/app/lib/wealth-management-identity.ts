"use client";

import { supabase } from "./supabase-client";

// Same shape as Creation Station's loadIdentity() in the main site's
// assets/js/creation-station-data.js — reused deliberately, not reinvented.
// program_code is 'wealth_management'; two offer codes exist so pricing can
// split later without any schema change: 'trusts' unlocks Trusts only,
// 'wealth_management_all' unlocks every Wealth Management topic, including
// ones added after this file was written.

export type WealthManagementIdentity = {
  isAdmin: boolean;
  offerCode: string | null;
  hasTrustsAccess: boolean;
};

type MembershipRow = {
  offer_code: string;
  membership_status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

function membershipIsCurrent(m: MembershipRow): boolean {
  const now = Date.now();
  const start = m.starts_at ? Date.parse(m.starts_at) : null;
  const end = m.ends_at ? Date.parse(m.ends_at) : null;
  return (
    ["active", "past_due"].includes(m.membership_status) &&
    (!start || start <= now) &&
    (!end || end > now)
  );
}

/**
 * Returns null if nobody is signed in. Otherwise returns the caller's
 * admin/membership status for the wealth_management program. Throws on a
 * genuine Supabase error so the caller can show a real error state rather
 * than silently treating a failed query as "no access."
 */
export async function loadWealthManagementIdentity(): Promise<WealthManagementIdentity | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) return null;

  const userId = session.user.id;

  const [rolesRes, membersRes] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("memberships")
      .select("offer_code,membership_status,starts_at,ends_at,created_at")
      .eq("user_id", userId)
      .eq("program_code", "wealth_management")
      .order("created_at", { ascending: false }),
  ]);
  if (rolesRes.error) throw rolesRes.error;
  if (membersRes.error) throw membersRes.error;

  const isAdmin = (rolesRes.data ?? []).some((r) => r.role === "admin");
  const current = ((membersRes.data ?? []) as MembershipRow[]).find(membershipIsCurrent) ?? null;
  const offerCode = current?.offer_code ?? null;

  const hasTrustsAccess = isAdmin || offerCode === "trusts" || offerCode === "wealth_management_all";

  return { isAdmin, offerCode, hasTrustsAccess };
}
