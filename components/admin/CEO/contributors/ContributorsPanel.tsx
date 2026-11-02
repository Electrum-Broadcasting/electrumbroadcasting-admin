"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { ContributorsPanel as ContributorActionsPanel } from "@/components/admin/city/ContributorsPanel";
import { ContributorDrawer } from "@/components/admin/city/ContributorDrawer";
import { CollapsibleSection } from "@/components/admin/CEO/CollapsibleSection";
import {
  ContributorProfileEditor,
  type ContributorCity,
  type ContributorProfile,
} from "./ContributorProfileEditor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { StoryRow } from "@/components/admin/city/useStories";

type ContributorRow = ContributorProfile & {
  city: string;
  fraud_score: number | null;
  fraud_level: string | null;
  locked: boolean;
};

type OverrideLogRow = {
  id: string;
  action_type: string;
  created_at: string;
  metadata_json: unknown;
};

export function CEOContributorsPanel() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [contributors, setContributors] = useState<ContributorRow[]>([]);
  const [cities, setCities] = useState<ContributorCity[]>([]);
  const [selectedContributorId, setSelectedContributorId] = useState("");
  const [fraudScore, setFraudScore] = useState("");
  const [fraudLevel, setFraudLevel] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [actions, setActions] = useState<OverrideLogRow[]>([]);

  const loadContributors = useCallback(async (preferredId?: string) => {
    const response = await fetch("/api/admin/contributors", {
      cache: "no-store",
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok || !Array.isArray(result.contributors)) {
      throw new Error(result?.error ?? "Failed to load contributors");
    }
    const rows = result.contributors as ContributorRow[];
    setContributors(rows);
    setCities(Array.isArray(result.cities) ? result.cities : []);
    const selectedStillExists = rows.some(
      (contributor) => contributor.id === (preferredId ?? selectedContributorId)
    );
    if (preferredId && rows.some((contributor) => contributor.id === preferredId)) {
      setSelectedContributorId(preferredId);
    } else if (!selectedStillExists && rows.length) {
      setSelectedContributorId(rows[0].id);
    } else if (!rows.length) {
      setSelectedContributorId("");
    }
  }, [selectedContributorId]);

  useEffect(() => {
    loadContributors().catch((error) => {
      console.error("Failed to load contributors:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load contributors");
    });
  }, [loadContributors]);

  const loadContributorDetails = useCallback(async (contributorId: string) => {
    const [storyResult, actionResult] = await Promise.all([
      supabase.rpc("admin_get_contributor_stories", {
        _contributor_id: contributorId,
      }),
      supabase.rpc("admin_get_contributor_actions", {
        _contributor_id: contributorId,
      }),
    ]);
    if (storyResult.error || actionResult.error) {
      const error = storyResult.error ?? actionResult.error;
      console.error("Failed to load contributor details:", error);
      toast.error("Failed to load contributor details.");
      return;
    }
    setStories(storyResult.data ?? []);
    setActions(actionResult.data ?? []);
  }, [supabase]);

  useEffect(() => {
    if (!isDrawerOpen || !selectedContributorId) return;
    void loadContributorDetails(selectedContributorId);
  }, [isDrawerOpen, loadContributorDetails, selectedContributorId]);

  const runAction = async (action: string, metadata: Record<string, unknown> = {}) => {
    if (!selectedContributorId || selectedContributorId.length !== 36) {
      toast.error("Select a contributor first.");
      return;
    }
    const { error } = await supabase.rpc("admin_update_contributor_status", {
      contributor_id: selectedContributorId,
      action,
      metadata,
    });
    if (error) {
      console.error("Contributor action failed:", error);
      toast.error("Action failed.");
      return;
    }

    toast.success(`Contributor ${action} successful.`);
    setFraudScore("");
    setFraudLevel("");
    try {
      await loadContributors(selectedContributorId);
      await loadContributorDetails(selectedContributorId);
    } catch (error) {
      console.error("Failed to refresh contributor data:", error);
      toast.error("Action succeeded, but contributor data could not be refreshed.");
    }
  };

  const selectedContributor =
    contributors.find((contributor) => contributor.id === selectedContributorId) ?? null;

  async function handleProfileSaved(id: string) {
    setIsCreating(false);
    try {
      await loadContributors(id);
    } catch (error) {
      console.error("Contributor saved but refresh failed:", error);
      toast.error("Profile saved, but the contributor list could not be refreshed.");
    }
  }

  async function handleSafeDelete() {
    if (!selectedContributor) return;
    const confirmed = window.confirm(
      `Safe delete ${selectedContributor.display_name}? The contributor is deactivated and hidden from this list; the record is kept and the action is logged.`
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/admin/contributors/${selectedContributor.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Failed to delete contributor");
      toast.success("Contributor deleted.");
      setSelectedContributorId("");
      await loadContributors();
    } catch (error) {
      console.error("Contributor safe delete failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete contributor");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant={isCreating ? "outline" : "default"}
          onClick={() => setIsCreating((creating) => !creating)}
        >
          {isCreating ? "Cancel create" : "Create new contributor"}
        </Button>
      </div>

      {isCreating ? (
        <CollapsibleSection title="Create new contributor" defaultOpen>
          <ContributorProfileEditor
            profile={null}
            cities={cities}
            onSaved={handleProfileSaved}
            onCancel={() => setIsCreating(false)}
          />
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection title="Contributor moderation" defaultOpen>
        <ContributorActionsPanel
          contributors={contributors}
          selectedContributorId={selectedContributorId}
          onSelectContributor={setSelectedContributorId}
          setIsContributorDrawerOpen={setIsDrawerOpen}
          fraudScore={fraudScore}
          onFraudScoreChange={setFraudScore}
          fraudLevel={fraudLevel}
          onFraudLevelChange={setFraudLevel}
          onLock={() => void runAction("lock")}
          onUnlock={() => void runAction("unlock")}
          onSetFraudScore={() => void runAction("set-fraud-score", { fraud_score: Number(fraudScore) })}
          onSetFraudLevel={() => void runAction("set-fraud-level", { fraud_level: fraudLevel })}
        />
      </CollapsibleSection>

      {selectedContributor ? (
        <CollapsibleSection
          title="Contributor profile"
          description="Edit the supported profile fields, city assignment, and profile image."
        >
          <ContributorProfileEditor
            key={selectedContributor.id}
            profile={selectedContributor}
            cities={cities}
            onSaved={handleProfileSaved}
          />
          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Contributor-specific roles or permission overrides are not present in
            the current contributor schema. Manage supported role settings in
            the global permissions configuration.
          </p>
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="destructive" onClick={() => void handleSafeDelete()}>
              Safe delete contributor
            </Button>
          </div>
        </CollapsibleSection>
      ) : null}

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
        onLock={() => void runAction("lock")}
        onUnlock={() => void runAction("unlock")}
        onSetFraudScore={() => void runAction("set-fraud-score", { fraud_score: Number(fraudScore) })}
        onSetFraudLevel={() => void runAction("set-fraud-level", { fraud_level: fraudLevel })}
      />
    </div>
  );
}
