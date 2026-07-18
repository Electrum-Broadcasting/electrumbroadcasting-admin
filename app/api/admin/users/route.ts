import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/admin/types";
import { getAdminContext } from "@/lib/admin/context";

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

export async function POST(req: Request) {
  try {
    const admin = await getAdminContext();
    if (admin.role !== "CEO" && admin.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      email,
      role,
      city_ids,
      status,
      primary_city_slug,
    } = body as {
      email?: string;
      role?: AdminRole;
      city_ids?: string[];
      status?: "active" | "inactive";
      primary_city_slug?: string | null;
    };

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();
    const normalizedCityIds = Array.isArray(city_ids) ? city_ids : [];
    const normalizedStatus = status === "inactive" ? "inactive" : "active";
    const normalizedPrimaryCitySlug =
      typeof primary_city_slug === "string" && primary_city_slug.trim().length > 0
        ? primary_city_slug.trim()
        : null;

    // 1. Create Supabase Auth user
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
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
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // 2. Insert into admin_users with auth_uid
    const { error: insertError } = await supabase.from("admin_users").insert({
      user_id: authUser.user.id,       // existing field
      auth_uid: authUser.user.id,      // ⭐ REQUIRED
      email,
      role,
      city_ids: normalizedCityIds,
      status: normalizedStatus,
      primary_city_slug: normalizedPrimaryCitySlug,
    });

    if (insertError) {
      console.error("Failed to insert admin user:", insertError);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: "Failed to create admin user" },
        { status: 500 }
      );
    }

    // 3. Generate recovery link (optional)
    const { error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (linkError) {
      console.error("Failed to generate recovery link:", linkError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}