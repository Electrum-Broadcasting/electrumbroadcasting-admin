import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { ResolvedAdminContext } from "@/lib/admin/context";
import { isValidCityId } from "@/lib/admin/guards";
import { canAccessCity } from "@/lib/admin/permissions";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { canModerateStory, isStoryOperation, type ModerationResult } from "./storyModerationTypes";

export function safetyServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export class ModerationError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function moderateStory(
  admin: ResolvedAdminContext,
  storyId: unknown,
  operation: unknown,
  reason: unknown,
  referenceLogId: unknown,
): Promise<ModerationResult> {
  if (!isValidCityId(storyId) || !isStoryOperation(operation)) {
    throw new ModerationError("Invalid story or unsupported operation", 400);
  }
  if (reason != null && typeof reason !== "string") {
    throw new ModerationError("Invalid reason", 400);
  }
  if (["emergency_unpublish", "place_hold", "escalate", "resolve_escalation"].includes(operation)
      && (typeof reason !== "string" || !reason.trim())) {
    throw new ModerationError("A reason or hold note is required", 400);
  }
  if ((operation === "resolve_escalation" && !isValidCityId(referenceLogId))
      || (operation !== "resolve_escalation" && referenceLogId != null)) {
    throw new ModerationError("Invalid escalation reference", 400);
  }

  const service = safetyServiceClient();
  const { data: story, error } = await service.from("civic_stories")
    .select("id, city_id").eq("id", storyId).maybeSingle();
  if (error) {
    console.error("Failed to load story for moderation:", error);
    throw new ModerationError("Failed to load story", 500);
  }
  if (!story) throw new ModerationError("Story not found", 404);
  if (!canModerateStory(admin.role, operation) || !story.city_id || !canAccessCity(admin, story.city_id)) {
    throw new ModerationError("Forbidden", 403);
  }
  const { data, error: rpcError } = await service.rpc("admin_moderate_story", {
    p_story_id: storyId,
    p_expected_city_id: story.city_id,
    p_actor_admin_id: admin.id,
    p_actor_auth_uid: admin.auth_uid,
    p_operation: operation,
    p_reason: typeof reason === "string" ? reason : null,
    p_reference_log_id: typeof referenceLogId === "string" ? referenceLogId : null,
  });
  if (rpcError) {
    console.error("Story moderation failed:", rpcError);
    throw new ModerationError("Story moderation failed or could not be confirmed; refresh before retrying", 500);
  }
  if (!data || typeof data !== "object" || typeof data.audit_id !== "string"
      || data.story_id !== storyId || data.city_id !== story.city_id || data.operation !== operation
      || typeof data.safety_hold !== "boolean"
      || (data.is_published !== null && typeof data.is_published !== "boolean")
      || (data.review_status !== null && typeof data.review_status !== "string")
      || (data.safety_hold_notes !== null && typeof data.safety_hold_notes !== "string")) {
    console.error("Invalid story moderation confirmation:", data);
    throw new ModerationError("Unable to confirm moderation result; refresh before retrying", 500);
  }
  return data as ModerationResult;
}
