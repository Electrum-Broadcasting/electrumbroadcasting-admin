"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StoryDrawer } from "@/components/admin/city/StoryDrawer";
import { Eye } from "lucide-react";

import type { StoryRow } from "@/lib/admin/types";

interface CEOStoriesPanelProps {
  stories: StoryRow[];
}

export function CEOStoriesPanel({ stories = [] }: CEOStoriesPanelProps) {
  const supabase = createBrowserClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState(
    stories.length > 0 ? stories[0].id : ""
  );
  const [actionStoryId, setActionStoryId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredStories = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return stories;

    return stories.filter((story) => {
      const title = (story.title ?? "").toLowerCase();
      const authorName = (story.author_name ?? "").toLowerCase();
      return title.includes(needle) || authorName.includes(needle);
    });
  }, [stories, searchTerm]);

  useEffect(() => {
    if (filteredStories.length === 0) {
      setSelectedStoryId("");
      return;
    }

    const stillExists = filteredStories.some((story) => story.id === selectedStoryId);
    if (!stillExists) {
      setSelectedStoryId(filteredStories[0].id);
    }
  }, [filteredStories, selectedStoryId]);

  const selectedStory = useMemo(
    () => filteredStories.find((story) => story.id === selectedStoryId) ?? null,
    [filteredStories, selectedStoryId]
  );

  async function handleAction(storyId: string, action: string) {
    if (actionStoryId) return;

    setActionStoryId(storyId);
    const { error } = await supabase.rpc("admin_update_story_status", {
      story_id: storyId,
      action,
      metadata: {},
    });

    setActionStoryId(null);

    if (error) {
      toast.error("Failed to update story");
      return;
    }

    const successMessage =
      action === "republish"
        ? "Story published"
        : action === "hide"
          ? "Story unpublished"
          : action === "delete"
            ? "Story deleted"
            : "Story updated";

    toast.success(successMessage);
  }

  return (
    <section className="border rounded-lg p-6 space-y-4 relative z-10 overflow-visible">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stories (CEO)</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Search</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Filter by title or author name"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      {filteredStories.length === 0 ? (
        <p className="text-sm text-slate-600">No stories found.</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedStoryId} onValueChange={setSelectedStoryId}>
              <SelectTrigger className="min-w-[560px] max-w-[960px]">
                <SelectValue placeholder="Select story" />
              </SelectTrigger>
              <SelectContent>
                {filteredStories.map((story) => (
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

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDrawerOpen(true)}
              disabled={!selectedStoryId}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => selectedStoryId && void handleAction(selectedStoryId, "republish")}
              disabled={!selectedStoryId || actionStoryId === selectedStoryId}
            >
              Publish
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => selectedStoryId && void handleAction(selectedStoryId, "hide")}
              disabled={!selectedStoryId || actionStoryId === selectedStoryId}
            >
              Unpublish
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                selectedStoryId &&
                selectedStory &&
                void handleAction(
                  selectedStoryId,
                  selectedStory.is_frozen ? "unfreeze" : "freeze"
                )
              }
              disabled={!selectedStoryId || !selectedStory || actionStoryId === selectedStoryId}
            >
              {selectedStory?.is_frozen ? "Unfreeze" : "Freeze"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => selectedStoryId && void handleAction(selectedStoryId, "delete")}
              disabled={!selectedStoryId || actionStoryId === selectedStoryId}
            >
              Delete
            </Button>
          </div>

          {selectedStory && (
            <div className="mt-4 rounded border bg-slate-50 p-4">
              <h3 className="font-semibold text-ink">{selectedStory.title ?? "Untitled"}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {selectedStory.summary ?? selectedStory.body ?? "No description available."}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Author: {selectedStory.author_name ?? "Unknown"} | Category: {selectedStory.category ?? "Uncategorized"} | Neighborhood: {selectedStory.neighborhood ?? "N/A"}
              </p>
            </div>
          )}
        </div>
      )}

      <StoryDrawer
        open={drawerOpen}
        storyId={selectedStoryId || null}
        onOpenChange={setDrawerOpen}
      />
    </section>
  );
}
