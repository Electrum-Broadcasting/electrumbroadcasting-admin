import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { contributor_id } = await req.json();

  // 1. Lock contributor
  const { error: updateError } = await supabase
    .from("fraud_contributor_state")
    .update({
      locked: true,
      locked_reason: "admin_override",
      locked_at: new Date().toISOString(),
    })
    .eq("contributor_id", contributor_id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json(
      { error: "Failed to lock contributor" },
      { status: 500 }
    );
  }

  // 2. Resolve admin identity (service client version)
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

  // 3. Insert override log entry
  const { error: logError } = await supabase
    .from("admin_override_logs")
    .insert({
      admin_id: adminId,
      target_type: "contributor",
      target_id: contributor_id,
      action: "lock_contributor",
      metadata: {},
    });

  if (logError) {
    console.error("Log error:", logError);
  }

  return NextResponse.json({ success: true });
}
