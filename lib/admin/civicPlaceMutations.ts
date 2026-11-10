import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getAdminContextOrNull, type ResolvedAdminContext } from "@/lib/admin/context";
import { canAccessCity } from "@/lib/admin/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import type { Database, Json } from "@/lib/database.types";
import { isValidCityId } from "./guards";

const PLACE_FIELDS = [
  "name",
  "slug",
  "place_type",
  "description",
  "latitude",
  "longitude",
  "year_built",
  "year_demolished",
  "neighborhood",
] as const;

type PlaceField = (typeof PLACE_FIELDS)[number];
type PlaceData = Partial<Record<PlaceField, string | number | null>>;
type PlaceOperation = "create_pending" | "edit_metadata" | "hide" | "approve" | "restore";

type CivicPlaceState = {
  id: string;
  cityId: string;
  status: string | null;
  isPublished: boolean | null;
};

export type CivicPlaceActions = {
  status: string | null;
  isPublished: boolean | null;
  canEdit: boolean;
  canApprove: boolean;
  canHide: boolean;
  canRestore: boolean;
};

export class CivicPlaceMutationError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseCivicPlaceData(value: unknown): PlaceData {
  if (!isRecord(value)) {
    throw new CivicPlaceMutationError("Invalid Place data", 400);
  }

  for (const key of Object.keys(value)) {
    if (!PLACE_FIELDS.includes(key as PlaceField)) {
      throw new CivicPlaceMutationError(`Unsupported Place field: ${key}`, 400);
    }
  }

  if (typeof value.name !== "string" || !value.name.trim()) {
    throw new CivicPlaceMutationError("Place name is required", 400);
  }

  const parsed: PlaceData = { name: value.name.trim() };
  const textFields = ["slug", "place_type", "description", "neighborhood"] as const;
  for (const field of textFields) {
    const fieldValue = value[field];
    if (fieldValue === undefined) continue;
    if (fieldValue !== null && typeof fieldValue !== "string") {
      throw new CivicPlaceMutationError(`Invalid ${field}`, 400);
    }
    parsed[field] = fieldValue as string | null;
  }

  const numericFields = ["latitude", "longitude", "year_built", "year_demolished"] as const;
  for (const field of numericFields) {
    const fieldValue = value[field];
    if (fieldValue === undefined) continue;
    if (fieldValue !== null && (typeof fieldValue !== "number" || !Number.isFinite(fieldValue))) {
      throw new CivicPlaceMutationError(`Invalid ${field}`, 400);
    }
    if ((field === "year_built" || field === "year_demolished")
        && typeof fieldValue === "number" && !Number.isInteger(fieldValue)) {
      throw new CivicPlaceMutationError(`Invalid ${field}`, 400);
    }
    parsed[field] = fieldValue as number | null;
  }

  return parsed;
}

async function requirePlacesAdmin(): Promise<ResolvedAdminContext> {
  const admin = await getAdminContextOrNull();
  if (!admin) throw new CivicPlaceMutationError("Unauthorized", 401);
  if (!["CEO", "PLATFORM_ADMIN", "CITY_ADMIN"].includes(admin.role)) {
    throw new CivicPlaceMutationError("Forbidden", 403);
  }
  return admin;
}

function serviceClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function mutatePlace(
  admin: ResolvedAdminContext,
  operation: PlaceOperation,
  cityId: string,
  placeId: string | null,
  data: PlaceData,
) {
  const { data: result, error } = await serviceClient().rpc("admin_mutate_civic_place", {
    p_actor_admin_id: admin.id,
    p_actor_auth_uid: admin.auth_uid,
    p_expected_city_id: cityId,
    p_operation: operation,
    p_place_id: placeId,
    p_place_data: data as Json,
  });

  if (error) {
    console.error("Guarded civic Place mutation failed:", error);
    throw new CivicPlaceMutationError(
      error.code === "23505" ? "A Place with this slug already exists" : "Place mutation failed",
      error.code === "23505" ? 409 : 500,
    );
  }
  if (!result || typeof result !== "object" || Array.isArray(result)
      || typeof result.place_id !== "string" || result.city_id !== cityId
      || typeof result.audit_id !== "string" || result.operation !== operation) {
    console.error("Invalid guarded civic Place mutation confirmation:", result);
    throw new CivicPlaceMutationError("Unable to confirm Place mutation", 500);
  }
  return result;
}

export async function createPendingCivicPlace(citySlug: unknown, input: unknown) {
  const admin = await requirePlacesAdmin();
  if (typeof citySlug !== "string" || !citySlug.trim()) {
    throw new CivicPlaceMutationError("City is required", 400);
  }
  const data = parseCivicPlaceData(input);
  if (typeof data.slug !== "string" || !data.slug.trim()) {
    data.slug = String(data.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const sessionClient = createSupabaseServerClient();
  const { data: city, error } = await sessionClient
    .from("cities")
    .select("id")
    .eq("slug", citySlug.trim())
    .maybeSingle();
  if (error) {
    console.error("Failed to resolve city for civic Place creation:", error);
    throw new CivicPlaceMutationError("Unable to resolve city", 500);
  }
  if (!city) throw new CivicPlaceMutationError("City not found", 404);
  if (!canAccessCity(admin, city.id)) {
    throw new CivicPlaceMutationError("Forbidden", 403);
  }

  return mutatePlace(admin, "create_pending", city.id, null, data);
}

export async function getCivicPlaceCityActions(citySlug: unknown) {
  const admin = await requirePlacesAdmin();
  if (typeof citySlug !== "string" || !citySlug.trim()) {
    throw new CivicPlaceMutationError("City is required", 400);
  }
  const sessionClient = createSupabaseServerClient();
  const { data: city, error } = await sessionClient
    .from("cities")
    .select("id")
    .eq("slug", citySlug.trim())
    .maybeSingle();
  if (error) {
    console.error("Failed to resolve city for civic Place actions:", error);
    throw new CivicPlaceMutationError("Unable to resolve city", 500);
  }
  if (!city) throw new CivicPlaceMutationError("City not found", 404);
  if (!canAccessCity(admin, city.id)) {
    throw new CivicPlaceMutationError("Forbidden", 403);
  }

  return {
    canCreate: ["CEO", "PLATFORM_ADMIN", "CITY_ADMIN"].includes(admin.role),
    canEdit: ["CEO", "PLATFORM_ADMIN", "CITY_ADMIN"].includes(admin.role),
  };
}

async function resolveExistingPlace(placeId: unknown): Promise<CivicPlaceState> {
  if (!isValidCityId(placeId)) {
    throw new CivicPlaceMutationError("Invalid Place ID", 400);
  }

  const sessionClient = createSupabaseServerClient();
  const { data: place, error } = await sessionClient
    .from("civic_places")
    .select("id, city_id, status, is_published")
    .eq("id", placeId)
    .maybeSingle();
  if (error) {
    console.error("Failed to resolve civic Place city:", error);
    throw new CivicPlaceMutationError("Unable to resolve Place", 500);
  }
  if (!place) throw new CivicPlaceMutationError("Place not found", 404);
  if (!place.city_id || !isValidCityId(place.city_id)) {
    throw new CivicPlaceMutationError("Place has no valid city assignment", 403);
  }
  return {
    id: place.id,
    cityId: place.city_id,
    status: place.status,
    isPublished: place.is_published,
  };
}

async function requireAuthorizedPlace(placeId: unknown) {
  const admin = await requirePlacesAdmin();
  const place = await resolveExistingPlace(placeId);
  if (!canAccessCity(admin, place.cityId)) {
    throw new CivicPlaceMutationError("Forbidden", 403);
  }
  return { admin, place };
}

export async function getCivicPlaceActions(placeId: unknown): Promise<CivicPlaceActions> {
  const { admin, place } = await requireAuthorizedPlace(placeId);
  const stateIs = (status: string, isPublished: boolean) =>
    place.status === status && place.isPublished === isPublished;
  const cityAdmin = admin.role === "CITY_ADMIN";
  const ceo = admin.role === "CEO";
  const canModerate = cityAdmin || ceo;

  return {
    status: place.status,
    isPublished: place.isPublished,
    canEdit: ["CEO", "PLATFORM_ADMIN", "CITY_ADMIN"].includes(admin.role),
    canApprove: cityAdmin && stateIs("pending", false),
    canHide: canModerate
      && (stateIs("approved", true) || stateIs("pending", true)),
    canRestore: canModerate && stateIs("hidden", false),
  };
}

export async function editCivicPlaceMetadata(placeId: unknown, input: unknown) {
  const { admin, place } = await requireAuthorizedPlace(placeId);
  const data = parseCivicPlaceData(input);
  return mutatePlace(admin, "edit_metadata", place.cityId, place.id, data);
}

export async function hideCivicPlace(placeId: unknown) {
  const { admin, place } = await requireAuthorizedPlace(placeId);
  if (!["CEO", "CITY_ADMIN"].includes(admin.role)) {
    throw new CivicPlaceMutationError("Forbidden", 403);
  }
  return mutatePlace(admin, "hide", place.cityId, place.id, {});
}

export async function approveCivicPlace(placeId: unknown) {
  const { admin, place } = await requireAuthorizedPlace(placeId);
  if (admin.role !== "CITY_ADMIN") {
    throw new CivicPlaceMutationError("Forbidden", 403);
  }
  return mutatePlace(admin, "approve", place.cityId, place.id, {});
}

export async function restoreCivicPlace(placeId: unknown) {
  const { admin, place } = await requireAuthorizedPlace(placeId);
  if (!["CEO", "CITY_ADMIN"].includes(admin.role)) {
    throw new CivicPlaceMutationError("Forbidden", 403);
  }
  return mutatePlace(admin, "restore", place.cityId, place.id, {});
}

export function parseCivicPlaceRequest(body: unknown) {
  if (!isRecord(body)) throw new CivicPlaceMutationError("Invalid request", 400);
  const { citySlug, ...data } = body;
  return { citySlug, data };
}
