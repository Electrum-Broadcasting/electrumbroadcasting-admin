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
  const role = String(value ?? "") as AdminRole;
  return role in roleRank ? role : null;
}

export function hasMinimumRole(current: AdminRole, required: AdminRole): boolean {
  return roleRank[current] >= roleRank[required];
}
