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

  const typography = data?.published_theme?.typography ?? {};
  return NextResponse.json({
    heading_font: typography.heading ?? "Inter",
    body_font: typography.body ?? "Inter",
    scale_ratio: 1.25,
  });
}

export async function PATCH(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { cityId, typography } = await req.json();

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
    typography: {
      ...(existingRow?.published_theme?.typography ?? {}),
      heading: typography?.heading_font ?? typography?.heading ?? existingRow?.published_theme?.typography?.heading,
      body: typography?.body_font ?? typography?.body ?? existingRow?.published_theme?.typography?.body,
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
