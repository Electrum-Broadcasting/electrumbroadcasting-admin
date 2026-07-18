import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { story_id } = await req.json();

  // 1. Unfreeze the story
  const { error: updateError } = await supabase
    .from("stories")
    .update({ is_frozen: false })
    .eq("id", story_id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json(
      { error: "Failed to unfreeze story" },
      { status: 500 }
    );
  }

  // ⭐ 2. Secure authenticated session check
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return NextResponse.json(
      { error: "Session expired" },
      { status: 401 }
    );
  }

  const user = authData.user;

  // ⭐ 3. Resolve admin identity using auth_uid
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_uid", user.id)
    .single();

  const adminId = adminRow?.id ?? null;

  // 4. Insert override log entry
  const { error: logError } = await supabase
    .from("admin_override_logs")
    .insert({
      admin_id: adminId,
      target_type: "story",
      target_id: story_id,
      action: "unfreeze_story",
      metadata: {},
    });

  if (logError) {
    console.error("Log error:", logError);
  }

  return NextResponse.json({ success: true });
}
