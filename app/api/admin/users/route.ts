import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";
import type { AdminRole } from "@/lib/admin/types";
import { getAdminContext } from "@/lib/admin/context";

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    console.log("CITY IDS RECEIVED:", adminRows.map(row => row.city_ids));

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

export async function POST(req: Request) {
  try {
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const admin = await getAdminContext();
    if (admin.role !== "CEO" && admin.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { email, role, city_ids, status, primary_city_slug } = body;

    const normalizedCityIds = Array.isArray(city_ids) ? city_ids : [];
    const normalizedStatus = status === "inactive" ? "inactive" : "active";
    const normalizedPrimaryCitySlug =
      primary_city_slug?.trim() || null;

    const tempPassword =
  crypto.randomUUID().replace(/-/g, "") + "Aa1!";

const { data: authUser, error: authError } =
  await service.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true, 
    user_metadata: {
      role,
      city_ids: normalizedCityIds,
      status: normalizedStatus,
      primary_city_slug: normalizedPrimaryCitySlug,
    },
  });

    if (authError || !authUser?.user) {
      console.error("Failed to create auth user:", authError);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    const authUid = authUser.user.id;

    const { error: insertError } = await service.from("admin_users").insert({
      user_id: authUid,
      auth_uid: authUid,
      email,
      role,
      city_ids: normalizedCityIds,
      status: normalizedStatus,
      primary_city_slug: normalizedPrimaryCitySlug,
      updated_by: admin.id ?? null,
      password_hash: null,
    });

    if (insertError) {
      console.error("Failed to insert admin user:", insertError);
      await service.auth.admin.deleteUser(authUid);
      return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 });
    }

    await service.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
