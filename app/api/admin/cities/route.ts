import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const supabase = createSupabaseServiceClient();

  const { data: cities, error } = await supabase
    .from("cities")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load cities:", error);
    return NextResponse.json({ cities: [] });
  }

  return NextResponse.json({ cities });
}

export async function POST(req: Request) {
  const supabase = createSupabaseServiceClient();
  const body = await req.json();

  const { name, slug, domain, status } = body;

  const { error } = await supabase.from("cities").insert({
    name,
    slug,
    domain,
    status,
  });

  if (error) {
    console.error("Failed to create city:", error);
    return NextResponse.json({ error: "Failed to create city" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
