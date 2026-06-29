import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: { cityId: string } }
) {
  const supabase = createSupabaseServerClient();
  const body = await req.json();

  const { theme, status } = body;

  const { error } = await supabase
    .from("cities")
    .update({
      theme,
      theme_status: status,
      theme_updated_at: new Date().toISOString(),
    })
    .eq("id", params.cityId);

  if (error) {
    console.error("Failed to update theme:", error);
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
