import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { logAdminAction } from "@/lib/admin/logging";

function getSupabaseClient() {
  return createSupabaseServerClient();
}

function canManageSettings(role: string) {
  return role === "CEO" || role === "PLATFORM_ADMIN";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function GET() {
  const admin = await getAdminContext();
  if (!canManageSettings(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("global_feature_toggles")
      .select("*")
      .order("feature_name");

    if (error) {
      console.error("Failed to fetch feature toggles:", error);
      return NextResponse.json(
        { error: "Failed to fetch feature toggles" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Feature toggles GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch feature toggles" },
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
      !isRecord(body) ||
      typeof body.feature_name !== "string" ||
      !body.feature_name.trim() ||
      typeof body.enabled !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid feature toggle payload" }, { status: 400 });
    }
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("global_feature_toggles")
      .update({
        enabled: body.enabled,
        updated_at: new Date().toISOString(),
        updated_by: admin.user_id,
      })
      .eq("feature_name", body.feature_name);

    if (error) {
      console.error("Failed to update feature toggle:", error);
      return NextResponse.json(
        { error: "Failed to update feature toggle" },
        { status: 500 }
      );
    }

    const { error: auditError } = await logAdminAction(supabase, admin, {
      action: "FEATURE_TOGGLE_UPDATE",
      domain: "settings",
      entity_type: "feature_toggle",
      entity_id: null,
      target_user_id: null,
      metadata: {
        updated_fields: {
          feature_name: body.feature_name,
          enabled: body.enabled,
        },
      },
    });
    if (auditError) {
      console.error("Feature toggle changed but audit logging failed:", auditError);
      return NextResponse.json(
        { error: "Feature toggle changed, but the audit log could not be written" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feature toggles PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update feature toggle" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminContext();
  if (!canManageSettings(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (
      !isRecord(body) ||
      typeof body.feature_name !== "string" ||
      !body.feature_name.trim() ||
      (body.enabled !== undefined && typeof body.enabled !== "boolean")
    ) {
      return NextResponse.json({ error: "Invalid feature toggle payload" }, { status: 400 });
    }
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("global_feature_toggles")
      .insert({
        feature_name: body.feature_name,
        enabled: body.enabled ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: admin.user_id,
      });

    if (error) {
      console.error("Failed to create feature toggle:", error);
      return NextResponse.json(
        { error: "Failed to create feature toggle" },
        { status: 500 }
      );
    }

    const { error: auditError } = await logAdminAction(supabase, admin, {
      action: "FEATURE_TOGGLE_CREATE",
      domain: "settings",
      entity_type: "feature_toggle",
      entity_id: null,
      target_user_id: null,
      metadata: {
        updated_fields: {
          feature_name: body.feature_name,
          enabled: body.enabled ?? false,
        },
      },
    });
    if (auditError) {
      console.error("Feature toggle created but audit logging failed:", auditError);
      return NextResponse.json(
        { error: "Feature toggle was created, but the audit log could not be written" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feature toggles POST error:", err);
    return NextResponse.json(
      { error: "Failed to create feature toggle" },
      { status: 500 }
    );
  }
}
