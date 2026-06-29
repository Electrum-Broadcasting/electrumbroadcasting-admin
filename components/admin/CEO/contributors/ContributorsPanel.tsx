"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { ContributorsPanel } from "@/components/admin/city/ContributorsPanel";
import { ContributorDrawer } from "@/components/admin/city/ContributorDrawer";
import { toast } from "sonner";
import type { StoryRow } from "@/components/admin/city/useStories";

type ContributorRow = {
  id: string;
  display_name: string | null;
  fraud_score: number | null;
  fraud_level: string | null;
  locked: boolean;
  city: string;
};

type OverrideLogRow = {
  id: string;
  action_type: string;
  created_at: string;
  metadata_json: any;
};

export function CEOContributorsPanel() {
  const supabase = createBrowserClient();

  const [contributors, setContributors] = useState<ContributorRow[]>([]);
  const [selectedContributorId, setSelectedContributorId] = useState<string>("");

  const [fraudScore, setFraudScore] = useState<string>("");
  const [fraudLevel, setFraudLevel] = useState<string>("");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [stories, setStories] = useState<StoryRow[]>([]);
  const [actions, setActions] = useState<OverrideLogRow[]>([]);

  useEffect(() => {
  const loadContributors = async () => {
    const { data, error } = await supabase.rpc("admin_get_contributors");

    if (error) {
      console.error(error);
      toast.error("Failed to load contributors.");
      return;
    }

    if (data && data.length > 0) {
      setContributors(data as ContributorRow[]);
      setSelectedContributorId(data[0].id);
    }
  };

  void loadContributors();
}, []);
  
  useEffect(() => {
  if (!isDrawerOpen) return;
  if (!selectedContributorId || selectedContributorId.length !== 36) return;

  const loadDetails = async () => {
    const { data: storyData } = await supabase.rpc(
      "admin_get_contributor_stories",
      { _contributor_id: selectedContributorId }
    );

    const { data: actionData } = await supabase.rpc(
      "admin_get_contributor_actions",
      { _contributor_id: selectedContributorId }
    );

    setStories(storyData ?? []);
    setActions(actionData ?? []);
  };

  void loadDetails();
}, [isDrawerOpen, selectedContributorId]);

  const runAction = async (action: string, metadata: any = {}) => {
    if (!selectedContributorId || selectedContributorId.length !== 36) return;

    const { error } = await supabase.rpc("admin_update_contributor_status", {
      contributor_id: selectedContributorId,
      action,
      metadata,
    });

    if (error) {
      console.error(error);
      toast.error("Action failed.");
      return;
    }

    toast.success(`Contributor ${action} successful.`);

    setFraudScore("");
    setFraudLevel("");

    const { data } = await supabase.rpc("admin_get_contributors");
    if (data) {
      setContributors(data as ContributorRow[]);
      setSelectedContributorId(selectedContributorId);
    }

    // Reload stories + actions after update
const { data: storyData } = await supabase.rpc(
  "admin_get_contributor_stories",
  { _contributor_id: selectedContributorId }
);

const { data: actionData } = await supabase.rpc(
  "admin_get_contributor_actions",
  { _contributor_id: selectedContributorId }
);

setStories(storyData ?? []);
setActions(actionData ?? []);

  };

  const handleLock = () => runAction("lock");
  const handleUnlock = () => runAction("unlock");

  const handleSetFraudScore = () =>
    runAction("set-fraud-score", { fraud_score: Number(fraudScore) });

  const handleSetFraudLevel = () =>
    runAction("set-fraud-level", { fraud_level: fraudLevel });

  const selectedContributor =
    contributors.find((c) => c.id === selectedContributorId) ?? null;

  return (
    <>
      <ContributorsPanel
        contributors={contributors}
        selectedContributorId={selectedContributorId}
        onSelectContributor={setSelectedContributorId}
        setIsContributorDrawerOpen={setIsDrawerOpen}
        fraudScore={fraudScore}
        onFraudScoreChange={setFraudScore}
        fraudLevel={fraudLevel}
        onFraudLevelChange={setFraudLevel}
        onLock={handleLock}
        onUnlock={handleUnlock}
        onSetFraudScore={handleSetFraudScore}
        onSetFraudLevel={handleSetFraudLevel}
      />

      <ContributorDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        contributor={selectedContributor}
        actions={actions}
        stories={stories}
        fraudScore={fraudScore}
        onFraudScoreChange={setFraudScore}
        fraudLevel={fraudLevel}
        onFraudLevelChange={setFraudLevel}
        onLock={handleLock}
        onUnlock={handleUnlock}
        onSetFraudScore={handleSetFraudScore}
        onSetFraudLevel={handleSetFraudLevel}
      />
    </>
  );
}
