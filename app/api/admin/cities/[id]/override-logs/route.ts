import { NextResponse } from "next/server";
import { resolveSafetyCity } from "@/lib/admin/safetyCity";
import { safetyServiceClient } from "@/lib/admin/storyModeration";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const context = await resolveSafetyCity(params.id);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  const { data, error } = await safetyServiceClient().from("admin_override_logs")
    .select("id, created_at, action, target_type, target_id")
    .eq("city_id", context.city.id).order("created_at", { ascending: false }).limit(50);
  if (error) {
    console.error("Failed to load city override logs:", error);
    return NextResponse.json({ error: "Failed to load override logs" }, { status: 500 });
  }
  return NextResponse.json(data.map((log) => ({ ...log, admin_name: null })));
}
