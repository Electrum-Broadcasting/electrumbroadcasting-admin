"use client";

import { createBrowserClient } from "@supabase/ssr";
import { replaceUnifiedRelationships } from "@/lib/joinTables";

export async function saveEntity({
  entityId,
  citySlug,
  router,

  // Form fields
  name,
  slug,
  entityType,
  description,
  summary,
  birthYear,
  deathYear,
  heroImageUrl,
  hero360Url,
  thumbnailUrl,
  mediaUrls,
  isPublished,

  // Unified relationships
  existingRelationships,
}: {
  entityId: string;
  citySlug: string;
  router: any;
  name: string;
  slug: string;
  entityType: string;
  description: string;
  summary: string;
  birthYear?: number | null;
  deathYear?: number | null;
  heroImageUrl: string;
  hero360Url: string;
  thumbnailUrl: string;
  mediaUrls: string[];
  isPublished: boolean;
  existingRelationships: any[];
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Update entity fields
  const { error } = await supabase
    .from("civic_entities")
    .update({
      name,
      slug,
      entity_type: entityType,
      description,
      summary,
      birth_year: birthYear || null,
      death_year: deathYear || null,
      hero_image_url: heroImageUrl,
      hero_360_url: hero360Url,
      thumbnail_url: thumbnailUrl,
      media_urls: mediaUrls,
      is_published: isPublished,
    })
    .eq("id", entityId);

  if (error) {
    console.log("SAVE ENTITY ERROR:", JSON.stringify(error, null, 2));
    alert("Failed to save entity");
    return;
  }

  // 2. Write unified relationships
  await replaceUnifiedRelationships(
    supabase,
    "entity",
    entityId,
    existingRelationships
  );

  // 3. Redirect to entity list
  router.push(`/${citySlug}/entities`);
}
