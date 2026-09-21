import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getAdminContext } from "@/lib/admin/context";
import { logAdminAction } from "@/lib/admin/logging";

function getSupabaseClient() {
  return createSupabaseServerClient();
}

  
    console.log("COOKIES:", cookies().getAll());
    

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Diagnostics
    console.log("COOKIES:", cookies().getAll());
    const { data: authTest } = await supabase.auth.getUser();
    console.log("SERVER AUTH TEST:", authTest);

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
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();
    const admin = await getAdminContext();

    const { error } = await supabase
      .from("global_safety_settings")
      .update({
        max_quiz_attempts_per_day: body.max_quiz_attempts_per_day,
        max_points_per_day: body.max_points_per_day,
        fraud_thresholds_json: body.fraud_thresholds_json,
        content_warning_rules_json: body.content_warning_rules_json,
        child_safety_display_rules_json: body.child_safety_display_rules_json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id);

    if (error) {
      console.error("Failed to update safety settings:", error);
      return NextResponse.json(
        { error: "Failed to update safety settings" },
        { status: 500 }
      );
    }

    await logAdminAction(supabase, admin, {
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Safety settings PATCH error:", err);
    
    return NextResponse.json(
      { error: "Failed to update safety settings" },
      { status: 500 }
    );
  }
}
