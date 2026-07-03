"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";

import type { StoryRow } from "./useStories";

interface StoriesPanelProps {
  stories: StoryRow[];
  selectedStoryId: string;
  onSelectStory: (id: string) => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onHide: () => void;
  onFreeze: () => void;
}

export function StoriesPanel({
  stories,
  selectedStoryId,
  onSelectStory,
  onPublish,
  onUnpublish,
  onHide,
  onFreeze,
}: StoriesPanelProps) {
  const selectedStory = useMemo(
    () => stories.find((s) => s.id === selectedStoryId) ?? null,
    [stories, selectedStoryId]
  );

  return (
    <section className="border rounded-lg p-6 space-y-4 relative z-10 overflow-visible">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stories (City)</h2>
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

        <Button onClick={onPublish}>Publish</Button>
        <Button onClick={onUnpublish} variant="secondary">Unpublish</Button>
        <Button onClick={onHide} variant="secondary">Hide</Button>
        <Button onClick={onFreeze}>
          {selectedStory?.is_frozen ? "Unfreeze" : "Freeze"}
        </Button>
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
        </div>
      )}
    </section>
  );
}
