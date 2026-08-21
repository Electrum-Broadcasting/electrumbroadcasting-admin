import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminRole, requireCityAccess, AdminAccessError } from "@/lib/admin/guards";
import { auditedUpsert } from "@/lib/admin/mutations";
import { sanitizeBrandFields } from "@/lib/admin/brandFields";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cityId, ...fields } = body;

    if (!cityId) {
      return NextResponse.json({ error: "cityId is required" }, { status: 400 });
    }

    const context = await requireAdminRole("CITY_ADMIN");
    requireCityAccess(context, cityId);

    const supabase = createSupabaseServerClient();

    await auditedUpsert(
      {
        context,
        table: "city_brand_settings",
        action: "update_city_brand_settings",
        domain: "city",
        entityId: cityId,
        supabase,
      },
      {
        city_id: cityId,
        ...sanitizeBrandFields(fields),
        updated_at: new Date().toISOString(),
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AdminAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("city-brand-settings POST error:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
