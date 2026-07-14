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

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieStore }
    );

    const { error } = await supabase
      .from("global_settings")
      .update({
        default_timezone: body.default_timezone,
        default_language: body.default_language,
        maintenance_mode: body.maintenance_mode,
        support_email: body.support_email,
        legal_footer_json: body.legal_footer_json,
      })
      .eq("id", body.id);

    if (error) {
      console.error("Failed to update system settings:", error);
      return NextResponse.json(
        { error: "Failed to update system settings" },
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
