import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { email } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const flagId = params.id;

  // 1. Load the flag event so we know which user + city are involved
  const { data: flagEvent } = await supabase
    .from("flag_events")
    .select("entity_id, city_id")
    .eq("id", flagId)
    .single();

  const reportedUserId = flagEvent?.entity_id ?? null;
  const cityId = flagEvent?.city_id ?? null;

  // 2. Write an audit log entry
  await supabase.from("audit_logs").insert({
    actor: email,
    action: "escalate_flag",
    entity: flagId,
    metadata: {
      reported_user_id: reportedUserId,
      city_id: cityId,
      source: "admin_action",
    },
  });

  // 3. Add a fraud signal for admin escalation
  if (reportedUserId) {
    await supabase.from("fraud_signals").insert({
      user_id: reportedUserId,
      city_id: cityId,
      signal_type: "admin_escalate",
      signal_value: 1,
      severity: "medium",
      score_impact: 2,
      metadata: { flag_event_id: flagId },
      reviewed: true,
    });
  }

  // 4. Redirect back to the report detail page
  return NextResponse.redirect(`/admin/CEO/safety/reports/${flagId}`);
}
