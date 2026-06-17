"use client";

import { useState, useEffect } from "react";
import { useContributors } from "./useContributors";
import { useStories } from "./useStories";
import { useLogs } from "./useLogs";

export function useSafetyDashboard(cityId: string) {
  // Contributors
  const {
    contributors,
    refreshContributors,
    lockContributor,
    unlockContributor,
    setFraudScore,
    setFraudLevel,
  } = useContributors(cityId);

  // Stories
  const {
    stories,
    loadStories,
    hideStory,
    republishStory,
    freezeStory,
    unfreezeStory,
  } = useStories(cityId);

  // Logs
  const { logs, loadLogs } = useLogs(cityId);

  const [selectedContributorId, setSelectedContributorId] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [fraudScore, setFraudScoreInput] = useState("");
  const [fraudLevel, setFraudLevelInput] = useState("low");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load everything once per city
  useEffect(() => {
    refreshContributors();
    loadStories();
    loadLogs();
  }, [cityId, refreshContributors, loadStories, loadLogs]);

  return {
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

    drawerOpen,
    setDrawerOpen,

    lockContributor,
    unlockContributor,
    setFraudScore,
    setFraudLevel,

    hideStory,
    republishStory,
    freezeStory,
    unfreezeStory,
  };
}
