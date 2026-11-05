import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/logging";
import { getAdminContext } from "@/lib/admin/context";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { story_id } = await req.json();
  const admin = await getAdminContext();

  // 1. Unhide the story (corrected: unhide = is_published = true)
  const { error: updateError } = await supabase
    .from("civic_stories")
    .update({ is_published: true })
    .eq("id", story_id);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json(
      { error: "Failed to unhide story" },
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
      action: "unhide_story",
      metadata: {},
    });

  if (logError) {
    console.error("Log error:", logError);
  }

  await logAdminAction(supabase, admin, {
    action: "SAFETY_UNHIDE_STORY",
    domain: "safety",
    entity_type: "safety_override",
    entity_id: null,
    target_user_id: null,
    metadata: { override_type: "unhide_story", story_id },
  });

  return NextResponse.json({ success: true });
}
