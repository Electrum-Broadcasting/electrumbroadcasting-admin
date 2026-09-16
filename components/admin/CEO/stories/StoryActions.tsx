"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  freezeStoryAction,
  hideStoryAction,
  republishStoryAction,
  unfreezeStoryAction,
  updateStoryStatusAction,
} from "@/components/admin/CEO/stories/actions";

import type { StoryRow } from "@/lib/admin/types";

interface StoryActionsProps {
  story: StoryRow;
  disabled?: boolean;
}

export function StoryActions({ story, disabled = false }: StoryActionsProps) {
  const [isPending, startTransition] = useTransition();

  const runAction = (action: string) => {
    if (isPending) return;

    startTransition(async () => {
      let result: any;

      switch (action) {
        case "republish":
          result = await republishStoryAction(story.id);
          break;
        case "hide":
          result = await hideStoryAction(story.id);
          break;
        case "freeze":
          result = await freezeStoryAction(story.id);
          break;
        case "unfreeze":
          result = await unfreezeStoryAction(story.id);
          break;
        default:
          result = await updateStoryStatusAction(story.id, action);
      }

      if (result.error) {
        toast.error("Failed to update story");
        return;
      }

      const labels: Record<string, string> = {
        republish: "Story published",
        hide: "Story unpublished",
        delete: "Story deleted",
        freeze: "Story frozen",
        unfreeze: "Story unfrozen",
      };

      toast.success(labels[action] ?? "Story updated");

      // Force UI refresh
      window.location.reload();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        onClick={() => runAction(story.is_published ? "hide" : "republish")}
        disabled={disabled || isPending}
      >
        {story.is_published ? "Unpublish" : "Publish"}
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => runAction(story.is_frozen ? "unfreeze" : "freeze")}
        disabled={disabled || isPending}
      >
        {story.is_frozen ? "Unfreeze" : "Freeze"}
      </Button>

      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => runAction("delete")}
        disabled={disabled || isPending}
      >
        Delete
      </Button>
    </div>
  );
}
