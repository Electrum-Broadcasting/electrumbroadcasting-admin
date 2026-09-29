"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function freezeStoryAdmin(id: string) {
  const supabase = createSupabaseServerClient();
  await supabase.rpc("freeze_story", { story_id: id });
}

export async function unfreezeStoryAdmin(id: string) {
  const supabase = createSupabaseServerClient();
  await supabase.rpc("unfreeze_story", { story_id: id });
}

export async function hideStoryAdmin(id: string) {
  const supabase = createSupabaseServerClient();
  await supabase.rpc("hide_story", { story_id: id });
}

export async function unhideStoryAdmin(id: string) {
  const supabase = createSupabaseServerClient();
  await supabase.rpc("unhide_story", { story_id: id });
}

export async function republishStoryAdmin(id: string) {
  const supabase = createSupabaseServerClient();
  await supabase
    .from("civic_stories")
    .update({ is_published: true })
    .eq("id", id);
}

export async function deleteStoryAdmin(id: string) {
  const supabase = createSupabaseServerClient();
  await supabase.from("civic_stories").delete().eq("id", id);
}
