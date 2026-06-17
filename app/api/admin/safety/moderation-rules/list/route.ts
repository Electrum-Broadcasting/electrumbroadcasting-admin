import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("moderation_rules")
    .select(`
      id,
      label,
      description,
      severity,
      applies_to,
      enabled,
      trigger_type,
      trigger_value
    `)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load moderation rules" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
