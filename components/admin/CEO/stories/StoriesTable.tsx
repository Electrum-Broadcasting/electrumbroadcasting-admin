"use client";

import { StoryRow } from "@/components/admin/CEO/stories/StoryRow";

import type { StoryActionName } from "@/components/admin/CEO/stories/actions";
import type { StoryRow as StoryRowType } from "@/lib/admin/types";

interface StoriesTableProps {
  stories: StoryRowType[];
  selectedStoryId: string;
  onSelectStory: (story: StoryRowType) => void;
  onOpenDrawer: () => void;
  onUpdated?: (storyId: string, action: StoryActionName) => void;
}

export function StoriesTable({
  stories,
  selectedStoryId,
  onSelectStory,
  onOpenDrawer,
  onUpdated,
}: StoriesTableProps) {
  if (stories.length === 0) {
    return <p className="text-sm text-slate-600">No stories found.</p>;
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => (
        <StoryRow
          key={story.id}
          story={story}
          selected={story.id === selectedStoryId}
          onSelect={onSelectStory}
          onOpenDrawer={onOpenDrawer}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}
