"use client";

import { createBrowserClient } from "@supabase/ssr";
import { replaceUnifiedRelationships } from "@/lib/joinTables";

export async function saveEvent({
  eventId,
  citySlug,
  router,

  // Form fields
  name,
  slug,
  eventType,
  description,
  startDate,
  endDate,
  tags,
  thumbnail360Url,
  isPublished,

  // Eras
  eras,
  selectedEraIds,

  // Unified relationships
  existingRelationships,
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // -----------------------------
  // 1. Update event
  // -----------------------------
  const { error: eventError } = await supabase
    .from("civic_events")
    .update({
      name,
      slug,
      event_type: eventType,
      description,
      start_date: startDate || null,
      end_date: endDate || null,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      thumbnail_360_url: thumbnail360Url || null,
      is_published: isPublished,
    })
    .eq("id", eventId);

  if (eventError) {
    console.error(eventError);
    alert("Failed to save event");
    return;
  }

  // -----------------------------
  // 2. Auto-assign eras
  // -----------------------------
  function autoAssignEras(eras, startDate, endDate) {
    const matches = [];

    const startYear = startDate ? new Date(startDate).getFullYear() : null;
    const endYear = endDate ? new Date(endDate).getFullYear() : startYear;

    if (!startYear || !endYear) return matches;

    eras.forEach((era) => {
      const eraStart = era.start_year;
      const eraEnd = era.end_year ?? 9999;

      const overlaps = startYear <= eraEnd && endYear >= eraStart;
      if (overlaps) matches.push(era.id);
    });

    return matches;
  }

  const autoEraIds = autoAssignEras(eras, startDate, endDate);
  const finalEraIds = Array.from(new Set([...selectedEraIds, ...autoEraIds]));

  // -----------------------------
  // 3. Write eras (legacy join table)
  // -----------------------------
  await supabase.from("event_eras").delete().eq("event_id", eventId);

  if (finalEraIds.length > 0) {
    await supabase.from("event_eras").insert(
      finalEraIds.map((eraId) => ({
        event_id: eventId,
        era_id: eraId,
      }))
    );
  }

  // -----------------------------
  // 4. Unified relationships
  // -----------------------------
  await replaceUnifiedRelationships(
    supabase,
    "event",
    eventId,
    existingRelationships
  );

  // -----------------------------
  // 5. Redirect
  // -----------------------------
  router.push(`/${citySlug}/events`);
}
