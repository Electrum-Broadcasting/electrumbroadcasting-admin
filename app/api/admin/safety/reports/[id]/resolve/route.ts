import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { email } = await getAdminContext();
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

  // 4. Redirect back to the detail page
  return NextResponse.redirect(`/admin/CEO/safety/reports/${flagId}`);
}
