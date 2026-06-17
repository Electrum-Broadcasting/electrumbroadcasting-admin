import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { contributor_id } = await req.json();

  // 1. Unlock contributor
  const { error: updateError } = await supabase
    .from("fraud_contributor_state")
    .update({
      locked: false,
      locked_reason: null,
      locked_at: null,
    })
    .eq("contributor_id", contributor_id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json({ error: "Failed to unlock contributor" }, { status: 500 });
  }

    // 2. Log override
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
    action: "unlock_contributor",
    metadata: {},
  });

  return NextResponse.json({ success: true });
}
