"use client";

import { createBrowserClient } from "@supabase/ssr";

export async function saveStory({
  storyId,
  citySlug,
  router,

  // Basics
  title,
  slug,
  summary,
  body,
  category,
  tags,

  // Hero
  heroImageUrl,

  // 360°
  hero360Url,
  thumbnail360Url,
  neighborhood360Url,
  inline360Urls,

  // Metadata
  year,
  dateRange,
  neighborhood,

  // Sponsor
  sponsor360Url,
  sponsorFlatUrl,
  sponsorName,
  sponsorLink,
  sponsorAltText,

  // Publish
  isPublished,

  // Unified relationships
  existingRelationships,
}: {
  storyId: string;
  citySlug: string;
  router: any;
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  tags: string;
  heroImageUrl: string;
  hero360Url: string;
  thumbnail360Url: string;
  neighborhood360Url: string;
  inline360Urls: string[];
  year: number;
  dateRange: string;
  neighborhood: string;
  sponsor360Url: string;
  sponsorFlatUrl: string;
  sponsorName: string;
  sponsorLink: string;
  sponsorAltText: string;
  isPublished: boolean;
  existingRelationships: any;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Update story
  const { error } = await supabase
    .from("civic_stories")
    .update({
      title,
      slug,
      summary,
      body,
      category,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      year,
      date_range: dateRange,
      neighborhood,

      hero_image_url: heroImageUrl,
      hero_360_url: hero360Url,
      thumbnail_360_url: thumbnail360Url,
      neighborhood_360_url: neighborhood360Url,
      inline_360_urls: inline360Urls,

      sponsor_360_url: sponsor360Url,
      sponsor_flat_url: sponsorFlatUrl,
      sponsor_name: sponsorName,
      sponsor_link: sponsorLink,
      sponsor_alt_text: sponsorAltText,

      is_published: isPublished,
    })
    .eq("id", storyId);

  if (error) {
    console.error(error);
    alert("Failed to save story");
    return;
  }

  // Unified relationships
  // (RelationshipSelector already handles insert/delete)

  router.push(`/${citySlug}/stories`);
}
