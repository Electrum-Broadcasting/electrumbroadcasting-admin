import { getAdminSession } from "./auth";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";
import type { AdminRole } from "./types";

type AdminContext = {
  id: string;
  email: string | null;
  role: AdminRole;
  cityIds: string[];
};

function normalizeRole(role: string): AdminRole {
  switch (role.toUpperCase()) {
    case "CEO":
      return "CEO";
    case "PLATFORM_ADMIN":
      return "PLATFORM_ADMIN";
    case "CITY_ADMIN":
      return "CITY_ADMIN";
    case "EDITOR":
      return "EDITOR";
    default:
      throw new Error(`Unknown admin role: ${role}`);
  }
}

export async function getAdminContext(): Promise<AdminContext> {
  const session = getAdminSession();
  if (!session) throw new Error("Not authenticated as admin");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: adminRow, error } = await supabase
    .from("admin_users")
    .select("role, city_ids, status, email")
    .eq("user_id", session.admin_id)
    .maybeSingle();

  if (error || !adminRow || adminRow.status !== "active") {
    throw new Error("Admin access denied");
  }

  return {
    id: session.admin_id,
    email: adminRow.email ?? null,
    role: normalizeRole(adminRow.role),
    cityIds: adminRow.city_ids ?? [],
  };
}
