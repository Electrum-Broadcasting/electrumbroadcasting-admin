import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { logAdminAction } from "@/lib/admin/logging";

function getSupabaseClient() {
  return createSupabaseServerClient();
}

export async function GET() {
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
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();
    const admin = await getAdminContext();

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

    await logAdminAction(supabase, admin, {
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("System settings PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update system settings" },
      { status: 500 }
    );
  }
}
