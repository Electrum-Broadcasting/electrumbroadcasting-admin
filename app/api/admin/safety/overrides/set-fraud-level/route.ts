import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { contributor_id, fraud_level } = await req.json();

// 1. Perform the update
  const { error: updateError } = await supabase
    .from("fraud_contributor_state")
    .update({ fraud_level })
    .eq("contributor_id", contributor_id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json({ error: "Failed to set fraud level" }, { status: 500 });
  }

  // 2. Resolve admin identity
  const { data: userData } = await supabase.auth.getUser();
  const authUserId = userData?.user?.id || null;

  let adminId = null;

  if (authUserId) {
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", authUserId)
      .single();

    adminId = adminRow?.id || null;
  }

    // 3. Insert log entry
  await supabase.from("admin_override_logs").insert({
    admin_id: adminId,
    target_type: "contributor",
    target_id: contributor_id,
    action: "set_fraud_level",
    metadata: { fraud_level },
  });

  return NextResponse.json({ success: true });
}
