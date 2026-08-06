"use client";

import { createBrowserClient } from "@supabase/ssr";
import { replaceUnifiedRelationships } from "@/lib/joinTables";

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
  selectedRelationships,
}: {
  momentId: string | null;
  citySlug: string;
  router: any;
  title: string;
  slug: string;
  body: string;
  momentTime: string;
  selectedPlaces: (string | number)[];
  selectedNeighborhoods: (string | number)[];
  thumbnail360Url: string;
  inline360Urls: string[];
  isPublished: boolean;
  selectedEras: (string | number)[];
  selectedRelationships: any;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  //
  // 1. If momentId is null → CREATE
  //
if (!momentId) {
  const { data: newMoment, error: createError } = await supabase
    .from("civic_moments")
    .insert({
      city_slug: citySlug,   // ⭐ REQUIRED
      title,
      slug,
      body,
      moment_time: toTimestampZ(momentTime),
      thumbnail_360_url: thumbnail360Url,
      inline_360_urls: inline360Urls,
      is_published: isPublished,
    })
    .select("*")
    .single();

    if (createError) {
      console.error("Moment creation error:", createError);
      alert("Failed to create moment");
      return;
    }

    momentId = newMoment.id;
  }

  //
  // 2. UPDATE existing moment
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
  // 3. Replace join tables (eras, places, neighborhoods)
  //
  // ERA JOIN
  await supabase
    .from("moment_eras")
    .delete()
    .eq("moment_id", momentId);

  if (selectedEras?.length) {
    await supabase.from("moment_eras").insert(
      selectedEras.map((eraId: string | number) => ({
        moment_id: momentId,
        era_id: eraId,
      }))
    );
  }

  // PLACE JOIN
  await supabase
    .from("moment_places")
    .delete()
    .eq("moment_id", momentId);

  if (selectedPlaces?.length) {
    await supabase.from("moment_places").insert(
      selectedPlaces.map((placeId: string | number) => ({
        moment_id: momentId,
        place_id: placeId,
      }))
    );
  }

  // NEIGHBORHOOD JOIN
  await supabase
    .from("moment_neighborhoods")
    .delete()
    .eq("moment_id", momentId);

  if (selectedNeighborhoods?.length) {
    await supabase.from("moment_neighborhoods").insert(
      selectedNeighborhoods.map((neighborhoodId: string | number) => ({
        moment_id: momentId,
        neighborhood_id: neighborhoodId,
      }))
    );
  }

  //
  // 4. Unified relationships
  //
  await replaceUnifiedRelationships(
    supabase,
    "moment",
    momentId,
    selectedRelationships
  );

  //
  // 5. Redirect
  //
  router.push(`/${citySlug}/moments`);
}
