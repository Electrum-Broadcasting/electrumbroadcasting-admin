// @ts-ignore -- supplied by the Next.js runtime.
import "server-only";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { resolveAdminContext } from "@/lib/admin/context";
import { CivicObjectMutationError } from "@/lib/admin/civicObjectMutations";
import { isValidCityId } from "@/lib/admin/guards";
import { canAccessCity } from "@/lib/admin/permissions";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import type { Database } from "@/lib/database.types";

const tables = {
  place: "civic_places", neighborhood: "civic_neighborhoods", entity: "civic_entities",
  event: "civic_events", artifact: "civic_artifacts", moment: "civic_moments", story: "civic_stories",
} as const;
const MAX_BYTES = 50 * 1024 * 1024;
type ObjectType = keyof typeof tables;

function fail(message: string, status = 400, code = "invalid_input"): never {
  throw new CivicObjectMutationError(message, status, code);
}

function serviceClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function authorize(type: string, objectId: string) {
  if (!Object.hasOwn(tables, type) || !isValidCityId(objectId)) fail("Invalid object", 400);
  const context = await resolveAdminContext();
  if (!context.ok) fail("Please sign in as an active administrator.", context.reason === "unauthenticated" ? 401 : 403, "forbidden");
  if (!["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"].includes(context.admin.role)) fail("Panorama access denied.", 403, "forbidden");
  const service = serviceClient();
  const objectType = type as ObjectType;
  const { data: object, error } = await service.from(tables[objectType]).select("id, city_id").eq("id", objectId).maybeSingle();
  if (error) {
    console.error("Panorama parent lookup failed:", error);
    fail("Unable to load panorama parent.", 500, "lookup_failed");
  }
  if (!object) fail("Panorama parent not found.", 404, "not_found");
  if (!isValidCityId(object.city_id) || !canAccessCity(context.admin, object.city_id)) fail("City access denied.", 403, "forbidden");
  return { service, admin: context.admin, cityId: object.city_id, objectType: `civic_${objectType}`, objectId: object.id };
}

export async function checkPanoramaAccess(type: string, objectId: string) {
  await authorize(type, objectId);
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("Invalid request.");
  return value as Record<string, unknown>;
}

function label(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 120) fail("Title must be 1–120 characters.");
  return value.trim();
}

function description(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 500) fail("Description must be at most 500 characters.");
  return value;
}

function coordinate(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) fail("Initial coordinates must be between 0 and 1.");
  return value;
}

function rpcError(error: { message: string }, status: number) {
  console.error("Panorama RPC failed:", error);
  if (status === 0 || status >= 500) fail("Save outcome is unconfirmed. Reload and verify before retrying.", 502, "unconfirmed");
  fail("Panorama operation was rejected. Check permissions and input.", 400, "rejected");
}

function confirmAudit(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("Save outcome is unconfirmed. Reload and verify before retrying.", 502, "unconfirmed");
  }
  const result = value as Record<string, unknown>;
  if (!isValidCityId(result.id) || !isValidCityId(result.audit_id)) {
    fail("Save outcome is unconfirmed. Reload and verify before retrying.", 502, "unconfirmed");
  }
  return result;
}

export async function listPanoramas(type: string, objectId: string) {
  const context = await authorize(type, objectId);
  const { data, error, count } = await context.service.from("panoramas")
    .select("id, city_id, civic_object_type, civic_object_id, label, description, status, display_order, equirectangular_url, pan_x_initial, pan_y_initial, created_at", { count: "exact" })
    .eq("city_id", context.cityId).eq("civic_object_type", context.objectType).eq("civic_object_id", context.objectId)
    .order("display_order").order("created_at").order("id");
  if (error || !data || count !== data.length) {
    console.error("Panorama list incomplete:", error);
    fail("Unable to load the complete panorama list.", 500, "lookup_failed");
  }
  return data;
}

export async function createPanorama(type: string, objectId: string, form: FormData) {
  const context = await authorize(type, objectId);
  const file = form.get("file");
  const title = label(form.get("label"));
  const details = description(form.get("description"));
  if (!(file instanceof File) || !["image/jpeg", "image/webp"].includes(file.type) || file.size === 0 || file.size > MAX_BYTES) {
    fail("Choose a JPEG or WebP image up to 50 MiB.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const image = sharp(bytes, { limitInputPixels: 8192 * 4096, failOn: "warning" });
    const info = await image.metadata();
    if ((info.format === "jpeg" ? "image/jpeg" : info.format === "webp" ? "image/webp" : "") !== file.type
        || !info.width || !info.height || info.width !== 2 * info.height
        || info.width < 2048 || info.height < 1024 || info.width > 8192 || info.height > 4096
        || (info.orientation && info.orientation !== 1) || (info.pages && info.pages > 1)) {
      fail("Image must be a non-animated, unrotated 2:1 JPEG or WebP between 2048 × 1024 and 8192 × 4096 pixels.");
    }
    await image.resize(1, 1).toBuffer();
  } catch (error) {
    if (error instanceof CivicObjectMutationError) throw error;
    console.error("Invalid panorama image:", error);
    fail("Unable to decode the panorama image. Check the file and dimensions.");
  }
  const path = `cities/${context.cityId}/panoramas/${context.objectType}/${context.objectId}/${crypto.randomUUID()}.${file.type === "image/jpeg" ? "jpg" : "webp"}`;
  const bucket = context.service.storage.from("universal-media");
  async function cleanup(): Promise<boolean> {
    try {
      const { error } = await bucket.remove([path]);
      if (error) {
        console.error("Panorama upload cleanup failed for", path, error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Panorama upload cleanup failed for", path, error);
      return false;
    }
  }
  let uploadError: unknown = null;
  try {
    const response = await bucket.upload(path, bytes, { contentType: file.type, upsert: false });
    uploadError = response.error;
  } catch (error) {
    uploadError = error;
  }
  if (uploadError) {
    console.error("Panorama upload failed:", uploadError);
    const cleaned = await cleanup();
    fail(!cleaned ? "Upload failed and cleanup could not be confirmed. Contact an administrator." : "Panorama upload failed.", 500, "upload_failed");
  }
  const url = bucket.getPublicUrl(path).data.publicUrl;
  let response;
  try {
    response = await context.service.rpc("admin_create_panorama", {
      p_actor_admin_id: context.admin.id, p_actor_auth_uid: context.admin.auth_uid,
      p_expected_city_id: context.cityId, p_object_type: context.objectType, p_object_id: context.objectId,
      p_equirectangular_url: url, p_label: title, ...(details === null ? {} : { p_description: details }),
    });
  } catch (error) {
    console.error("Panorama creation outcome unknown for", path, error);
    fail("Creation outcome is unconfirmed. Reload and verify before retrying; storage cleanup requires review.", 502, "unconfirmed");
  }
  if (response.error) {
    if (response.status === 0 || response.status >= 500) {
      console.error("Panorama upload requires reconciliation:", path);
      rpcError(response.error, response.status);
    }
    if (!await cleanup()) {
      fail("Creation was rejected and storage cleanup failed. Contact an administrator.", 500, "cleanup_failed");
    }
    rpcError(response.error, response.status);
  }
  try {
    return confirmAudit(response.data);
  } catch (error) {
    console.error("Panorama upload requires reconciliation:", path);
    throw error;
  }
}

export async function mutatePanorama(type: string, objectId: string, body: unknown) {
  const context = await authorize(type, objectId);
  const input = requireRecord(body);
  const actor = { p_actor_admin_id: context.admin.id, p_actor_auth_uid: context.admin.auth_uid, p_expected_city_id: context.cityId };
  if (input.operation === "reorder") {
    if (!Array.isArray(input.ids) || !input.ids.length || !input.ids.every(isValidCityId)) fail("A complete ordered panorama list is required.");
    const response = await context.service.rpc("admin_reorder_panoramas", {
      ...actor, p_object_type: context.objectType, p_object_id: context.objectId, p_panorama_ids: input.ids,
    });
    if (response.error) rpcError(response.error, response.status);
    const result = response.data;
    if (!result || typeof result !== "object" || Array.isArray(result)
        || typeof result.changed !== "number" || !Number.isInteger(result.changed) || result.changed < 0) {
      fail("Reorder outcome is unconfirmed. Reload to verify.", 502, "unconfirmed");
    }
    return result;
  }
  if (!isValidCityId(input.id)) fail("Invalid panorama ID.");
  const { data: panorama, error } = await context.service.from("panoramas").select("id")
    .eq("id", input.id).eq("city_id", context.cityId)
    .eq("civic_object_type", context.objectType).eq("civic_object_id", context.objectId).maybeSingle();
  if (error) {
    console.error("Panorama lookup failed:", error);
    fail("Unable to load panorama.", 500, "lookup_failed");
  }
  if (!panorama) fail("Panorama not found.", 404, "not_found");
  if (input.operation === "metadata") {
    const data = requireRecord(input.data);
    const response = await context.service.rpc("rpc_update_panorama_metadata", {
      ...actor, p_panorama_id: input.id, p_data: {
        label: label(data.label), description: description(data.description),
        pan_x_initial: coordinate(data.pan_x_initial), pan_y_initial: coordinate(data.pan_y_initial),
      },
    });
    if (response.error) rpcError(response.error, response.status);
    return confirmAudit(response.data);
  }
  if (input.operation === "publish" || input.operation === "archive" || input.operation === "unpublish") {
    const status = input.operation === "publish" ? "published" : input.operation === "archive" ? "archived" : "draft";
    const response = await context.service.rpc("admin_set_panorama_status", { ...actor, p_panorama_id: input.id, p_status: status });
    if (response.error) rpcError(response.error, response.status);
    return confirmAudit(response.data);
  }
  fail("Unsupported panorama operation.");
}
