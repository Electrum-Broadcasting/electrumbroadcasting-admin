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
      .from("global_brand_settings")
      .select("*")
      .single();

    if (error) {
      console.error("Failed to fetch brand settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch brand settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Brand settings GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch brand settings" },
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
      .from("global_brand_settings")
      .update({
        primary_color: body.primary_color,
        secondary_color: body.secondary_color,
        neutral_palette_json: body.neutral_palette_json,
        typography_json: body.typography_json,
        iconography_style: body.iconography_style,
        motion_settings_json: body.motion_settings_json,
        logo_asset_id: body.logo_asset_id,
        dark_mode_enabled: body.dark_mode_enabled,
        accessibility_defaults_json: body.accessibility_defaults_json,
        child_safety_display_rules_json: body.child_safety_display_rules_json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id);

    if (error) {
      console.error("Failed to update brand settings:", error);
      return NextResponse.json(
        { error: "Failed to update brand settings" },
        { status: 500 }
      );
    }

    await logAdminAction(supabase, admin, {
      action: "BRAND_UPDATE",
      domain: "settings",
      entity_type: "brand",
      entity_id: null,
      target_user_id: null,
      metadata: {
        updated_fields: {
          primary_color: body.primary_color,
          secondary_color: body.secondary_color,
          neutral_palette_json: body.neutral_palette_json,
          typography_json: body.typography_json,
          iconography_style: body.iconography_style,
          motion_settings_json: body.motion_settings_json,
          logo_asset_id: body.logo_asset_id,
          dark_mode_enabled: body.dark_mode_enabled,
          accessibility_defaults_json: body.accessibility_defaults_json,
          child_safety_display_rules_json: body.child_safety_display_rules_json,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Brand settings PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update brand settings" },
      { status: 500 }
    );
  }
}
