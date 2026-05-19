import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/admin/types";
import {
  ADMIN_ROLE_COLUMN,
  ADMIN_ROLE_TABLE,
  ADMIN_USER_ID_COLUMN,
  hasMinimumRole,
  normalizeAdminRole
} from "@/lib/admin/role";

export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentRole(userId: string): Promise<AdminRole | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(ADMIN_ROLE_TABLE)
    .select(ADMIN_ROLE_COLUMN)
    .eq(ADMIN_USER_ID_COLUMN, userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return normalizeAdminRole(data?.[ADMIN_ROLE_COLUMN]);
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireMinimumRole(requiredRole: AdminRole) {
  const user = await requireAuthenticatedUser();
  const role = await getCurrentRole(user.id);

  if (!role || !hasMinimumRole(role, requiredRole)) {
    redirect("/");
  }

  return { user, role };
}
