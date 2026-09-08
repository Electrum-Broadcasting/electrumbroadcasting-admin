export const OSM_SOURCE_NAME = "openstreetmap";
export const OVERPASS_ENDPOINT =
  "https://overpass-api.de/api/interpreter";

export const OSM_INGESTION_CONFIG = {
  batchSize: 500,
  radiusDegrees: 0.15,
  requestTimeoutMs: 30_000,
};

// TODO: Replace this map with persisted per-city ingestion priority settings.
export const CITY_INGESTION_PRIORITY: Record<string, number> = {};

export type IngestionCity = {
  id: string;
  name: string;
  slug: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function sortCitiesByIngestionPriority(
  cities: IngestionCity[],
): IngestionCity[] {
  return [...cities].sort((left, right) => {
    const leftPriority = CITY_INGESTION_PRIORITY[left.id] ??
      (left.slug ? CITY_INGESTION_PRIORITY[left.slug] : undefined) ??
      Number.MAX_SAFE_INTEGER;
    const rightPriority = CITY_INGESTION_PRIORITY[right.id] ??
      (right.slug ? CITY_INGESTION_PRIORITY[right.slug] : undefined) ??
      Number.MAX_SAFE_INTEGER;

    return leftPriority - rightPriority || left.name.localeCompare(right.name);
  });
}