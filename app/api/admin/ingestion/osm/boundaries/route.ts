import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { resolveAdminContext } from "@/lib/admin/context";
import { isValidCityId } from "@/lib/admin/guards";
import { canAccessCity } from "@/lib/admin/permissions";
import { parseCityBoundary } from "@/lib/ingestion/cityBoundary";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export async function POST(request: Request) {
  const context = await resolveAdminContext();
  if (!context.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"].includes(context.admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let input: unknown;
  try {
    const limit = 1024 * 1024;
    const length = Number(request.headers.get("content-length"));
    if (Number.isFinite(length) && length > limit) {
      return NextResponse.json({ error: "Boundary exceeds the size limit" }, { status: 413 });
    }
    if (!request.body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return NextResponse.json({ error: "Boundary exceeds the size limit" }, { status: 413 });
      }
      chunks.push(value);
    }
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!input || typeof input !== "object" || Array.isArray(input)
      || !("city_id" in input) || !isValidCityId(input.city_id)
      || !("source_url" in input) || typeof input.source_url !== "string"
      || !("source_version" in input) || typeof input.source_version !== "string"
      || !input.source_version.trim() || input.source_version.length > 200
      || !("geometry" in input)) {
    return NextResponse.json({ error: "City, source URL, source version, and geometry are required" }, { status: 400 });
  }
  if (!canAccessCity(context.admin, input.city_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let sourceUrl: URL;
  try {
    sourceUrl = new URL(input.source_url);
  } catch {
    return NextResponse.json({ error: "Invalid boundary source URL" }, { status: 400 });
  }
  if (sourceUrl.protocol !== "https:" || !sourceUrl.hostname || sourceUrl.username || sourceUrl.password) {
    return NextResponse.json({ error: "Boundary source must be an HTTPS URL without credentials" }, { status: 400 });
  }
  let geometry;
  try {
    geometry = parseCityBoundary(input.geometry);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid boundary" }, { status: 400 });
  }
  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let result;
  try {
    result = await service.rpc("admin_register_osm_boundary", {
      p_actor_admin_id: context.admin.id,
      p_actor_auth_uid: context.admin.auth_uid,
      p_city_id: input.city_id,
      p_source_url: sourceUrl.href,
      p_source_version: input.source_version.trim(),
      p_geometry: geometry,
    });
  } catch (error) {
    console.error("OSM boundary registration outcome unconfirmed:", { cityId: input.city_id, error });
    return NextResponse.json({ error: "Registration outcome is unconfirmed; verify before retrying" }, { status: 502 });
  }
  const { data, error, status } = result;
  if (error) {
    console.error("OSM boundary registration failed:", error);
    return NextResponse.json({ error: status === 0 || status >= 500
      ? "Registration outcome is unconfirmed; verify before retrying"
      : "Boundary registration rejected" }, { status: status === 0 || status >= 500 ? 502 : 400 });
  }
  if (!data || typeof data !== "object" || !isValidCityId(data.boundary_id)
      || !isValidCityId(data.audit_id) || data.city_id !== input.city_id) {
    return NextResponse.json({ error: "Registration outcome is unconfirmed; verify before retrying" }, { status: 502 });
  }
  return NextResponse.json({ result: data });
}
