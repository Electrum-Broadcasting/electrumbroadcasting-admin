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
    return NextResponse.json({ error: "Failed to unfreeze story" }, { status: 500 });
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
    target_type: "story",
    target_id: story_id,
    action: "unfreeze_story",
    metadata: {},
  });

  return NextResponse.json({ success: true });
}
