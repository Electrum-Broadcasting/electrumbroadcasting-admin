import type { OSMIngestionPayload } from "../ingest_osm_places/osmAdapter.ts";

export type NormalizedCivicPlace = {
  city_id: string;
  name: string;
  place_type: string;
  description: string;
  latitude: number;
  longitude: number;
  slug: string;
  ingestion_source: "openstreetmap";
  ingestion_metadata: Record<string, unknown>;
  status: "pending";
  is_published: false;
};

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "place";
}

function inferPlaceType(tags: Record<string, string>): string {
  return tags.amenity ?? tags.historic ?? tags.leisure ??
    tags.public_transport ?? tags.tourism ?? "place";
}

export function normalizeOSMPlace(
  ingestion: OSMIngestionPayload,
): NormalizedCivicPlace {
  const { payload } = ingestion;
  const placeType = inferPlaceType(payload.tags);

  return {
    city_id: payload.city_id,
    name: payload.name,
    place_type: placeType,
    description: payload.tags.description ?? "",
    latitude: payload.latitude,
    longitude: payload.longitude,
    slug: slugify(payload.name),
    ingestion_source: "openstreetmap",
    ingestion_metadata: {
      source: "openstreetmap",
      osm_type: payload.osm_type,
      osm_id: payload.osm_id,
      tags: payload.tags,
      safety: {
        status: "pending_review",
        copyrighted_media_ingested: false,
        unverifiable_claims_added: false,
      },
    },
    status: "pending",
    is_published: false,
  };
}

// TODO: Add explicit review flags for sensitive entities and minor-related data.
// TODO: Add controlled category and description enrichment after v1 normalization.