import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
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
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  if (!user) {
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
