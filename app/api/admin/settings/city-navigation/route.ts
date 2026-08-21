import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireAdminRole, requireCityAccess, AdminAccessError } from "@/lib/admin/guards";
import { logAdminAction } from "@/lib/admin/logAdminAction";

function getSupabaseClient() {
  const cookieAdapter = {
    get: (name: string) => cookies().get(name)?.value,
    set: (name: string, value: string, options: any) =>
      cookies().set(name, value, options),
    remove: (name: string, options: any) =>
      cookies().set(name, "", { ...options, maxAge: 0 }),
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: cookieAdapter }
  );
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get("cityId");

    const { data, error } = await supabase
      .from("city_navigation")
      .select("*")
      .eq("city_id", cityId)
      .order("type", { ascending: true })
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to fetch city navigation:", error);
      return NextResponse.json(
        { error: "Failed to fetch city navigation" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("City navigation GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch city navigation" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { cityId, items } = await req.json();

    const context = await requireAdminRole("CITY_ADMIN");
    requireCityAccess(context, cityId);

    const supabase = getSupabaseClient();

    await supabase.from("city_navigation").delete().eq("city_id", cityId);

    const { error } = await supabase.from("city_navigation").insert(
      items.map((item: any, index: number) => ({
        city_id: cityId,
        label: item.label,
        url: item.url,
        type: item.type,
        position: index,
        visible: item.visible ?? true,
      }))
    );

    if (error) {
      console.error("Failed to update city navigation:", error);
      return NextResponse.json(
        { error: "Failed to update city navigation" },
        { status: 500 }
      );
    }

    await logAdminAction(supabase, {
      actorUserId: context.user_id,
      actorRole: context.role,
      action: "update_city_navigation",
      domain: "city",
      entityType: "city_navigation",
      entityId: cityId,
      metadata: { itemCount: items.length },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AdminAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("City navigation PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update city navigation" },
      { status: 500 }
    );
  }
}
