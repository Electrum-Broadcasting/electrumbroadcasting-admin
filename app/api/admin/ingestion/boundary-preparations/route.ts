import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { resolveAdminContext } from "@/lib/admin/context";
import { isValidCityId } from "@/lib/admin/guards";
import { canAccessCity } from "@/lib/admin/permissions";
import { analyzeBoundarySource, maxPreparationBytes } from "@/lib/ingestion/boundaryPreparation";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export const maxDuration = 180;

function client() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Invalid JSON");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxPreparationBytes) {
      await reader.cancel();
      throw new Error("Source geometry exceeds the 5 MB preparation upload limit");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function GET(request: Request) {
  const context = await resolveAdminContext();
  if (!context.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = context.admin;
  if (!["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"].includes(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cityId = new URL(request.url).searchParams.get("city_id");
  if (!isValidCityId(cityId)) return NextResponse.json({ error: "Valid city is required" }, { status: 400 });
  if (!canAccessCity(admin, cityId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await client().rpc("osm_list_boundary_preparations", {
    p_actor_admin_id: admin.id, p_actor_auth_uid: admin.auth_uid, p_city_id: cityId,
  });
  if (error || !Array.isArray(data)) {
    console.error("Unable to list boundary preparations:", error);
    return NextResponse.json({ error: "Unable to load boundary preparations" }, { status: 502 });
  }
  return NextResponse.json({ preparations: data });
}

export async function POST(request: Request) {
  const context = await resolveAdminContext();
  if (!context.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = context.admin;
  if (!["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"].includes(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let input: unknown;
  try {
    const length = Number(request.headers.get("content-length"));
    if (Number.isFinite(length) && length > maxPreparationBytes) {
      return NextResponse.json({ error: "Source geometry exceeds the 5 MB preparation upload limit" }, { status: 413 });
    }
    input = await readJson(request);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid JSON" }, { status: 400 });
  }
  if (!isRecord(input) || !isValidCityId(input.city_id) || typeof input.source_url !== "string"
      || typeof input.source_version !== "string" || !input.source_version.trim() || input.source_version.length > 200
      || !("geometry" in input)) {
    return NextResponse.json({ error: "City, source URL, source version, and GeoJSON geometry are required" }, { status: 400 });
  }
  if (!canAccessCity(admin, input.city_id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let sourceUrl: URL;
  try {
    if (new TextEncoder().encode(input.source_url).byteLength > 2048) throw new Error();
    sourceUrl = new URL(input.source_url);
    if (sourceUrl.protocol !== "https:" || !sourceUrl.hostname || sourceUrl.username || sourceUrl.password) throw new Error();
  } catch {
    return NextResponse.json({ error: "Boundary source must be an HTTPS URL without credentials" }, { status: 400 });
  }
  let analysis;
  try {
    analysis = analyzeBoundarySource(input.geometry);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Boundary analysis failed" }, { status: 400 });
  }
  const sourceHash = createHash("sha256").update(JSON.stringify(analysis.geometry)).digest("hex");
  const service = client();
  const { data, error } = await service.rpc("osm_create_boundary_preparation", {
    p_actor_admin_id: admin.id, p_actor_auth_uid: admin.auth_uid, p_city_id: input.city_id,
    p_source_url: sourceUrl.href, p_source_version: input.source_version.trim(),
    p_source_geometry: analysis.geometry, p_source_hash: sourceHash,
    p_source_coordinate_count: analysis.coordinateCount, p_source_size_bytes: analysis.sizeBytes,
    p_source_ring_count: analysis.ringCount,
    p_source_analysis: { bounds: analysis.bounds, projection: analysis.projection.definition, valid: true },
  });
  if (error || !isRecord(data) || !isValidCityId(data.preparation_id)) {
    console.error("Unable to persist boundary preparation:", error);
    return NextResponse.json({ error: "Unable to save boundary preparation" }, { status: 502 });
  }
  return NextResponse.json({ preparation_id: data.preparation_id, source: {
    source_hash: sourceHash, coordinate_count: analysis.coordinateCount,
    size_bytes: analysis.sizeBytes, ring_count: analysis.ringCount, bounds: analysis.bounds,
  } });
}