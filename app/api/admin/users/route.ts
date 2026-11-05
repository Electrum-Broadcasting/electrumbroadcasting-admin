import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/supabase/env";
import type { AdminRole } from "@/lib/admin/types";
import { getAdminContext } from "@/lib/admin/context";
import { apiRequirePlatformAdmin } from "@/lib/admin/guards";

const ADMIN_ROLES: string[] = ["CEO", "PLATFORM_ADMIN", "CITY_ADMIN", "EDITOR"];

export async function GET() {
  const guard = await apiRequirePlatformAdmin();
  if (guard.response) return guard.response;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Load admin_users
  const { data: adminRows, error: adminError } = await supabase
    .from("admin_users")
    .select("id, user_id, auth_uid, role, city_ids, status");

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
    const auth = authUsers.users.find((u) => u.id === row.auth_uid);

    // city_ids is an array — we take the first one
    const cityId = Array.isArray(row.city_ids) ? row.city_ids[0] : null;
    const city = cities?.find((c) => c.id === cityId);

    return {
      id: row.id,
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
    const { role, city_ids, status, primary_city_slug } = body;
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Valid email and role are required" }, { status: 400 });
    }

    const normalizedCityIds = Array.isArray(city_ids) ? city_ids : [];
    const normalizedStatus = status === "inactive" ? "inactive" : "active";
    const normalizedPrimaryCitySlug =
      primary_city_slug?.trim() || null;

    // Stop before any mutation if an admin_users record already uses this email,
    // even when no Supabase Auth identity exists. ilike is escaped to match literally.
    const escapedEmail = email.replace(/[\\%_]/g, "\\$&");
    const { data: existingAdminRows, error: existingAdminError } = await service
      .from("admin_users")
      .select("id")
      .ilike("email", escapedEmail)
      .limit(1);

    if (existingAdminError) {
      console.error("Failed to check existing admin_users:", existingAdminError);
      return NextResponse.json({ error: "Failed to check existing accounts" }, { status: 500 });
    }

    if (existingAdminRows && existingAdminRows.length > 0) {
      return NextResponse.json(
        { error: "An admin record with this email already exists. No changes were made.", code: "ADMIN_RECORD_EXISTS" },
        { status: 409 }
      );
    }

    // Stop before any mutation if the email already has a Supabase Auth identity.
    for (let page = 1; ; page++) {
      const { data: pageData, error: listError } =
        await service.auth.admin.listUsers({ page, perPage: 1000 });

      if (listError || !pageData) {
        console.error("Failed to check existing auth users:", listError);
        return NextResponse.json({ error: "Failed to check existing accounts" }, { status: 500 });
      }

      if (pageData.users.some((u) => u.email?.toLowerCase() === email)) {
        return NextResponse.json(
          { error: "An account with this email already exists. No changes were made.", code: "ACCOUNT_EXISTS" },
          { status: 409 }
        );
      }

      if (pageData.users.length < 1000) break;
    }

    // Supabase emails the invitation; the user sets their own password.
    const { data: authUser, error: authError } =
      await service.auth.admin.inviteUserByEmail(email);

    if (authError || !authUser?.user) {
      console.error("Failed to invite auth user:", authError);
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
