"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { ContributorsPanel } from "@/components/admin/city/ContributorsPanel";
import { toast } from "sonner";

type ContributorRow = {
  id: string;
  display_name: string | null;
  fraud_score: number | null;
  fraud_level: string | null;
  locked: boolean;
};

export function CEOContributorsPanel() {
  const supabase = createBrowserClient();

  const [contributors, setContributors] = useState<ContributorRow[]>([]);
  const [selectedContributorId, setSelectedContributorId] = useState<string>("");

  const [fraudScore, setFraudScore] = useState<string>("");
  const [fraudLevel, setFraudLevel] = useState<string>("");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
  }, [supabase]);

  const runAction = async (action: string, metadata: any = {}) => {
    if (!selectedContributorId) return;

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

    const { data } = await supabase.rpc("admin_get_contributors");
    if (data) {
      setContributors(data as ContributorRow[]);
      setSelectedContributorId(data[0].id);
    }
  };

  const handleLock = () => runAction("lock");
  const handleUnlock = () => runAction("unlock");

  const handleSetFraudScore = () =>
    runAction("set-fraud-score", { fraud_score: Number(fraudScore) });

  const handleSetFraudLevel = () =>
    runAction("set-fraud-level", { fraud_level: fraudLevel });

  if (contributors.length === 0) {
    return <p className="text-sm text-slate-500">No contributors found.</p>;
  }

  return (
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
  );
}
