import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServiceClient();
  const cityId = params.id;

  // 1. Fetch contributors
  const { data: contributors, error } = await supabase
    .from("contributors")
    .select("id, name, email, status, fraud_score, fraud_level")
    .eq("city_id", cityId);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load contributors" }, { status: 500 });
  }

  // 2. Example transformations that caused implicit-any errors
  const contributorMap = new Map(
    contributors.map((c: any) => [c.id, c]) // FIXED: typed c
  );

  const flagged = contributors.filter((f: any) => f.fraud_score > 0); // FIXED: typed f

  return NextResponse.json({
    contributors,
    flaggedCount: flagged.length,
    contributorMapSize: contributorMap.size,
  });
}
