import type { AdminRole } from "@/lib/admin/types";
import { hasMinimumRole } from "@/lib/admin/auth";

export function canCreate(role: AdminRole): boolean {
  return hasMinimumRole(role, "editor");
}

export function canEdit(role: AdminRole): boolean {
  return hasMinimumRole(role, "editor");
}

export function canDelete(role: AdminRole): boolean {
  return hasMinimumRole(role, "admin");
}
