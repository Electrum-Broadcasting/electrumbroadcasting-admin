"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CollapsibleSection } from "@/components/admin/CEO/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type PermissionSettings = {
  id: string;
  editor_permissions_json: string;
  contributor_permissions_json: string;
  city_admin_permissions_json: string;
};

const INITIAL_SETTINGS: PermissionSettings = {
  id: "",
  editor_permissions_json: "{}",
  contributor_permissions_json: "{}",
  city_admin_permissions_json: "{}",
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
    throw new Error("Permission settings must be JSON objects.");
  }
  return parsed;
}

export default function PermissionsSettingsSection() {
  const [settings, setSettings] = useState<PermissionSettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/settings/permissions", {
          cache: "no-store",
          credentials: "include",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error ?? "Failed to load permissions");
        if (active) {
          setSettings({
            ...INITIAL_SETTINGS,
            ...result,
            editor_permissions_json: JSON.stringify(result.editor_permissions_json ?? {}, null, 2),
            contributor_permissions_json: JSON.stringify(result.contributor_permissions_json ?? {}, null, 2),
            city_admin_permissions_json: JSON.stringify(result.city_admin_permissions_json ?? {}, null, 2),
          });
        }
      } catch (loadError) {
        console.error("Failed to load permissions:", loadError);
        if (active) {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load permissions";
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
      const response = await fetch("/api/admin/settings/permissions", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: settings.id,
          editor_permissions_json: parseObject(settings.editor_permissions_json),
          contributor_permissions_json: parseObject(settings.contributor_permissions_json),
          city_admin_permissions_json: parseObject(settings.city_admin_permissions_json),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Failed to save permissions");
      toast.success("Permissions saved");
    } catch (saveError) {
      console.error("Failed to save permissions:", saveError);
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save permissions";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading permissions…</p>;
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
      <CollapsibleSection title="Editor permissions" defaultOpen>
        <JsonEditor
          label="Editor permission rules"
          value={settings.editor_permissions_json}
          onChange={(value) =>
            setSettings((previous) => ({ ...previous, editor_permissions_json: value }))
          }
        />
      </CollapsibleSection>
      <CollapsibleSection title="Contributor permissions">
        <JsonEditor
          label="Contributor permission rules"
          value={settings.contributor_permissions_json}
          onChange={(value) =>
            setSettings((previous) => ({ ...previous, contributor_permissions_json: value }))
          }
        />
      </CollapsibleSection>
      <CollapsibleSection title="City Admin permissions">
        <JsonEditor
          label="City Admin permission rules"
          value={settings.city_admin_permissions_json}
          onChange={(value) =>
            setSettings((previous) => ({ ...previous, city_admin_permissions_json: value }))
          }
        />
      </CollapsibleSection>
      <div className="flex justify-end">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save permissions"}
        </Button>
      </div>
    </div>
  );
}
