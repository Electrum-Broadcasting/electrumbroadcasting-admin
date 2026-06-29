import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { story_id } = await req.json();

  // 1. Hide the story (corrected: hide = is_published = false)
  const { error: updateError } = await supabase
    .from("stories")
    .update({ is_published: false })
    .eq("id", story_id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json(
      { error: "Failed to hide story" },
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
      target_type: "story",
      target_id: story_id,
      action: "hide_story",
      metadata: {},
    });

  if (logError) {
    console.error("Log error:", logError);
  }

  return NextResponse.json({ success: true });
}
