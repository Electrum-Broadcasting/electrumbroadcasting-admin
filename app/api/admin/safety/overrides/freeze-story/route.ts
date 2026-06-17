import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { story_id } = await req.json();

  // 1. Perform the override
  const { error: updateError } = await supabase
    .from("stories")
    .update({ is_frozen: true })
    .eq("id", story_id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json(
      { error: "Failed to freeze story" },
      { status: 500 }
    );
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
  const { error: logError } = await supabase
    .from("admin_override_logs")
    .insert({
      admin_id: adminId,
      target_type: "story",
      target_id: story_id,
      action: "freeze_story",
      metadata: {},
    });

  if (logError) console.error("Log error:", logError);

  return NextResponse.json({ success: true });
}
