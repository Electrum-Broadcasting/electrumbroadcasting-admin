import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { FlagThresholds } from "@/lib/safety/types";

export async function POST(req: Request) {
  try {
    const admin = await getAdminContext();

    // CEO-only access
    if (!admin || admin.role !== "CEO") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = (await req.json()) as {
      flag_thresholds?: Partial<FlagThresholds>;
    };

    if (!body.flag_thresholds) {
      return new NextResponse("Missing flag_thresholds", { status: 400 });
    }

    const parse = (value: unknown, fallback: number): number => {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };

    const thresholds: FlagThresholds = {
      auto_hide: parse(body.flag_thresholds.auto_hide, 3),
      escalate_city_admin: parse(
        body.flag_thresholds.escalate_city_admin,
        4
      ),
      auto_freeze: parse(body.flag_thresholds.auto_freeze, 5),
      fraud_review: parse(body.flag_thresholds.fraud_review, 6),
      escalate_ceo: parse(body.flag_thresholds.escalate_ceo, 7),
      safety_review: parse(body.flag_thresholds.safety_review, 8),
    };

    const supabase = createSupabaseServiceClient();

    // Update JSONB in platform_settings
    const { data, error } = await supabase
      .from("platform_settings")
      .update({
        safety_settings: {
          flag_thresholds: thresholds,
        },
      })
      .eq("id", "global") // your platform_settings row id
      .select()
      .single();

    if (error) {
      console.error("Safety update DB error:", error);
      return new NextResponse("Database error", { status: 500 });
    }

    return NextResponse.json({
      success: true,
      flag_thresholds: thresholds,
    });
  } catch (err) {
    console.error("Safety update error", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
