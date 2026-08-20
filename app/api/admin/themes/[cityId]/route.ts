import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

export async function GET(
  _req: Request,
  { params }: { params: { cityId: string } }
) {
  const admin = await getAdminContext();
  const cityId = params.cityId;

  const isCEO = admin.role === "CEO";
  const isPlatformAdmin = admin.role === "PLATFORM_ADMIN";
  const isCityAdmin = admin.role === "CITY_ADMIN" && admin.cityIds.includes(cityId);

  if (!isCEO && !isPlatformAdmin && !isCityAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("city_design_system")
    .select("draft_theme, published_theme")
    .eq("city_id", cityId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load theme:", error);
    return NextResponse.json({ error: "Failed to load theme" }, { status: 500 });
  }

  return NextResponse.json(data ?? {});
}

export async function PATCH(
  req: Request,
  { params }: { params: { cityId: string } }
) {
  const admin = await getAdminContext();
  const cityId = params.cityId;

  const isCEO = admin.role === "CEO";
  const isPlatformAdmin = admin.role === "PLATFORM_ADMIN";
  const isCityAdmin = admin.role === "CITY_ADMIN" && admin.cityIds.includes(cityId);

  if (!isCEO && !isPlatformAdmin && !isCityAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { draft_theme, published_theme } = body;

  const supabase = createSupabaseServerClient();
  const payload = {
    city_id: cityId,
    draft_theme: draft_theme ?? null,
    published_theme: published_theme ?? null,
  };

  const { data: existingRow } = await supabase
    .from("city_design_system")
    .select("id")
    .eq("city_id", cityId)
    .maybeSingle();

  const { error } = existingRow
    ? await supabase
        .from("city_design_system")
        .update(payload)
        .eq("city_id", cityId)
    : await supabase.from("city_design_system").insert(payload);

  if (error) {
    console.error("Failed to update theme:", error);
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

