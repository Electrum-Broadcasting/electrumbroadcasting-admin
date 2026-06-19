import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  const supabase = createSupabaseServiceClient();
  const { contributor_id, fraud_score } = await req.json();

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

  // 3. Resolve admin identity (service client version)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const authUserId = session?.user?.id ?? null;

  let adminId: string | null = null;

  if (authUserId) {
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", authUserId)
      .single();

    adminId = adminRow?.id ?? null;
  }

  // 4. Insert override log entry
  const { error: logError } = await supabase
    .from("admin_override_logs")
    .insert({
      admin_id: adminId,
      target_type: "contributor",
      target_id: contributor_id,
      action: "set_fraud_score",
      metadata: { old_score, new_score: fraud_score },
    });

  if (logError) {
    console.error("Log error:", logError);
  }

  return NextResponse.json({ success: true });
}
