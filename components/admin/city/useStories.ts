"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useToastContext } from "@/components/ui/ToastProvider";

export type StoryRow = {
  id: string;
  title: string | null;
  body: string | null;
  summary: string | null;
  author_name: string | null;
  contributor_id: string | null;
  city_id: string | null;
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

export function useStories(cityId: string) {
  const supabase = createBrowserClient();
  const { showToast } = useToastContext();

  const [stories, setStories] = useState<StoryRow[]>([]);

  useEffect(() => {
    if (!cityId) return;
    loadStories();
  }, [cityId]);

  const loadStories = useCallback(async () => {
    const { data, error } = await supabase
      .from("civic_stories_public")
      .select("*")
      .eq("city_id", cityId);

    if (error) {
      console.error("loadStories error:", error);
      showToast("Failed to load stories");
      return;
    }

    setStories(data || []);
  }, [supabase, cityId, showToast]);

  // -----------------------------
  // RPC ACTIONS
  // -----------------------------

  async function hideStory(id: string) {
    const { error } = await supabase.rpc("admin_hide_story", {
      story_id: id,
      city_id: cityId,
    });

    if (error) {
      console.error("hideStory RPC error:", error);
      showToast("Failed to hide story");
      return;
    }

    showToast("Story hidden");
    loadStories();
  }

  async function republishStory(id: string) {
    const { error } = await supabase.rpc("admin_republish_story", {
      story_id: id,
      city_id: cityId,
    });

    if (error) {
      console.error("republishStory RPC error:", error);
      showToast("Failed to republish story");
      return;
    }

    showToast("Story republished");
    loadStories();
  }

  async function freezeStory(id: string) {
    const { error } = await supabase.rpc("admin_freeze_story", {
      story_id: id,
      city_id: cityId,
    });

    if (error) {
      console.error("freezeStory RPC error:", error);
      showToast("Failed to freeze story");
      return;
    }

    showToast("Story frozen");
    loadStories();
  }

  async function unfreezeStory(id: string) {
    const { error } = await supabase.rpc("admin_unfreeze_story", {
      story_id: id,
      city_id: cityId,
    });

    if (error) {
      console.error("unfreezeStory RPC error:", error);
      showToast("Failed to unfreeze story");
      return;
    }

    showToast("Story unfrozen");
    loadStories();
  }

  return {
    stories,
    loadStories,
    hideStory,
    republishStory,
    freezeStory,
    unfreezeStory,
  };
}
