"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Update story status (publish, hide, freeze, unfreeze, delete)
 */
export async function updateStoryStatusAction(
  storyId: string,
  action: string,
) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_update_story_status", {
    story_id: storyId,
    action,
    metadata: {},
  });

  return { data, error };
}

/**
 * Load full story details for the StoryDrawer
 */
export async function getStoryDetailsAction(storyId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_get_story_details", {
    story_id: storyId,
  });

  return { data, error };
}

/**
 * Freeze a story (prevent edits)
 */
export async function freezeStoryAction(storyId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_freeze_story", {
    story_id: storyId,
  });

  return { data, error };
}

/**
 * Unfreeze a story
 */
export async function unfreezeStoryAction(storyId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_unfreeze_story", {
    story_id: storyId,
  });

  return { data, error };
}

/**
 * Hide (unpublish) a story
 */
export async function hideStoryAction(storyId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_hide_story", {
    story_id: storyId,
  });

  return { data, error };
}

/**
 * Republish a story
 */
export async function republishStoryAction(storyId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_republish_story", {
    story_id: storyId,
  });

  return { data, error };
}

export async function getRecentStoryActionsAction(storyId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("admin_override_logs")
    .select("*")
    .eq("target_type", "story")
    .eq("target_id", storyId)
    .order("created_at", { ascending: false })
    .limit(10);

  return { data: data ?? [], error };
}
