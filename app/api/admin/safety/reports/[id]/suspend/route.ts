import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user_id: adminUserId } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const flagId = params.id;

  // 1. Load the flag event so we know which user was reported
  const { data: flagEvent, error } = await supabase
    .from("flag_events")
    .select("entity_id, city_id")
    .eq("id", flagId)
    .single();

  if (!flagEvent || error) {
    return NextResponse.redirect(`/admin/CEO/safety/reports/${flagId}`);
  }

  const reportedUserId = flagEvent.entity_id;
  const cityId = flagEvent.city_id;

  // 2. Suspend the user
  if (reportedUserId) {
    await supabase
      .from("users")
      .update({ suspended: true })
      .eq("id", reportedUserId);
  }

  // 3. Write an audit log entry
  await supabase.from("audit_logs").insert({
    actor_user_id: adminUserId,
    action: "suspend_user",
    entity_type: "user",
    entity_id: reportedUserId ?? flagId,
    metadata: {
      flag_event_id: flagId,
      city_id: cityId,
      source: "admin_action",
    },
  });

  // 4. Add a fraud signal for admin suspension
  await supabase.from("fraud_signals").insert({
    user_id: reportedUserId,
    city_id: cityId,
    signal_type: "admin_suspend",
    signal_value: 1,
    severity: "high",
    score_impact: 3,
    metadata: { flag_event_id: flagId },
    reviewed: true,
  });

  // 5. Redirect back to the report detail page
  return NextResponse.redirect(`/admin/CEO/safety/reports/${flagId}`);
}
