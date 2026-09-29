import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/logging";
import { getAdminContext } from "@/lib/admin/context";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { contributor_id } = await req.json();
  const admin = await getAdminContext();

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
    return NextResponse.json(
      { error: "Failed to unlock contributor" },
      { status: 500 }
    );
  }

  // 2. Resolve admin identity (session already verified by getAdminContext above)
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_uid", admin.auth_uid)
    .single();

  const adminId = adminRow?.id ?? null;

  // 4. Insert override log entry
  const { error: logError } = await supabase
    .from("admin_override_logs")
    .insert({
      admin_id: adminId,
      target_type: "contributor",
      target_id: contributor_id,
      action: "unlock_contributor",
      metadata: {},
    });

  if (logError) {
    console.error("Log error:", logError);
  }

  await logAdminAction(supabase, admin, {
    action: "SAFETY_UNLOCK_CONTRIBUTOR",
    domain: "safety",
    entity_type: "safety_override",
    entity_id: null,
    target_user_id: contributor_id,
    metadata: { override_type: "unlock_contributor", contributor_id },
  });

  return NextResponse.json({ success: true });
}
