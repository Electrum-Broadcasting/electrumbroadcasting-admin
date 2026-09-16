"use client";

import { Button } from "@/components/ui/button";
import { StoryActions } from "@/components/admin/CEO/stories/StoryActions";
import { StoryStatusBadge } from "@/components/admin/CEO/stories/StoryStatusBadge";

import type { StoryRow } from "@/lib/admin/types";

interface StoryRowProps {
  story: StoryRow;
  selected?: boolean;
  onSelect?: (story: StoryRow) => void;
  onOpenDrawer?: () => void;
}

export function StoryRow({ story, selected = false, onSelect, onOpenDrawer }: StoryRowProps) {
  return (
    <div
      className={[
        "rounded-lg border bg-white p-4 shadow-sm transition-colors",
        selected ? "border-slate-300 bg-slate-50" : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="text-left text-base font-semibold text-slate-900 hover:text-slate-700"
              onClick={() => onSelect?.(story)}
            >
              {story.title || "Untitled"}
            </button>
            <StoryStatusBadge story={story} />
          </div>

          <p className="text-sm text-slate-600">
            {story.summary || story.body || "No description available."}
          </p>

          <div className="text-xs text-slate-500">
            <span>{story.author_name || "Unknown author"}</span>
            <span className="mx-2">•</span>
            <span>{story.category || "Uncategorized"}</span>
            <span className="mx-2">•</span>
            <span>{story.neighborhood || "No neighborhood"}</span>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <div className="flex flex-wrap gap-2">
            {onSelect && (
              <Button type="button" size="sm" variant="secondary" onClick={() => onSelect(story)}>
                Select
              </Button>
            )}

            {onOpenDrawer && (
              <Button type="button" size="sm" variant="outline" onClick={onOpenDrawer}>
                View
              </Button>
            )}
          </div>

          <StoryActions story={story} />
        </div>
      </div>
    </div>
  );
}
