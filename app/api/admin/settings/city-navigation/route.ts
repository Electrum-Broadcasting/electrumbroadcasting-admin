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
    .from("city_navigation")
    .select("*")
    .eq("city_id", cityId)
    .order("type", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function PATCH(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { cityId, items } = await req.json();

  // Delete existing nav items
  await supabase.from("city_navigation").delete().eq("city_id", cityId);

  // Insert new nav items
  const { error } = await supabase.from("city_navigation").insert(
    items.map((item: any, index: number) => ({
      city_id: cityId,
      label: item.label,
      url: item.url,
      type: item.type,
      position: index,
      visible: item.visible ?? true,
    }))
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
