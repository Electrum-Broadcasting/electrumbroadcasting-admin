"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/admin/CEO/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PublicLaunchMode = "private" | "soft_launch" | "public";

type SystemSettings = {
  id: string;
  default_timezone: string;
  default_language: string;
  maintenance_mode: boolean;
  support_email: string;
  legal_footer_json: string;
  public_launch_mode: PublicLaunchMode;
};

const INITIAL_SETTINGS: SystemSettings = {
  id: "",
  default_timezone: "",
  default_language: "",
  maintenance_mode: false,
  support_email: "",
  legal_footer_json: "{}",
  public_launch_mode: "private",
};

export default function SystemSettingsSection() {
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/settings/system", {
          cache: "no-store",
          credentials: "include",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error ?? "Failed to load system settings");
        if (active) {
          setSettings({
            ...INITIAL_SETTINGS,
            ...result,
            legal_footer_json: JSON.stringify(result.legal_footer_json ?? {}, null, 2),
          });
        }
      } catch (loadError) {
        console.error("Failed to load system settings:", loadError);
        if (active) {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load system settings";
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
      const legalFooter: unknown = JSON.parse(settings.legal_footer_json);
      if (!legalFooter || typeof legalFooter !== "object" || Array.isArray(legalFooter)) {
        throw new Error("Legal footer settings must be a JSON object.");
      }
      const response = await fetch("/api/admin/settings/system", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          legal_footer_json: legalFooter,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Failed to save system settings");
      toast.success("System settings saved");
    } catch (saveError) {
      console.error("Failed to save system settings:", saveError);
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save system settings";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading system settings…</p>;
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

      <CollapsibleSection title="Platform defaults" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="system-timezone">Default timezone</Label>
            <Input
              id="system-timezone"
              value={settings.default_timezone}
              onChange={(event) =>
                setSettings((previous) => ({ ...previous, default_timezone: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="system-language">Default language</Label>
            <Input
              id="system-language"
              value={settings.default_language}
              onChange={(event) =>
                setSettings((previous) => ({ ...previous, default_language: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="system-support-email">Support email</Label>
            <Input
              id="system-support-email"
              type="email"
              value={settings.support_email}
              onChange={(event) =>
                setSettings((previous) => ({ ...previous, support_email: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="system-launch-mode">Public launch mode</Label>
            <select
              id="system-launch-mode"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={settings.public_launch_mode}
              onChange={(event) =>
                setSettings((previous) => ({
                  ...previous,
                  public_launch_mode: event.target.value as PublicLaunchMode,
                }))
              }
            >
              <option value="private">Private</option>
              <option value="soft_launch">Soft launch</option>
              <option value="public">Public</option>
            </select>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={settings.maintenance_mode}
              onChange={(event) =>
                setSettings((previous) => ({ ...previous, maintenance_mode: event.target.checked }))
              }
            />
            Maintenance mode
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Legal footer">
        <div className="space-y-2">
          <Label htmlFor="system-footer-json">Legal footer configuration (JSON)</Label>
          <textarea
            id="system-footer-json"
            className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
            value={settings.legal_footer_json}
            onChange={(event) =>
              setSettings((previous) => ({ ...previous, legal_footer_json: event.target.value }))
            }
            spellCheck={false}
          />
        </div>
      </CollapsibleSection>

      <div className="flex justify-end">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save system settings"}
        </Button>
      </div>
    </div>
  );
}
