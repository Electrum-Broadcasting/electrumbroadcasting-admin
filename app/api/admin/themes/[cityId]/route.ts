import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminRole, requireCityAccess, AdminAccessError } from "@/lib/admin/guards";
import { logAdminAction } from "@/lib/admin/logAdminAction";

export async function GET(
  _req: Request,
  { params }: { params: { cityId: string } }
) {
  try {
    const context = await requireAdminRole("CITY_ADMIN");
    requireCityAccess(context, params.cityId);

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("city_design_system")
      .select("draft_theme, published_theme")
      .eq("city_id", params.cityId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load theme:", error);
      return NextResponse.json({ error: "Failed to load theme" }, { status: 500 });
    }

    return NextResponse.json(data ?? {});
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { cityId: string } }
) {
  try {
    const context = await requireAdminRole("CITY_ADMIN");
    requireCityAccess(context, params.cityId);

    const body = await req.json();
    const { draft_theme, published_theme } = body;

    const supabase = createSupabaseServerClient();
    const payload = {
      city_id: params.cityId,
      draft_theme: draft_theme ?? null,
      published_theme: published_theme ?? null,
    };

    const { data: existingRow } = await supabase
      .from("city_design_system")
      .select("id")
      .eq("city_id", params.cityId)
      .maybeSingle();

    const { error } = existingRow
      ? await supabase
          .from("city_design_system")
          .update(payload)
          .eq("city_id", params.cityId)
      : await supabase.from("city_design_system").insert(payload);

    if (error) {
      console.error("Failed to update theme:", error);
      return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
    }

    await logAdminAction(supabase, {
      actorUserId: context.user_id,
      actorRole: context.role,
      action: "update_city_design_system",
      domain: "city",
      entityType: "city_design_system",
      entityId: params.cityId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to update theme:", error);
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
  }
}

