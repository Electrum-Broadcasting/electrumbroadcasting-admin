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
      .from("global_permissions")
      .select("*")
      .single();

    if (error) {
      console.error("Failed to fetch permissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch permissions" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Permissions GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
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
      .from("global_permissions")
      .update({
        editor_permissions_json: body.editor_permissions_json,
        contributor_permissions_json: body.contributor_permissions_json,
        city_admin_permissions_json: body.city_admin_permissions_json,
      })
      .eq("id", body.id);

    if (error) {
      console.error("Failed to update permissions:", error);
      return NextResponse.json(
        { error: "Failed to update permissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Permissions PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}
