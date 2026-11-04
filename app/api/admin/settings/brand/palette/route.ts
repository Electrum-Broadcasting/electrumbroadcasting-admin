import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiRequireCityAccess, isValidCityId } from "@/lib/admin/guards";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId");
  if (!isValidCityId(cityId)) {
    return NextResponse.json({ error: "Invalid cityId" }, { status: 400 });
  }
  const guard = await apiRequireCityAccess(cityId);
  if (guard.response) return guard.response;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("city_brand_settings")
    .select("accent_color, accent_color_secondary")
    .eq("city_id", cityId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || {});
}

export async function PATCH(req: Request) {
  const { cityId, accent_color, accent_color_secondary } = await req.json();
  if (!isValidCityId(cityId)) {
    return NextResponse.json({ error: "Invalid cityId" }, { status: 400 });
  }
  const guard = await apiRequireCityAccess(cityId);
  if (guard.response) return guard.response;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("city_brand_settings")
    .update({ accent_color, accent_color_secondary })
    .eq("city_id", cityId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
