import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cityId, ...fields } = body;

    if (!cityId) {
      return NextResponse.json({ error: "cityId is required" }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
    );

    const { error } = await supabase
      .from("city_brand_settings")
      .upsert({
        city_id: cityId,
        ...fields,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("city-brand-settings update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("city-brand-settings POST error:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
