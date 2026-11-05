import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/logging";
import { getAdminContext } from "@/lib/admin/context";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { story_id } = await req.json();
  const admin = await getAdminContext();

  // 1. Unfreeze the story
  const { error: updateError } = await supabase
    .from("civic_stories")
    .update({ is_frozen: false })
    .eq("id", story_id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json(
      { error: "Failed to unfreeze story" },
      { status: 500 }
    );
  }

  // 4. Insert override log entry
  const { error: logError } = await supabase
    .from("admin_override_logs")
    .insert({
      admin_id: admin.id,
      target_type: "story",
      target_id: story_id,
      action: "unfreeze_story",
      metadata: {},
    });

  if (logError) {
    console.error("Log error:", logError);
  }

  await logAdminAction(supabase, admin, {
    action: "SAFETY_UNFREEZE_STORY",
    domain: "safety",
    entity_type: "safety_override",
    entity_id: null,
    target_user_id: null,
    metadata: { override_type: "unfreeze_story", story_id },
  });

  return NextResponse.json({ success: true });
}
