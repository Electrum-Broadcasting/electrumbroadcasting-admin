"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  replaceJoinTable,
  replaceUnifiedRelationships,
} from "@/lib/joinTables";

function toTimestampZ(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}

export async function saveMoment({
  momentId,
  citySlug,
  router,

  // Basics
  title,
  slug,
  body,

  // Timeline
  momentTime,

  // Spatial
  selectedPlaces,
  selectedNeighborhoods,

  // Media
  thumbnail360Url,
  inline360Urls,

  // Publish
  isPublished,

  // Eras
  selectedEras,

  // Unified relationships
  existingRelationships,
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  //
  // 1. Update moment
  //
  const { error: updateError } = await supabase
    .from("civic_moments")
    .update({
      title,
      slug,
      body,
      moment_time: toTimestampZ(momentTime),
      thumbnail_360_url: thumbnail360Url,
      inline_360_urls: inline360Urls,
      is_published: isPublished,
    })
    .eq("id", momentId);

  if (updateError) {
    console.error("Moment update error:", updateError);
    alert("Failed to save moment");
    return;
  }

  //
  // 2. Replace join tables (eras, places, neighborhoods)
  //
  await replaceJoinTable(
    supabase,
    "moment_eras",
    momentId,
    "era_id",
    selectedEras
  );

  await replaceJoinTable(
    supabase,
    "moment_places",
    momentId,
    "place_id",
    selectedPlaces
  );

  await replaceJoinTable(
    supabase,
    "moment_neighborhoods",
    momentId,
    "neighborhood_id",
    selectedNeighborhoods
  );

  //
  // 3. Unified relationships
  //
  await replaceUnifiedRelationships(
    supabase,
    "moment",
    momentId,
    existingRelationships
  );

  //
  // 4. Redirect
  //
  router.push(`/${citySlug}/moments`);
}
