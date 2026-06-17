// /app/api/platform/settings/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Table: platform_settings
// Columns:
//   id (uuid, primary key)
//   platform_name (text)
//   maintenance_mode (boolean)
//   updated_at (timestamp)

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Settings GET error:", error);
      return NextResponse.json(
        { error: "Failed to load settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      platform_name: data?.platform_name ?? "",
      maintenance_mode: data?.maintenance_mode ?? false,
    });
  } catch (err) {
    console.error("Settings GET crashed:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upsert settings (only one row should ever exist)
    const { error } = await supabase.from("platform_settings").upsert(
      {
        id: "singleton", // ensures only one row exists
        platform_name: body.platform_name ?? "",
        maintenance_mode: body.maintenance_mode ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Settings POST error:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Settings POST crashed:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
