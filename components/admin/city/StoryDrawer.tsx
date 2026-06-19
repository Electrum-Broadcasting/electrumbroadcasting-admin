"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createBrowserClient } from "@/lib/supabase/client";

type StoryDrawerProps = {
  open: boolean;
  storyId: string | null;
  onOpenChange: (open: boolean) => void;
};

type RecentAction = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  city_id: string | null;
  metadata: any;
  created_at: string;
  admin_name?: string | null;
};

export function StoryDrawer({ open, storyId, onOpenChange }: StoryDrawerProps) {
  const supabase = createBrowserClient();

  const [story, setStory] = useState<any | null>(null);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingActions, setLoadingActions] = useState(false);

  //
  // Load full story details via RPC
  //
  useEffect(() => {
    if (!storyId) return;

    const loadStory = async () => {
      setLoadingStory(true);

      const { data, error } = await supabase.rpc(
        "admin_get_story_details",
        { story_id: storyId }
      );

      if (!error && data) {
        setStory(data[0] ?? null);
      }

      setLoadingStory(false);
    };

    void loadStory();
  }, [storyId, supabase]);

  //
  // Load recent admin actions
  //
  useEffect(() => {
    if (!storyId) return;

    const loadActions = async () => {
      setLoadingActions(true);

      const { data, error } = await supabase
        .from("admin_override_logs")
        .select("*")
        .eq("target_type", "story")
        .eq("target_id", storyId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentActions(data as RecentAction[]);
      }

      setLoadingActions(false);
    };

    void loadActions();
  }, [storyId, supabase]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-white"
      >
        <SheetHeader>
          <SheetTitle className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              Story Details
            </span>
            <span className="text-base font-semibold truncate">
              {story?.title ?? (loadingStory ? "Loading…" : "No story selected")}
            </span>
          </SheetTitle>
        </SheetHeader>

        {!story ? (
          <div className="mt-6 text-sm text-muted-foreground">
            {loadingStory ? "Loading story…" : "No story selected."}
          </div>
        ) : (
          <ScrollArea className="mt-6 h-[calc(100vh-8rem)] pr-4">
            <div className="space-y-8 text-sm">

              {/* Status / Category */}
              <div className="flex flex-wrap items-center gap-2">
                {story.is_published !== undefined && (
                  <Badge
                    variant={story.is_published ? "secondary" : "outline"}
                    className="uppercase tracking-wide text-xs"
                  >
                    {story.is_published ? "Published" : "Hidden"}
                  </Badge>
                )}

                {story.category && (
                  <Badge variant="secondary" className="text-xs">
                    {story.category}
                  </Badge>
                )}

                {story.is_frozen && (
                  <Badge variant="outline" className="text-xs">
                    Frozen
                  </Badge>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-1 text-xs text-muted-foreground">
                {story.author_name && (
                  <div>
                    <span className="font-medium text-foreground">Author: </span>
                    {story.author_name}
                  </div>
                )}

                {story.city && (
                  <div>
                    <span className="font-medium text-foreground">City: </span>
                    {story.city}
                  </div>
                )}

                {story.created_at && (
                  <div>
                    <span className="font-medium text-foreground">Created: </span>
                    {new Date(story.created_at).toLocaleString()}
                  </div>
                )}

                {story.updated_at && (
                  <div>
                    <span className="font-medium text-foreground">Updated: </span>
                    {new Date(story.updated_at).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Story Body */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Story
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {story.body || "No story text provided."}
                </div>
              </div>

              <Separator />

              {/* Recent Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Recent Actions</h4>

                {loadingActions ? (
                  <p className="text-xs text-muted-foreground">Loading actions…</p>
                ) : recentActions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No recent actions for this story.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentActions.map((log) => (
                      <div
                        key={log.id}
                        className="border rounded-md p-3 text-sm"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{log.action}</span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>

                        {log.admin_name && (
                          <div className="text-xs text-muted-foreground mt-1">
                            by {log.admin_name}
                          </div>
                        )}

                        {log.metadata &&
                          Object.keys(log.metadata).length > 0 && (
                            <div className="text-xs text-muted-foreground mt-2">
                              {JSON.stringify(log.metadata)}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
