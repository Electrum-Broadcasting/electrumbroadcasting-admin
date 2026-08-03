"use client";

import { createBrowserClient } from "@supabase/ssr";
import { replaceUnifiedRelationships } from "@/lib/joinTables";

export async function saveArtifact({
  artifactId,
  citySlug,
  router,

  // Form fields
  title,
  slug,
  description,
  artifactType,
  thumbnailUrl,
  isPublished,

  // Unified relationships
  existingRelationships,
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Update artifact
  const { error } = await supabase
    .from("civic_artifacts")
    .update({
      title,
      slug,
      description,
      artifact_type: artifactType,
      thumbnail_url: thumbnailUrl,
      is_published: isPublished,
    })
    .eq("id", artifactId);

  if (error) {
    console.error(error);
    alert("Failed to save artifact");
    return;
  }

  // Unified relationships
  await replaceUnifiedRelationships(
    supabase,
    "artifact",
    artifactId,
    existingRelationships
  );

  router.push(`/${citySlug}/artifacts`);
}
