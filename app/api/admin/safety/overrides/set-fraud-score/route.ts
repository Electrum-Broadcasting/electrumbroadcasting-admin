import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/logging";
import { getAdminContext } from "@/lib/admin/context";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { contributor_id, fraud_score } = await req.json();
  const admin = await getAdminContext();

  // 1. Load old score
  const { data: existing } = await supabase
    .from("fraud_contributor_state")
    .select("fraud_score")
    .eq("contributor_id", contributor_id)
    .single();

  const old_score = existing?.fraud_score ?? null;

  // 2. Update fraud score
  const { error: updateError } = await supabase
    .from("fraud_contributor_state")
    .update({ fraud_score })
    .eq("contributor_id", contributor_id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json(
      { error: "Failed to set fraud score" },
      { status: 500 }
    );
  }

  // 5. Insert override log entry
  const { error: logError } = await supabase
    .from("admin_override_logs")
    .insert({
      admin_id: admin.id,
      target_type: "contributor",
      target_id: contributor_id,
      action: "set_fraud_score",
      metadata: { old_score, new_score: fraud_score },
    });

  if (logError) {
    console.error("Log error:", logError);
  }

  await logAdminAction(supabase, admin, {
    action: "SAFETY_SET_FRAUD_SCORE",
    domain: "safety",
    entity_type: "safety_override",
    entity_id: null,
    target_user_id: contributor_id,
    metadata: {
      contributor_id,
      previous_value: old_score,
      new_value: fraud_score,
    },
  });

  return NextResponse.json({ success: true });
}
