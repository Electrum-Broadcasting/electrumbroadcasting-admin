import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type DedupeCandidate = {
  city_id: string;
  slug: string;
  latitude: number;
  longitude: number;
  osm_id?: number;
};

export type DedupeResult = {
  isDuplicate: boolean;
  matchedId?: string;
  reason?: "slug" | "coordinates" | "external_id";
};

const COORDINATE_TOLERANCE = 0.0001;

export async function findDuplicatePlace(
  supabase: SupabaseClient,
  candidate: DedupeCandidate,
): Promise<DedupeResult> {
  const { data: slugMatches, error: slugError } = await supabase
    .from("civic_places")
    .select("id, latitude, longitude, ingestion_metadata")
    .eq("city_id", candidate.city_id)
    .eq("slug", candidate.slug)
    .limit(1);

  if (slugError) {
    throw new Error(`Unable to check place slug duplicates: ${slugError.message}`);
  }

  const slugMatch = slugMatches?.[0] as {
    id: string;
    latitude?: number | null;
    longitude?: number | null;
    ingestion_metadata?: { osm_id?: number };
  } | undefined;
  if (slugMatch) {
    const sameExternalId = candidate.osm_id !== undefined &&
      slugMatch.ingestion_metadata?.osm_id === candidate.osm_id;
    const sameCoordinates = typeof slugMatch.latitude === "number" &&
      typeof slugMatch.longitude === "number" &&
      Math.abs(slugMatch.latitude - candidate.latitude) <= COORDINATE_TOLERANCE &&
      Math.abs(slugMatch.longitude - candidate.longitude) <= COORDINATE_TOLERANCE;

    if (sameExternalId || sameCoordinates) {
      return {
        isDuplicate: true,
        matchedId: slugMatch.id,
        reason: sameExternalId ? "external_id" : "coordinates",
      };
    }
  }

  const { data: coordinateMatches, error: coordinateError } = await supabase
    .from("civic_places")
    .select("id, latitude, longitude")
    .eq("city_id", candidate.city_id)
    .gte("latitude", candidate.latitude - COORDINATE_TOLERANCE)
    .lte("latitude", candidate.latitude + COORDINATE_TOLERANCE)
    .gte("longitude", candidate.longitude - COORDINATE_TOLERANCE)
    .lte("longitude", candidate.longitude + COORDINATE_TOLERANCE)
    .limit(1);

  if (coordinateError) {
    throw new Error(`Unable to check place coordinate duplicates: ${coordinateError.message}`);
  }

  const coordinateMatch = coordinateMatches?.[0] as { id: string } | undefined;
  return coordinateMatch
    ? { isDuplicate: true, matchedId: coordinateMatch.id, reason: "coordinates" }
    : { isDuplicate: false };
}