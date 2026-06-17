import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const { params } = context;
  const supabase = createServerClient();

  // 1. Look up city by slug
  const { data: city, error: cityErr } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", params.id)
    .single();

  if (cityErr || !city) {
    console.error(cityErr);
    return NextResponse.json([], { status: 404 });
  }

  // 2. Load contributors for this city
  const { data: contributors, error: cErr } = await supabase
    .from("contributors")
    .select("id, display_name")
    .eq("city_id", city.id);

  if (cErr) {
    console.error(cErr);
    return NextResponse.json([], { status: 500 });
  }

  // 3. Load fraud state
  const contributorIds = contributors.map((c) => c.id);

  const { data: fraudRows, error: fErr } = await supabase
    .from("fraud_contributor_state")
    .select("*")
    .in("contributor_id", contributorIds);

  if (fErr) {
    console.error(fErr);
    return NextResponse.json([], { status: 500 });
  }

  // 4. Merge
  const rows = contributors.map((c) => {
    const fraud = fraudRows.find((f) => f.contributor_id === c.id);
    return {
      id: c.id,
      display_name: c.display_name,
      fraud_score: fraud?.fraud_score ?? null,
      fraud_level: fraud?.fraud_level ?? null,
      locked: fraud?.locked ?? false,
    };
  });

  return NextResponse.json(rows);
}
