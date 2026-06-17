"use client";

import { createBrowserClient } from "@/lib/supabase/client";

// -----------------------------
// Types
// -----------------------------
export type ContributorRow = {
  contributor_id: string;
  fraud_score: number | null;
  fraud_level: string | null;
  locked: boolean;
  contributors: {
    id: string;
    display_name: string | null;
  } | null;
};

export type StoryRow = {
  id: string;
  title: string | null;
  body: string | null;
  summary: string | null;
  author_name: string | null;
  contributor_id: string | null;
  primary_city_id: string | null;
  slug: string | null;
  category: string | null;
  city: string | null;
  year: number | null;
  tags: string[] | null;
  image_description: string | null;
  related_place_ids: string[] | null;
  related_entity_ids: string[] | null;
  related_moment_ids: string[] | null;
  date_range: string | null;
  neighborhood: string | null;
  cross_city_links: string[] | null;
  entities: string[] | null;
  is_published: boolean;
  is_frozen: boolean;
  created_at: string;
  updated_at: string;
};

export type OverrideLogRow = {
  id: string;
  created_at: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  metadata: any;
  city_id: string | null;
};

// -----------------------------
// Supabase client
// -----------------------------


// -----------------------------
// Loaders
// -----------------------------


export async function loadStories(cityId: string) {
  const supabase = createBrowserClient();
  return supabase
      .from("civic_stories")
    .select("*")
    .eq("primary_city_id", cityId);
}

export async function loadLogs(cityId: string) {
  const supabase = createBrowserClient();
  return supabase
    .from("admin_override_logs")
    .select("*")
    .eq("city_id", cityId)
    .order("created_at", { ascending: false })
    .limit(50);
}


// -----------------------------
// Story Actions (unused now — RPCs replaced these)
// -----------------------------
export async function hideStory(storyId: string, cityId: string) {
  const supabase = createBrowserClient();
  return supabase.rpc("admin_hide_story", {
    story_id: storyId,
    city_id: cityId,
  });
}

export async function republishStory(storyId: string, cityId: string) {
  const supabase = createBrowserClient();
  return supabase.rpc("admin_republish_story", {
    story_id: storyId,
    city_id: cityId,
  });
}

export async function freezeStory(storyId: string, cityId: string) {
  const supabase = createBrowserClient();
  return supabase.rpc("admin_freeze_story", {
    story_id: storyId,
    city_id: cityId,
  });
}

export async function unfreezeStory(storyId: string, cityId: string) {
  const supabase = createBrowserClient();
  return supabase.rpc("admin_unfreeze_story", {
    story_id: storyId,
    city_id: cityId,
  });
}
