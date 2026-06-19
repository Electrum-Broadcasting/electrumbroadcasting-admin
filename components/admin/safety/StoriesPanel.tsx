"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

import { StoriesPanel as UnifiedStoriesPanel } from "@/components/admin/city/StoriesPanel";
import type { StoryRow } from "@/lib/admin/types";

interface SafetyStoriesPanelProps {
  cityId: string;
}

export function SafetyStoriesPanel({ cityId }: SafetyStoriesPanelProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [stories, setStories] = useState<StoryRow[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");

  const loadStories = useCallback(async () => {
    const { data, error } = await supabase
      .from("civic_stories")
      .select(
        `
        id,
        title,
        contributor_display_name,
        is_published,
        is_frozen
      `
      )
      .eq("primary_city_id", cityId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped: StoryRow[] = data.map((s: any) => ({
        id: s.id,
        title: s.title,
        author_name: s.contributor_display_name ?? null,
        is_published: s.is_published ?? null,
        is_frozen: s.is_frozen ?? null,

        // Fields not selected in this query → set to null
        body: null,
        summary: null,
        published_at: null,
        primary_city_id: null,

        // Use real ISO timestamps so downstream components don’t break
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        slug: null,
        category: null,
        city: null,
        year: null,
        tags: null,
        image_description: null,
        related_place_ids: null,
        related_entity_ids: null,
        related_moment_ids: null,
        date_range: null,
        neighborhood: null,
        cross_city_links: null,
        entities: null,
        contributor_id: null,
      }));

      setStories(mapped);

      if (mapped.length > 0 && !selectedStoryId) {
        setSelectedStoryId(mapped[0].id);
      }
    }
  }, [cityId, selectedStoryId, supabase]);

  useEffect(() => {
    void loadStories();
  }, [loadStories]);

  // Action handlers (Safety Dashboard uses same actions as City Admin)
  const handleHide = async () => {
    if (!selectedStoryId) return;
    await supabase.rpc("admin_update_story_status", {
      story_id: selectedStoryId,
      action: "hide",
      metadata: {},
    });
    void loadStories();
  };

  const handleRepublish = async () => {
    if (!selectedStoryId) return;
    await supabase.rpc("admin_update_story_status", {
      story_id: selectedStoryId,
      action: "republish",
      metadata: {},
    });
    void loadStories();
  };

  const handleFreeze = async () => {
    if (!selectedStoryId) return;
    await supabase.rpc("admin_update_story_status", {
      story_id: selectedStoryId,
      action: "freeze",
      metadata: {},
    });
    void loadStories();
  };

  const handleUnfreeze = async () => {
    if (!selectedStoryId) return;
    await supabase.rpc("admin_update_story_status", {
      story_id: selectedStoryId,
      action: "unfreeze",
      metadata: {},
    });
    void loadStories();
  };

  return (
    <UnifiedStoriesPanel
      stories={stories}
      selectedStoryId={selectedStoryId}
      onSelectStory={setSelectedStoryId}
      onHide={handleHide}
      onRepublish={handleRepublish}
      onFreeze={handleFreeze}
      onUnfreeze={handleUnfreeze}
    />
  );
}
