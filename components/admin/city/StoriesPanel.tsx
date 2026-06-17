"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/Badge";

type StoryRow = {
  id: string;
  title: string | null;
  author_name: string | null;
  is_published: boolean;
  is_frozen: boolean;
};

interface StoriesPanelProps {
  stories: StoryRow[];
  selectedStoryId: string;
  onSelectStory: (id: string) => void;

  onHide: () => void;
  onRepublish: () => void;
  onFreeze: () => void;
  onUnfreeze: () => void;
}

export function StoriesPanel({
  stories,
  selectedStoryId,
  onSelectStory,

  onHide,
  onRepublish,
  onFreeze,
  onUnfreeze,
}: StoriesPanelProps) {
  const selectedStory = stories.find((s) => s.id === selectedStoryId);

  return (
    <section className="border rounded-lg p-6 space-y-4 relative overflow-visible">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stories </h2>
      </div>

      <div className="flex flex-col gap-6">
        {/* Row 1: Dropdown */}
        <div className="flex items-center gap-6">
          <Select value={selectedStoryId} onValueChange={onSelectStory}>
            <SelectTrigger className="min-w-[560px] max-w-[960px]">
              <SelectValue placeholder="Select story" />
            </SelectTrigger>
            <SelectContent>
              {stories.map((story) => (
                <SelectItem key={story.id} value={story.id}>
                  <div className="flex items-center gap-2">
                    <span>{story.title ?? "Untitled"}</span>

                    {!story.is_published ? (
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
        </div>

        {/* Row 2: Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onHide}
            disabled={!selectedStory || !selectedStory.is_published}
          >
            Hide Story
          </Button>

          <Button
            onClick={onRepublish}
            disabled={!selectedStory || selectedStory.is_published}
          >
            Republish Story
          </Button>

          <Button
            onClick={onFreeze}
            disabled={!selectedStory || selectedStory.is_frozen}
          >
            Freeze Story
          </Button>

          <Button
            onClick={onUnfreeze}
            disabled={!selectedStory || !selectedStory.is_frozen}
          >
            Unfreeze Story
          </Button>
        </div>
      </div>
    </section>
  );
}
