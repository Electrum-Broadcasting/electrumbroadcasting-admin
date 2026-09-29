import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/logging";
import { getAdminContext } from "@/lib/admin/context";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { story_id } = await req.json();
  const admin = await getAdminContext();

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
      target_type: "story",
      target_id: story_id,
      action: "hide_story",
      metadata: {},
    });

  if (logError) {
    console.error("Log error:", logError);
  }

  await logAdminAction(supabase, admin, {
    action: "SAFETY_HIDE_STORY",
    domain: "safety",
    entity_type: "safety_override",
    entity_id: null,
    target_user_id: null,
    metadata: { override_type: "hide_story", story_id },
  });

  return NextResponse.json({ success: true });
}
