// app/api/admin/users/[id]/route.ts

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/auth";
import { canManageUsers } from "@/lib/admin/permissions";
import type { AdminRole } from "@/lib/admin/types";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const admin = await getAdminContext();
    if (!canManageUsers(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      role,
      city_ids,
      status,
    } = body as {
      role?: AdminRole;
      city_ids?: string[];
      status?: "active" | "inactive";
    };

    const supabase = createSupabaseServerClient();

    const updatePayload: Record<string, unknown> = {};
    if (role) updatePayload.role = role;
    if (Array.isArray(city_ids)) updatePayload.city_ids = city_ids;
    if (status) updatePayload.status = status;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await supabase
      .from("admin_users")
      .update(updatePayload)
      .eq("user_id", params.id);

    if (error) {
      console.error("Failed to update admin user:", error);
      return NextResponse.json(
        { error: "Failed to update admin user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const admin = await getAdminContext();
    if (!canManageUsers(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();

    const { error: adminError } = await supabase
      .from("admin_users")
      .delete()
      .eq("user_id", params.id);

    if (adminError) {
      console.error("Failed to delete admin_users row:", adminError);
      return NextResponse.json(
        { error: "Failed to delete admin user record" },
        { status: 500 }
      );
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(params.id);

    if (authError) {
      console.error("Failed to delete auth user:", authError);
      return NextResponse.json(
        { error: "Failed to delete auth user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/users/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
