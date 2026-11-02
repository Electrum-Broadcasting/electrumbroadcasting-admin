"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useToastContext } from "@/components/ui/ToastProvider";
import { Database } from "@/lib/database.types";

export type StoryRow = Database["public"]["Tables"]["civic_stories"]["Row"];

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
