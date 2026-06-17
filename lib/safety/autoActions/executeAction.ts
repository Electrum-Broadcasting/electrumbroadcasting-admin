import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Executes the auto-action once the trigger condition is met.
 */
export async function executeAction(
  supabase: SupabaseClient,
  action: any,
  flagEvent: any
) {
  switch (action.action_type) {
    case "auto_hide_story":
      return await autoHideStory(supabase, action, flagEvent);

    case "auto_escalate":
      return await autoEscalate(supabase, action, flagEvent);

    case "auto_notify_editor":
      return await autoNotifyEditor(supabase, action, flagEvent);

    case "auto_lock_contributor":
      return await autoLockContributor(supabase, action, flagEvent);

    case "auto_archive":
      return await autoArchiveStory(supabase, action, flagEvent);

    case "freeze_contributor":
      return await freezeContributor(supabase, flagEvent.contributor_id);

    default:
      console.error("Unknown action_type:", action.action_type);
      return;
  }
}

/* -------------------------------------------------------
   ACTION HELPERS
------------------------------------------------------- */

/**
 * ACTION: auto_hide_story
 * Immediately unpublishes the story.
 */
async function autoHideStory(
  supabase: SupabaseClient,
  action: any,
  flagEvent: any
) {
  const storyId = flagEvent.content_item_id;
  if (!storyId) return;

  const { error } = await supabase
    .from("stories")
    .update({ hidden: true })
    .eq("id", storyId);

  if (error) {
    console.error("Auto-Hide Story failed:", error);
  }
}

/**
 * ACTION: auto_escalate
 * Adds the story to the moderation queue for human review.
 */
async function autoEscalate(
  supabase: SupabaseClient,
  action: any,
  flagEvent: any
) {
  const { error } = await supabase.from("moderation_queue").insert({
    story_id: flagEvent.content_item_id,
    city_id: flagEvent.city_id,
    reason: "Auto-escalated by rule",
    auto_action_id: action.id,
  });

  if (error) {
    console.error("Auto-Escalate failed:", error);
  }
}

/**
 * ACTION: auto_notify_editor
 * Logs a moderation event that the Editor Dashboard can surface.
 */
async function autoNotifyEditor(
  supabase: SupabaseClient,
  action: any,
  flagEvent: any
) {
  const { error } = await supabase.from("moderation_events").insert({
    event_type: "notify_editor",
    story_id: flagEvent.content_item_id,
    metadata: {
      auto_action_id: action.id,
      message: "Story requires editorial review",
    },
  });

  if (error) {
    console.error("Auto-Notify Editor failed:", error);
  }
}

/**
 * ACTION: auto_lock_contributor
 * Temporarily restricts the contributor from posting new content.
 */
async function autoLockContributor(
  supabase: SupabaseClient,
  action: any,
  flagEvent: any
) {
  const { error } = await supabase.from("moderation_events").insert({
    event_type: "lock_contributor",
    user_id: flagEvent.user_id,
    metadata: {
      auto_action_id: action.id,
      reason: "Contributor locked due to safety rule",
    },
  });

  if (error) {
    console.error("Auto-Lock Contributor failed:", error);
  }
}

/**
 * ACTION: freeze_contributor
 */
async function freezeContributor(
  supabase: SupabaseClient,
  contributorId: string
) {
  if (!contributorId) return;

  const { error } = await supabase
    .from("contributors")
    .update({ frozen: true })
    .eq("id", contributorId);

  if (error) {
    console.error("Freeze Contributor failed:", error);
  }
}

/**
 * ACTION: auto_archive
 * Moves the story into an archived state.
 */
async function autoArchiveStory(
  supabase: SupabaseClient,
  action: any,
  flagEvent: any
) {
  const { error } = await supabase
    .from("civic_stories")
    .update({ status: "archived" })
    .eq("id", flagEvent.content_item_id);

  if (error) {
    console.error("Auto-Archive failed:", error);
  }
}
