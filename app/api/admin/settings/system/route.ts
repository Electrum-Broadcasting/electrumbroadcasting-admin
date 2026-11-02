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
      .from("global_settings")
      .select("*")
      .single();

    if (error) {
      console.error("Failed to fetch system settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch system settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("System settings GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch system settings" },
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
      typeof body.default_timezone !== "string" ||
      typeof body.default_language !== "string" ||
      typeof body.maintenance_mode !== "boolean" ||
      typeof body.support_email !== "string" ||
      !isJsonObject(body.legal_footer_json) ||
      !["private", "soft_launch", "public"].includes(String(body.public_launch_mode))
    ) {
      return NextResponse.json({ error: "Invalid system settings payload" }, { status: 400 });
    }
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("global_settings")
      .update({
        default_timezone: body.default_timezone,
        default_language: body.default_language,
        maintenance_mode: body.maintenance_mode,
        support_email: body.support_email,
        legal_footer_json: body.legal_footer_json,
        public_launch_mode: body.public_launch_mode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id);

    if (error) {
      console.error("Failed to update system settings:", error);
      return NextResponse.json(
        { error: "Failed to update system settings" },
        { status: 500 }
      );
    }

    const { error: auditError } = await logAdminAction(supabase, admin, {
      action: "SYSTEM_UPDATE",
      domain: "settings",
      entity_type: "system",
      entity_id: null,
      target_user_id: null,
      metadata: {
        updated_fields: {
          default_timezone: body.default_timezone,
          default_language: body.default_language,
          maintenance_mode: body.maintenance_mode,
          support_email: body.support_email,
          legal_footer_json: body.legal_footer_json,
          public_launch_mode: body.public_launch_mode,
        },
      },
    });
    if (auditError) {
      console.error("System settings saved but audit logging failed:", auditError);
      return NextResponse.json(
        { error: "Settings were saved, but the audit log could not be written" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("System settings PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update system settings" },
      { status: 500 }
    );
  }
}
