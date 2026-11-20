import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { resolveAdminContext } from "@/lib/admin/context";
import { isValidCityId } from "@/lib/admin/guards";
import { canAccessCity } from "@/lib/admin/permissions";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const context = await resolveAdminContext();
  if (!context.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = context.admin;
  if (!["CITY_ADMIN", "CEO", "PLATFORM_ADMIN"].includes(admin.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const cityId = new URL(request.url).searchParams.get("city_id");
  if (cityId) {
    if (!isValidCityId(cityId)) return NextResponse.json({ error: "Invalid city" }, { status: 400 });
    if (!canAccessCity(admin, cityId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const result = await service.rpc("osm_operations_for_city", {
      p_actor_admin_id: admin.id, p_actor_auth_uid: admin.auth_uid, p_city_id: cityId,
    });
    if (result.error) {
      console.error("Unable to load ingestion operations:", result.error);
      return NextResponse.json({ error: "Unable to load ingestion records" }, { status: 502 });
    }
    return NextResponse.json({ result: result.data });
  }
  if (admin.role === "CITY_ADMIN" && admin.city_ids.length === 0) return NextResponse.json({ cities: [] });
  let query = service.from("cities").select("id, name, slug").order("name");
  if (admin.role === "CITY_ADMIN") query = query.in("id", admin.city_ids);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Unable to load cities" }, { status: 502 });
  return NextResponse.json({ cities: data });
}