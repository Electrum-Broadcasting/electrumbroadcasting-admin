import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { FlagThresholds, ModerationRule } from "./types";

export async function getSafetySettings() {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("safety_settings")
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    console.error("Error loading safety settings:", error);
    throw new Error("Failed to load safety settings");
  }

  // Default values if missing
  const defaults: FlagThresholds = {
    auto_hide: 3,
    escalate_city_admin: 4,
    auto_freeze: 5,
    fraud_review: 6,
    escalate_ceo: 7,
    safety_review: 8,
  };

  const stored = data?.safety_settings?.flag_thresholds;

  const merged: FlagThresholds = {
    auto_hide: stored?.auto_hide ?? defaults.auto_hide,
    escalate_city_admin:
      stored?.escalate_city_admin ?? defaults.escalate_city_admin,
    auto_freeze: stored?.auto_freeze ?? defaults.auto_freeze,
    fraud_review: stored?.fraud_review ?? defaults.fraud_review,
    escalate_ceo: stored?.escalate_ceo ?? defaults.escalate_ceo,
    safety_review: stored?.safety_review ?? defaults.safety_review,
  };

  return {
    flag_thresholds: merged,

    // ⭐ NEW: Moderation Rules default
    moderation_rules: data?.safety_settings?.moderation_rules ?? [],
  };
}
