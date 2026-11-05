import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import type { ResolvedAdminContext } from "@/lib/admin/context";
import type { AdminRole } from "@/lib/admin/types";

const ADMIN_ROLES: AdminRole[] = [
  "CEO",
  "PLATFORM_ADMIN",
  "CITY_ADMIN",
  "EDITOR",
];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminUserManagementRow = {
  id: string;
  user_id: string;
  email: string;
  role: AdminRole;
  city_ids: string[] | null;
  status: "active" | "inactive";
  primary_city_slug: string | null;
  auth_uid: string | null;
};

export type AdminUserUpdate = {
  role?: AdminRole;
  status?: "active" | "inactive";
  city_ids?: string[];
  primary_city_slug?: string | null;
};

export type AdminUserDeleteResult =
  | { ok: true }
  | { ok: false; status: 400 | 404 | 409 | 500; error: string };

function createAdminServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isAdminUserId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isAdminUserUpdate(value: unknown): value is AdminUserUpdate {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  const allowed = new Set([
    "role",
    "status",
    "city_ids",
    "primary_city_slug",
  ]);
  if (keys.length === 0 || keys.some((key) => !allowed.has(key))) return false;

  return (
    (!("role" in body) ||
      (typeof body.role === "string" &&
        ADMIN_ROLES.includes(body.role as AdminRole))) &&
    (!("status" in body) ||
      body.status === "active" ||
      body.status === "inactive") &&
    (!("city_ids" in body) ||
      (Array.isArray(body.city_ids) &&
        body.city_ids.every((cityId) => isAdminUserId(cityId)))) &&
    (!("primary_city_slug" in body) ||
      body.primary_city_slug === null ||
      typeof body.primary_city_slug === "string")
  );
}

export async function listAdminUsersForManagement() {
  const service = createAdminServiceClient();
  const { data, error } = await service
    .from("admin_users")
    .select(
      "id, user_id, auth_uid, email, role, city_ids, status, primary_city_slug"
    )
    .order("email");

  if (error) throw new Error(`Failed to load Admin users: ${error.message}`);
  return (data ?? []) as AdminUserManagementRow[];
}

export async function getAdminUserForManagement(id: string) {
  if (!isAdminUserId(id)) return null;

  const service = createAdminServiceClient();
  const { data, error } = await service
    .from("admin_users")
    .select(
      "id, user_id, auth_uid, email, role, city_ids, status, primary_city_slug"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load Admin user: ${error.message}`);
  return (data as AdminUserManagementRow | null) ?? null;
}

export async function updateAdminUserForManagement(
  id: string,
  update: AdminUserUpdate
) {
  const service = createAdminServiceClient();
  const { data, error } = await service
    .from("admin_users")
    .update(update)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Failed to update Admin user: ${error.message}`);
  return Boolean(data);
}

export async function deleteAdminUserForManagement(
  id: string,
  actor: ResolvedAdminContext
): Promise<AdminUserDeleteResult> {
  if (!isAdminUserId(id)) {
    return { ok: false, status: 400, error: "Invalid Admin user ID" };
  }

  const service = createAdminServiceClient();
  const { data: target, error: loadError } = await service
    .from("admin_users")
    .select("id, auth_uid")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    console.error("Failed to load Admin user for deletion:", loadError);
    return { ok: false, status: 500, error: "Failed to load Admin user" };
  }
  if (!target) {
    return { ok: false, status: 404, error: "Admin user not found" };
  }
  if (target.auth_uid === actor.auth_uid) {
    return {
      ok: false,
      status: 409,
      error: "You cannot delete your own Admin account",
    };
  }
  if (!isAdminUserId(target.auth_uid)) {
    return {
      ok: false,
      status: 400,
      error: "Admin user has a missing or invalid Auth identity",
    };
  }

  const { error: authError } = await service.auth.admin.deleteUser(
    target.auth_uid
  );
  if (authError) {
    console.error("Failed to delete Admin Auth identity:", authError);
    return {
      ok: false,
      status: 500,
      error: "Failed to delete Auth identity; Admin record was not changed",
    };
  }

  const { error: rowError } = await service
    .from("admin_users")
    .delete()
    .eq("id", target.id);
  if (rowError) {
    console.error("Auth identity deleted but Admin row deletion failed:", rowError);
    return {
      ok: false,
      status: 500,
      error: "Auth identity was deleted, but the Admin record could not be deleted",
    };
  }

  return { ok: true };
}
