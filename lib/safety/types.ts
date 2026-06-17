export type FlagThresholds = {
  auto_hide: number;
  escalate_city_admin: number;
  auto_freeze: number;
  fraud_review: number;
  escalate_ceo: number;
  safety_review: number;
};

export type SafetySettings = {
  flag_thresholds: FlagThresholds;
};

export const DEFAULT_FLAG_THRESHOLDS: FlagThresholds = {
  auto_hide: 3,
  escalate_city_admin: 4,
  auto_freeze: 5,
  fraud_review: 6,
  escalate_ceo: 7,
  safety_review: 8,
};

export type ModerationRule = {
  id?: string; // ⭐ SQL will generate UUID for new rules
  label: string;
  description: string;
  enabled: boolean;
  severity: "low" | "medium" | "high";
  applies_to: "posts" | "comments" | "contributors";
  trigger_type: string;
  trigger_value: number | string | null;
}

export const DEFAULT_SAFETY_SETTINGS: SafetySettings = {
  flag_thresholds: DEFAULT_FLAG_THRESHOLDS,
};
