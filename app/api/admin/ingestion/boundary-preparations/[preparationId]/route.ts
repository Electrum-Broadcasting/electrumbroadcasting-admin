import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { resolveAdminContext } from "@/lib/admin/context";
import { isValidCityId } from "@/lib/admin/guards";
import { canAccessCity } from "@/lib/admin/permissions";
import { boundaryTolerancesMeters, prepareBoundaryCandidate } from "@/lib/ingestion/boundaryPreparation";
import { parseCityBoundary } from "@/lib/ingestion/cityBoundary";
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

async function loadPreparation(actor: { id: string; auth_uid: string }, preparationId: string) {
  const { data, error } = await client().rpc("osm_get_boundary_preparation", {
    p_actor_admin_id: actor.id, p_actor_auth_uid: actor.auth_uid, p_preparation_id: preparationId,
  });
  if (error || !isRecord(data) || !isValidCityId(data.city_id)) return null;
  return data;
}

export async function GET(_request: Request, { params }: { params: { preparationId: string } }) {
  const context = await resolveAdminContext();
  if (!context.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"].includes(context.admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isValidCityId(params.preparationId)) return NextResponse.json({ error: "Invalid preparation" }, { status: 400 });
  const preparation = await loadPreparation(context.admin, params.preparationId);
  if (!preparation) return NextResponse.json({ error: "Preparation unavailable or access denied" }, { status: 404 });
  if (!canAccessCity(context.admin, preparation.city_id as string)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ preparation });
}

export async function POST(request: Request, { params }: { params: { preparationId: string } }) {
  const context = await resolveAdminContext();
  if (!context.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = context.admin;
  if (!["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"].includes(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isValidCityId(params.preparationId)) return NextResponse.json({ error: "Invalid preparation" }, { status: 400 });
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!isRecord(input) || typeof input.operation !== "string") {
    return NextResponse.json({ error: "Preparation operation is required" }, { status: 400 });
  }
  const service = client();
  let result;

  if (input.operation === "prepare") {
    if (typeof input.tolerance_meters !== "number"
        || !(boundaryTolerancesMeters as readonly number[]).includes(input.tolerance_meters)) {
      return NextResponse.json({ error: "Choose a supported simplification tolerance" }, { status: 400 });
    }
    const preparation = await loadPreparation(admin, params.preparationId);
    if (!preparation || !canAccessCity(admin, preparation.city_id as string)) {
      return NextResponse.json({ error: "Preparation unavailable or access denied" }, { status: 404 });
    }
    let candidate;
    try {
      candidate = prepareBoundaryCandidate(preparation.source_geometry, input.tolerance_meters);
      if (candidate.metadata.registration_eligible) parseCityBoundary(candidate.geometry);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Candidate preparation failed" }, { status: 422 });
    }
    const preparedHash = createHash("sha256").update(JSON.stringify(candidate.geometry)).digest("hex");
    const { data, error } = await service.rpc("osm_save_boundary_preparation_candidate", {
      p_actor_admin_id: admin.id, p_actor_auth_uid: admin.auth_uid,
      p_preparation_id: params.preparationId, p_prepared_geometry: candidate.geometry,
      p_prepared_hash: preparedHash, p_prepared_coordinate_count: candidate.metadata.prepared_coordinates,
      p_prepared_size_bytes: candidate.metadata.prepared_size_bytes,
      p_preparation_metadata: candidate.metadata,
    });
    if (error || !isRecord(data) || !isValidCityId(data.candidate_id)
        || typeof data.candidate_version !== "number") {
      console.error("Unable to persist prepared boundary:", error);
      return NextResponse.json({ error: "Unable to save prepared boundary" }, { status: 502 });
    }
    return NextResponse.json({ preparation_id: params.preparationId, candidate_id: data.candidate_id,
      candidate_version: data.candidate_version, geometry: candidate.geometry,
      prepared_hash: preparedHash, metadata: candidate.metadata });
  }

  if (input.operation === "approve") {
    if (typeof input.acknowledge_boundary_differences !== "boolean") {
      return NextResponse.json({ error: "Boundary comparison acknowledgement is required" }, { status: 400 });
    }
    result = await service.rpc("osm_approve_boundary_preparation", {
      p_actor_admin_id: admin.id, p_actor_auth_uid: admin.auth_uid,
      p_preparation_id: params.preparationId,
      p_acknowledge_boundary_differences: input.acknowledge_boundary_differences,
    });
  } else if (input.operation === "reject") {
    if (typeof input.reason !== "string" || !input.reason.trim() || input.reason.length > 500) {
      return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 });
    }
    result = await service.rpc("osm_reject_boundary_preparation", {
      p_actor_admin_id: admin.id, p_actor_auth_uid: admin.auth_uid,
      p_preparation_id: params.preparationId, p_reason: input.reason.trim(),
    });
  } else if (input.operation === "register") {
    result = await service.rpc("osm_register_prepared_boundary", {
      p_actor_admin_id: admin.id, p_actor_auth_uid: admin.auth_uid,
      p_preparation_id: params.preparationId,
    });
  } else {
    return NextResponse.json({ error: "Unsupported preparation operation" }, { status: 400 });
  }

  if (result.error || !isRecord(result.data)) {
    console.error("Boundary preparation operation failed:", { operation: input.operation, error: result.error });
    return NextResponse.json({ error: "Boundary preparation action failed; reload and check its status" }, { status: 409 });
  }
  return NextResponse.json({ result: result.data });
}