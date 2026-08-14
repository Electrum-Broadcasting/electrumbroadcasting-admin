"use client";

import { createBrowserClient } from "@/lib/supabase/client";

export async function saveEra({
  eraId,
  citySlug,
  router,

  name,
  slug,
  startYear,
  endYear,
  description,
  isPublished,
}: {
  eraId: string;
  citySlug: string;
  router: any;
  name: string;
  slug: string;
  startYear: number;
  endYear: number;
  description: string;
  isPublished: boolean;
}) {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("civic_eras")
    .update({
      name,
      slug,
      start_year: startYear,
      end_year: endYear,
      description,
      is_published: isPublished,
    })
    .eq("id", eraId);

  if (error) {
    console.error(error);
    alert("Failed to save era");
    return;
  }

  router.push(`/${citySlug}/eras`);
}
