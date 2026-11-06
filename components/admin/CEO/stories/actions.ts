"use server";

import { getAdminContext, getAdminContextOrNull } from "@/lib/admin/context";
import { canManageUsers } from "@/lib/admin/permissions";
import { moderateStory, ModerationError, safetyServiceClient } from "@/lib/admin/storyModeration";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateStoryStatusAction(storyId: string, operation: string, reason?: string, referenceLogId?: string) {
  const admin = await getAdminContext();
  try {
    const result = await moderateStory(admin, storyId, operation, reason, referenceLogId);
    return { result, error: null };
  } catch (error) {
    if (error instanceof ModerationError) return { result: null, error: error.message };
    console.error("Unexpected story moderation error:", error);
    return { result: null, error: "Unable to confirm moderation result; refresh before retrying" };
  }
}

export async function getStoryDetailsAction(storyId: string) {
  const admin = await getAdminContextOrNull();
  if (!admin || !canManageUsers(admin.role)) return { data: null, error: "Forbidden" };
  return createSupabaseServerClient().rpc("admin_get_story_details", { story_id: storyId });
}

export async function getRecentStoryActionsAction(storyId: string) {
  const admin = await getAdminContextOrNull();
  if (!admin || !canManageUsers(admin.role)) return { data: [], error: "Forbidden" };
  const service = safetyServiceClient();
  const [canonical, legacy] = await Promise.all([
    service.from("admin_action_logs").select("id, action, created_at, metadata")
      .eq("entity_type", "story").eq("entity_id", storyId).in("domain", ["safety", "editorial"])
      .order("created_at", { ascending: false }).limit(10),
    service.from("admin_override_logs").select("id, action, created_at, metadata")
      .eq("target_type", "story").eq("target_id", storyId)
      .order("created_at", { ascending: false }).limit(10),
  ]);
  if (canonical.error || legacy.error) {
    console.error("Failed to load story audit history:", canonical.error ?? legacy.error);
    return { data: [], error: "Failed to load story audit history" };
  }
  const data = [...canonical.data, ...legacy.data]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).slice(0, 10);
  return { data, error: null };
}
