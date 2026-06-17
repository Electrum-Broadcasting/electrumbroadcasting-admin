"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/Badge";
import type { StoryRow } from "./useStories";

type ContributorRow = {
  id: string;
  display_name: string | null;
  fraud_score: number | null;
  fraud_level: string | null;
  locked: boolean;
};

type OverrideLogRow = {
  id: string;
  created_at: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
};

interface ContributorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  contributor: ContributorRow | null;
  actions: OverrideLogRow[];
  stories: StoryRow[];

  fraudScore: string;
  onFraudScoreChange: (value: string) => void;

  fraudLevel: string;
  onFraudLevelChange: (value: string) => void;

  onLock: () => void;
  onUnlock: () => void;
  onSetFraudScore: () => void;
  onSetFraudLevel: () => void;
}

export function ContributorDrawer({
  open,
  onOpenChange,

  contributor,
  actions,
  stories,

  fraudScore,
  onFraudScoreChange,

  fraudLevel,
  onFraudLevelChange,

  onLock,
  onUnlock,
  onSetFraudScore,
  onSetFraudLevel,
}: ContributorDrawerProps) {
  if (!contributor) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] p-0 bg-white">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b p-4">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>{contributor.display_name ?? contributor.id}</span>

              <div className="flex items-center gap-2">
                {contributor.locked ? (
                  <StatusBadge color="blue">Frozen</StatusBadge>
                ) : (
                  <StatusBadge color="gray">Active</StatusBadge>
                )}

                {contributor.fraud_level && (
                  <StatusBadge
                    color={
                      contributor.fraud_level === "high"
                        ? "red"
                        : contributor.fraud_level === "medium"
                        ? "yellow"
                        : "green"
                    }
                  >
                    {contributor.fraud_level}
                  </StatusBadge>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Controls */}
          <div className="flex flex-col gap-2 mt-3">
            {/* Fraud Score */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={fraudScore}
                onChange={(e) => onFraudScoreChange(e.target.value)}
                className="w-20 px-2 py-1 border rounded text-sm bg-white"
                placeholder="Score"
              />
              <Button size="sm" onClick={onSetFraudScore}>
                Set Score
              </Button>
            </div>

            {/* Fraud Level */}
            <div className="flex items-center gap-2">
              <select
                value={fraudLevel}
                onChange={(e) => onFraudLevelChange(e.target.value)}
                className="px-2 py-1 border rounded text-sm bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <Button size="sm" onClick={onSetFraudLevel}>
                Set Level
              </Button>
            </div>

            {/* Lock / Unlock */}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onLock} disabled={contributor.locked}>
                Lock
              </Button>
              <Button size="sm" onClick={onUnlock} disabled={!contributor.locked}>
                Unlock
              </Button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)] bg-white">
          {/* Stories */}
          {stories.length === 0 ? (
            <div>
              <h3 className="text-sm font-semibold mb-2">Stories</h3>
              <p className="text-sm text-muted-foreground">No stories found.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold mb-2">Stories</h3>

              <ul className="space-y-2">
                {stories.map((story) => (
                  <li
                    key={story.id}
                    className="p-2 border rounded-md flex items-center justify-between hover:bg-accent cursor-pointer"
                    onClick={() => console.log("Open story drawer:", story.id)}
                  >
                    <span className="text-sm">{story.title ?? "Untitled"}</span>

                    <StatusBadge
                      color={
                        story.is_frozen
                          ? "blue"
                          : story.is_published
                          ? "green"
                          : "gray"
                      }
                    >
                      {story.is_frozen
                        ? "Frozen"
                        : story.is_published
                        ? "Published"
                        : "Hidden"}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent Actions */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Recent Actions</h3>

            {actions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recent actions for this contributor.
              </p>
            )}

            <div className="space-y-3">
              {actions.map((log) => (
                <div key={log.id} className="border rounded-md p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  {log.admin_id && (
                    <div className="text-xs text-muted-foreground mt-1">
                      by {log.admin_id}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
