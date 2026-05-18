import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/admin/types";

const roleRank: Record<AdminRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3
};

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
    .from("admin_users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.role) {
    return null;
  }

  const role = String(data.role) as AdminRole;
  if (!(role in roleRank)) {
    return null;
  }

  return role;
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

  if (!role || roleRank[role] < roleRank[requiredRole]) {
    redirect("/login?error=unauthorized");
  }

  return { user, role };
}

export function hasMinimumRole(current: AdminRole, required: AdminRole): boolean {
  return roleRank[current] >= roleRank[required];
}
