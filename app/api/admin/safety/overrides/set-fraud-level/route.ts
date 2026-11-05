import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/logging";
import { getAdminContext } from "@/lib/admin/context";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { contributor_id, fraud_level } = await req.json();
  const admin = await getAdminContext();

  // 1. Update fraud level
  const { error: updateError } = await supabase
    .from("fraud_contributor_state")
    .update({ fraud_level })
    .eq("contributor_id", contributor_id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json(
      { error: "Failed to set fraud level" },
      { status: 500 }
    );
  }

  // 4. Insert override log entry
  const { error: logError } = await supabase
    .from("admin_override_logs")
    .insert({
      admin_id: admin.id,
      target_type: "contributor",
      target_id: contributor_id,
      action: "set_fraud_level",
      metadata: { fraud_level },
    });

  if (logError) {
    console.error("Log error:", logError);
  }

  await logAdminAction(supabase, admin, {
    action: "SAFETY_SET_FRAUD_LEVEL",
    domain: "safety",
    entity_type: "safety_override",
    entity_id: null,
    target_user_id: contributor_id,
    metadata: { contributor_id, new_value: fraud_level },
  });

  return NextResponse.json({ success: true });
}
