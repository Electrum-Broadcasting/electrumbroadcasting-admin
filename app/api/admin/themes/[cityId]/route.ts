import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

export async function PATCH(
  req: Request,
  { params }: { params: { cityId: string } }
) {
  // 1. Authenticate admin
  const admin = await getAdminContext();

  // 2. Authorization rules
  const cityId = params.cityId;

  const isCEO = admin.role === "CEO";
  const isPlatformAdmin = admin.role === "PLATFORM_ADMIN";
  const isCityAdmin = admin.role === "CITY_ADMIN" && admin.cityIds.includes(cityId);

  if (!isCEO && !isPlatformAdmin && !isCityAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 3. Parse body
  const body = await req.json();
  const { draft_theme, published_theme } = body;

  const payload: Record<string, unknown> = {
    city_id: cityId,
  };

  if (draft_theme !== undefined) payload.draft_theme = draft_theme;
  if (published_theme !== undefined) payload.published_theme = published_theme;

  // 4. Write to DB
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("city_themes")
    .upsert(payload, { onConflict: "city_id" });

  if (error) {
    console.error("Failed to update theme:", error);
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
