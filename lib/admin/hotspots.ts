// @ts-ignore -- supplied by the Next.js runtime.
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { authorizePanoramaParent } from "@/lib/admin/panoramas";
import { CivicObjectMutationError } from "@/lib/admin/civicObjectMutations";
import { isValidCityId } from "@/lib/admin/guards";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import type { Database } from "@/lib/database.types";

const targets = {
  civic_entity: { table: "civic_entities", label: "name" },
  civic_event: { table: "civic_events", label: "name" },
  civic_artifact: { table: "civic_artifacts", label: "title" },
  civic_place: { table: "civic_places", label: "name" },
  civic_neighborhood: { table: "civic_neighborhoods", label: "name" },
  civic_moment: { table: "civic_moments", label: "title" },
  civic_story: { table: "civic_stories", label: "title" },
} as const;
type TargetType = keyof typeof targets;

function fail(message: string, status = 400, code = "invalid_input"): never {
  throw new CivicObjectMutationError(message, status, code);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("Invalid hotspot request.");
  return value as Record<string, unknown>;
}

function targetType(value: unknown): TargetType | "external_url" {
  if (value === "external_url") return value;
  if (typeof value !== "string" || !Object.hasOwn(targets, value)) fail("Unsupported hotspot target type.");
  return value as TargetType;
}

async function authorize(type: string, objectId: string, panoramaId: string) {
  if (!isValidCityId(panoramaId)) fail("Invalid panorama ID.");
  const context = await authorizePanoramaParent(type, objectId);
  const { data, error } = await context.service.from("panoramas").select("id, status")
    .eq("id", panoramaId).eq("city_id", context.cityId)
    .eq("civic_object_type", context.objectType).eq("civic_object_id", context.objectId).maybeSingle();
  if (error) {
    console.error("Hotspot panorama lookup failed:", error);
    fail("Unable to load panorama.", 500, "lookup_failed");
  }
  if (!data) fail("Panorama not found.", 404, "not_found");
  return { ...context, panorama: data };
}

function anonymousClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Context = Awaited<ReturnType<typeof authorize>>;

async function validateTarget(context: Context, input: Record<string, unknown>) {
  const type = targetType(input.target_type);
  if (type === "external_url") {
    if (typeof input.target_url !== "string" || !/^https:\/\/[^\s]+$/i.test(input.target_url)) {
      fail("Enter a valid HTTPS target URL.");
    }
    try {
      const url = new URL(input.target_url);
      if (url.protocol !== "https:" || !url.hostname || url.username || url.password) fail("Enter a valid HTTPS target URL without credentials.");
    } catch (error) {
      if (error instanceof CivicObjectMutationError) throw error;
      fail("Enter a valid HTTPS target URL.");
    }
    return { target_type: type, target_id: null, target_url: input.target_url };
  }
  if (!isValidCityId(input.target_id)) fail("Select a valid target object.");
  const id = input.target_id;
  const table = targets[type].table;
  const { data, error } = await context.service.from(table).select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("Hotspot target lookup failed:", error);
    fail("Unable to validate the target.", 500, "lookup_failed");
  }
  if (!data) fail("Target object not found.");
  if (data.city_id !== context.cityId) fail("Target object belongs to a different city.");
  if (!data.is_published || (type === "civic_story" && "safety_hold" in data && data.safety_hold !== false)) {
    fail("Target object must be published and accessible.");
  }
  const visible = await anonymousClient().from(table).select("id").eq("id", id).maybeSingle();
  if (visible.error) {
    console.error("Hotspot public target lookup failed:", visible.error);
    fail("Unable to verify public access to the target.", 500, "lookup_failed");
  }
  if (!visible.data) fail("Target object is not publicly accessible.");
  return { target_type: type, target_id: id, target_url: null };
}

function hotspotData(input: unknown) {
  const value = record(input);
  if (typeof value.label !== "string" || !value.label.trim() || value.label.length > 120) fail("Hotspot label must be 1–120 characters.");
  const { pan_x, pan_y } = value;
  if (typeof pan_x !== "number" || !Number.isFinite(pan_x) || pan_x < 0 || pan_x > 1
      || typeof pan_y !== "number" || !Number.isFinite(pan_y) || pan_y < 0 || pan_y > 1) {
    fail("Hotspot coordinates must be between 0 and 1.");
  }
  return { ...value, label: value.label.trim(), pan_x, pan_y };
}

function confirmResult(data: unknown, expectedId?: string, expectedActive?: boolean) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    fail("Save outcome is unconfirmed. Reload and verify before retrying.", 502, "unconfirmed");
  }
  const result = data as Record<string, unknown>;
  if (!isValidCityId(result.id) || !isValidCityId(result.audit_id) || (expectedId && result.id !== expectedId)
      || (expectedActive !== undefined && result.is_active !== expectedActive)) {
    fail("Save outcome is unconfirmed. Reload and verify before retrying.", 502, "unconfirmed");
  }
  return result;
}

function checkRpc(error: { message: string } | null, status: number) {
  if (!error) return;
  console.error("Hotspot RPC failed:", error);
  if (status === 0 || status >= 500) fail("Save outcome is unconfirmed. Reload and verify before retrying.", 502, "unconfirmed");
  const known = [
    "hotspot target belongs to a different city",
    "cannot activate a hotspot targeting an unpublished object",
    "cannot activate a hotspot on an archived panorama",
    "Cannot place a hotspot on an archived panorama",
    "panorama targets are not supported for activation in the MVP",
  ];
  fail(known.includes(error.message) ? error.message : "Hotspot operation rejected. Check target, position, and permissions.", 400, "rejected");
}

export async function listHotspots(type: string, objectId: string, panoramaId: string) {
  const context = await authorize(type, objectId, panoramaId);
  const { data, error, count } = await context.service.from("hotspots")
    .select("id, panorama_id, pan_x, pan_y, label, target_type, target_id, target_url, is_active, display_order", { count: "exact" })
    .eq("panorama_id", panoramaId).eq("city_id", context.cityId).order("display_order").order("id");
  if (error || !data || count !== data.length) {
    console.error("Hotspot list incomplete:", error);
    fail("Unable to load the complete hotspot list.", 500, "lookup_failed");
  }
  return data;
}

export async function searchHotspotTargets(type: string, objectId: string, panoramaId: string, rawType: string, search: string) {
  const context = await authorize(type, objectId, panoramaId);
  const target = targetType(rawType);
  if (target === "external_url") fail("External URLs do not have object search.");
  const query = search.trim();
  if (query.length < 2 || query.length > 100 || /[%_\\]/.test(query)) fail("Enter 2–100 search characters without wildcard characters.");
  const config = targets[target];
  const { data, error } = await context.service.from(config.table).select("*")
    .eq("city_id", context.cityId).eq("is_published", true).ilike(config.label, `%${query}%`)
    .order(config.label).limit(30);
  if (error || !data) {
    console.error("Hotspot target search failed:", error);
    fail("Unable to search target objects.", 500, "lookup_failed");
  }
  const eligible = data.filter((item) => target !== "civic_story" || ("safety_hold" in item && item.safety_hold === false));
  if (!eligible.length) return [];
  const visible = await anonymousClient().from(config.table).select("id").in("id", eligible.map((item) => item.id));
  if (visible.error || !visible.data) {
    console.error("Hotspot public target search failed:", visible.error);
    fail("Unable to verify public access to targets.", 500, "lookup_failed");
  }
  const visibleIds = new Set(visible.data.map((item) => item.id));
  return eligible.filter((item) => visibleIds.has(item.id))
    .map((item) => ({ id: item.id, label: ("name" in item ? item.name : item.title) || item.id }));
}

export async function mutateHotspot(type: string, objectId: string, panoramaId: string, payload: unknown) {
  const context = await authorize(type, objectId, panoramaId);
  const input = record(payload);
  const actor = { p_actor_admin_id: context.admin.id, p_actor_auth_uid: context.admin.auth_uid, p_expected_city_id: context.cityId };
  if (input.operation === "validate") {
    await validateTarget(context, record(input.data));
    return { valid: true };
  }
  if (input.operation === "place") {
    if (context.panorama.status === "archived") fail("Cannot place a hotspot on an archived panorama.");
    const data = hotspotData(input.data);
    const target = await validateTarget(context, data);
    const response = await context.service.rpc("admin_place_hotspot", { ...actor, p_panorama_id: panoramaId, p_data: {
      pan_x: data.pan_x, pan_y: data.pan_y, label: data.label, ...target,
    } });
    checkRpc(response.error, response.status);
    return confirmResult(response.data, undefined, false);
  }
  if (!isValidCityId(input.id)) fail("Invalid hotspot ID.");
  const { data: hotspot, error } = await context.service.from("hotspots").select("id, target_type, target_id, target_url")
    .eq("id", input.id).eq("panorama_id", panoramaId).eq("city_id", context.cityId).maybeSingle();
  if (error) {
    console.error("Hotspot lookup failed:", error);
    fail("Unable to load hotspot.", 500, "lookup_failed");
  }
  if (!hotspot) fail("Hotspot not found.", 404, "not_found");
  if (input.operation === "update") {
    const data = hotspotData(input.data);
    const target = await validateTarget(context, data);
    const response = await context.service.rpc("admin_update_hotspot", { ...actor, p_hotspot_id: input.id, p_data: {
      pan_x: data.pan_x, pan_y: data.pan_y, label: data.label, ...target,
    } });
    checkRpc(response.error, response.status);
    return confirmResult(response.data, input.id);
  }
  if (input.operation === "activate" || input.operation === "deactivate") {
    if (input.operation === "activate") await validateTarget(context, hotspot);
    const response = await context.service.rpc("admin_set_hotspot_active", { ...actor, p_hotspot_id: input.id, p_active: input.operation === "activate" });
    checkRpc(response.error, response.status);
    return confirmResult(response.data, input.id, input.operation === "activate");
  }
  if (input.operation === "delete") {
    const response = await context.service.rpc("admin_delete_hotspot", { ...actor, p_hotspot_id: input.id });
    checkRpc(response.error, response.status);
    return confirmResult(response.data, input.id);
  }
  fail("Unsupported hotspot operation.");
}
