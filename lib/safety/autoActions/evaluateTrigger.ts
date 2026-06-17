import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Evaluate whether an auto-action should fire based on its trigger.
 */
export async function evaluateTrigger(
  supabase: SupabaseClient,
  action: any,
  triggerEvent: any   // This is either flagEvent or fraudState depending on caller
): Promise<boolean> {
  switch (action.trigger_type) {
    case "flag_threshold":
      return await checkFlagThreshold(supabase, action, triggerEvent);

    case "moderation_rule":
      return await evaluateModerationRuleTrigger(supabase, action, triggerEvent);

    case "fraud_rule":
      return await evaluateFraudRuleTrigger(supabase, action, triggerEvent);

    case "fraud_level_is":
      return triggerEvent.fraud_level === action.trigger_value;

    case "fraud_score_above":
      return triggerEvent.total_score >= action.trigger_value;

    case "fraud_signal":
      return await checkFraudSignal(supabase, action, triggerEvent);

    default:
      console.warn("Unknown auto_action trigger_type:", action.trigger_type);
      return false;
  }
}

/* -------------------------------------------------------
   Trigger Type: flag_threshold
------------------------------------------------------- */

async function checkFlagThreshold(
  supabase: SupabaseClient,
  action: any,
  flagEvent: any
): Promise<boolean> {
  const { data: rule, error } = await supabase
    .from("moderation_rules")
    .select("condition_json")
    .eq("id", action.trigger_id)
    .single();

  if (error || !rule) {
    console.error("FlagThreshold: Missing rule", error);
    return false;
  }

  const threshold = rule.condition_json?.threshold;
  const windowHours = rule.condition_json?.window_hours;

  if (!threshold || !windowHours) return false;

  const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();

  const { count, error: countError } = await supabase
    .from("flag_events")
    .select("*", { count: "exact", head: true })
    .eq("content_item_id", flagEvent.content_item_id)
    .gte("created_at", since);

  if (countError) {
    console.error("FlagThreshold: Count error", countError);
    return false;
  }

  return (count ?? 0) >= threshold;
}

/* -------------------------------------------------------
   Trigger Type: fraud_rule
------------------------------------------------------- */

async function evaluateFraudRuleTrigger(
  supabase: SupabaseClient,
  action: any,
  triggerEvent: any
): Promise<boolean> {
  // Fires when the fraud rule that fired matches the auto_action.trigger_id
  return triggerEvent.rule_id === action.trigger_id;
}

/* -------------------------------------------------------
   Trigger Type: moderation_rule
------------------------------------------------------- */

async function evaluateModerationRuleTrigger(
  supabase: SupabaseClient,
  action: any,
  triggerEvent: any
): Promise<boolean> {
  // Fires when the moderation rule that fired matches the auto_action.trigger_id
  return triggerEvent.rule_id === action.trigger_id;
}

/* -------------------------------------------------------
   Trigger Type: fraud_signal (placeholder)
------------------------------------------------------- */

async function checkFraudSignal(
  supabase: SupabaseClient,
  action: any,
  triggerEvent: any
): Promise<boolean> {
  // Reserved for future fraud-signal-specific logic
  return false;
}
