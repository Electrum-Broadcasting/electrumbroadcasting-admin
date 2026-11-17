// @ts-ignore -- supplied by the Next.js runtime.
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { resolveAdminContext, type ResolvedAdminContext } from "@/lib/admin/context";
import { isValidCityId } from "@/lib/admin/guards";
import { canAccessCity } from "@/lib/admin/permissions";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type ObjectType = "event" | "artifact" | "neighborhood" | "era" | "moment";
type Operation = "create_pending" | "edit_metadata" | "approve" | "hide" | "restore";
type Transition = "approve" | "hide" | "restore";
type ObjectData = Record<string, string | number | string[] | null>;

const specs = {
  event: {
    label: "Event", table: "civic_events", rpc: "admin_mutate_civic_event",
    fields: { name: "string", slug: "string", event_type: "string", description: "string", start_date: "string", end_date: "string", severity: "string", casualties: "integer", economic_impact: "number", tags: "array", thumbnail_360_url: "string" },
    required: ["name", "event_type"],
  },
  artifact: {
    label: "Artifact", table: "civic_artifacts", rpc: "admin_mutate_civic_artifact",
    fields: { title: "string", slug: "string", artifact_type: "string", description: "string", media_url: "string", year: "integer", hero_image_url: "string", hero_360_url: "string", media_urls: "array", tags: "array", related_event_ids: "uuid_array" },
    required: ["title", "artifact_type"],
  },
  neighborhood: {
    label: "Neighborhood", table: "civic_neighborhoods", rpc: "admin_mutate_civic_neighborhood",
    fields: { name: "string", slug: "string", description: "string" },
    required: ["name"],
  },
  era: {
    label: "Era", table: "civic_eras", rpc: "admin_mutate_civic_era",
    fields: { name: "string", slug: "string", description: "string", start_year: "integer", end_year: "integer" },
    required: ["name"],
  },
  moment: {
    label: "Moment", table: "civic_moments", rpc: "admin_mutate_civic_moment",
    fields: { title: "string", slug: "string", body: "string", moment_time: "string", thumbnail_360_url: "string", inline_360_urls: "array" },
    required: ["title", "moment_time"],
  },
} as const;

export class CivicObjectMutationError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseCivicObjectType(value: string): ObjectType {
  if (!Object.hasOwn(specs, value)) throw new CivicObjectMutationError("Not found", 404, "not_found");
  return value as ObjectType;
}

export function parseCivicObjectData(type: ObjectType, input: unknown, operation: "create_pending" | "edit_metadata"): ObjectData {
  const spec = specs[type];
  if (!isRecord(input)) throw new CivicObjectMutationError(`Invalid ${spec.label} data`, 400, "invalid_input");
  if (operation === "edit_metadata" && Object.keys(input).length === 0) {
    throw new CivicObjectMutationError(`${spec.label} metadata cannot be empty`, 400, "invalid_input");
  }
  const fields: Readonly<Record<string, string>> = spec.fields;
  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(fields, key)) throw new CivicObjectMutationError(`Unsupported ${spec.label} field: ${key}`, 400, "invalid_input");
  }
  for (const key of spec.required) {
    const value = input[key];
    if ((operation === "create_pending" || Object.hasOwn(input, key))
        && (typeof value !== "string" || !value.trim())) {
      throw new CivicObjectMutationError(`${key} must be a nonblank string`, 400, "invalid_input");
    }
  }
  if (Object.hasOwn(input, "slug") && (typeof input.slug !== "string" || !input.slug.trim())) {
    throw new CivicObjectMutationError("slug must be a nonblank string", 400, "invalid_input");
  }
  const data: ObjectData = {};
  for (const [key, value] of Object.entries(input)) {
    const kind = fields[key];
    if (value === null) {
      data[key] = null;
    } else if (kind === "string" && typeof value === "string") {
      data[key] = value;
    } else if ((kind === "number" || kind === "integer") && typeof value === "number" && Number.isFinite(value)
      && (kind !== "integer" || (Number.isInteger(value) && value >= -2147483648 && value <= 2147483647))) {
      data[key] = value;
    } else if ((kind === "array" || kind === "uuid_array") && Array.isArray(value)
      && value.every((item) => typeof item === "string" && (kind !== "uuid_array" || isValidCityId(item)))) {
      data[key] = value;
    } else {
      throw new CivicObjectMutationError(`Invalid ${key}`, 400, "invalid_input");
    }
  }
  if (type === "moment" && typeof data.moment_time === "string"
      && Number.isNaN(Date.parse(data.moment_time))) {
    throw new CivicObjectMutationError("Invalid moment_time", 400, "invalid_input");
  }
  return data;
}

async function requireAdmin(): Promise<ResolvedAdminContext> {
  const context = await resolveAdminContext();
  if (!context.ok) {
    const unauthorized = context.reason === "unauthenticated";
    throw new CivicObjectMutationError(unauthorized ? "Unauthorized" : "Forbidden", unauthorized ? 401 : 403, unauthorized ? "unauthorized" : "forbidden");
  }
  if (!["CEO", "PLATFORM_ADMIN", "CITY_ADMIN"].includes(context.admin.role)) {
    throw new CivicObjectMutationError("Forbidden", 403, "forbidden");
  }
  return context.admin;
}

async function resolveObject(type: ObjectType, objectId: unknown) {
  const spec = specs[type];
  if (!isValidCityId(objectId)) throw new CivicObjectMutationError(`Invalid ${spec.label} ID`, 400, "invalid_input");
  const { data: row, error } = await createSupabaseServerClient()
    .from(spec.table).select("id, city_id, status, is_published").eq("id", objectId).maybeSingle();
  if (error) {
    console.error(`Failed to resolve ${spec.label}:`, error);
    throw new CivicObjectMutationError(`Unable to resolve ${spec.label}`, 500, "lookup_failed");
  }
  if (!row) throw new CivicObjectMutationError(`${spec.label} not found`, 404, "not_found");
  if (!isValidCityId(row.city_id)) throw new CivicObjectMutationError(`${spec.label} has no valid city assignment`, 403, "forbidden");
  return { id: row.id, cityId: row.city_id, status: row.status, isPublished: row.is_published };
}

async function authorizedObject(type: ObjectType, objectId: unknown) {
  const admin = await requireAdmin();
  const object = await resolveObject(type, objectId);
  if (!canAccessCity(admin, object.cityId)) throw new CivicObjectMutationError("Forbidden", 403, "forbidden");
  return { admin, object };
}

async function mutate(type: ObjectType, admin: ResolvedAdminContext, operation: Operation, cityId: string, objectId: string | null, data: ObjectData) {
  const spec = specs[type];
  const client = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let response;
  try {
    response = await client.rpc(spec.rpc, {
      p_actor_admin_id: admin.id, p_actor_auth_uid: admin.auth_uid, p_expected_city_id: cityId,
      p_operation: operation, p_object_id: objectId, p_object_data: data,
    });
  } catch (error) {
    console.error(`${spec.label} RPC transport failed:`, { operation, error });
    throw new CivicObjectMutationError(`${spec.label} mutation outcome is unconfirmed; verify before retrying`, 502, "unconfirmed");
  }
  const { data: result, error, status } = response;
  if (error) {
    console.error(`Guarded ${spec.label} mutation failed:`, { operation, error, status });
    if (error.code === "23505") throw new CivicObjectMutationError(`${spec.label} conflicts with an existing record`, 409, "conflict");
    if (error.code === "P0001" && error.message.startsWith("Invalid civic lifecycle transition:")) throw new CivicObjectMutationError(`${spec.label} lifecycle state changed`, 409, "invalid_transition");
    if (error.code === "P0001" && [
      "Actor is not an active authorized administrator", "Only CITY_ADMIN may approve civic objects",
      "Role is not authorized for this civic lifecycle operation", "Civic object is outside the administrator city scope",
    ].includes(error.message)) throw new CivicObjectMutationError("Forbidden", 403, "forbidden");
    if (error.code === "P0001" && error.message === "Civic object city changed or is unavailable") throw new CivicObjectMutationError(`${spec.label} city changed`, 409, "conflict");
    if (error.code === "P0001" && error.message === "Civic object not found") throw new CivicObjectMutationError(`${spec.label} not found`, 404, "not_found");
    if (error.code === "23514" && error.message === "this city requires a published panorama before publishing") throw new CivicObjectMutationError("A published panorama is required", 409, "panorama_required");
    if (status === 0 || status >= 500) throw new CivicObjectMutationError(`${spec.label} mutation outcome is unconfirmed; verify before retrying`, 502, "unconfirmed");
    throw new CivicObjectMutationError(`${spec.label} mutation failed`, 500, "mutation_failed");
  }
  const idKey = `${type}_id`;
  if (!isRecord(result) || !isValidCityId(result[idKey])
      || (objectId !== null && result[idKey] !== objectId)
      || result.city_id !== cityId || result.operation !== operation || !isValidCityId(result.audit_id)
      || (result.status !== "pending" && result.status !== "approved" && result.status !== "hidden")
      || typeof result.is_published !== "boolean" || result.is_published !== (result.status === "approved")
      || (operation === "create_pending" && result.status !== "pending")
      || (operation === "approve" && result.status !== "approved")
      || (operation === "hide" && result.status !== "hidden")
      || (operation === "restore" && result.status !== "pending")) {
    console.error(`Invalid ${spec.label} mutation confirmation:`, { operation, result });
    throw new CivicObjectMutationError(`${spec.label} mutation outcome is unconfirmed; verify before retrying`, 502, "unconfirmed");
  }
  return {
    [`${type}Id`]: result[idKey], cityId, operation, status: result.status,
    isPublished: result.is_published, auditId: result.audit_id,
  };
}

export async function createPendingCivicObject(type: ObjectType, citySlug: unknown, input: unknown) {
  const admin = await requireAdmin();
  if (typeof citySlug !== "string" || !citySlug.trim()) throw new CivicObjectMutationError("City is required", 400, "invalid_input");
  const data = parseCivicObjectData(type, input, "create_pending");
  const { data: city, error } = await createSupabaseServerClient().from("cities").select("id").eq("slug", citySlug.trim()).maybeSingle();
  if (error) {
    console.error("Failed to resolve civic object city:", error);
    throw new CivicObjectMutationError("Unable to resolve city", 500, "lookup_failed");
  }
  if (!city) throw new CivicObjectMutationError("City not found", 404, "not_found");
  if (!canAccessCity(admin, city.id)) throw new CivicObjectMutationError("Forbidden", 403, "forbidden");
  return mutate(type, admin, "create_pending", city.id, null, data);
}

export async function getCivicObjectActions(type: ObjectType, objectId: unknown) {
  const { admin, object } = await authorizedObject(type, objectId);
  const cityAdmin = admin.role === "CITY_ADMIN";
  const moderator = cityAdmin || admin.role === "CEO";
  return {
    status: object.status, isPublished: object.isPublished, canEdit: true,
    canApprove: cityAdmin && object.status === "pending" && object.isPublished === false,
    canHide: moderator && object.status === "approved" && object.isPublished === true,
    canRestore: moderator && object.status === "hidden" && object.isPublished === false,
  };
}

export async function editCivicObjectMetadata(type: ObjectType, objectId: unknown, input: unknown) {
  const { admin, object } = await authorizedObject(type, objectId);
  return mutate(type, admin, "edit_metadata", object.cityId, object.id, parseCivicObjectData(type, input, "edit_metadata"));
}

export async function transitionCivicObject(type: ObjectType, objectId: unknown, operation: Transition) {
  const { admin, object } = await authorizedObject(type, objectId);
  if ((operation === "approve" && admin.role !== "CITY_ADMIN")
      || (operation !== "approve" && !["CITY_ADMIN", "CEO"].includes(admin.role))) {
    throw new CivicObjectMutationError("Forbidden", 403, "forbidden");
  }
  return mutate(type, admin, operation, object.cityId, object.id, {});
}

export function parseCivicObjectRequest(body: unknown) {
  if (!isRecord(body)) throw new CivicObjectMutationError("Invalid request", 400, "invalid_input");
  const { citySlug, ...data } = body;
  return { citySlug, data };
}
