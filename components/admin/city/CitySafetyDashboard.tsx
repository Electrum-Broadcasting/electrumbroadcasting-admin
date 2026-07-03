"use client";

import { useEffect, useMemo, useState } from "react";
import { ContributorsPanel } from "./ContributorsPanel";
import { ContributorDrawer } from "./ContributorDrawer";
import { StoriesPanel } from "./StoriesPanel";
import { useContributors, type Contributor } from "./useContributors";
import { useStories, type StoryRow } from "./useStories";

type ContributorRow = Contributor;

interface CitySafetyDashboardProps {
  cityId: string;
}

export function CitySafetyDashboard({ cityId }: CitySafetyDashboardProps) {
  const {
    contributors,
    refreshContributors,
    lockContributor,
    unlockContributor,
    setFraudScore,
    setFraudLevel,
  } = useContributors(cityId);

  const {
    stories,
    hideStory,
    republishStory,
    freezeStory,
    unfreezeStory,
  } = useStories(cityId);

  const [selectedContributorId, setSelectedContributorId] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [fraudScoreInput, setFraudScoreInput] = useState("");
  const [fraudLevelInput, setFraudLevelInput] = useState("low");

  const [isContributorDrawerOpen, setIsContributorDrawerOpen] = useState(false);

  useEffect(() => {
    void refreshContributors();
  }, [refreshContributors]);

  useEffect(() => {
    if (contributors.length === 0) {
      setSelectedContributorId("");
      return;
    }

    const stillExists = contributors.some((c) => c.id === selectedContributorId);
    if (!stillExists) {
      setSelectedContributorId(contributors[0].id);
      setFraudScoreInput("");
      setFraudLevelInput(contributors[0].fraud_level ?? "low");
    }
  }, [contributors, selectedContributorId]);

  useEffect(() => {
    if (!selectedContributorId) return;
    const selected = contributors.find((c) => c.id === selectedContributorId);
    if (!selected) return;

    setFraudScoreInput(
      typeof selected.fraud_score === "number" ? String(selected.fraud_score) : ""
    );
    setFraudLevelInput(selected.fraud_level ?? "low");
  }, [selectedContributorId, contributors]);

  useEffect(() => {
    if (stories.length === 0) {
      setSelectedStoryId("");
      return;
    }

    const stillExists = stories.some((story) => story.id === selectedStoryId);
    if (!stillExists) {
      setSelectedStoryId(stories[0].id);
    }
  }, [stories, selectedStoryId]);

  const selectedContributor: ContributorRow | null = useMemo(
    () => contributors.find((c) => c.id === selectedContributorId) ?? null,
    [contributors, selectedContributorId]
  );

  const selectedStory: StoryRow | null = useMemo(
    () => stories.find((story) => story.id === selectedStoryId) ?? null,
    [stories, selectedStoryId]
  );

  const contributorStories: StoryRow[] = useMemo(
    () => stories.filter((story) => story.contributor_id === selectedContributorId),
    [stories, selectedContributorId]
  );

  return (
    <div className="space-y-8">
      <ContributorsPanel
        contributors={contributors}
        selectedContributorId={selectedContributorId}
        onSelectContributor={setSelectedContributorId}
        setIsContributorDrawerOpen={setIsContributorDrawerOpen}
        fraudScore={fraudScoreInput}
        onFraudScoreChange={setFraudScoreInput}
        fraudLevel={fraudLevelInput}
        onFraudLevelChange={setFraudLevelInput}
        onLock={() => selectedContributorId && void lockContributor(selectedContributorId)}
        onUnlock={() => selectedContributorId && void unlockContributor(selectedContributorId)}
        onSetFraudScore={() => {
          if (!selectedContributorId) return;
          const score = Number.parseInt(fraudScoreInput, 10);
          if (Number.isNaN(score)) return;
          void setFraudScore(selectedContributorId, score);
        }}
        onSetFraudLevel={() => {
          if (!selectedContributorId) return;
          void setFraudLevel(selectedContributorId, fraudLevelInput);
        }}
      />

      <StoriesPanel
        stories={stories}
        selectedStoryId={selectedStoryId}
        onSelectStory={setSelectedStoryId}
        onPublish={() => selectedStoryId && void republishStory(selectedStoryId)}
        onUnpublish={() => selectedStoryId && void hideStory(selectedStoryId)}
        onHide={() => selectedStoryId && void hideStory(selectedStoryId)}
        onFreeze={() => {
          if (!selectedStoryId || !selectedStory) return;
          if (selectedStory.is_frozen) {
            void unfreezeStory(selectedStoryId);
            return;
          }
          void freezeStory(selectedStoryId);
        }}
      />

      <ContributorDrawer
        open={isContributorDrawerOpen}
        onOpenChange={setIsContributorDrawerOpen}
        contributor={selectedContributor}
        actions={[]}
        stories={contributorStories}
        fraudScore={fraudScoreInput}
        onFraudScoreChange={setFraudScoreInput}
        fraudLevel={fraudLevelInput}
        onFraudLevelChange={setFraudLevelInput}
        onLock={() => selectedContributorId && void lockContributor(selectedContributorId)}
        onUnlock={() => selectedContributorId && void unlockContributor(selectedContributorId)}
        onSetFraudScore={() => {
          if (!selectedContributorId) return;
          const score = Number.parseInt(fraudScoreInput, 10);
          if (Number.isNaN(score)) return;
          void setFraudScore(selectedContributorId, score);
        }}
        onSetFraudLevel={() => {
          if (!selectedContributorId) return;
          void setFraudLevel(selectedContributorId, fraudLevelInput);
        }}
      />
    </div>
  );
}
