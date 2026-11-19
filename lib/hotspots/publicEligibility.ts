export type CivicHotspotTargetType =
  | "civic_entity"
  | "civic_event"
  | "civic_artifact"
  | "civic_place"
  | "civic_neighborhood"
  | "civic_moment"
  | "civic_story";

type CivicTargetEligibility = {
  city_id: string | null;
  is_published: boolean | null;
  status?: string | null;
  review_status?: string | null;
  safety_hold?: boolean | null;
};

export function isPubliclyEligibleHotspotTarget(
  type: CivicHotspotTargetType,
  cityId: string,
  target: CivicTargetEligibility,
): boolean {
  return target.city_id === cityId
    && target.is_published === true
    && (type === "civic_story"
      ? target.review_status === "published" && target.safety_hold === false
      : target.status === null || target.status === "approved");
}
