import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();

  // 1. Load admin_users
  const { data: adminRows, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id, role, city_ids, status");

  if (adminError || !adminRows) {
    console.error("Failed to load admin_users:", adminError);
    return NextResponse.json({ users: [] });
  }

  // 2. Load cities
  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, domain");

  // 3. Load all auth users
  const { data: authUsers } = await supabase.auth.admin.listUsers();

  // 4. Join everything
  const users = adminRows.map((row) => {
    const auth = authUsers.users.find((u) => u.id === row.user_id);

    // city_ids is an array — we take the first one
    const cityId = Array.isArray(row.city_ids) ? row.city_ids[0] : null;
    const city = cities?.find((c) => c.id === cityId);

    return {
      id: row.user_id,
      email: auth?.email ?? "unknown",
      created_at: auth?.created_at ?? null,
      role: row.role,
      city_name: city?.name ?? null,
      city_domain: city?.domain ?? null,
      status: row.status ?? "active",
    };
  });

  return NextResponse.json({ users });
}
