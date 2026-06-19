"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";

import type { StoryRow } from "@/lib/admin/types";

interface CEOStoriesPanelProps {
  stories: StoryRow[];
  selectedStoryId: string;
  onSelectStory: (id: string) => void;
  onHide: () => void;
  onRepublish: () => void;
  onFreeze: () => void;
  onUnfreeze: () => void;
}

export function CEOStoriesPanel({
  stories = [],
  selectedStoryId = "",
  onSelectStory,
  onHide,
  onRepublish,
  onFreeze,
  onUnfreeze,
}: CEOStoriesPanelProps) {
  const selectedStory = useMemo(
    () => stories.find((s) => s.id === selectedStoryId) ?? null,
    [stories, selectedStoryId]
  );

  return (
    <section className="border rounded-lg p-6 space-y-4 relative z-10 overflow-visible">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stories (CEO)</h2>
      </div>

      <div className="flex gap-3 items-center">
        <Select value={selectedStoryId} onValueChange={onSelectStory}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Select story" />
          </SelectTrigger>
          <SelectContent>
            {stories.map((story) => (
              <SelectItem key={story.id} value={story.id}>
                <div className="flex items-center gap-2">
                  <span>{story.title ?? "Untitled"}</span>

                  {story.is_published === false ? (
                    <StatusBadge color="red">Hidden</StatusBadge>
                  ) : (
                    <StatusBadge color="green">Published</StatusBadge>
                  )}

                  {story.is_frozen ? (
                    <StatusBadge color="blue">Frozen</StatusBadge>
                  ) : (
                    <StatusBadge color="gray">Active</StatusBadge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={onHide}>Hide Story</Button>
        <Button onClick={onRepublish}>Republish Story</Button>
        <Button onClick={onFreeze}>Freeze Story</Button>
        <Button onClick={onUnfreeze}>Unfreeze Story</Button>
      </div>

      {selectedStory && (
        <div className="mt-4 p-4 border rounded bg-slate-50">
          <h3 className="font-semibold text-ink">{selectedStory.title}</h3>

          <p className="text-sm text-slate-600 mt-1">
            Author: {selectedStory.author_name ?? "Unknown"}
          </p>

          <p className="text-sm text-slate-600 mt-1">
            Category: {selectedStory.category ?? "Uncategorized"}
          </p>

          <p className="text-sm text-slate-600 mt-1">
            Neighborhood: {selectedStory.neighborhood ?? "N/A"}
          </p>

          <p className="text-sm text-slate-600 mt-1">
            City: {selectedStory.city ?? "N/A"}
          </p>

          <p className="text-sm text-slate-600 mt-1">
            Year: {selectedStory.year ?? "N/A"}
          </p>
        </div>
      )}
    </section>
  );
}
