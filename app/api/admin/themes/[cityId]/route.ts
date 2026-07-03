import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: { cityId: string } }
) {
  const supabase = createSupabaseServerClient();
  const body = await req.json();

  const { draft_theme, published_theme } = body;

  const payload: Record<string, unknown> = {
    city_id: params.cityId,
  };

  if (draft_theme !== undefined) {
    payload.draft_theme = draft_theme;
  }

  if (published_theme !== undefined) {
    payload.published_theme = published_theme;
  }

  const { error } = await supabase
    .from("city_themes")
    .upsert(payload, { onConflict: "city_id" });

  if (error) {
    console.error("Failed to update theme:", error);
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
