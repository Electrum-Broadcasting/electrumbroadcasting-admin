"use client";

import { useEffect, useState } from "react";

function CollapsibleJSON({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded p-3">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium">{label}</span>
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <textarea
          className="border rounded px-3 py-2 mt-3 w-full h-40"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export default function BrandSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    id: "",
    primary_color: "#000000",
    secondary_color: "#ffffff",
    neutral_palette_json: "{}",
    typography_json: "{}",
    iconography_style: "outline",
    motion_settings_json: "{}",
    logo_asset_id: "",
    dark_mode_enabled: false,
    accessibility_defaults_json: "{}",
    child_safety_display_rules_json: "{}",
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/settings/brand", { cache: "no-store" });
      const json = await res.json();

      setSettings({
        ...json,
        neutral_palette_json: JSON.stringify(json.neutral_palette_json, null, 2),
        typography_json: JSON.stringify(json.typography_json, null, 2),
        motion_settings_json: JSON.stringify(json.motion_settings_json, null, 2),
        accessibility_defaults_json: JSON.stringify(json.accessibility_defaults_json, null, 2),
        child_safety_display_rules_json: JSON.stringify(
          json.child_safety_display_rules_json,
          null,
          2
        ),
      });

      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError("");

    try {
      JSON.parse(settings.neutral_palette_json);
      JSON.parse(settings.typography_json);
      JSON.parse(settings.motion_settings_json);
      JSON.parse(settings.accessibility_defaults_json);
      JSON.parse(settings.child_safety_display_rules_json);
    } catch {
      setError("One or more JSON fields are invalid.");
      setSaving(false);
      return;
    }

    await fetch("/api/admin/settings/brand", {
      method: "PATCH",
      body: JSON.stringify({
        ...settings,
        neutral_palette_json: JSON.parse(settings.neutral_palette_json),
        typography_json: JSON.parse(settings.typography_json),
        motion_settings_json: JSON.parse(settings.motion_settings_json),
        accessibility_defaults_json: JSON.parse(settings.accessibility_defaults_json),
        child_safety_display_rules_json: JSON.parse(
          settings.child_safety_display_rules_json
        ),
      }),
    });

    setSaving(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Brand Settings</h1>

      {error && <div className="text-red-600">{error}</div>}

      {/* Primary Color */}
      <div className="flex flex-col gap-2">
        <label>Primary Color</label>
        <input
          type="color"
          className="border rounded px-3 py-2 h-10 w-20"
          value={settings.primary_color}
          onChange={(e) =>
            setSettings({ ...settings, primary_color: e.target.value })
          }
        />
      </div>

      {/* Secondary Color */}
      <div className="flex flex-col gap-2">
        <label>Secondary Color</label>
        <input
          type="color"
          className="border rounded px-3 py-2 h-10 w-20"
          value={settings.secondary_color}
          onChange={(e) =>
            setSettings({ ...settings, secondary_color: e.target.value })
          }
        />
      </div>

      {/* Iconography Style */}
      <div className="flex flex-col gap-2">
        <label>Iconography Style</label>
        <select
          className="border rounded px-3 py-2"
          value={settings.iconography_style}
          onChange={(e) =>
            setSettings({ ...settings, iconography_style: e.target.value })
          }
        >
          <option value="outline">Outline</option>
          <option value="filled">Filled</option>
          <option value="duotone">Duotone</option>
          <option value="rounded">Rounded</option>
          <option value="sharp">Sharp</option>
        </select>
      </div>

      {/* Logo Asset */}
      <div className="flex flex-col gap-2">
        <label>Logo Asset ID</label>
        <input
          type="text"
          className="border rounded px-3 py-2"
          value={settings.logo_asset_id}
          onChange={(e) =>
            setSettings({ ...settings, logo_asset_id: e.target.value })
          }
        />
      </div>

      {/* Dark Mode */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.dark_mode_enabled}
          onChange={(e) =>
            setSettings({ ...settings, dark_mode_enabled: e.target.checked })
          }
        />
        <label>Dark Mode Enabled</label>
      </div>

      {/* Collapsible JSON Editors */}
      <CollapsibleJSON
        label="Neutral Palette (JSON)"
        value={settings.neutral_palette_json}
        onChange={(v) =>
          setSettings({ ...settings, neutral_palette_json: v })
        }
      />

      <CollapsibleJSON
        label="Typography (JSON)"
        value={settings.typography_json}
        onChange={(v) => setSettings({ ...settings, typography_json: v })}
      />

      <CollapsibleJSON
        label="Motion Settings (JSON)"
        value={settings.motion_settings_json}
        onChange={(v) => setSettings({ ...settings, motion_settings_json: v })}
      />

      <CollapsibleJSON
        label="Accessibility Defaults (JSON)"
        value={settings.accessibility_defaults_json}
        onChange={(v) =>
          setSettings({ ...settings, accessibility_defaults_json: v })
        }
      />

      <CollapsibleJSON
        label="Child Safety Display Rules (JSON)"
        value={settings.child_safety_display_rules_json}
        onChange={(v) =>
          setSettings({ ...settings, child_safety_display_rules_json: v })
        }
      />

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 bg-black text-white rounded"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
