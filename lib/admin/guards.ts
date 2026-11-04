import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import {
  getAdminContext,
  getAdminContextOrNull,
  type ResolvedAdminContext,
} from "@/lib/admin/context";
import {
  canAccessCity,
  canManageUsers,
  hasMinimumRole,
} from "@/lib/admin/permissions";
import type { AdminRole } from "@/lib/admin/types";

// Page / layout / server-action guards (redirect on failure)

export async function requirePlatformAdmin(): Promise<ResolvedAdminContext> {
  const admin = await getAdminContext();
  if (!canManageUsers(admin.role)) redirect("/admin");
  return admin;
}

export async function requireRole(
  minimum: AdminRole
): Promise<ResolvedAdminContext> {
  const admin = await getAdminContext();
  if (!hasMinimumRole(admin.role, minimum)) redirect("/admin");
  return admin;
}

export async function requireCityAccess(
  cityId: string
): Promise<ResolvedAdminContext> {
  const admin = await getAdminContext();
  if (!canAccessCity(admin, cityId)) redirect("/admin");
  return admin;
}

// Non-redirecting guards for API routes

export type ApiGuardResult =
  | { admin: ResolvedAdminContext; response?: undefined }
  | { admin?: undefined; response: NextResponse };

async function apiAuthorize(
  allowed: (admin: ResolvedAdminContext) => boolean
): Promise<ApiGuardResult> {
  const admin = await getAdminContextOrNull();
  if (!admin) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!allowed(admin)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { admin };
}

export function apiRequirePlatformAdmin(): Promise<ApiGuardResult> {
  return apiAuthorize((a) => canManageUsers(a.role));
}

export function apiRequireRole(minimum: AdminRole): Promise<ApiGuardResult> {
  return apiAuthorize((a) => hasMinimumRole(a.role, minimum));
}

export function apiRequireCityAccess(cityId: string): Promise<ApiGuardResult> {
  return apiAuthorize((a) => canAccessCity(a, cityId));
}

export function isValidCityId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}
