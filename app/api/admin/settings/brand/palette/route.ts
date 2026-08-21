import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminRole, requireCityAccess, AdminAccessError } from "@/lib/admin/guards";
import { logAdminAction } from "@/lib/admin/logAdminAction";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get("cityId") ?? "";

    const context = await requireAdminRole("CITY_ADMIN");
    requireCityAccess(context, cityId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(req: Request) {
  try {
    const { cityId, accent_color, accent_color_secondary } = await req.json();

    const context = await requireAdminRole("CITY_ADMIN");
    requireCityAccess(context, cityId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    await logAdminAction(supabase, {
      actorUserId: context.user_id,
      actorRole: context.role,
      action: "update_city_design_system_palette",
      domain: "city",
      entityType: "city_design_system",
      entityId: cityId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("brand/palette PATCH error:", error);
    return NextResponse.json({ error: "Failed to update palette" }, { status: 500 });
  }
}
