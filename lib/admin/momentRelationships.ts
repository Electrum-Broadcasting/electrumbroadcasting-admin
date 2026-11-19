// @ts-ignore -- supplied by the Next.js runtime.
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { resolveAdminContext } from "@/lib/admin/context";
import { CivicObjectMutationError } from "@/lib/admin/civicObjectMutations";
import { canAccessCity } from "@/lib/admin/permissions";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { isRelationshipUuid, parseMomentSnapshot, type MomentRelationshipSnapshot } from "@/lib/moments/relationships";
import type { Database, Json } from "@/lib/database.types";

type RelationshipDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Database["public"]["Functions"] & {
      admin_replace_moment_relationships: {
        Args: {
          p_actor_admin_id: string; p_actor_auth_uid: string; p_expected_city_id: string;
          p_moment_id: string; p_entity_links: Json; p_era_ids: string[];
          p_place_ids: string[]; p_neighborhood_ids: string[]; p_story_ids: string[];
          p_idempotency_key: string;
        };
        Returns: Json;
      };
    };
  };
};

function serviceClient() {
  return createClient<RelationshipDatabase>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function authorize(momentId: unknown) {
  if (!isRelationshipUuid(momentId)) throw new CivicObjectMutationError("Invalid Moment ID", 400, "invalid_input");
  const context = await resolveAdminContext();
  if (!context.ok) {
    throw new CivicObjectMutationError(context.reason === "unauthenticated" ? "Unauthorized" : "Forbidden",
      context.reason === "unauthenticated" ? 401 : 403, context.reason === "unauthenticated" ? "unauthorized" : "forbidden");
  }
  const admin = context.admin;
  if (!["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"].includes(admin.role)) {
    throw new CivicObjectMutationError("Forbidden", 403, "forbidden");
  }
  const service = serviceClient();
  const { data: moment, error } = await service.from("civic_moments")
    .select("id, city_id").eq("id", momentId).maybeSingle();
  if (error) {
    console.error("Failed to resolve Moment relationship source:", error);
    throw new CivicObjectMutationError("Unable to load Moment relationships", 500, "lookup_failed");
  }
  if (!moment) throw new CivicObjectMutationError("Moment not found", 404, "not_found");
  if (!isRelationshipUuid(moment.city_id) || !canAccessCity(admin, moment.city_id)) {
    throw new CivicObjectMutationError("Moment city access denied", 403, "forbidden");
  }
  return { admin, moment: { id: moment.id, cityId: moment.city_id }, service };
}

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null; count: number | null }>;

async function readAll<T>(read: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];
  let total: number | null = null;
  do {
    const page = await read(rows.length, rows.length + 999);
    if (page.error || !page.data || page.count === null || (total !== null && total !== page.count)) {
      console.error("Unable to read complete Moment relationship family:", page.error);
      throw new CivicObjectMutationError("Unable to load complete Moment relationships. Reload before saving.", 500, "snapshot_failed");
    }
    total = page.count;
    if (page.data.length === 0 && rows.length < total) {
      throw new CivicObjectMutationError("Unable to load complete Moment relationships. Reload before saving.", 500, "snapshot_failed");
    }
    rows.push(...page.data);
  } while (rows.length < total);
  if (rows.length !== total) {
    throw new CivicObjectMutationError("Unable to load complete Moment relationships. Reload before saving.", 500, "snapshot_failed");
  }
  return rows;
}

export async function getMomentRelationships(momentId: unknown) {
  const { moment, service } = await authorize(momentId);
  const [entities, eras, places, neighborhoods, stories] = await Promise.all([
    readAll((from, to) => service.from("moment_entities").select("entity_id, role", { count: "exact" })
      .eq("moment_id", moment.id).order("id").range(from, to)),
    readAll((from, to) => service.from("moment_eras").select("era_id", { count: "exact" })
      .eq("moment_id", moment.id).order("id").range(from, to)),
    readAll((from, to) => service.from("moment_places").select("place_id", { count: "exact" })
      .eq("moment_id", moment.id).order("id").range(from, to)),
    readAll((from, to) => service.from("moment_neighborhoods").select("neighborhood_id", { count: "exact" })
      .eq("moment_id", moment.id).order("id").range(from, to)),
    readAll((from, to) => service.from("moment_stories").select("story_id", { count: "exact" })
      .eq("moment_id", moment.id).order("id").range(from, to)),
  ]);
  const snapshot = parseMomentSnapshot({
    entities: entities.map((row) => ({ id: row.entity_id, role: row.role })),
    eras: eras.map((row) => ({ id: row.era_id })),
    places: places.map((row) => ({ id: row.place_id })),
    neighborhoods: neighborhoods.map((row) => ({ id: row.neighborhood_id })),
    stories: stories.map((row) => ({ id: row.story_id })),
  });
  if (!snapshot) {
    throw new CivicObjectMutationError("Moment relationships contain invalid or duplicate links. Reload or request assistance.", 409, "invalid_snapshot");
  }

  const targets = [
    { table: "civic_entities", links: snapshot.entities },
    { table: "civic_eras", links: snapshot.eras },
    { table: "civic_places", links: snapshot.places },
    { table: "civic_neighborhoods", links: snapshot.neighborhoods },
    { table: "civic_stories", links: snapshot.stories },
  ] as const;
  for (const { table, links } of targets) {
    for (let offset = 0; offset < links.length; offset += 100) {
      const ids = links.slice(offset, offset + 100).map((link) => link.id);
      const { data, error } = await service.from(table).select("id").in("id", ids).eq("city_id", moment.cityId);
      if (error || !data || data.length !== ids.length) {
        if (error) console.error("Failed to validate Moment relationship targets:", error);
        throw new CivicObjectMutationError("Some Moment relationships are unavailable or outside this city. Request assistance before saving.", 409, "invalid_snapshot");
      }
    }
  }
  return { cityId: moment.cityId, snapshot };
}

export async function replaceMomentRelationships(momentId: unknown, input: unknown) {
  const { admin, moment, service } = await authorize(momentId);
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new CivicObjectMutationError("Invalid relationship request", 400, "invalid_input");
  }
  const snapshot: MomentRelationshipSnapshot | null = parseMomentSnapshot("snapshot" in input ? input.snapshot : null);
  const idempotencyKey = "idempotencyKey" in input ? input.idempotencyKey : null;
  const expectedCityId = "cityId" in input ? input.cityId : null;
  if (!snapshot || !isRelationshipUuid(idempotencyKey) || !isRelationshipUuid(expectedCityId)) {
    throw new CivicObjectMutationError("A complete Moment relationship snapshot and retry key are required", 400, "invalid_input");
  }
  if (moment.cityId !== expectedCityId.toLowerCase()) {
    throw new CivicObjectMutationError("Moment city changed. Reload before saving relationships.", 409, "city_changed");
  }
  let response;
  try {
    response = await service.rpc("admin_replace_moment_relationships", {
      p_actor_admin_id: admin.id, p_actor_auth_uid: admin.auth_uid, p_expected_city_id: moment.cityId,
      p_moment_id: moment.id, p_entity_links: snapshot.entities,
      p_era_ids: snapshot.eras.map((link) => link.id), p_place_ids: snapshot.places.map((link) => link.id),
      p_neighborhood_ids: snapshot.neighborhoods.map((link) => link.id),
      p_story_ids: snapshot.stories.map((link) => link.id), p_idempotency_key: idempotencyKey,
    });
  } catch (error) {
    console.error("Moment relationship RPC transport failed:", error);
    throw new CivicObjectMutationError("Moment relationship save outcome is unconfirmed. Retry the same request.", 502, "unconfirmed");
  }
  if (response.error) {
    console.error("Moment relationship RPC failed:", response.error);
    if (response.status === 0 || response.status >= 500) {
      throw new CivicObjectMutationError("Moment relationship save outcome is unconfirmed. Retry the same request.", 502, "unconfirmed");
    }
    throw new CivicObjectMutationError("Moment relationship save was rejected. Verify the relationships and city access.", 400, "relationship_rejected");
  }
  const result = response.data;
  if (!result || typeof result !== "object" || Array.isArray(result)
      || result.sourceId !== moment.id || result.cityId !== moment.cityId
      || typeof result.changed !== "boolean"
      || (result.changed ? !isRelationshipUuid(result.auditId) : result.auditId !== null)
      || typeof result.addedCount !== "number" || !Number.isInteger(result.addedCount) || result.addedCount < 0
      || typeof result.removedCount !== "number" || !Number.isInteger(result.removedCount) || result.removedCount < 0
      || (result.changed && result.addedCount === 0 && result.removedCount === 0)
      || (!result.changed && (result.addedCount !== 0 || result.removedCount !== 0))) {
    throw new CivicObjectMutationError("Moment relationship save outcome is unconfirmed. Retry the same request.", 502, "unconfirmed");
  }
  return result;
}
