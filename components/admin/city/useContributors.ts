"use client";

import { useState, useCallback } from "react";
import { useToastContext } from "@/components/ui/ToastProvider";
import { createBrowserClient } from "@/lib/supabase/client";

export type Contributor = {
  id: string;
  display_name: string | null;
  fraud_score: number | null;
  fraud_level: string | null;
  locked: boolean;
};

export function useContributors(cityId: string) {
  const supabase = createBrowserClient();

  const { showToast } = useToastContext();

  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------------
  // Load Contributors
  // ------------------------------------------------------------
  const refreshContributors = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("fraud_contributor_state")
      .select(`
        contributor_id,
        fraud_score,
        fraud_level,
        locked,
        contributors:contributors!fraud_contributor_state_contributor_id_fkey (
          id,
          display_name
        )
      `)
      .eq("city_id", cityId);

    if (error) {
      showToast("Failed to load contributors");
      setLoading(false);
      return;
    }

    const normalized: Contributor[] = (data || []).map((row: any) => ({
      id: row.contributor_id,
      display_name: row.contributors?.display_name ?? null,
      fraud_score: row.fraud_score,
      fraud_level: row.fraud_level,
      locked: row.locked,
    }));

    setContributors(normalized);
    setLoading(false);
  }, [cityId, showToast, supabase]);

  // ------------------------------------------------------------
  // Lock Contributor
  // ------------------------------------------------------------
  const lockContributor = useCallback(
    async (id: string) => {
      const result = await supabase.rpc("admin_lock_contributor", {
        contributor_id: id,
        city_id: cityId,
      });

      console.log(await supabase.auth.getSession());
      console.log("cityId:", cityId);
      console.log("RPC result:", result);
      console.log("RPC error:", result.error);
      console.log("RPC data:", result.data);

      if (result.error) {
        showToast("Failed to lock contributor");
        return;
      }

      showToast("Contributor locked");
      refreshContributors();
    },
    [refreshContributors, showToast, supabase]
  );

  // ------------------------------------------------------------
  // Unlock Contributor
  // ------------------------------------------------------------
  const unlockContributor = useCallback(
    async (id: string) => {
      const result = await supabase.rpc("admin_unlock_contributor", {
        contributor_id: id,
        city_id: cityId,
      });

      if (result.error) {
        showToast("Failed to unlock contributor");
        return;
      }

      showToast("Contributor unlocked");
      refreshContributors();
    },
    [refreshContributors, showToast, supabase]
  );

  // ------------------------------------------------------------
  // Set Fraud Score
  // ------------------------------------------------------------
  const setFraudScore = useCallback(
    async (id: string, score: number) => {
      const result = await supabase.rpc("admin_set_fraud_score", {
        contributor_id: id,
        fraud_score: score,
        city_id: cityId,
      });

      if (result.error) {
        showToast("Failed to update fraud score");
        return;
      }

      showToast("Fraud score updated");
      refreshContributors();
    },
    [refreshContributors, showToast, supabase]
  );

  // ------------------------------------------------------------
  // Set Fraud Level
  // ------------------------------------------------------------
  const setFraudLevel = useCallback(
    async (id: string, level: string) => {
      const result = await supabase.rpc("admin_set_fraud_level", {
        contributor_id: id,
        fraud_level: level,
        city_id: cityId,
      });

      if (result.error) {
        showToast("Failed to update fraud level");
        return;
      }

      showToast("Fraud level updated");
      refreshContributors();
    },
    [refreshContributors, showToast, supabase]
  );

  return {
    contributors,
    loading,
    refreshContributors,
    lockContributor,
    unlockContributor,
    setFraudScore,
    setFraudLevel,
  };
}
