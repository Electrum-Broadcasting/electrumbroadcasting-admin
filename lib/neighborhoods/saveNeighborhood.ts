"use client";

import { createBrowserClient } from "@supabase/ssr";

export async function saveNeighborhood({
  neighborhoodId,
  citySlug,
  router,

  name,
  slug,
  description,
 
  isPublished,
}: {
  neighborhoodId: string;
  citySlug: string;
  router: any;
  name: string;
  slug: string;
  description: string;
 
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
