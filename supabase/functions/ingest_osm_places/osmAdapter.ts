import {
  OSM_INGESTION_CONFIG,
  OSM_SOURCE_NAME,
  OVERPASS_ENDPOINT,
  type IngestionCity,
} from "./ingestionConfig.ts";
import {
  buildRefinedOverpassQuery,
  type BoundingBox,
} from "./overpassQuery.ts";

export type OSMElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

export type OSMIngestionPayload = {
  city_id: string;
  source_name: typeof OSM_SOURCE_NAME;
  source_object_id: string;
  payload: {
    object_type: "place";
    osm_type: OSMElement["type"];
    osm_id: number;
    city_id: string;
    name: string;
    latitude: number;
    longitude: number;
    tags: Record<string, string>;
  };
};

export function buildBoundingBox(
  latitude: number,
  longitude: number,
  radiusDegrees = OSM_INGESTION_CONFIG.radiusDegrees,
): BoundingBox {
  return {
    south: latitude - radiusDegrees,
    west: longitude - radiusDegrees,
    north: latitude + radiusDegrees,
    east: longitude + radiusDegrees,
  };
}

function elementCoordinates(element: OSMElement): { latitude: number; longitude: number } | null {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return { latitude, longitude };
}

function mapElementToPayload(
  city: IngestionCity,
  element: OSMElement,
): OSMIngestionPayload | null {
  const tags = element.tags ?? {};
  const coordinates = elementCoordinates(element);
  const name = tags.name?.trim();

  if (!name || !coordinates) {
    return null;
  }

  return {
    city_id: city.id,
    source_name: OSM_SOURCE_NAME,
    source_object_id: `${element.type}/${element.id}`,
    payload: {
      object_type: "place",
      osm_type: element.type,
      osm_id: element.id,
      city_id: city.id,
      name,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      tags,
    },
  };
}

export async function fetchOSMPlaces(
  city: IngestionCity,
  signal?: AbortSignal,
): Promise<OSMIngestionPayload[]> {
  if (city.latitude === null || city.longitude === null) {
    throw new Error(`City ${city.id} is missing coordinates`);
  }

  const boundingBox = buildBoundingBox(city.latitude, city.longitude);
  const query = buildRefinedOverpassQuery(
    boundingBox,
    OSM_INGESTION_CONFIG.batchSize,
  );
  const timeoutController = new AbortController();
  if (signal) {
    if (signal.aborted) {
      timeoutController.abort(signal.reason);
    } else {
      signal.addEventListener(
        "abort",
        () => timeoutController.abort(signal.reason),
        { once: true },
      );
    }
  }
  const timeout = setTimeout(
    () => timeoutController.abort(),
    OSM_INGESTION_CONFIG.requestTimeoutMs,
  );

  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: query }),
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass request failed with status ${response.status}`);
    }

    const result = await response.json() as { elements?: OSMElement[] };
    return (result.elements ?? [])
      .slice(0, OSM_INGESTION_CONFIG.batchSize)
      .map((element) => mapElementToPayload(city, element))
      .filter((payload): payload is OSMIngestionPayload => payload !== null);
  } finally {
    clearTimeout(timeout);
  }
}