import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const { params } = context;
  const supabase = createSupabaseServerClient();

  // 1. Look up city by slug
  const { data: city, error: cityErr } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", params.id)
    .maybeSingle();

  if (cityErr || !city) {
    console.error(cityErr);
    return NextResponse.json([], { status: 200 });
  }

  // 2. Load stories via RPC
  const { data, error } = await supabase
    .rpc("admin_get_stories", { city_uuid: city.id});

  if (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }
console.log("RPC RESULT:", data);

  // 3. Return real moderation fields
  const rows = data.map((s: any) => ({
    id: s.id,
    title: s.title,
    is_published: s.is_published,
    is_frozen: s.is_frozen,
  }));

  return NextResponse.json(rows);
}
