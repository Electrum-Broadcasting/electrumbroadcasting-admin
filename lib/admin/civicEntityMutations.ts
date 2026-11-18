// @ts-ignore -- supplied by the Next.js runtime.
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { resolveAdminContext, type ResolvedAdminContext } from "@/lib/admin/context";
import { canAccessCity } from "@/lib/admin/permissions";
import { isValidCityId } from "@/lib/admin/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import type { Database } from "@/lib/database.types";

type EntityOperation = "create_pending" | "edit_metadata" | "approve" | "hide" | "restore";
type EntityStatus = "pending" | "approved" | "hidden";
type EntityData = Record<string, string | number | string[] | null>;

const textFields = [
  "name", "slug", "entity_type", "roles", "description", "summary",
  "era_id", "thumbnail_url", "hero_image_url", "hero_360_url",
] as const;
const numberFields = ["birth_year", "death_year", "year"] as const;
const arrayFields = ["tags", "media_urls"] as const;
const allowedFields: readonly string[] = [...textFields, ...numberFields, ...arrayFields];

export class CivicEntityMutationError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isEntityStatus(value: unknown): value is EntityStatus {
  return value === "pending" || value === "approved" || value === "hidden";
}

export function parseCivicEntityData(value: unknown, operation: "create_pending" | "edit_metadata"): EntityData {
  if (!isRecord(value)) throw new CivicEntityMutationError("Invalid Entity data", 400, "invalid_input");
  if (operation === "edit_metadata" && Object.keys(value).length === 0) {
    throw new CivicEntityMutationError("Entity metadata cannot be empty", 400, "invalid_input");
  }
  for (const key of Object.keys(value)) {
    if (!allowedFields.includes(key)) {
      throw new CivicEntityMutationError(`Unsupported Entity field: ${key}`, 400, "invalid_input");
    }
  }
  for (const field of ["name", "entity_type"] as const) {
    if ((operation === "create_pending" || field in value)
        && (typeof value[field] !== "string" || !value[field].trim())) {
      throw new CivicEntityMutationError(`${field} must be a nonblank string`, 400, "invalid_input");
    }
  }
  if ("slug" in value && (typeof value.slug !== "string" || !value.slug.trim())) {
    throw new CivicEntityMutationError("slug must be a nonblank string", 400, "invalid_input");
  }

  const parsed: EntityData = {};
  for (const field of textFields) {
    const item = value[field];
    if (!(field in value)) continue;
    if (item !== null && typeof item !== "string") {
      throw new CivicEntityMutationError(`Invalid ${field}`, 400, "invalid_input");
    }
    if (field === "era_id" && item !== null && !isValidCityId(item)) {
      throw new CivicEntityMutationError("Invalid era_id", 400, "invalid_input");
    }
    parsed[field] = item;
  }
  for (const field of numberFields) {
    const item = value[field];
    if (!(field in value)) continue;
    if (item !== null && (typeof item !== "number" || !Number.isInteger(item)
        || item < -2147483648 || item > 2147483647)) {
      throw new CivicEntityMutationError(`Invalid ${field}`, 400, "invalid_input");
    }
    parsed[field] = item;
  }
  for (const field of arrayFields) {
    const item = value[field];
    if (!(field in value)) continue;
    if (item !== null && (!Array.isArray(item) || !item.every((entry) => typeof entry === "string"))) {
      throw new CivicEntityMutationError(`Invalid ${field}`, 400, "invalid_input");
    }
    parsed[field] = item;
  }
  return parsed;
}

async function requireEntityAdmin(): Promise<ResolvedAdminContext> {
  const context = await resolveAdminContext();
  if (!context.ok) {
    throw new CivicEntityMutationError(
      context.reason === "unauthenticated" ? "Unauthorized" : "Forbidden",
      context.reason === "unauthenticated" ? 401 : 403,
      context.reason === "unauthenticated" ? "unauthorized" : "forbidden",
    );
  }
  if (!["CEO", "PLATFORM_ADMIN", "CITY_ADMIN"].includes(context.admin.role)) {
    throw new CivicEntityMutationError("Forbidden", 403, "forbidden");
  }
  return context.admin;
}

function serviceClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveEntity(entityId: unknown) {
  if (!isValidCityId(entityId)) {
    throw new CivicEntityMutationError("Invalid Entity ID", 400, "invalid_input");
  }
  const { data: entity, error } = await createSupabaseServerClient()
    .from("civic_entities")
    .select("id, city_id, status, is_published")
    .eq("id", entityId)
    .maybeSingle();
  if (error) {
    console.error("Failed to resolve Entity:", error);
    throw new CivicEntityMutationError("Unable to resolve Entity", 500, "lookup_failed");
  }
  if (!entity) throw new CivicEntityMutationError("Entity not found", 404, "not_found");
  if (!isValidCityId(entity.city_id)) {
    throw new CivicEntityMutationError("Entity has no valid city assignment", 403, "forbidden");
  }
  return { id: entity.id, cityId: entity.city_id, status: entity.status, isPublished: entity.is_published };
}

async function requireAuthorizedEntity(entityId: unknown) {
  const admin = await requireEntityAdmin();
  const entity = await resolveEntity(entityId);
  if (!canAccessCity(admin, entity.cityId)) {
    throw new CivicEntityMutationError("Forbidden", 403, "forbidden");
  }
  return { admin, entity };
}

async function mutateEntity(
  admin: ResolvedAdminContext,
  operation: EntityOperation,
  cityId: string,
  entityId: string | null,
  data: EntityData,
) {
  let response;
  try {
    response = await serviceClient().rpc("admin_mutate_civic_entity", {
      p_actor_admin_id: admin.id,
      p_actor_auth_uid: admin.auth_uid,
      p_expected_city_id: cityId,
      p_operation: operation,
      p_object_id: entityId as string,
      p_object_data: data,
    });
  } catch (error) {
    console.error("Entity RPC transport failed:", { operation, error });
    throw new CivicEntityMutationError("Entity mutation outcome is unconfirmed; verify before retrying", 502, "unconfirmed");
  }
  const { data: result, error, status } = response;
  if (error) {
    console.error("Guarded Entity mutation failed:", { operation, error, status });
    if (error.code === "23505") {
      throw new CivicEntityMutationError("Entity conflicts with an existing record", 409, "conflict");
    }
    if (error.code === "P0001" && error.message.startsWith("Invalid civic lifecycle transition:")) {
      throw new CivicEntityMutationError("Entity lifecycle state changed", 409, "invalid_transition");
    }
    if (error.code === "P0001" && [
      "Actor is not an active authorized administrator",
      "Only CITY_ADMIN may approve civic objects",
      "Role is not authorized for this civic lifecycle operation",
      "Civic object is outside the administrator city scope",
    ].includes(error.message)) {
      throw new CivicEntityMutationError("Forbidden", 403, "forbidden");
    }
    if (error.code === "P0001" && error.message === "Civic object city changed or is unavailable") {
      throw new CivicEntityMutationError("Entity city changed", 409, "conflict");
    }
    if (error.code === "P0001" && error.message === "Civic object not found") {
      throw new CivicEntityMutationError("Entity not found", 404, "not_found");
    }
    if (error.code === "23514" && error.message === "this city requires a published panorama before publishing") {
      throw new CivicEntityMutationError("A published panorama is required", 409, "panorama_required");
    }
    if (status === 0 || status >= 500) {
      throw new CivicEntityMutationError("Entity mutation outcome is unconfirmed; verify before retrying", 502, "unconfirmed");
    }
    throw new CivicEntityMutationError("Entity mutation failed", 500, "mutation_failed");
  }
  if (!isRecord(result) || !isValidCityId(result.entity_id)
      || (entityId !== null && result.entity_id !== entityId)
      || result.city_id !== cityId || result.operation !== operation
      || !isValidCityId(result.audit_id)
      || !isEntityStatus(result.status)
      || typeof result.is_published !== "boolean"
      || result.is_published !== (result.status === "approved")
      || (operation === "create_pending" && result.status !== "pending")
      || (operation === "approve" && result.status !== "approved")
      || (operation === "hide" && result.status !== "hidden")
      || (operation === "restore" && result.status !== "pending")) {
    console.error("Invalid Entity mutation confirmation:", { operation, result });
    throw new CivicEntityMutationError("Entity mutation outcome is unconfirmed; verify before retrying", 502, "unconfirmed");
  }
  return {
    entityId: result.entity_id,
    cityId,
    operation,
    status: result.status,
    isPublished: result.is_published,
    auditId: result.audit_id,
  };
}

export async function createPendingCivicEntity(citySlug: unknown, input: unknown) {
  const admin = await requireEntityAdmin();
  if (typeof citySlug !== "string" || !citySlug.trim()) {
    throw new CivicEntityMutationError("City is required", 400, "invalid_input");
  }
  const data = parseCivicEntityData(input, "create_pending");
  const { data: city, error } = await createSupabaseServerClient()
    .from("cities").select("id").eq("slug", citySlug.trim()).maybeSingle();
  if (error) {
    console.error("Failed to resolve Entity city:", error);
    throw new CivicEntityMutationError("Unable to resolve city", 500, "lookup_failed");
  }
  if (!city) throw new CivicEntityMutationError("City not found", 404, "not_found");
  if (!canAccessCity(admin, city.id)) throw new CivicEntityMutationError("Forbidden", 403, "forbidden");
  return mutateEntity(admin, "create_pending", city.id, null, data);
}

export async function getCivicEntityActions(entityId: unknown) {
  const { admin, entity } = await requireAuthorizedEntity(entityId);
  const cityAdmin = admin.role === "CITY_ADMIN";
  const moderator = cityAdmin || admin.role === "CEO";
  return {
    status: entity.status,
    isPublished: entity.isPublished,
    canEdit: true,
    canApprove: cityAdmin && entity.status === "pending" && entity.isPublished === false,
    canHide: moderator && entity.status === "approved" && entity.isPublished === true,
    canRestore: moderator && entity.status === "hidden" && entity.isPublished === false,
  };
}

export async function editCivicEntityMetadata(entityId: unknown, input: unknown) {
  const { admin, entity } = await requireAuthorizedEntity(entityId);
  return mutateEntity(admin, "edit_metadata", entity.cityId, entity.id, parseCivicEntityData(input, "edit_metadata"));
}

export async function transitionCivicEntity(entityId: unknown, operation: "approve" | "hide" | "restore") {
  const { admin, entity } = await requireAuthorizedEntity(entityId);
  if ((operation === "approve" && admin.role !== "CITY_ADMIN")
      || (operation !== "approve" && !["CITY_ADMIN", "CEO"].includes(admin.role))) {
    throw new CivicEntityMutationError("Forbidden", 403, "forbidden");
  }
  return mutateEntity(admin, operation, entity.cityId, entity.id, {});
}

export function parseCivicEntityRequest(body: unknown) {
  if (!isRecord(body)) throw new CivicEntityMutationError("Invalid request", 400, "invalid_input");
  const { citySlug, ...data } = body;
  return { citySlug, data };
}
