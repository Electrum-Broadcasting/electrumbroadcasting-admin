"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/admin/CEO/CollapsibleSection";

type FeatureToggle = {
  feature_name: string;
  enabled: boolean;
};

export default function FeatureTogglesSection() {
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState("");
  const [error, setError] = useState("");
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/settings/features", {
          cache: "no-store",
          credentials: "include",
        });
        const result = await response.json();
        if (!response.ok || !Array.isArray(result)) {
          throw new Error(result?.error ?? "Failed to load feature toggles");
        }
        if (active) setToggles(result);
      } catch (loadError) {
        console.error("Failed to load feature toggles:", loadError);
        if (active) {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load feature toggles";
          setError(message);
          toast.error(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function updateToggle(toggle: FeatureToggle, enabled: boolean) {
    if (savingName) return;
    setSavingName(toggle.feature_name);
    try {
      const response = await fetch("/api/admin/settings/features", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature_name: toggle.feature_name, enabled }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Failed to save feature toggle");
      setToggles((previous) =>
        previous.map((item) =>
          item.feature_name === toggle.feature_name ? { ...item, enabled } : item
        )
      );
      toast.success("Feature toggle updated");
    } catch (saveError) {
      console.error("Failed to update feature toggle:", saveError);
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save feature toggle";
      setError(message);
      toast.error(message);
    } finally {
      setSavingName("");
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading feature toggles…</p>;

  return (
    <div className="space-y-4">
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <CollapsibleSection
        title="Global feature toggles"
        description="Enable or disable platform features."
        defaultOpen
      >
        {toggles.length ? (
          <div className="divide-y divide-border">
            {toggles.map((toggle) => (
              <label
                key={toggle.feature_name}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <span className="text-sm font-medium">{toggle.feature_name}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={toggle.enabled}
                  disabled={Boolean(savingName)}
                  onChange={(event) => void updateToggle(toggle, event.target.checked)}
                />
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {error ? "Feature toggles could not be loaded." : "No feature toggles are configured."}
          </p>
        )}
      </CollapsibleSection>
      {savingName ? (
        <p className="text-sm text-muted-foreground">Saving {savingName}…</p>
      ) : null}
    </div>
  );
}
