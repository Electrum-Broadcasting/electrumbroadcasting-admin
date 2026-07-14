import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieStore }
    );

    const { data, error } = await supabase
      .from("global_feature_toggles")
      .select("*");

    if (error) {
      console.error("Failed to fetch feature toggles:", error);
      return NextResponse.json(
        { error: "Failed to fetch feature toggles" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Feature toggles GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch feature toggles" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieStore }
    );

    const { error } = await supabase
      .from("global_feature_toggles")
      .update({
        enabled: body.enabled,
      })
      .eq("feature_name", body.feature_name);

    if (error) {
      console.error("Failed to update feature toggle:", error);
      return NextResponse.json(
        { error: "Failed to update feature toggle" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feature toggles PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update feature toggle" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieStore }
    );

    const { error } = await supabase
      .from("global_feature_toggles")
      .insert({
        feature_name: body.feature_name,
        enabled: body.enabled ?? false,
      });

    if (error) {
      console.error("Failed to create feature toggle:", error);
      return NextResponse.json(
        { error: "Failed to create feature toggle" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feature toggles POST error:", err);
    return NextResponse.json(
      { error: "Failed to create feature toggle" },
      { status: 500 }
    );
  }
}
