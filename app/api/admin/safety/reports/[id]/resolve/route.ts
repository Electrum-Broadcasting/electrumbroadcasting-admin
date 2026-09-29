import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/context";
import { logAdminAction } from "@/lib/admin/logging";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminContext();
  const { email } = admin;
  const supabase = createSupabaseServerClient();

  const flagId = params.id;

  // 1. Load the flag event so we know which user was reported
  const { data: flagEvent } = await supabase
    .from("flag_events")
    .select("entity_id, city_id")
    .eq("id", flagId)
    .single();

  // If somehow missing, still log the admin action
  const reportedUserId = flagEvent?.entity_id ?? null;
  const cityId = flagEvent?.city_id ?? null;

  // 2. Write an audit log entry for the admin action
  await supabase.from("audit_logs").insert({
    actor: email,
    action: "resolve_flag",
    entity: flagId,
    metadata: {
      reported_user_id: reportedUserId,
      city_id: cityId,
      source: "admin_action",
    },
  });

  // 3. Optionally: add a fraud signal indicating admin resolution
  // (This is low severity and does not penalize the user.)
  if (reportedUserId) {
    await supabase.from("fraud_signals").insert({
      user_id: reportedUserId,
      city_id: cityId,
      signal_type: "admin_resolve",
      signal_value: 0,
      severity: "low",
      score_impact: 0,
      metadata: { flag_event_id: flagId },
      reviewed: true,
    });
  }

  await logAdminAction(supabase, admin, {
    action: "REPORT_RESOLVE",
    domain: "safety_reports",
    entity_type: "report",
    entity_id: null,
    target_user_id: reportedUserId,
    metadata: { report_id: flagId, city_id: cityId, reason: "admin_resolve" },
  });

  // 4. Redirect back to the detail page
  return NextResponse.redirect(`/admin/CEO/safety/reports/${flagId}`);
}
