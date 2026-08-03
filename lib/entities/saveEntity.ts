"use client";

import { createBrowserClient } from "@supabase/ssr";

export async function saveEntity({
  entityId,
  citySlug,
  router,

  // Form fields
  name,
  slug,
  entityType,
  description,
  thumbnailUrl,
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
  thumbnailUrl: string;
  isPublished: boolean;
  existingRelationships: any;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Update entity
  const { error } = await supabase
    .from("civic_entities")
    .update({
      name,
      slug,
      entity_type: entityType,
      description,
      thumbnail_url: thumbnailUrl,
      is_published: isPublished,
    })
    .eq("id", entityId);

  if (error) {
    console.error(error);
    alert("Failed to save entity");
    return;
  }

  // Unified relationships handled by RelationshipSelector

  router.push(`/${citySlug}/entities`);
}
