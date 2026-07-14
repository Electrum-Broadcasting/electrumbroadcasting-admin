import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieStore }
    );

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

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieStore }
    );

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
      })
      .eq("id", body.id);

    if (error) {
      console.error("Failed to update brand settings:", error);
      return NextResponse.json(
        { error: "Failed to update brand settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Brand settings PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update brand settings" },
      { status: 500 }
    );
  }
}
