"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/admin/CEO/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SafetySettings = {
  id: string;
  max_quiz_attempts_per_day: number;
  max_points_per_day: number;
  fraud_thresholds_json: string;
  content_warning_rules_json: string;
  child_safety_display_rules_json: string;
};

const INITIAL_SETTINGS: SafetySettings = {
  id: "",
  max_quiz_attempts_per_day: 0,
  max_points_per_day: 0,
  fraud_thresholds_json: "{}",
  content_warning_rules_json: "{}",
  child_safety_display_rules_json: "{}",
};

function JsonEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <textarea
        className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
      />
    </div>
  );
}

function parseObject(value: string) {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON settings must be an object.");
  }
  return parsed;
}

export default function SafetySettingsSection() {
  const [settings, setSettings] = useState<SafetySettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/settings/safety", {
          cache: "no-store",
          credentials: "include",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error ?? "Failed to load safety settings");
        if (active) {
          setSettings({
            ...INITIAL_SETTINGS,
            ...result,
            fraud_thresholds_json: JSON.stringify(result.fraud_thresholds_json ?? {}, null, 2),
            content_warning_rules_json: JSON.stringify(result.content_warning_rules_json ?? {}, null, 2),
            child_safety_display_rules_json: JSON.stringify(result.child_safety_display_rules_json ?? {}, null, 2),
          });
        }
      } catch (loadError) {
        console.error("Failed to load safety settings:", loadError);
        if (active) {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load safety settings";
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

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...settings,
        fraud_thresholds_json: parseObject(settings.fraud_thresholds_json),
        content_warning_rules_json: parseObject(settings.content_warning_rules_json),
        child_safety_display_rules_json: parseObject(settings.child_safety_display_rules_json),
      };
      const response = await fetch("/api/admin/settings/safety", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Failed to save safety settings");
      toast.success("Safety settings saved");
    } catch (saveError) {
      console.error("Failed to save safety settings:", saveError);
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save safety settings";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading safety settings…</p>;
  if (error && !settings.id) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <CollapsibleSection
        title="Rate limits"
        description="Daily limits currently stored in global safety settings."
        defaultOpen
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="safety-quiz-attempts">Maximum quiz attempts per day</Label>
            <Input
              id="safety-quiz-attempts"
              type="number"
              min={0}
              step={1}
              value={settings.max_quiz_attempts_per_day}
              onChange={(event) =>
                setSettings((previous) => ({
                  ...previous,
                  max_quiz_attempts_per_day: Number(event.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="safety-points">Maximum points per day</Label>
            <Input
              id="safety-points"
              type="number"
              min={0}
              step={1}
              value={settings.max_points_per_day}
              onChange={(event) =>
                setSettings((previous) => ({
                  ...previous,
                  max_points_per_day: Number(event.target.value),
                }))
              }
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Moderation and fraud controls">
        <div className="space-y-5">
          <JsonEditor
            label="Fraud thresholds"
            value={settings.fraud_thresholds_json}
            onChange={(value) =>
              setSettings((previous) => ({ ...previous, fraud_thresholds_json: value }))
            }
          />
          <JsonEditor
            label="Content warning rules"
            value={settings.content_warning_rules_json}
            onChange={(value) =>
              setSettings((previous) => ({ ...previous, content_warning_rules_json: value }))
            }
          />
          <JsonEditor
            label="Child safety display rules"
            value={settings.child_safety_display_rules_json}
            onChange={(value) =>
              setSettings((previous) => ({
                ...previous,
                child_safety_display_rules_json: value,
              }))
            }
          />
        </div>
      </CollapsibleSection>

      <div className="flex justify-end">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save safety settings"}
        </Button>
      </div>
    </div>
  );
}
