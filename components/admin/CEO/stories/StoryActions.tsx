"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  updateStoryStatusAction,
  type StoryActionName,
} from "@/components/admin/CEO/stories/actions";

import type { StoryRow } from "@/lib/admin/types";

interface StoryActionsProps {
  story: StoryRow;
  disabled?: boolean;
  onUpdated?: (storyId: string, action: StoryActionName) => void;
}

const labels: Record<StoryActionName, string> = {
  republish: "Story published",
  hide: "Story unpublished",
  delete: "Story deleted",
  freeze: "Story frozen",
  unfreeze: "Story unfrozen",
};

export function StoryActions({
  story,
  disabled = false,
  onUpdated,
}: StoryActionsProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");

  async function runAction(action: StoryActionName) {
    if (isPending || disabled) return;

    if (action === "delete") {
      const confirmed = window.confirm(
        `Delete "${story.title || "this story"}"? This cannot be undone.`,
      );
      if (!confirmed) return;
    }

    setIsPending(true);
    setFeedback(null);

    try {
      const result = await updateStoryStatusAction(story.id, action);

      if (!result || result.error) {
        const message = result?.error || "Failed to update story";
        setFeedbackTone("error");
        setFeedback(message);
        toast.error(message);
        return;
      }

      setFeedbackTone("success");
      setFeedback(labels[action]);
      toast.success(labels[action]);
      onUpdated?.(story.id, action);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update story";
      setFeedbackTone("error");
      setFeedback(message);
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 lg:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() =>
            void runAction(story.is_published ? "hide" : "republish")
          }
          disabled={disabled || isPending}
        >
          {story.is_published ? "Unpublish" : "Publish"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            void runAction(story.is_frozen ? "unfreeze" : "freeze")
          }
          disabled={disabled || isPending}
        >
          {story.is_frozen ? "Unfreeze" : "Freeze"}
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => void runAction("delete")}
          disabled={disabled || isPending}
        >
          Delete
        </Button>
      </div>

      {feedback ? (
        <p
          className={
            feedbackTone === "error"
              ? "text-xs text-red-600"
              : "text-xs text-green-700"
          }
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
