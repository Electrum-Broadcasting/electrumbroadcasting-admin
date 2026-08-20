import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    const supabase = getSupabaseClient();
    const { cityId, items } = await req.json();

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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("City navigation PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update city navigation" },
      { status: 500 }
    );
  }
}
