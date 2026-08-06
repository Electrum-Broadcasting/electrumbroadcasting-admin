// app/[citySlug]/artifacts/[artifactSlug]/saveArtifact.ts
"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function saveArtifact({
  citySlug,
  artifactSlug,
  title,
  description,
  artifactType,
  year,
  tags,
  heroImageUrl,
  mediaUrls,
  thumbnailUrl,
  isPublished,
}: {
  citySlug: string;
  artifactSlug: string;
  title: string;
  description: string;
  artifactType: string;
  year: number | null;
  tags: string[];
  heroImageUrl: string | null;
  mediaUrls: string[];
  thumbnailUrl: string | null;
  isPublished: boolean;
}) {
  const supabase = createServerComponentClient({ cookies });

  const { data, error } = await supabase
    .from("civic_artifacts")
    .upsert(
      {
        city_slug: citySlug,
        slug: artifactSlug,
        title,
        description,
        artifact_type: artifactType,
        year,
        tags,
        hero_image_url: heroImageUrl,
        media_urls: mediaUrls,
        // thumbnail_url if you have it
        is_published: isPublished,
      },
      {
        onConflict: "city_slug,slug",
      }
    )
    .select("*")
    .single();

  console.log("saveArtifact error:", error);
  return { data, error };
}
