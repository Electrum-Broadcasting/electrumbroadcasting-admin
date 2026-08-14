// lib/admin/permissions.ts

import type { AdminRole } from "./types";

const ROLE_RANK: Record<AdminRole, number> = {
  CEO: 4,
  PLATFORM_ADMIN: 3,
  CITY_ADMIN: 2,
  EDITOR: 1,
};

export function hasMinimumRole(
  userRole: AdminRole,
  requiredRole: AdminRole
): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

export function canManageUsers(role: AdminRole): boolean {
  return role === "CEO" || role === "PLATFORM_ADMIN";
}

export function canManageCityContent(role: AdminRole): boolean {
  return role === "CEO" || role === "PLATFORM_ADMIN" || role === "CITY_ADMIN";
}

export function canCreate(role: AdminRole): boolean {
  return canManageCityContent(role) || role === "CEO";
}

export function canEdit(role: AdminRole): boolean {
  return canManageCityContent(role) || role === "EDITOR";
}

export function canDelete(role: AdminRole): boolean {
  return role === "CEO" || role === "PLATFORM_ADMIN";
}
