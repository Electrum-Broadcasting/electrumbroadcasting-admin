"use client";

import { useEffect, useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { StoryActions } from "@/components/admin/CEO/stories/StoryActions";
import { StoryStatusBadge } from "@/components/admin/CEO/stories/StoryStatusBadge";
import {
  getRecentStoryActionsAction,
  getStoryDetailsAction,
} from "@/components/admin/CEO/stories/actions";

import type { StoryRow } from "@/lib/admin/types";

type RecentAction = {
  id: string;
  action: string;
  admin_name?: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

interface StoryDrawerProps {
  open: boolean;
  story: StoryRow | null;
  onOpenChange: (open: boolean) => void;
}

export function StoryDrawer({ open, story, onOpenChange }: StoryDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [loadingActions, setLoadingActions] = useState(false);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);

  useEffect(() => {
    if (!open || !story) {
      setRecentActions([]);
      return;
    }

    const storyIdToLoad = story.id;
    let isMounted = true;

    async function loadStoryDetails() {
      setLoading(true);
      const { data, error } = await getStoryDetailsAction(storyIdToLoad);

      if (!isMounted) return;

      if (!error && data) {
        // Story data already exists in the selected StoryRow, so no extra state overwrite is needed.
      }

      setLoading(false);
    }

    async function loadRecentActions() {
      setLoadingActions(true);
      const { data, error } = await getRecentStoryActionsAction(storyIdToLoad);

      if (!isMounted) return;

      if (!error && data) {
        setRecentActions((data as RecentAction[]) ?? []);
      }

      setLoadingActions(false);
    }

    void loadStoryDetails();
    void loadRecentActions();

    return () => {
      isMounted = false;
    };
  }, [open, story]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="space-y-4 p-6 bg-white">
        {loading && <p className="text-sm text-slate-600">Loading story…</p>}

        {!loading && !story && (
          <p className="text-sm text-slate-600">Story not found.</p>
        )}

        {!loading && story && (
          <div className="space-y-5">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">{story.title || "Untitled"}</h2>
              <StoryStatusBadge story={story} />
              <StoryActions story={story} />
            </div>

            {story.summary && (
              <p className="text-sm leading-6 text-slate-700">{story.summary}</p>
            )}

            <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {story.body || "No story body available."}
            </div>

            <div className="space-y-1 text-sm text-slate-600">
              <p>
                <strong>Author:</strong> {story.author_name || "Unknown"}
              </p>
              <p>
                <strong>Category:</strong> {story.category || "Uncategorized"}
              </p>
              <p>
                <strong>Neighborhood:</strong> {story.neighborhood || "N/A"}
              </p>
              <p>
                <strong>Year:</strong> {story.year ?? "N/A"}
              </p>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-800">Recent Actions</h3>

              {loadingActions ? (
                <p className="text-xs text-slate-500">Loading actions…</p>
              ) : recentActions.length === 0 ? (
                <p className="text-xs text-slate-500">No recent actions for this story.</p>
              ) : (
                <div className="space-y-3">
                  {recentActions.map((action) => (
                    <div key={action.id} className="rounded-md border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-900">{action.action}</span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(action.created_at).toLocaleString()}
                        </span>
                      </div>

                      {action.admin_name && (
                        <p className="mt-1 text-xs text-slate-500">by {action.admin_name}</p>
                      )}

                      {action.metadata && Object.keys(action.metadata).length > 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                          {JSON.stringify(action.metadata)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
