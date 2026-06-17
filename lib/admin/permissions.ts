// lib/admin/permissions.ts

import type { AdminRole } from "./types";

const ROLE_RANK: Record<AdminRole, number> = {
  CEO: 4,
  platform_admin: 3,
  city_admin: 2,
  editor: 1,
};

export function hasMinimumRole(
  userRole: AdminRole,
  requiredRole: AdminRole
): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

export function canManageUsers(role: AdminRole): boolean {
  return role === "CEO" || role === "platform_admin";
}

export function canManageCityContent(role: AdminRole): boolean {
  return role === "CEO" || role === "platform_admin" || role === "city_admin";
}
