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
    .from("city_design_system")
    .select("published_theme")
    .eq("city_id", cityId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const colors = data?.published_theme?.colors ?? {};
  return NextResponse.json({
    accent_color: colors.primary ?? "#0f172a",
    accent_color_secondary: colors.secondary ?? "#334155",
  });
}

export async function PATCH(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { cityId, accent_color, accent_color_secondary } = await req.json();

  const { data: existingRow } = await supabase
    .from("city_design_system")
    .select("id, published_theme")
    .eq("city_id", cityId)
    .maybeSingle();

  const nextTheme = {
    ...(existingRow?.published_theme ?? {
      colors: {},
      typography: {},
    }),
    colors: {
      ...(existingRow?.published_theme?.colors ?? {}),
      primary: accent_color ?? existingRow?.published_theme?.colors?.primary,
      secondary: accent_color_secondary ?? existingRow?.published_theme?.colors?.secondary,
    },
  };

  const { error } = existingRow
    ? await supabase
        .from("city_design_system")
        .update({ published_theme: nextTheme })
        .eq("city_id", cityId)
    : await supabase.from("city_design_system").insert({ city_id: cityId, published_theme: nextTheme });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
