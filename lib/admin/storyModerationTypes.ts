import type { AdminRole } from "./types";

export const STORY_OPERATIONS = [
  "unpublish", "emergency_unpublish", "hide", "place_hold",
  "lift_hold", "escalate", "resolve_escalation",
] as const;

export type StoryOperation = (typeof STORY_OPERATIONS)[number];

export interface ModerationResult {
  story_id: string;
  city_id: string;
  operation: StoryOperation;
  audit_id: string;
  is_published: boolean | null;
  review_status: string | null;
  safety_hold: boolean;
  safety_hold_notes: string | null;
}

export function isStoryOperation(value: unknown): value is StoryOperation {
  return typeof value === "string" && STORY_OPERATIONS.some((operation) => operation === value);
}

export function canModerateStory(role: AdminRole, operation: StoryOperation): boolean {
  if (role === "CITY_ADMIN") {
    return ["unpublish", "hide", "place_hold", "lift_hold", "escalate"].includes(operation);
  }
  if (role === "CEO" || role === "PLATFORM_ADMIN") {
    return ["emergency_unpublish", "hide", "place_hold", "lift_hold", "resolve_escalation"].includes(operation);
  }
  return false;
}

export function canReadSafety(role: AdminRole): boolean {
  return role === "CITY_ADMIN" || role === "CEO" || role === "PLATFORM_ADMIN";
}
