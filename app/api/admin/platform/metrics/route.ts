// /app/api/admin/platform/metrics/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Helper to count rows in a table
    async function count(table: string) {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error(`Metrics API error counting ${table}:`, error);
        return 0;
      }

      return count ?? 0;
    }

    const [
      totalCities,
      totalStories,
      totalEntities,
      totalPlaces,
      totalMoments,
      totalUsers,
      totalAds,
      totalGameplay,
    ] = await Promise.all([
      count("cities"),
      count("civic_stories"),
      count("civic_entities"),
      count("civic_places"),
      count("civic_moments"),
      count("admin_users"),
      count("ad_placements"),
      count("game_players"),
    ]);

    return NextResponse.json({
      total_cities: totalCities,
      total_stories: totalStories,
      total_entities: totalEntities,
      total_places: totalPlaces,
      total_moments: totalMoments,
      total_users: totalUsers,
      total_ads: totalAds,
      total_gameplay_sessions: totalGameplay,
    });
  } catch (err) {
    console.error("Metrics API crashed:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
