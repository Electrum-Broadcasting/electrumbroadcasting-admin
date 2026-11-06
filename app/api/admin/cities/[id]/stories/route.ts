import { NextResponse } from "next/server";
import { resolveSafetyCity } from "@/lib/admin/safetyCity";
import { safetyServiceClient } from "@/lib/admin/storyModeration";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const context = await resolveSafetyCity(params.id);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  const { data, error } = await safetyServiceClient().from("civic_stories")
    .select("id, title, city_id, is_published, is_frozen, review_status, safety_hold, safety_hold_notes")
    .eq("city_id", context.city.id).order("title");
  if (error) {
    console.error("Failed to load city stories:", error);
    return NextResponse.json({ error: "Failed to load stories" }, { status: 500 });
  }
  return NextResponse.json(data);
}
