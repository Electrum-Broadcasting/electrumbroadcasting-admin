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
      .from("global_safety_settings")
      .select("*")
      .single();

    if (error) {
      console.error("Failed to fetch safety settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch safety settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("SAFETY API ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch safety settings" },
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
    if (!isJsonObject(body)) {
      return NextResponse.json({ error: "Invalid safety settings payload" }, { status: 400 });
    }
    if (
      typeof body.id !== "string" ||
      !Number.isInteger(body.max_quiz_attempts_per_day) ||
      Number(body.max_quiz_attempts_per_day) < 0 ||
      !Number.isInteger(body.max_points_per_day) ||
      Number(body.max_points_per_day) < 0 ||
      !isJsonObject(body.fraud_thresholds_json) ||
      !isJsonObject(body.content_warning_rules_json) ||
      !isJsonObject(body.child_safety_display_rules_json)
    ) {
      return NextResponse.json({ error: "Invalid safety settings fields" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("global_safety_settings")
      .update({
        max_quiz_attempts_per_day: body.max_quiz_attempts_per_day,
        max_points_per_day: body.max_points_per_day,
        fraud_thresholds_json: body.fraud_thresholds_json,
        content_warning_rules_json: body.content_warning_rules_json,
        child_safety_display_rules_json: body.child_safety_display_rules_json,
        updated_at: new Date().toISOString(),
        updated_by: admin.user_id,
      })
      .eq("id", body.id);

    if (error) {
      console.error("Failed to update safety settings:", error);
      return NextResponse.json(
        { error: "Failed to update safety settings" },
        { status: 500 }
      );
    }

    const { error: auditError } = await logAdminAction(supabase, admin, {
      action: "SAFETY_UPDATE",
      domain: "settings",
      entity_type: "safety",
      entity_id: null,
      target_user_id: null,
      metadata: {
        updated_fields: {
          max_quiz_attempts_per_day: body.max_quiz_attempts_per_day,
          max_points_per_day: body.max_points_per_day,
          fraud_thresholds_json: body.fraud_thresholds_json,
          content_warning_rules_json: body.content_warning_rules_json,
          child_safety_display_rules_json: body.child_safety_display_rules_json,
        },
      },
    });
    if (auditError) {
      console.error("Safety settings saved but audit logging failed:", auditError);
      return NextResponse.json(
        { error: "Settings were saved, but the audit log could not be written" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Safety settings PATCH error:", err);
    
    return NextResponse.json(
      { error: "Failed to update safety settings" },
      { status: 500 }
    );
  }
}
