import type { AdminRole } from "@/lib/admin/types";

export const ADMIN_ROLE_TABLE = "admin_roles";
export const ADMIN_ROLE_COLUMN = "role";
export const ADMIN_USER_ID_COLUMN = "user_id";

const roleRank: Record<AdminRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3
};

export function normalizeAdminRole(value: unknown): AdminRole | null {
  if (typeof value !== "string") {
    return null;
  }

  if (!(value in roleRank)) {
    return null;
  }

  return value as AdminRole;
}

export function hasMinimumRole(current: AdminRole, required: AdminRole): boolean {
  return roleRank[current] >= roleRank[required];
}
