"use client";

import { createBrowserClient } from "@supabase/ssr";

export async function saveNeighborhood({
  neighborhoodId,
  citySlug,
  router,

  name,
  slug,
  description,
  thumbnailUrl,
  isPublished,
}: {
  neighborhoodId: string;
  citySlug: string;
  router: any;
  name: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  isPublished: boolean;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase
    .from("civic_neighborhoods")
    .update({
      name,
      slug,
      description,
      thumbnail_url: thumbnailUrl,
      is_published: isPublished,
    })
    .eq("id", neighborhoodId);

  if (error) {
    console.error(error);
    alert("Failed to save neighborhood");
    return;
  }

  router.push(`/${citySlug}/neighborhoods`);
}
