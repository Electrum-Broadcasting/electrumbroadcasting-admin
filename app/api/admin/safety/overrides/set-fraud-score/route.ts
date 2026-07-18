import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
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

  // ⭐ 3. Secure authenticated session check
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return NextResponse.json(
      { error: "Session expired" },
      { status: 401 }
    );
  }

  const user = authData.user;

  // ⭐ 4. Resolve admin identity using auth_uid
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_uid", user.id)
    .single();

  const adminId = adminRow?.id ?? null;

  // 5. Insert override log entry
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
