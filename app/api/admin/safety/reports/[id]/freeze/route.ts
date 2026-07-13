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

  // 1. Load the flag event so we know which city is affected
  const { data: flagEvent } = await supabase
    .from("flag_events")
    .select("city_id, entity_id")
    .eq("id", flagId)
    .single();

  const cityId = flagEvent?.city_id ?? null;

  // 2. Freeze the city if we have one
  if (cityId) {
    await supabase
      .from("cities")
      .update({ frozen: true })
      .eq("id", cityId);
  }

  // 3. Write an audit log entry
  await supabase.from("audit_logs").insert({
    actor: email,
    action: "freeze_city",
    entity: cityId ?? "unknown",
    metadata: {
      flag_event_id: flagId,
      source: "admin_action",
    },
  });

  // 4. Optional: add a fraud signal for admin freeze (neutral impact)
  if (flagEvent?.entity_id) {
    await supabase.from("fraud_signals").insert({
      user_id: flagEvent.entity_id,
      city_id: cityId,
      signal_type: "admin_freeze_city",
      signal_value: 0,
      severity: "medium",
      score_impact: 0,
      metadata: { flag_event_id: flagId },
      reviewed: true,
    });
  }

  // 5. Redirect back to the report detail page
  return NextResponse.redirect(`/admin/CEO/safety/reports/${flagId}`);
}
