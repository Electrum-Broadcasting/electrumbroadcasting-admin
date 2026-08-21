// lib/admin/guards.ts
// City-scoped admin authorization wrappers per docs/ARCHITECTURE.md + docs/DATA-MODEL.md.

import { getAdminContext } from "./context";
import { hasMinimumRole } from "./permissions";
import type { AdminRole } from "./types";

export type AdminContext = Awaited<ReturnType<typeof getAdminContext>>;

const GLOBAL_ROLES: AdminRole[] = ["CEO", "PLATFORM_ADMIN"];

export class AdminAccessError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "AdminAccessError";
    this.status = status;
  }
}

/** Loads the current admin session and enforces a minimum role rank. */
export async function requireAdminRole(minRole: AdminRole): Promise<AdminContext> {
  const context = await getAdminContext();

  if (!hasMinimumRole(context.role as AdminRole, minRole)) {
    throw new AdminAccessError(`This action requires ${minRole} role or higher.`);
  }

  return context;
}

/** Ensures the given admin context has access to the given city (CEO/PLATFORM_ADMIN bypass city scoping). */
export function requireCityAccess(context: AdminContext, cityId: string): AdminContext {
  if (!cityId) {
    throw new AdminAccessError("cityId is required to authorize this action.", 400);
  }

  const isGlobalAdmin = GLOBAL_ROLES.includes(context.role as AdminRole);
  const cityIds: string[] = Array.isArray(context.city_ids) ? context.city_ids : [];

  if (!isGlobalAdmin && !cityIds.includes(cityId)) {
    throw new AdminAccessError("You do not have access to this city.");
  }

  return context;
}

/**
 * Loads the admin session, enforces a minimum role, enforces city scoping,
 * then invokes the handler with the resolved context.
 */
export async function withCityAdminScope<T>(
  cityId: string,
  minRole: AdminRole,
  handler: (context: AdminContext) => Promise<T>
): Promise<T> {
  const context = await requireAdminRole(minRole);
  requireCityAccess(context, cityId);
  return handler(context);
}
