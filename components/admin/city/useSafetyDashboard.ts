import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export type ContributorRow = {
  id: string;
  display_name: string | null;
  fraud_score: number | null;
  fraud_level: string | null;
  locked: boolean;
  city: string;
};

export type StoryRow = {
  id: string;
  title: string;
  published_at: string | null;
  status: string;
};

export type OverrideLogRow = {
  id: string;
  action_type: string;
  created_at: string;
  metadata_json: any;
};

export function useSafetyDashboard() {
  const supabase = createBrowserClient();

  const [contributors, setContributors] = useState<ContributorRow[]>([]);
  const [selectedContributorId, setSelectedContributorId] = useState<string>("");

  const [stories, setStories] = useState<StoryRow[]>([]);
  const [actions, setActions] = useState<OverrideLogRow[]>([]);

  const [fraudScore, setFraudScore] = useState<string>("");
  const [fraudLevel, setFraudLevel] = useState<string>("");

  // ⭐ Load contributors once on mount
  useEffect(() => {
    const loadContributors = async () => {
      const { data, error } = await supabase.rpc("admin_get_contributors");

      if (error) {
        console.error("Failed to load contributors:", error);
        return;
      }

      if (data && data.length > 0) {
        setContributors(data as ContributorRow[]);
        setSelectedContributorId(data[0].id); // ⭐ sets valid UUID
      }
    };

    void loadContributors();
  }, []);

  // ⭐ Load stories + actions when contributor changes
  useEffect(() => {
    if (!selectedContributorId || selectedContributorId.length !== 36) return;

    const loadDetails = async () => {
      const { data: storyData } = await supabase.rpc(
        "admin_get_contributor_stories",
        { contributor_id: selectedContributorId }
      );

      const { data: actionData } = await supabase.rpc(
        "admin_get_contributor_actions",
        { contributor_id: selectedContributorId }
      );

      setStories(storyData ?? []);
      setActions(actionData ?? []);
    };

    void loadDetails();
  }, [selectedContributorId]);

  // ⭐ Action handlers
  const runAction = async (action: string, metadata: any = {}) => {
    if (!selectedContributorId || selectedContributorId.length !== 36) return;

    const { error } = await supabase.rpc("admin_update_contributor_status", {
      contributor_id: selectedContributorId,
      action,
      metadata,
    });

    if (error) {
      console.error("Action failed:", error);
      return;
    }

    // Reload contributors
    const { data } = await supabase.rpc("admin_get_contributors");
    if (data) {
      setContributors(data as ContributorRow[]);
    }

    // Reload stories + actions
    const { data: storyData } = await supabase.rpc(
      "admin_get_contributor_stories",
      { contributor_id: selectedContributorId }
    );
    const { data: actionData } = await supabase.rpc(
      "admin_get_contributor_actions",
      { contributor_id: selectedContributorId }
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

  return {
    contributors,
    selectedContributorId,
    setSelectedContributorId,

    stories,
    actions,

    fraudScore,
    setFraudScore,

    fraudLevel,
    setFraudLevel,

    handleLock,
    handleUnlock,
    handleSetFraudScore,
    handleSetFraudLevel,
  };
}
