import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";
import type { AdminRole } from "@/lib/admin/types";

export interface ResolvedAdminContext {
  id: string;
  email: string;
  role: AdminRole;
  auth_uid: string;
  user_id: string;
  city_ids: string[];
  status: string;
  primary_city_slug: string | null;
}

export type AdminContextFailure = "unauthenticated" | "no_admin" | "inactive";

export type AdminContextResult =
  | { ok: true; admin: ResolvedAdminContext }
  | { ok: false; reason: AdminContextFailure };

// Identity comes from the Supabase Auth session (validated by Supabase);
// role, status and city_ids come from admin_users, never from cookies.
export async function resolveAdminContext(): Promise<AdminContextResult> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;

  if (error || !user) return { ok: false, reason: "unauthenticated" };

  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: row, error: rowError } = await service
    .from("admin_users")
    .select("id, email, role, status, city_ids, user_id, auth_uid, primary_city_slug")
    .eq("auth_uid", user.id)
    .maybeSingle();

  if (rowError || !row) return { ok: false, reason: "no_admin" };
  if (row.status !== "active") return { ok: false, reason: "inactive" };

  return {
    ok: true,
    admin: {
      id: row.id,
      email: row.email ?? user.email ?? "",
      role: row.role as AdminRole,
      auth_uid: row.auth_uid,
      user_id: row.user_id ?? row.auth_uid,
      city_ids: Array.isArray(row.city_ids) ? row.city_ids : [],
      status: row.status,
      primary_city_slug: row.primary_city_slug ?? null,
    },
  };
}

export async function getAdminContextOrNull(): Promise<ResolvedAdminContext | null> {
  const result = await resolveAdminContext();
  return result.ok ? result.admin : null;
}

export async function getAdminContext(): Promise<ResolvedAdminContext> {
  const result = await resolveAdminContext();

  if (!result.ok) {
    if (result.reason === "unauthenticated") {
      redirect("/login?error=Not authenticated");
    }
    redirect("/login?error=Access denied");
  }

  return result.admin;
}
