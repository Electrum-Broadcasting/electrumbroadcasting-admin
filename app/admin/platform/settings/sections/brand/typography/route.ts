import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminContext } from "@/lib/admin/context";
import { logAdminAction } from "@/lib/admin/logging";

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId");

  const { data, error } = await supabase
    .from("city_brand_settings")
    .select("typography")
    .eq("city_id", cityId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data.typography || {});
}

export async function PATCH(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { cityId, typography } = await req.json();

  const { error } = await supabase
    .from("city_brand_settings")
    .update({ typography })
    .eq("city_id", cityId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction(supabase, await getAdminContext(), {
    action: "BRAND_SETTINGS_UPDATE",
    domain: "settings",
    entity_type: "brand",
    entity_id: null,
    target_user_id: null,
    metadata: { updated_fields: { cityId, typography } },
  });

  return NextResponse.json({ success: true });
}
