import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { logAdminAction } from "@/lib/admin/logging";

function getSupabaseClient() {
  return createSupabaseServerClient();
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function canManageSettings(role: string) {
  return role === "CEO" || role === "PLATFORM_ADMIN";
}

export async function GET() {
  const admin = await getAdminContext();
  if (!canManageSettings(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("global_permissions")
      .select("*")
      .single();

    if (error) {
      console.error("Failed to fetch permissions settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch permissions settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Permissions settings GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch permissions settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminContext();
  if (!canManageSettings(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (
      !isJsonObject(body) ||
      typeof body.id !== "string" ||
      !isJsonObject(body.editor_permissions_json) ||
      !isJsonObject(body.contributor_permissions_json) ||
      !isJsonObject(body.city_admin_permissions_json)
    ) {
      return NextResponse.json({ error: "Invalid permissions payload" }, { status: 400 });
    }
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("global_permissions")
      .update({
        editor_permissions_json: body.editor_permissions_json,
        contributor_permissions_json: body.contributor_permissions_json,
        city_admin_permissions_json: body.city_admin_permissions_json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id);

    if (error) {
      console.error("Failed to update permissions settings:", error);
      return NextResponse.json(
        { error: "Failed to update permissions settings" },
        { status: 500 }
      );
    }

    const { error: auditError } = await logAdminAction(supabase, admin, {
      action: "PERMISSIONS_UPDATE",
      domain: "settings",
      entity_type: "permissions",
      entity_id: null,
      target_user_id: null,
      metadata: {
        updated_fields: {
          editor_permissions_json: body.editor_permissions_json,
          contributor_permissions_json: body.contributor_permissions_json,
          city_admin_permissions_json: body.city_admin_permissions_json,
        },
      },
    });
    if (auditError) {
      console.error("Permissions saved but audit logging failed:", auditError);
      return NextResponse.json(
        { error: "Permissions were saved, but the audit log could not be written" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Permissions settings PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update permissions settings" },
      { status: 500 }
    );
  }
}
