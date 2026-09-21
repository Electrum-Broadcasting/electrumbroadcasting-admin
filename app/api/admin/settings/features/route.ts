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
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();
    const admin = await getAdminContext();

    const { error } = await supabase
      .from("global_feature_toggles")
      .update({
        enabled: body.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("feature_name", body.feature_name);

    if (error) {
      console.error("Failed to update feature toggle:", error);
      return NextResponse.json(
        { error: "Failed to update feature toggle" },
        { status: 500 }
      );
    }

    await logAdminAction(supabase, admin, {
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
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();
    const admin = await getAdminContext();

    const { error } = await supabase
      .from("global_feature_toggles")
      .insert({
        feature_name: body.feature_name,
        enabled: body.enabled ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Failed to create feature toggle:", error);
      return NextResponse.json(
        { error: "Failed to create feature toggle" },
        { status: 500 }
      );
    }

    await logAdminAction(supabase, admin, {
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feature toggles POST error:", err);
    return NextResponse.json(
      { error: "Failed to create feature toggle" },
      { status: 500 }
    );
  }
}
