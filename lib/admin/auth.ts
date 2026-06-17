// lib/admin/auth.ts

import { createServerClient } from "@/lib/supabase/server";
import type { AdminContext, AdminRole } from "./types";

function normalizeRole(role: string): AdminRole {
  switch (role.toLowerCase()) {
    case "ceo":
      return "CEO";
    case "platform_admin":
      return "PLATFORM_ADMIN";
    case "city_admin":
      return "CITY_ADMIN";
    case "editor":
      return "EDITOR";
    default:
      throw new Error(`Unknown admin role: ${role}`);
  }
}

export async function getAdminContext(): Promise<AdminContext> {
  const supabase = createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated as admin");
  }

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("role, city_ids, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminRow || adminRow.status !== "active") {
    throw new Error("Admin access denied");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role: normalizeRole(adminRow.role),
    cityIds: adminRow.city_ids ?? [],
  };
}
