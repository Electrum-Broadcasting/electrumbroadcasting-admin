import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { resolveAdminContext } from "@/lib/admin/context";
import { isValidCityId } from "@/lib/admin/guards";
import { canAccessCity } from "@/lib/admin/permissions";
import { cityBoundaryExtent, classifyCityPoint, parseCityBoundary } from "@/lib/ingestion/cityBoundary";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { buildRefinedOverpassQuery, type BoundingBox } from "@/supabase/functions/ingest_osm_places/overpassQuery";

const endpoint = "https://overpass-api.de/api/interpreter";
const maxItems = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function queryBox(value: unknown): BoundingBox | null {
  if (!isRecord(value)) return null;
  const { south, west, north, east } = value;
  if (typeof south !== "number" || typeof west !== "number"
      || typeof north !== "number" || typeof east !== "number"
      || ![south, west, north, east].every(Number.isFinite)
      || south < -90 || north > 90 || west < -180 || east > 180
      || south >= north || west >= east) return null;
  return { south, west, north, east };
}

function candidate(element: Record<string, unknown>, boundary: ReturnType<typeof parseCityBoundary>) {
  const tags = isRecord(element.tags) ? element.tags : {};
  const center = isRecord(element.center) ? element.center : {};
  const latitude = element.lat ?? center.lat;
  const longitude = element.lon ?? center.lon;
  const name = typeof tags.name === "string" ? tags.name.trim() : "";
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return { data: null, reason: "missing_coordinates" };
  }
  const location = classifyCityPoint(boundary, longitude, latitude);
  if (location !== "inside") return { data: null, reason: `location_${location}` };
  if (!name) return { data: null, reason: "missing_name" };
  const slug = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
  if (!slug) return { data: null, reason: "invalid_slug" };
  const type = [tags.amenity, tags.historic, tags.leisure, tags.public_transport, tags.tourism]
    .find((value) => typeof value === "string" && value.trim());
  return {
    data: {
      name, slug, latitude, longitude, place_type: type || "place",
      description: typeof tags.description === "string" ? tags.description : "",
    },
    reason: null,
  };
}

export async function GET(request: Request) {
  const context = await resolveAdminContext();
  if (!context.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"].includes(context.admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const batchId = new URL(request.url).searchParams.get("batch_id");
  if (!isValidCityId(batchId)) return NextResponse.json({ error: "Invalid batch ID" }, { status: 400 });
  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await service.rpc("osm_get_batch", {
    p_actor_admin_id: context.admin.id, p_actor_auth_uid: context.admin.auth_uid, p_batch_id: batchId,
  });
  if (result.error) {
    console.error("OSM batch lookup failed:", result.error);
    const unavailable = result.status === 0 || result.status >= 500;
    return NextResponse.json({ error: unavailable ? "Unable to load batch" : "Batch unavailable or access denied" },
      { status: unavailable ? 502 : 403 });
  }
  if (!isRecord(result.data) || result.data.batch_id !== batchId || !Array.isArray(result.data.items)) {
    return NextResponse.json({ error: "Unable to confirm batch details" }, { status: 502 });
  }
  return NextResponse.json({ result: result.data });
}

export async function PATCH(request: Request) {
  const context = await resolveAdminContext();
  if (!context.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"].includes(context.admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isRecord(input) || !isValidCityId(input.batch_id) || input.operation !== "abort"
      || typeof input.reason !== "string" || !input.reason.trim() || input.reason.length > 500) {
    return NextResponse.json({ error: "Batch ID and abort reason are required" }, { status: 400 });
  }
  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let result;
  try {
    result = await service.rpc("osm_finish_batch", {
      p_actor_admin_id: context.admin.id, p_actor_auth_uid: context.admin.auth_uid,
      p_batch_id: input.batch_id, p_error: input.reason.trim(),
    });
  } catch (error) {
    console.error("OSM batch abort outcome unconfirmed:", { batchId: input.batch_id, error });
    return NextResponse.json({ error: "Unable to confirm batch abort; reload and verify" }, { status: 502 });
  }
  if (result.error || !isRecord(result.data) || result.data.batch_id !== input.batch_id
      || result.data.status !== "failed" || !isValidCityId(result.data.audit_id)) {
    console.error("OSM batch abort failed or unconfirmed:", result.error);
    return NextResponse.json({ error: "Unable to confirm batch abort; reload and verify" }, { status: 502 });
  }
  return NextResponse.json({ result: result.data });
}

export async function POST(request: Request) {
  const context = await resolveAdminContext();
  if (!context.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"].includes(context.admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isRecord(input) || !isValidCityId(input.city_id) || !isValidCityId(input.boundary_id)
      || input.source !== "openstreetmap") {
    return NextResponse.json({ error: "City, boundary, and OpenStreetMap source are required" }, { status: 400 });
  }
  const box = queryBox(input.query_box);
  if (!box) return NextResponse.json({ error: "A valid query_box is required" }, { status: 400 });
  if (!canAccessCity(context.admin, input.city_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const actor = { p_actor_admin_id: context.admin.id, p_actor_auth_uid: context.admin.auth_uid };
  const batchId = randomUUID();
  let start;
  try {
    start = await service.rpc("osm_start_batch", {
      ...actor, p_city_id: input.city_id, p_boundary_id: input.boundary_id,
      p_source_name: "openstreetmap", p_source_version: "unavailable", p_batch_id: batchId,
    });
  } catch (error) {
    console.error("OSM batch start outcome unconfirmed:", { batchId, error });
    return NextResponse.json({ error: "Batch start outcome is unconfirmed; verify before retrying", batch_id: batchId }, { status: 502 });
  }
  if (start.error || !isRecord(start.data) || start.data.batch_id !== batchId || !isValidCityId(start.data.audit_id)) {
    console.error("OSM batch start failed or unconfirmed:", { batchId, error: start.error });
    return NextResponse.json({ error: "Batch start outcome is unconfirmed; verify before retrying", batch_id: batchId }, { status: 502 });
  }
  const counts = { created: 0, duplicate: 0, quarantined: 0 };
  let failure: string | null = null;
  try {
    const boundary = parseCityBoundary(start.data.geometry);
    const extent = cityBoundaryExtent(boundary);
    if (box.south < extent.south || box.north > extent.north
        || box.west < extent.west || box.east > extent.east) {
      throw new Error("Query box must be within the registered boundary extent");
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: buildRefinedOverpassQuery(box, maxItems + 1) }),
      signal: AbortSignal.timeout(35_000),
    });
    if (!response.ok) throw new Error(`Overpass returned HTTP ${response.status}`);
    const body: unknown = await response.json();
    if (!isRecord(body) || !Array.isArray(body.elements)) throw new Error("Invalid Overpass response");
    if (typeof body.remark === "string" && body.remark.trim()) throw new Error(`Overpass reported: ${body.remark}`);
    const snapshot = isRecord(body.osm3s) ? body.osm3s.timestamp_osm_base : null;
    if (typeof snapshot !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(snapshot)
        || Number.isNaN(Date.parse(snapshot))) throw new Error("Overpass response has no valid source version");
    const version = await service.rpc("osm_set_source_version", {
      ...actor, p_batch_id: batchId, p_source_version: snapshot,
    });
    if (version.error || !isRecord(version.data) || !isValidCityId(version.data.audit_id)
        || version.data.source_version !== snapshot || version.data.batch_id !== batchId) {
      console.error("OSM source version could not be recorded:", { batchId, error: version.error });
      throw new Error("Source version outcome is unconfirmed");
    }
    if (body.elements.length > maxItems) throw new Error("Query exceeds 50 results; use a smaller query box");
    const staged: Array<{ element: Record<string, unknown>; externalId: string; rawId: string }> = [];
    const seen = new Set<string>();
    for (const element of body.elements) {
      if (!isRecord(element) || !["node", "way", "relation"].includes(String(element.type))
          || typeof element.id !== "number" || !Number.isSafeInteger(element.id) || element.id <= 0) {
        throw new Error("OSM element has an invalid source identity");
      }
      const externalId = `${element.type}/${element.id}`;
      if (seen.has(externalId)) throw new Error(`Overpass returned duplicate identity ${externalId}`);
      seen.add(externalId);
      const result = await service.rpc("osm_stage_item", {
        ...actor, p_batch_id: batchId, p_external_id: externalId, p_payload: element,
      });
      if (result.error || !isRecord(result.data) || !isValidCityId(result.data.raw_id)
          || !isValidCityId(result.data.audit_id) || result.data.state !== "staged") {
        console.error("OSM item staging failed or unconfirmed:", { batchId, externalId, error: result.error });
        throw new Error(`Staging ${externalId} failed or its outcome is unconfirmed`);
      }
      staged.push({ element, externalId, rawId: result.data.raw_id });
    }
    for (const { element, externalId, rawId } of staged) {
      const normalized = candidate(element, boundary);
      const result = await service.rpc("osm_ingest_item", {
        ...actor, p_batch_id: batchId, p_raw_id: rawId,
        p_candidate: normalized.data, p_quarantine_reason: normalized.reason,
      });
      if (result.error) {
        console.error("OSM item failed:", { batchId, externalId, error: result.error });
        throw new Error(`Item ${externalId} failed or its outcome is unconfirmed`);
      }
      if (!isRecord(result.data) || !isValidCityId(result.data.raw_id) || !isValidCityId(result.data.audit_id)
          || (result.data.state !== "created" && result.data.state !== "duplicate" && result.data.state !== "quarantined")) {
        throw new Error(`Item ${externalId} outcome is unconfirmed`);
      }
      counts[result.data.state] += 1;
    }
  } catch (error) {
    console.error("OSM ingestion failed:", { batchId, error });
    failure = error instanceof Error ? error.message : "Ingestion failed";
  }
  let finish;
  try {
    finish = await service.rpc("osm_finish_batch", {
      ...actor, p_batch_id: batchId, p_error: failure,
    });
  } catch (error) {
    console.error("OSM batch completion unconfirmed:", { batchId, error });
    return NextResponse.json({ error: "Batch outcome is unconfirmed; verify before retrying", batch_id: batchId, counts }, { status: 502 });
  }
  if (finish.error || !isRecord(finish.data) || !isValidCityId(finish.data.audit_id)
      || finish.data.batch_id !== batchId || finish.data.status !== (failure ? "failed" : "completed")) {
    console.error("OSM batch completion unconfirmed:", { batchId, error: finish.error });
    return NextResponse.json({ error: "Batch outcome is unconfirmed; verify before retrying", batch_id: batchId, counts }, { status: 502 });
  }
  if (failure) return NextResponse.json({ error: failure, batch_id: batchId, counts }, { status: 502 });
  return NextResponse.json({ batch_id: batchId, counts, audit_id: finish.data.audit_id });
}
