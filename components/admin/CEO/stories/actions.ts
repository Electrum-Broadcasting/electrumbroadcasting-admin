"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export type StoryActionName =
  | "republish"
  | "hide"
  | "freeze"
  | "unfreeze"
  | "delete";

export type StoryActionResult = {
  error: string | null;
};

const STORY_ACTIONS = new Set<StoryActionName>([
  "republish",
  "hide",
  "freeze",
  "unfreeze",
  "delete",
]);

function isStoryAction(action: string): action is StoryActionName {
  return STORY_ACTIONS.has(action as StoryActionName);
}

function uuidOrNull(value: unknown) {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value)
    ? value
    : null;
}

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Publish, hide, freeze, unfreeze, or delete a story.
 * CEO login is cookie-based, so these mutations cannot rely on auth.uid() RPCs.
 */
export async function updateStoryStatusAction(
  storyId: string,
  action: string,
): Promise<StoryActionResult> {
  if (!uuidOrNull(storyId) || !isStoryAction(action)) {
    return { error: "Unknown story action." };
  }

  const admin = await getAdminContext();
  if (admin.status === "inactive") {
    return { error: "Your admin account is inactive." };
  }

  const supabase = createServiceClient();
  const { data: story, error: storyError } = await supabase
    .from("civic_stories")
    .select("id, city_id, published_at")
    .eq("id", storyId)
    .maybeSingle();

  if (storyError) {
    return { error: storyError.message || "Failed to load story." };
  }
  if (!story) {
    return { error: "Story not found." };
  }

  const now = new Date().toISOString();
  const updatedBy = uuidOrNull(admin.user_id) ?? uuidOrNull(admin.auth_uid);

  if (action === "delete") {
    const { error: deleteError } = await supabase
      .from("civic_stories")
      .delete()
      .eq("id", storyId);

    if (deleteError) {
      return { error: deleteError.message || "Failed to delete story." };
    }
  } else {
    const update: {
      is_published?: boolean;
      is_frozen?: boolean;
      published_at?: string;
      updated_at: string;
      updated_by?: string;
    } = { updated_at: now };

    if (updatedBy) update.updated_by = updatedBy;
    if (action === "republish") {
      update.is_published = true;
      if (!story.published_at) update.published_at = now;
    } else if (action === "hide") {
      update.is_published = false;
    } else if (action === "freeze") {
      update.is_frozen = true;
    } else {
      update.is_frozen = false;
    }

    const { error: updateError } = await supabase
      .from("civic_stories")
      .update(update)
      .eq("id", storyId);

    if (updateError) {
      return { error: updateError.message || "Failed to update story." };
    }
  }

  if (admin.id) {
    const { error: logError } = await supabase.from("admin_override_logs").insert({
      admin_id: admin.id,
      action: action === "delete" ? "delete_story" : action,
      target_type: "story",
      target_id: storyId,
      city_id: story.city_id,
      metadata: { story_id: storyId, source: "ceo_stories" },
    });

    if (logError) {
      console.error("Story updated but override log failed:", logError);
    }
  }

  revalidatePath("/admin/CEO/stories");
  revalidatePath("/admin/CEO");

  return { error: null };
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

export async function freezeStoryAction(storyId: string) {
  return updateStoryStatusAction(storyId, "freeze");
}

export async function unfreezeStoryAction(storyId: string) {
  return updateStoryStatusAction(storyId, "unfreeze");
}

export async function hideStoryAction(storyId: string) {
  return updateStoryStatusAction(storyId, "hide");
}

export async function republishStoryAction(storyId: string) {
  return updateStoryStatusAction(storyId, "republish");
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
