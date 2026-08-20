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
      .from("city_brand_settings")
      .select(
        "description, summary, population, editorial_tone, future_concepts, theme"
      )
      .eq("city_id", cityId)
      .single();

    if (error) {
      console.error("Failed to fetch city profile:", error);
      return NextResponse.json(
        { error: "Failed to fetch city profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || {});
  } catch (err) {
    console.error("City profile GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch city profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const {
      cityId,
      description,
      summary,
      population,
      editorial_tone,
      future_concepts,
      theme,
    } = await req.json();

    const { error } = await supabase
      .from("city_brand_settings")
      .update({
        description,
        summary,
        population,
        editorial_tone,
        future_concepts,
        theme,
      })
      .eq("city_id", cityId);

    if (error) {
      console.error("Failed to update city profile:", error);
      return NextResponse.json(
        { error: "Failed to update city profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("City profile PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update city profile" },
      { status: 500 }
    );
  }
}
