"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function freezeStoryAdmin(id: string) {
  const supabase = createSupabaseServerClient();
  await supabase.rpc("admin_freeze_story", { story_id: id });
}

export async function unfreezeStoryAdmin(id: string) {
  const supabase = createSupabaseServerClient();
  await supabase.rpc("admin_unfreeze_story", { story_id: id });
}

export async function hideStoryAdmin(id: string) {
  const supabase = createSupabaseServerClient();
  await supabase.rpc("admin_hide_story", { story_id: id });
}

export async function unhideStoryAdmin(id: string) {
  const supabase = createSupabaseServerClient();
  await supabase.rpc("admin_unhide_story", { story_id: id });
}

export async function republishStoryAdmin(id: string) {
  const supabase = createSupabaseServerClient();
  await supabase
    .from("civic_stories")
    .update({ is_published: true })
    .eq("id", id);
}

export async function updateStoryStatusAdmin(id: string, action: string) {
  const supabase = createSupabaseServerClient();
  await supabase.rpc("admin_update_story_status", {
    story_id: id,
    action,
    metadata: {},
  });
}