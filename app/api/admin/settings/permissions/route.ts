import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseClient() {
  const cookieAdapter = {
    get: (name: string) => cookies().get(name)?.value,
    set: () => {},
    remove: () => {},
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: cookieAdapter }
  );
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("global_permissions")
      .select("*")
      .single();

    if (error) {
      console.error("Failed to fetch permissions settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch permissions settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Permissions settings GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch permissions settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("global_permissions")
      .update({
        editor_permissions_json: body.editor_permissions_json,
        contributor_permissions_json: body.contributor_permissions_json,
        city_admin_permissions_json: body.city_admin_permissions_json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id);

    if (error) {
      console.error("Failed to update permissions settings:", error);
      return NextResponse.json(
        { error: "Failed to update permissions settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Permissions settings PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update permissions settings" },
      { status: 500 }
    );
  }
}
