import type { AdminRole } from "@/lib/admin/types";

export const ADMIN_ROLE_TABLE = "admin_users";
export const ADMIN_ROLE_COLUMN = "role";
export const ADMIN_USER_ID_COLUMN = "user_id";

const roleRank: Record<AdminRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3
};

/**
 * Validates and normalizes role values from Supabase payloads.
 * Returns null when the input is not one of the supported admin roles.
 */
export function normalizeAdminRole(value: unknown): AdminRole | null {
  if (typeof value !== "string") {
    return null;
  }

  if (!(value in roleRank)) {
    return null;
  }

  return value as AdminRole;
}

/**
 * Checks whether the current role rank is at least the required role rank.
 */
export function hasMinimumRole(current: AdminRole, required: AdminRole): boolean {
  return roleRank[current] >= roleRank[required];
}
