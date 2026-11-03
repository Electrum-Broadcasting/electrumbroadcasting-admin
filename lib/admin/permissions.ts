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

export function canAccessCity(
  admin: { role: AdminRole; city_ids: string[] },
  cityId: string
): boolean {
  if (admin.role === "CEO" || admin.role === "PLATFORM_ADMIN") return true;
  if (admin.role === "CITY_ADMIN" || admin.role === "EDITOR") {
    return Array.isArray(admin.city_ids) && admin.city_ids.includes(cityId);
  }
  return false;
}
