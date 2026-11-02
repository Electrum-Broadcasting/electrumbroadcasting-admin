// components/admin/CEO/stories/StoriesPanel.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { StoryDrawer } from "@/components/admin/CEO/stories/StoryDrawer";
import { StoriesTable } from "@/components/admin/CEO/stories/StoriesTable";
import type { StoryActionName } from "@/components/admin/CEO/stories/actions";
import type { StoryRow } from "@/lib/admin/types";

interface CEOStoriesPanelProps {
  stories: StoryRow[];
}

function applyStoryAction(story: StoryRow, action: StoryActionName): StoryRow | null {
  if (action === "delete") return null;
  if (action === "republish") return { ...story, is_published: true };
  if (action === "hide") return { ...story, is_published: false };
  if (action === "freeze") return { ...story, is_frozen: true };
  return { ...story, is_frozen: false };
}

export function CEOStoriesPanel({ stories = [] }: CEOStoriesPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [storyRows, setStoryRows] = useState(stories);
  const [selectedStory, setSelectedStory] = useState<StoryRow | null>(
    stories[0] ?? null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setStoryRows(stories);
  }, [stories]);

  const filteredStories = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return storyRows;

    return storyRows.filter((story) => {
      const title = (story.title ?? "").toLowerCase();
      const authorName = (story.author_name ?? "").toLowerCase();
      return title.includes(needle) || authorName.includes(needle);
    });
  }, [storyRows, searchTerm]);

  function handleStoryUpdated(storyId: string, action: StoryActionName) {
    setStoryRows((current) =>
      current.flatMap((story) => {
        if (story.id !== storyId) return [story];
        const next = applyStoryAction(story, action);
        return next ? [next] : [];
      }),
    );
    setSelectedStory((current) => {
      if (!current || current.id !== storyId) return current;
      return applyStoryAction(current, action);
    });
    if (action === "delete") setDrawerOpen(false);
  }

  useEffect(() => {
    if (filteredStories.length === 0) {
      setSelectedStory(null);
      return;
    }

    if (!selectedStory) {
      setSelectedStory(filteredStories[0]);
      return;
    }

    const stillExists = filteredStories.some(
      (story) => story.id === selectedStory.id,
    );
    if (!stillExists) {
      setSelectedStory(filteredStories[0]);
    }
  }, [filteredStories, selectedStory]);

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Search
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Filter by title or author name"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <StoriesTable
        stories={filteredStories}
        selectedStoryId={selectedStory?.id ?? ""}
        onSelectStory={(story) => {
          setSelectedStory(story);
          setDrawerOpen(true);
        }}
        onOpenDrawer={() => setDrawerOpen(true)}
        onUpdated={handleStoryUpdated}
      />

      <StoryDrawer
        open={drawerOpen}
        story={selectedStory}
        onOpenChange={setDrawerOpen}
      />
    </section>
  );
}
