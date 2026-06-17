"use client";

import { ContributorsPanel } from "./ContributorsPanel";
import { ContributorDrawer } from "./ContributorDrawer";
import { StoriesPanel } from "./StoriesPanel";
import { RecentSafetyActivity } from "./RecentSafetyActivity";

import { useSafetyDashboard } from "./useSafetyDashboard";

import { Sheet, SheetContent } from "@/components/ui/sheet";

import { StoryRow } from "./useStories";

import { useState } from "react";

interface CitySafetyDashboardProps {
  cityId: string;
}

export function CitySafetyDashboard({ cityId }: CitySafetyDashboardProps) {
  const {
    contributors,
    stories,
    logs,

    selectedContributorId,
    setSelectedContributorId,

    selectedStoryId,
    setSelectedStoryId,

    fraudScore,
    setFraudScoreInput,

    fraudLevel,
    setFraudLevelInput,

    lockContributor,
    unlockContributor,
    setFraudScore,
    setFraudLevel,

    hideStory,
    republishStory,
    freezeStory,
    unfreezeStory,
  } = useSafetyDashboard(cityId);

  const selectedContributor = Array.isArray(contributors)
  ? contributors.find((c) => c.id === selectedContributorId)
  : null;

  const contributorLogs = logs.filter(
    (log) =>
      log.target_type === "contributor" &&
      log.target_id === selectedContributorId
  );

  const contributorStories = stories.filter(
    (s) => s.contributor_id === selectedContributorId
  );

  const [isContributorDrawerOpen, setIsContributorDrawerOpen] = useState(false);

  return (
    <div className="space-y-8">
      <ContributorsPanel
  contributors={contributors}
  selectedContributorId={selectedContributorId}
  onSelectContributor={setSelectedContributorId}

 fraudScore={fraudScore}
onFraudScoreChange={(value) => {
  setFraudScoreInput(value); // local only
}}

fraudLevel={fraudLevel}
onFraudLevelChange={(value) => {
  setFraudLevelInput(value); // local only
}}

  onLock={() =>
    selectedContributorId && lockContributor(selectedContributorId)
  }
  onUnlock={() =>
    selectedContributorId && unlockContributor(selectedContributorId)
  }

  /** ⭐ ADD THESE THREE PROPS ⭐ */
  setIsContributorDrawerOpen={setIsContributorDrawerOpen}
 onSetFraudScore={() => {
  if (!selectedContributorId) return;
  const score = parseInt(fraudScore, 10);
  if (!isNaN(score)) setFraudScore(selectedContributorId, score);
}}

onSetFraudLevel={() => {
  if (!selectedContributorId) return;
  setFraudLevel(selectedContributorId, fraudLevel);
}}
/>

      <StoriesPanel
        stories={stories}
        selectedStoryId={selectedStoryId}
        onSelectStory={setSelectedStoryId}
        onHide={() => selectedStoryId && hideStory(selectedStoryId)}
        onRepublish={() => selectedStoryId && republishStory(selectedStoryId)}
        onFreeze={() => selectedStoryId && freezeStory(selectedStoryId)}
        onUnfreeze={() => selectedStoryId && unfreezeStory(selectedStoryId)}
      />

      <RecentSafetyActivity logs={logs} />

      <Sheet
        open={isContributorDrawerOpen}
        onOpenChange={setIsContributorDrawerOpen}
      >
        <SheetContent side="right" className="w-[480px]">
          <ContributorDrawer
            open={isContributorDrawerOpen}
            onOpenChange={setIsContributorDrawerOpen}
            contributor={selectedContributor || null}
            actions={contributorLogs}
            stories={contributorStories}
            fraudScore={fraudScore}
            onFraudScoreChange={setFraudScoreInput}
            fraudLevel={fraudLevel}
            onFraudLevelChange={setFraudLevelInput}
            onLock={() =>
              selectedContributorId && lockContributor(selectedContributorId)
            }
            onUnlock={() =>
              selectedContributorId && unlockContributor(selectedContributorId)
            }
            onSetFraudScore={() => {
              if (!selectedContributorId) return;
              const score = parseInt(fraudScore, 10);
              if (!isNaN(score)) setFraudScore(selectedContributorId, score);
            }}
            onSetFraudLevel={() => {
              if (!selectedContributorId) return;
              setFraudLevel(selectedContributorId, fraudLevel);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
