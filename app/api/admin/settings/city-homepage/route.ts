import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId");

  const { data, error } = await supabase
    .from("city_brand_settings")
    .select("theme, homepage_modules")
    .eq("city_id", cityId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || {});
}

export async function PATCH(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { cityId, theme, homepage_modules } = await req.json();

  const { error } = await supabase
    .from("city_brand_settings")
    .update({
      theme,
      homepage_modules,
      theme_updated_at: new Date().toISOString(),
    })
    .eq("city_id", cityId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
