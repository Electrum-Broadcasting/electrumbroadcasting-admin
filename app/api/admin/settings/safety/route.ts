import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseClient() {
  const cookieAdapter = {
    get: (name: string) => cookies().get(name)?.value,
    set: () => {},
    remove: () => {},
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: cookieAdapter }
  );
}

export async function GET() {
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
    console.error("Safety settings GET error:", err);
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Safety settings PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update safety settings" },
      { status: 500 }
    );
  }
}
