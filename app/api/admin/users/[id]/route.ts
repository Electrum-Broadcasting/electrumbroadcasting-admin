// app/api/admin/users/[id]/route.ts

import { NextResponse } from "next/server";
import { apiRequirePlatformAdmin } from "@/lib/admin/guards";
import {
  deleteAdminUserForManagement,
  isAdminUserId,
  isAdminUserUpdate,
  updateAdminUserForManagement,
} from "@/lib/admin/user-management";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const guard = await apiRequirePlatformAdmin();
  if (guard.response) return guard.response;
  if (!isAdminUserId(params.id)) {
    return NextResponse.json({ error: "Invalid Admin user ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    if (!isAdminUserUpdate(body)) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await updateAdminUserForManagement(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const guard = await apiRequirePlatformAdmin();
  if (guard.response) return guard.response;

  try {
    const result = await deleteAdminUserForManagement(params.id, guard.admin);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/users/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
