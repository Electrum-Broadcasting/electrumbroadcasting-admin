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
      .from("city_brand_settings")
      .select("logo")
      .eq("city_id", cityId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data.logo || {});
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(req: Request) {
  try {
    const { cityId, logo } = await req.json();

    const context = await requireAdminRole("CITY_ADMIN");
    requireCityAccess(context, cityId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("city_brand_settings")
      .update({ logo })
      .eq("city_id", cityId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(supabase, {
      actorUserId: context.user_id,
      actorRole: context.role,
      action: "update_city_brand_logo",
      domain: "city",
      entityType: "city_brand_settings",
      entityId: cityId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("brand/logo PATCH error:", error);
    return NextResponse.json({ error: "Failed to update logo" }, { status: 500 });
  }
}
